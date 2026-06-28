<?php
class Progamacao {
    public function __construct(private PDO $db) {}

    public function listar(string $busca = '', int $id_evento = 0, string $status = ''): array {
        $sql    = "SELECT pg.id_progamacao, pg.horario, pg.atividade, pg.status,
                          e.id_evento, e.nome AS evento,
                          es.id_espaco, es.nome AS espaco
                   FROM progamacao pg
                   LEFT JOIN evento e  ON e.id_evento  = pg.id_evento
                   LEFT JOIN espaco es ON es.id_espaco = pg.id_espaco
                   WHERE 1=1";
        $params = [];
        if ($busca)     { $sql .= " AND pg.atividade LIKE ?"; $params[] = "%$busca%"; }
        if ($id_evento) { $sql .= " AND pg.id_evento = ?";   $params[] = $id_evento; }
        if ($status)    { $sql .= " AND pg.status = ?";      $params[] = $status; }
        $sql .= " ORDER BY pg.horario";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): array|false {
        $stmt = $this->db->prepare(
            "SELECT pg.*, e.nome AS evento, es.nome AS espaco
             FROM progamacao pg
             LEFT JOIN evento e  ON e.id_evento  = pg.id_evento
             LEFT JOIN espaco es ON es.id_espaco = pg.id_espaco
             WHERE pg.id_progamacao = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function criar(string $horario, string $atividade, string $status, int $id_evento, int $id_espaco): int {
        $this->db->prepare(
            "INSERT INTO progamacao (horario, atividade, status, id_evento, id_espaco) VALUES (?, ?, ?, ?, ?)"
        )->execute([$horario, $atividade, $status, $id_evento, $id_espaco]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void {
        $sets = []; $params = [];
        if (!empty($campos['horario']))   { $sets[] = 'horario = ?';   $params[] = $campos['horario']; }
        if (!empty($campos['atividade'])) { $sets[] = 'atividade = ?'; $params[] = $campos['atividade']; }
        if (!empty($campos['status']))    { $sets[] = 'status = ?';    $params[] = $campos['status']; }
        if (!empty($campos['id_evento'])) { $sets[] = 'id_evento = ?'; $params[] = $campos['id_evento']; }
        if (!empty($campos['id_espaco'])) { $sets[] = 'id_espaco = ?'; $params[] = $campos['id_espaco']; }
        if (empty($sets)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE progamacao SET " . implode(', ', $sets) . " WHERE id_progamacao = ?")->execute($params);
    }

    public function deletar(int $id): int {
        $stmt = $this->db->prepare("DELETE FROM progamacao WHERE id_progamacao = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function existe(int $id): bool {
        $stmt = $this->db->prepare("SELECT id_progamacao FROM progamacao WHERE id_progamacao = ?");
        $stmt->execute([$id]);
        return (bool) $stmt->fetch();
    }
}