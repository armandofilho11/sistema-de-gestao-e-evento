<?php
class Relacoes {
    public function __construct(private PDO $db) {}

    public function listarEspacosDoEvento(int $id_evento): array {
        $stmt = $this->db->prepare(
            "SELECT es.id_espaco, es.nome, es.tipo, es.capaciade, es.status
             FROM utiliza u JOIN espaco es ON es.id_espaco = u.id_espaco
             WHERE u.id_evento = ? ORDER BY es.nome"
        );
        $stmt->execute([$id_evento]);
        return $stmt->fetchAll();
    }

    public function listarProjetosDaTurma(int $id_turma): array {
        $stmt = $this->db->prepare(
            "SELECT pr.id_projeto, pr.nome, pr.descricao
             FROM apresenta ap JOIN projeto pr ON pr.id_projeto = ap.id_projeto
             WHERE ap.id_turma = ? ORDER BY pr.nome"
        );
        $stmt->execute([$id_turma]);
        return $stmt->fetchAll();
    }

    public function listarParticipantesDaTurma(int $id_turma): array {
        $stmt = $this->db->prepare(
            "SELECT p.id_participacao, p.nome, p.email, p.categoria
             FROM agrupa a JOIN participante p ON p.id_participacao = a.id_participacao
             WHERE a.id_turma = ? ORDER BY p.nome"
        );
        $stmt->execute([$id_turma]);
        return $stmt->fetchAll();
    }

    public function sincronizarUtiliza(int $id_evento, array $espacos): void {
        $this->db->prepare("DELETE FROM utiliza WHERE id_evento = ?")->execute([$id_evento]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO utiliza (id_evento, id_espaco) VALUES (?, ?)");
        foreach ($espacos as $id) $stmt->execute([$id_evento, $id]);
    }

    public function sincronizarApresenta(int $id_projeto, array $turmas): void {
        $this->db->prepare("DELETE FROM apresenta WHERE id_projeto = ?")->execute([$id_projeto]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO apresenta (id_turma, id_projeto) VALUES (?, ?)");
        foreach ($turmas as $id) $stmt->execute([$id, $id_projeto]);
    }

    public function sincronizarAgrupa(int $id_turma, array $participantes): void {
        $this->db->prepare("DELETE FROM agrupa WHERE id_turma = ?")->execute([$id_turma]);
        $stmt = $this->db->prepare("INSERT IGNORE INTO agrupa (id_turma, id_participacao) VALUES (?, ?)");
        foreach ($participantes as $id) $stmt->execute([$id_turma, $id]);
    }

    public function removerUtiliza(int $id_evento, int $id_espaco): void {
        $this->db->prepare("DELETE FROM utiliza WHERE id_evento = ? AND id_espaco = ?")->execute([$id_evento, $id_espaco]);
    }

    public function removerApresenta(int $id_turma, int $id_projeto): void {
        $this->db->prepare("DELETE FROM apresenta WHERE id_turma = ? AND id_projeto = ?")->execute([$id_turma, $id_projeto]);
    }

    public function removerAgrupa(int $id_turma, int $id_participacao): void {
        $this->db->prepare("DELETE FROM agrupa WHERE id_turma = ? AND id_participacao = ?")->execute([$id_turma, $id_participacao]);
    }
}