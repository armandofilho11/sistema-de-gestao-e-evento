<?php
class Evento {
    public function __construct(private PDO $db) {}

    /** Atualiza automaticamente o status de eventos cuja data/hora final já passou. */
    public function atualizarStatusAutomatico(): void {
        $this->db->exec(
            "UPDATE evento
             SET status = 'encerrado'
             WHERE status NOT IN ('encerrado','cancelado')
             AND (
                 (data_fim IS NOT NULL AND TIMESTAMP(data_fim, COALESCE(hora_fim,'23:59:59')) <= NOW())
                 OR (data_fim IS NULL AND data < CURDATE())
             )"
        );
    }

    public function listar(string $busca = '', string $status = '', string $data_inicio = '', string $data_fim = '', int $id_espaco = 0): array {
        $this->atualizarStatusAutomatico();

        $sql    = "SELECT e.id_evento, e.nome, e.descricao, e.status, e.data, e.hora_inicio,
                          e.data_fim, e.hora_fim, e.criado_em,
                          u.nome AS criado_por, u.id_usuario AS id_usuario_criado
                   FROM evento e
                   LEFT JOIN usuario u ON u.id_usuario = e.id_usuario_criado
                   WHERE 1=1";
        $params = [];
        if ($busca)       { $sql .= " AND e.nome LIKE ?";   $params[] = "%$busca%"; }
        if ($status)      { $sql .= " AND e.status = ?";    $params[] = $status; }
        if ($data_inicio) { $sql .= " AND e.data >= ?";     $params[] = $data_inicio; }
        if ($data_fim)    { $sql .= " AND e.data <= ?";     $params[] = $data_fim; }
        if ($id_espaco)   {
            $sql .= " AND e.id_evento IN (SELECT id_evento FROM utiliza WHERE id_espaco = ?)";
            $params[] = $id_espaco;
        }
        $sql .= " ORDER BY e.data DESC, e.hora_inicio DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): array|false {
        $this->atualizarStatusAutomatico();

        $stmt = $this->db->prepare(
            "SELECT e.*, u.nome AS criado_por
             FROM evento e
             LEFT JOIN usuario u ON u.id_usuario = e.id_usuario_criado
             WHERE e.id_evento = ?"
        );
        $stmt->execute([$id]);
        $evento = $stmt->fetch();
        if (!$evento) return false;

        // Espaços vinculados (com capacidade definida para este evento)
        $stmt2 = $this->db->prepare(
            "SELECT es.id_espaco, es.nome, es.tipo, es.capaciade, es.status, ut.capacidade_max
             FROM utiliza ut JOIN espaco es ON es.id_espaco = ut.id_espaco
             WHERE ut.id_evento = ?
             ORDER BY es.nome"
        );
        $stmt2->execute([$id]);
        $evento['espacos'] = $stmt2->fetchAll();

        // Projetos vinculados ao evento
        $stmt3 = $this->db->prepare(
            "SELECT pr.id_projeto, pr.nome, pr.descricao
             FROM evento_projeto ep JOIN projeto pr ON pr.id_projeto = ep.id_projeto
             WHERE ep.id_evento = ?
             ORDER BY pr.nome"
        );
        $stmt3->execute([$id]);
        $evento['projetos'] = $stmt3->fetchAll();

        // Turmas vinculadas ao evento
        $stmt4 = $this->db->prepare(
            "SELECT t.id_turma, t.nome, t.curso, t.ano
             FROM evento_turma et JOIN turma t ON t.id_turma = et.id_turma
             WHERE et.id_evento = ?
             ORDER BY t.nome"
        );
        $stmt4->execute([$id]);
        $evento['turmas'] = $stmt4->fetchAll();

        // Responsáveis vinculados (junção nova + compatibilidade com id_evento direto)
        $stmt5 = $this->db->prepare(
            "SELECT DISTINCT p.id_participacao, p.nome, p.email, p.categoria
             FROM participante p
             LEFT JOIN evento_responsavel er ON er.id_participacao = p.id_participacao AND er.id_evento = ?
             WHERE er.id_evento = ? OR p.id_evento = ?
             ORDER BY p.nome"
        );
        $stmt5->execute([$id, $id, $id]);
        $evento['responsaveis'] = $stmt5->fetchAll();

        // Programação do evento
        $stmt6 = $this->db->prepare(
            "SELECT p.id_progamacao, p.horario, p.atividade, p.status, es.nome AS espaco
             FROM progamacao p
             LEFT JOIN espaco es ON es.id_espaco = p.id_espaco
             WHERE p.id_evento = ? ORDER BY p.horario"
        );
        $stmt6->execute([$id]);
        $evento['programacao'] = $stmt6->fetchAll();

        return $evento;
    }

