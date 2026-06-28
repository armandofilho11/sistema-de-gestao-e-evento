<?php
class Usuario {
    public function __construct(private PDO $db) {}

    public function listar(string $busca = '', string $tipo = ''): array {
        $sql    = "SELECT id_usuario, nome, email, tipo_usuario, criado_em FROM usuario WHERE 1=1";
        $params = [];
        if ($busca) { $sql .= " AND (nome LIKE ? OR email LIKE ?)"; $params[] = "%$busca%"; $params[] = "%$busca%"; }
        if ($tipo)  { $sql .= " AND tipo_usuario = ?"; $params[] = $tipo; }
        $sql .= " ORDER BY nome";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): array|false {
        $stmt = $this->db->prepare("SELECT id_usuario, nome, email, tipo_usuario, criado_em FROM usuario WHERE id_usuario = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function emailExiste(string $email, int $ignorarId = 0): bool {
        $stmt = $this->db->prepare("SELECT id_usuario FROM usuario WHERE email = ? AND id_usuario != ?");
        $stmt->execute([$email, $ignorarId]);
        return (bool) $stmt->fetch();
    }

    public function criar(string $nome, string $email, string $senha, string $tipo): int {
        $hash = password_hash($senha, PASSWORD_BCRYPT);
        $this->db->prepare("INSERT INTO usuario (nome, email, senha, tipo_usuario, lembrar_sessao) VALUES (?, ?, ?, ?, 0)")
                 ->execute([$nome, $email, $hash, $tipo]);
        return (int) $this->db->lastInsertId();
    }

    public function atualizar(int $id, array $campos): void {
        $sets   = [];
        $params = [];
        if (!empty($campos['nome']))         { $sets[] = 'nome = ?';         $params[] = $campos['nome']; }
        if (!empty($campos['email']))        { $sets[] = 'email = ?';        $params[] = $campos['email']; }
        if (!empty($campos['senha']))        { $sets[] = 'senha = ?';        $params[] = password_hash($campos['senha'], PASSWORD_BCRYPT); }
        if (!empty($campos['tipo_usuario'])) { $sets[] = 'tipo_usuario = ?'; $params[] = $campos['tipo_usuario']; }
        if (empty($sets)) return;
        $params[] = $id;
        $this->db->prepare("UPDATE usuario SET " . implode(', ', $sets) . " WHERE id_usuario = ?")->execute($params);
    }

    public function deletar(int $id): int {
        $stmt = $this->db->prepare("DELETE FROM usuario WHERE id_usuario = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function buscarPorEmail(string $email): array|false {
        $stmt = $this->db->prepare("SELECT * FROM usuario WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public function atualizarLembrarSessao(int $id, bool $lembrar): void {
        $this->db->prepare("UPDATE usuario SET lembrar_sessao = ? WHERE id_usuario = ?")
                 ->execute([(int)$lembrar, $id]);
    }
}