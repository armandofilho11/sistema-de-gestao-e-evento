<?php
class AuthController {
    private Usuario $model;

    public function __construct() {
        $this->model = new Usuario(getDB());
        session_start();
    }

    public function login(): void {
        $data           = body();
        $email          = trim($data['email'] ?? '');
        $senha          = $data['senha'] ?? '';
        $lembrar_sessao = (bool)($data['lembrar_sessao'] ?? false);

        if (!$email || !$senha) erro('Email e senha são obrigatórios');

        $user = $this->model->buscarPorEmail($email);
        if (!$user || !password_verify($senha, $user['senha'])) erro('Email ou senha inválidos', 401);

        $this->model->atualizarLembrarSessao($user['id_usuario'], $lembrar_sessao);

        $_SESSION['usuario_id']   = $user['id_usuario'];
        $_SESSION['usuario_nome'] = $user['nome'];
        $_SESSION['usuario_tipo'] = $user['tipo_usuario'];

        if ($lembrar_sessao) session_set_cookie_params(60 * 60 * 24 * 30);
        session_regenerate_id(true);

        unset($user['senha']);
        ok($user);
    }

    public function logout(): void {
        if (!empty($_SESSION['usuario_id'])) {
            $this->model->atualizarLembrarSessao($_SESSION['usuario_id'], false);
        }
        session_destroy();
        ok(['mensagem' => 'Logout realizado']);
    }

    public function me(): void {
        if (empty($_SESSION['usuario_id'])) erro('Não autenticado', 401);
        $user = $this->model->buscarPorId($_SESSION['usuario_id']);
        $user ? ok($user) : erro('Usuário não encontrado', 404);
    }
}