<?php
class EventoController {
    private Evento $model;

    public function __construct() {
        $this->model = new Evento(getDB());
    }

    public function index(): void {
        ok($this->model->listar(param('busca', ''), param('status', '')));
    }

    public function show(string $id): void {
        $evento = $this->model->buscarPorId((int)$id);
        $evento ? ok($evento) : erro('Evento não encontrado', 404);
    }

    public function store(): void {
        $data              = body();
        $nome              = trim($data['nome'] ?? '');
        $status            = $data['status'] ?? 'rascunho';
        $data_evento       = $data['data'] ?? '';
        $id_usuario_criado = (int)($data['id_usuario_criado'] ?? 0);

        if (!$nome)              erro('Nome é obrigatório');
        if (!$data_evento)       erro('Data é obrigatória');
        if (!$id_usuario_criado) erro('id_usuario_criado é obrigatório');
        if (!in_array($status, ['rascunho','ativo','encerrado','cancelado'])) erro('Status inválido');

        $id = $this->model->criar($nome, $status, $data_evento, $id_usuario_criado);
        created(['id_evento' => $id, 'nome' => $nome, 'status' => $status]);
    }

    public function update(string $id): void {
        if (!$this->model->existe((int)$id)) erro('Evento não encontrado', 404);
        $this->model->atualizar((int)$id, body());
        ok(['mensagem' => 'Evento atualizado']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Evento removido'])
            : erro('Evento não encontrado', 404);
    }
}