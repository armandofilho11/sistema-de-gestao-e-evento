<?php
class Espaco {
    public function __construct(private PDO $db) {}

    public function listar(string $busca = '', string $status = ''): array {
        $sql = "SELECT * FROM espaco WHERE 1=1";
        $params = [];
        if ($busca)  { $sql .= " AND nome LIKE ?";  $params[] = "%$busca%"; }
        if ($status) { $sql .= " AND status = ?";   $params[] = $status; }
        $sql .= " ORDER BY nome";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM espaco WHERE id_espaco = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function criar(string $nome, string $tipo, int $capaciade, string $status): int {
        $this->db->prepare("INSERT INTO espaco (nome, tipo, capaciade, status) VALUES (?, ?, ?, ?)")
                 ->execute([$nome, $tipo, $capaciade, $status]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void {
        $sets = []; $params = [];
        if (!empty($campos['nome']))      { $sets[] = 'nome = ?';      $params[] = $campos['nome']; }
        if (!empty($campos['tipo']))      { $sets[] = 'tipo = ?';      $params[] = $campos['tipo']; }
        if (!empty($campos['capaciade'])) { $sets[] = 'capaciade = ?'; $params[] = (int)$campos['capaciade']; }
        if (!empty($campos['status']))    { $sets[] = 'status = ?';    $params[] = $campos['status']; }
        if (empty($sets)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE espaco SET " . implode(', ', $sets) . " WHERE id_espaco = ?")->execute($params);
    }

    public function deletar(int $id): int {
        $stmt = $this->db->prepare("DELETE FROM espaco WHERE id_espaco = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function existe(int $id): bool {
        $stmt = $this->db->prepare("SELECT id_espaco FROM espaco WHERE id_espaco = ?");
        $stmt->execute([$id]);
        return (bool) $stmt->fetch();
    }
}