<?php
class UsuarioController {
    private Usuario $model;

    public function __construct() {
        $this->model = new Usuario(getDB());
    }

    public function index(): void {
        ok($this->model->listar(param('busca', ''), param('tipo_usuario', '')));
    }

    public function show(string $id): void {
        $user = $this->model->buscarPorId((int)$id);
        $user ? ok($user) : erro('Usuário não encontrado', 404);
    }

    public function store(): void {
        $data  = body();
        $nome  = trim($data['nome']  ?? '');
        $email = trim($data['email'] ?? '');
        $senha = $data['senha'] ?? '';
        $tipo  = $data['tipo_usuario'] ?? 'aluno';

        if (!$nome || !$email || !$senha)              erro('Nome, email e senha são obrigatórios');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) erro('Email inválido');
        if (!in_array($tipo, ['admin','professor','aluno'])) erro('tipo_usuario inválido');
        if ($this->model->emailExiste($email))          erro('Email já cadastrado', 409);

        $id = $this->model->criar($nome, $email, $senha, $tipo);
        created(['id_usuario' => $id, 'nome' => $nome, 'email' => $email, 'tipo_usuario' => $tipo]);
    }

    public function update(string $id): void {
        if (!$this->model->buscarPorId((int)$id)) erro('Usuário não encontrado', 404);
        $this->model->atualizar((int)$id, body());
        ok(['mensagem' => 'Usuário atualizado']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Usuário removido'])
            : erro('Usuário não encontrado', 404);
    }
}