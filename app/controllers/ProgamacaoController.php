<?php
class ProgamacaoController {
    private Progamacao $model;
    private Evento $eventoModel;
    private Espaco $espacoModel;

    public function __construct() {
        $db = getDB();
        $this->model       = new Progamacao($db);
        $this->eventoModel = new Evento($db);
        $this->espacoModel = new Espaco($db);
    }

    public function index(): void {
        ok($this->model->listar(
            param('busca', ''),
            (int)param('id_evento', 0),
            param('status', '')
        ));
    }

    public function show(string $id): void {
        $p = $this->model->buscarPorId((int)$id);
        $p ? ok($p) : erro('Atividade não encontrada', 404);
    }

    public function store(): void {
        $data      = body();
        $horario   = $data['horario']   ?? '';
        $atividade = trim($data['atividade'] ?? '');
        $status    = $data['status']    ?? 'agendado';
        $id_evento = (int)($data['id_evento'] ?? 0);
        $id_espaco = (int)($data['id_espaco'] ?? 0);

        if (!$horario)   erro('Horário é obrigatório');
        if (!$atividade) erro('Atividade é obrigatória');
        if (!$id_evento) erro('id_evento é obrigatório');
        if (!$id_espaco) erro('id_espaco é obrigatório');
        if (!in_array($status, ['agendado','em_andamento','concluido','cancelado'])) erro('Status inválido');
        if (!$this->eventoModel->existe($id_evento)) erro('Evento não encontrado', 404);
        if (!$this->espacoModel->existe($id_espaco)) erro('Espaço não encontrado', 404);

        $id = $this->model->criar($horario, $atividade, $status, $id_evento, $id_espaco);
        created(['id_progamacao' => $id, 'atividade' => $atividade, 'horario' => $horario]);
    }

    public function update(string $id): void {
        if (!$this->model->existe((int)$id)) erro('Atividade não encontrada', 404);
        $this->model->atualizar((int)$id, body());
        ok(['mensagem' => 'Atividade atualizada']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Atividade removida'])
            : erro('Atividade não encontrada', 404);
    }
}