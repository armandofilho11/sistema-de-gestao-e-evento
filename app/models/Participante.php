<?php
class Participante {
    public function __construct(private PDO $db) {}

    public function listar(string $busca = '', string $categoria = '', int $id_evento = 0): array {
        $sql    = "SELECT p.id_participacao, p.nome, p.email, p.categoria,
                          e.nome AS evento, t.nome AS turma, pr.nome AS projeto
                   FROM participante p
                   LEFT JOIN evento  e  ON e.id_evento   = p.id_evento
                   LEFT JOIN turma   t  ON t.id_turma    = p.id_turma
                   LEFT JOIN projeto pr ON pr.id_projeto = p.id_projeto
                   WHERE 1=1";
        $params = [];
        if ($busca)     { $sql .= " AND (p.nome LIKE ? OR p.email LIKE ?)"; $params[] = "%$busca%"; $params[] = "%$busca%"; }
        if ($categoria) { $sql .= " AND p.categoria = ?"; $params[] = $categoria; }
        if ($id_evento) { $sql .= " AND p.id_evento = ?"; $params[] = $id_evento; }
        $sql .= " ORDER BY p.nome";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): array|false {
        $stmt = $this->db->prepare(
            "SELECT p.*, e.nome AS evento, t.nome AS turma, pr.nome AS projeto
             FROM participante p
             LEFT JOIN evento  e  ON e.id_evento   = p.id_evento
             LEFT JOIN turma   t  ON t.id_turma    = p.id_turma
             LEFT JOIN projeto pr ON pr.id_projeto = p.id_projeto
             WHERE p.id_participacao = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function criar(string $nome, string $email, string $categoria, ?int $id_evento = null, ?int $id_turma = null, ?int $id_projeto = null): int {
        $this->db->prepare(
            "INSERT INTO participante (nome, email, categoria, id_evento, id_turma, id_projeto) VALUES (?, ?, ?, ?, ?, ?)"
        )->execute([$nome, $email, $categoria, $id_evento, $id_turma, $id_projeto]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void {
        $sets = []; $params = [];
        if (!empty($campos['nome']))      { $sets[] = 'nome = ?';      $params[] = $campos['nome']; }
        if (!empty($campos['email']))     { $sets[] = 'email = ?';     $params[] = $campos['email']; }
        if (!empty($campos['categoria'])) { $sets[] = 'categoria = ?'; $params[] = $campos['categoria']; }
        if (array_key_exists('id_evento',  $campos)) { $sets[] = 'id_evento = ?';  $params[] = $campos['id_evento']  ?: null; }
        if (array_key_exists('id_turma',   $campos)) { $sets[] = 'id_turma = ?';   $params[] = $campos['id_turma']   ?: null; }
        if (array_key_exists('id_projeto', $campos)) { $sets[] = 'id_projeto = ?'; $params[] = $campos['id_projeto'] ?: null; }
        if (empty($sets)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE participante SET " . implode(', ', $sets) . " WHERE id_participacao = ?")->execute($params);
    }

    public function deletar(int $id): int {
        $stmt = $this->db->prepare("DELETE FROM participante WHERE id_participacao = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function existe(int $id): bool {
        $stmt = $this->db->prepare("SELECT id_participacao FROM participante WHERE id_participacao = ?");
        $stmt->execute([$id]);
        return (bool) $stmt->fetch();
    }
}