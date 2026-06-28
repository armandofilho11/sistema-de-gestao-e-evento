<?php
class EspacoController {
    private Espaco $model;

    public function __construct() {
        $this->model = new Espaco(getDB());
    }

    public function index(): void {
        ok($this->model->listar(param('busca', ''), param('status', '')));
    }

    public function show(string $id): void {
        $e = $this->model->buscarPorId((int)$id);
        $e ? ok($e) : erro('Espaço não encontrado', 404);
    }

    public function store(): void {
        $data      = body();
        $nome      = trim($data['nome'] ?? '');
        $tipo      = $data['tipo']      ?? 'outro';
        $capaciade = (int)($data['capaciade'] ?? 0);
        $status    = $data['status']    ?? 'ativo';

        if (!$nome)          erro('Nome é obrigatório');
        if ($capaciade <= 0) erro('Capacidade deve ser maior que zero');
        if (!in_array($tipo,   ['sala','auditorio','laboratorio','quadra','outro'])) erro('Tipo inválido');
        if (!in_array($status, ['ativo','inativo','manutencao']))                    erro('Status inválido');

        $id = $this->model->criar($nome, $tipo, $capaciade, $status);
        created(['id_espaco' => $id, 'nome' => $nome, 'tipo' => $tipo]);
    }

    public function update(string $id): void {
        if (!$this->model->existe((int)$id)) erro('Espaço não encontrado', 404);
        $this->model->atualizar((int)$id, body());
        ok(['mensagem' => 'Espaço atualizado']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Espaço removido'])
            : erro('Espaço não encontrado', 404);
    }
}