    public function criar(
        string $nome,
        string $status,
        string $data,
        int $id_usuario_criado,
        ?string $descricao = null,
        ?string $hora_inicio = null,
        ?string $data_fim = null,
        ?string $hora_fim = null
    ): int {
        $this->db->prepare(
            "INSERT INTO evento (nome, descricao, status, data, hora_inicio, data_fim, hora_fim, id_usuario_criado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([$nome, $descricao, $status, $data, $hora_inicio, $data_fim ?: $data, $hora_fim, $id_usuario_criado]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void {
        $sets = []; $params = [];
        if (!empty($campos['nome']))        { $sets[] = 'nome = ?';        $params[] = $campos['nome']; }
        if (array_key_exists('descricao', $campos)) { $sets[] = 'descricao = ?'; $params[] = $campos['descricao']; }
        if (!empty($campos['status']))      { $sets[] = 'status = ?';      $params[] = $campos['status']; }
        if (!empty($campos['data']))        { $sets[] = 'data = ?';        $params[] = $campos['data']; }
        if (array_key_exists('hora_inicio', $campos)) { $sets[] = 'hora_inicio = ?'; $params[] = $campos['hora_inicio']; }
        if (!empty($campos['data_fim']))    { $sets[] = 'data_fim = ?';    $params[] = $campos['data_fim']; }
        if (array_key_exists('hora_fim', $campos)) { $sets[] = 'hora_fim = ?'; $params[] = $campos['hora_fim']; }
        if (empty($sets)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE evento SET " . implode(', ', $sets) . " WHERE id_evento = ?")->execute($params);
    }

    public function deletar(int $id): int {
        $stmt = $this->db->prepare("DELETE FROM evento WHERE id_evento = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function existe(int $id): bool {
        $stmt = $this->db->prepare("SELECT id_evento FROM evento WHERE id_evento = ?");
        $stmt->execute([$id]);
        return (bool) $stmt->fetch();
    }

    public function totais(): array {
        $this->atualizarStatusAutomatico();
        return [
            'eventos'      => $this->db->query("SELECT COUNT(*) FROM evento")->fetchColumn(),
            'responsaveis' => $this->db->query("SELECT COUNT(*) FROM participante")->fetchColumn(),
            'projetos'     => $this->db->query("SELECT COUNT(*) FROM projeto")->fetchColumn(),
            'espacos'      => $this->db->query("SELECT COUNT(*) FROM espaco WHERE status = 'ativo'")->fetchColumn(),
        ];
    }

    public function porStatus(): array {
        $this->atualizarStatusAutomatico();
        $rows   = $this->db->query("SELECT status, COUNT(*) AS total FROM evento GROUP BY status")->fetchAll();
        $result = [];
        foreach ($rows as $r) $result[$r['status']] = (int)$r['total'];
        return $result;
    }

    public function proximos(int $limite = 5): array {
        $this->atualizarStatusAutomatico();
        $stmt = $this->db->prepare(
            "SELECT e.id_evento, e.nome, e.data, e.status, u.nome AS criado_por
             FROM evento e
             LEFT JOIN usuario u ON u.id_usuario = e.id_usuario_criado
             ORDER BY e.data DESC LIMIT ?"
        );
        $stmt->execute([$limite]);
        return $stmt->fetchAll();
    }

    public function diasComEventos(): array {
        return $this->db->query(
            "SELECT DISTINCT DATE_FORMAT(data, '%Y-%m-%d') AS dia
             FROM evento
             WHERE YEAR(data) = YEAR(CURDATE()) AND MONTH(data) = MONTH(CURDATE())"
        )->fetchAll(PDO::FETCH_COLUMN);
    }
}