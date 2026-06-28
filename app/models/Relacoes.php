<?php
class Relacoes {
    public function __construct(private PDO $db) {}

    // ---------------- ESPAÇOS DO EVENTO (com capacidade) ----------------

    public function listarEspacosDoEvento(int $id_evento): array {
        $stmt = $this->db->prepare(
            "SELECT es.id_espaco, es.nome, es.tipo, es.capaciade, es.status, ut.capacidade_max
             FROM utiliza ut JOIN espaco es ON es.id_espaco = ut.id_espaco
             WHERE ut.id_evento = ? ORDER BY es.nome"
        );
        $stmt->execute([$id_evento]);
        return $stmt->fetchAll();
    }

    /**
     * @param array $espacos lista de ['id_espaco' => int, 'capacidade_max' => int|null]
     */
    public function sincronizarUtiliza(int $id_evento, array $espacos): void {
        $this->db->prepare("DELETE FROM utiliza WHERE id_evento = ?")->execute([$id_evento]);
        $stmt = $this->db->prepare("INSERT INTO utiliza (id_evento, id_espaco, capacidade_max) VALUES (?, ?, ?)");
        foreach ($espacos as $e) {
            $idEspaco = is_array($e) ? (int)($e['id_espaco'] ?? 0) : (int)$e;
            $cap      = is_array($e) ? ($e['capacidade_max'] ?? null) : null;
            if (!$idEspaco) continue;
            $stmt->execute([$id_evento, $idEspaco, $cap !== null ? (int)$cap : null]);
        }
    }

    public function removerUtiliza(int $id_evento, int $id_espaco): void {
        $this->db->prepare("DELETE FROM utiliza WHERE id_evento = ? AND id_espaco = ?")->execute([$id_evento, $id_espaco]);
    }

    // ---------------- PROJETOS DO EVENTO ----------------

    public function listarProjetosDoEvento(int $id_evento): array {
        $stmt = $this->db->prepare(
            "SELECT pr.id_projeto, pr.nome, pr.descricao
             FROM evento_projeto ep JOIN projeto pr ON pr.id_projeto = ep.id_projeto
             WHERE ep.id_evento = ? ORDER BY pr.nome"
        );
        $stmt->execute([$id_evento]);
        return $stmt->fetchAll();
    }

    public function sincronizarEventoProjeto(int $id_evento, array $projetos): void {
        $this->db->prepare("DELETE FROM evento_projeto WHERE id_evento = ?")->execute([$id_evento]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO evento_projeto (id_evento, id_projeto) VALUES (?, ?)");
        foreach ($projetos as $id) {
            $id = (int)$id;
            if ($id) $stmt->execute([$id_evento, $id]);
        }
    }

    public function removerEventoProjeto(int $id_evento, int $id_projeto): void {
        $this->db->prepare("DELETE FROM evento_projeto WHERE id_evento = ? AND id_projeto = ?")->execute([$id_evento, $id_projeto]);
    }

    // ---------------- TURMAS DO EVENTO ----------------

    public function listarTurmasDoEvento(int $id_evento): array {
        $stmt = $this->db->prepare(
            "SELECT t.id_turma, t.nome, t.curso, t.ano
             FROM evento_turma et JOIN turma t ON t.id_turma = et.id_turma
             WHERE et.id_evento = ? ORDER BY t.nome"
        );
        $stmt->execute([$id_evento]);
        return $stmt->fetchAll();
    }

    public function sincronizarEventoTurma(int $id_evento, array $turmas): void {
        $this->db->prepare("DELETE FROM evento_turma WHERE id_evento = ?")->execute([$id_evento]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO evento_turma (id_evento, id_turma) VALUES (?, ?)");
        foreach ($turmas as $id) {
            $id = (int)$id;
            if ($id) $stmt->execute([$id_evento, $id]);
        }
    }

    public function removerEventoTurma(int $id_evento, int $id_turma): void {
        $this->db->prepare("DELETE FROM evento_turma WHERE id_evento = ? AND id_turma = ?")->execute([$id_evento, $id_turma]);
    }

    // ---------------- RESPONSÁVEIS DO EVENTO ----------------

    public function listarResponsaveisDoEvento(int $id_evento): array {
        $stmt = $this->db->prepare(
            "SELECT DISTINCT p.id_participacao, p.nome, p.email, p.categoria
             FROM participante p
             LEFT JOIN evento_responsavel er ON er.id_participacao = p.id_participacao AND er.id_evento = ?
             WHERE er.id_evento = ? OR p.id_evento = ?
             ORDER BY p.nome"
        );
        $stmt->execute([$id_evento, $id_evento, $id_evento]);
        return $stmt->fetchAll();
    }

    public function sincronizarEventoResponsavel(int $id_evento, array $participantes): void {
        $this->db->prepare("DELETE FROM evento_responsavel WHERE id_evento = ?")->execute([$id_evento]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO evento_responsavel (id_evento, id_participacao) VALUES (?, ?)");
        foreach ($participantes as $id) {
            $id = (int)$id;
            if ($id) $stmt->execute([$id_evento, $id]);
        }
    }

    public function removerEventoResponsavel(int $id_evento, int $id_participacao): void {
        $this->db->prepare("DELETE FROM evento_responsavel WHERE id_evento = ? AND id_participacao = ?")->execute([$id_evento, $id_participacao]);
    }

    // ---------------- TURMAS QUE APRESENTAM UM PROJETO (legado) ----------------

    public function listarProjetosDaTurma(int $id_turma): array {
        $stmt = $this->db->prepare(
            "SELECT pr.id_projeto, pr.nome, pr.descricao
             FROM apresenta ap JOIN projeto pr ON pr.id_projeto = ap.id_projeto
             WHERE ap.id_turma = ? ORDER BY pr.nome"
        );
        $stmt->execute([$id_turma]);
        return $stmt->fetchAll();
    }

    public function sincronizarApresenta(int $id_projeto, array $turmas): void {
        $this->db->prepare("DELETE FROM apresenta WHERE id_projeto = ?")->execute([$id_projeto]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO apresenta (id_turma, id_projeto) VALUES (?, ?)");
        foreach ($turmas as $id) $stmt->execute([$id, $id_projeto]);
    }

    public function removerApresenta(int $id_turma, int $id_projeto): void {
        $this->db->prepare("DELETE FROM apresenta WHERE id_turma = ? AND id_projeto = ?")->execute([$id_turma, $id_projeto]);
    }

    // ---------------- PARTICIPANTES DE UMA TURMA (legado) ----------------

    public function listarParticipantesDaTurma(int $id_turma): array {
        $stmt = $this->db->prepare(
            "SELECT p.id_participacao, p.nome, p.email, p.categoria
             FROM agrupa a JOIN participante p ON p.id_participacao = a.id_participacao
             WHERE a.id_turma = ? ORDER BY p.nome"
        );
        $stmt->execute([$id_turma]);
        return $stmt->fetchAll();
    }

    public function sincronizarAgrupa(int $id_turma, array $participantes): void {
        $this->db->prepare("DELETE FROM agrupa WHERE id_turma = ?")->execute([$id_turma]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO agrupa (id_turma, id_participacao) VALUES (?, ?)");
        foreach ($participantes as $id) $stmt->execute([$id_turma, $id]);
    }

    public function removerAgrupa(int $id_turma, int $id_participacao): void {
        $this->db->prepare("DELETE FROM agrupa WHERE id_turma = ? AND id_participacao = ?")->execute([$id_turma, $id_participacao]);
    }
}