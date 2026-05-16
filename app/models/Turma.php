<?php
class Turma {
    public function __construct(private PDO $db) {}

    public function listar(string $busca = ''): array {
        $sql    = "SELECT t.*,
                          COUNT(DISTINCT a.id_participacao) AS total_participantes,
                          GROUP_CONCAT(DISTINCT pr.nome SEPARATOR ', ') AS projetos
                   FROM turma t
                   LEFT JOIN agrupa    a  ON a.id_turma    = t.id_turma
                   LEFT JOIN apresenta ap ON ap.id_turma   = t.id_turma
                   LEFT JOIN projeto   pr ON pr.id_projeto = ap.id_projeto
                   WHERE 1=1";
        $params = [];
        if ($busca) { $sql .= " AND (t.nome LIKE ? OR t.curso LIKE ?)"; $params[] = "%$busca%"; $params[] = "%$busca%"; }
        $sql .= " GROUP BY t.id_turma ORDER BY t.ano DESC, t.nome";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): array|false {
        $stmt = $this->db->prepare("SELECT * FROM turma WHERE id_turma = ?");
        $stmt->execute([$id]);
        $turma = $stmt->fetch();
        if (!$turma) return false;

        $stmt2 = $this->db->prepare(
            "SELECT p.id_participacao, p.nome, p.email, p.categoria
             FROM agrupa a JOIN participante p ON p.id_participacao = a.id_participacao
             WHERE a.id_turma = ?"
        );
        $stmt2->execute([$id]);
        $turma['participantes'] = $stmt2->fetchAll();

        $stmt3 = $this->db->prepare(
            "SELECT pr.id_projeto, pr.nome, pr.descricao
             FROM apresenta ap JOIN projeto pr ON pr.id_projeto = ap.id_projeto
             WHERE ap.id_turma = ?"
        );
        $stmt3->execute([$id]);
        $turma['projetos'] = $stmt3->fetchAll();

        return $turma;
    }

    public function criar(string $nome, string $curso, int $ano): int {
        $this->db->prepare("INSERT INTO turma (nome, curso, ano) VALUES (?, ?, ?)")
                 ->execute([$nome, $curso, $ano]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void {
        $sets = []; $params = [];
        if (!empty($campos['nome']))  { $sets[] = 'nome = ?';  $params[] = $campos['nome']; }
        if (!empty($campos['curso'])) { $sets[] = 'curso = ?'; $params[] = $campos['curso']; }
        if (!empty($campos['ano']))   { $sets[] = 'ano = ?';   $params[] = (int)$campos['ano']; }
        if (empty($sets)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE turma SET " . implode(', ', $sets) . " WHERE id_turma = ?")->execute($params);
    }

    public function deletar(int $id): int {
        $stmt = $this->db->prepare("DELETE FROM turma WHERE id_turma = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function existe(int $id): bool {
        $stmt = $this->db->prepare("SELECT id_turma FROM turma WHERE id_turma = ?");
        $stmt->execute([$id]);
        return (bool) $stmt->fetch();
    }
}