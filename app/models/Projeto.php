<?php
class Projeto {
    public function __construct(private PDO $db) {}

    public function listar(string $busca = ''): array {
        $sql    = "SELECT pr.*, GROUP_CONCAT(DISTINCT t.nome SEPARATOR ', ') AS turmas
                   FROM projeto pr
                   LEFT JOIN apresenta ap ON ap.id_projeto = pr.id_projeto
                   LEFT JOIN turma     t  ON t.id_turma    = ap.id_turma
                   WHERE 1=1";
        $params = [];
        if ($busca) { $sql .= " AND pr.nome LIKE ?"; $params[] = "%$busca%"; }
        $sql .= " GROUP BY pr.id_projeto ORDER BY pr.nome";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM projeto WHERE id_projeto = ?");
        $stmt->execute([$id]);
        $projeto = $stmt->fetch();
        if (!$projeto) return false;

        $stmt2 = $this->db->prepare(
            "SELECT t.id_turma, t.nome, t.curso, t.ano
             FROM apresenta ap JOIN turma t ON t.id_turma = ap.id_turma
             WHERE ap.id_projeto = ?"
        );
        $stmt2->execute([$id]);
        $projeto['turmas'] = $stmt2->fetchAll();

        return $projeto;
    }

    public function criar(string $nome, ?string $descricao): int {
        $this->db->prepare("INSERT INTO projeto (nome, descricao) VALUES (?, ?)")
                 ->execute([$nome, $descricao]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void {
        $sets = []; $params = [];
        if (!empty($campos['nome']))     { $sets[] = 'nome = ?';      $params[] = $campos['nome']; }
        if (isset($campos['descricao'])) { $sets[] = 'descricao = ?'; $params[] = $campos['descricao']; }
        if (empty($sets)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE projeto SET " . implode(', ', $sets) . " WHERE id_projeto = ?")->execute($params);
    }

    public function deletar(int $id): int {
        $stmt = $this->db->prepare("DELETE FROM projeto WHERE id_projeto = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function existe(int $id): bool {
        $stmt = $this->db->prepare("SELECT id_projeto FROM projeto WHERE id_projeto = ?");
        $stmt->execute([$id]);
        return (bool) $stmt->fetch();
    }
}