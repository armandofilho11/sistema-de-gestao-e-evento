<?php
class ProjetoController {
    private Projeto $model;

    public function __construct() {
        $this->model = new Projeto(getDB());
    }

    public function index(): void {
        ok($this->model->listar(param('busca', '')));
    }

    public function show(string $id): void {
        $p = $this->model->buscarPorId((int)$id);
        $p ? ok($p) : erro('Projeto não encontrado', 404);
    }

    public function store(): void {
        $data = body();
        $nome = trim($data['nome'] ?? '');
        if (!$nome) erro('Nome é obrigatório');
        $id = $this->model->criar($nome, $data['descricao'] ?? null);
        created(['id_projeto' => $id, 'nome' => $nome]);
    }

    public function update(string $id): void {
        if (!$this->model->existe((int)$id)) erro('Projeto não encontrado', 404);
        $this->model->atualizar((int)$id, body());
        ok(['mensagem' => 'Projeto atualizado']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Projeto removido'])
            : erro('Projeto não encontrado', 404);
    }
}