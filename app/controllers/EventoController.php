<?php
class EventoController {
    private Evento $model;

    public function __construct() {
        $this->model = new Evento(getDB());
    }

    public function index(): void {
        ok($this->model->listar(
            param('busca',       ''),
            param('status',      ''),
            param('data_inicio', ''),
            param('data_fim',    ''),
            (int)param('id_espaco', 0)
        ));
    }

    public function show(string $id): void {
        $evento = $this->model->buscarPorId((int)$id);
        $evento ? ok($evento) : erro('Evento não encontrado', 404);
    }

    public function store(): void {
        $data              = body();
        $nome              = trim($data['nome'] ?? '');
        $descricao         = isset($data['descricao']) ? trim($data['descricao']) : null;
        $status            = $data['status'] ?? 'agendado';
        $data_inicio       = $data['data'] ?? '';
        $hora_inicio       = $data['hora_inicio'] ?? null;
        $data_fim          = $data['data_fim'] ?? $data_inicio;
        $hora_fim          = $data['hora_fim'] ?? null;
        $id_usuario_criado = (int)($data['id_usuario_criado'] ?? 0);

        if (!$nome)              erro('Nome é obrigatório');
        if (!$data_inicio)       erro('Data de início é obrigatória');
        if (!$id_usuario_criado) erro('id_usuario_criado é obrigatório');
        if (!in_array($status, ['agendado','rascunho','ativo','encerrado','cancelado'])) erro('Status inválido');

        $this->validarPeriodo($data_inicio, $hora_inicio, $data_fim, $hora_fim);

        $id = $this->model->criar(
            $nome, $status, $data_inicio, $id_usuario_criado,
            $descricao, $hora_inicio ?: null, $data_fim, $hora_fim ?: null
        );
        created(['id_evento' => $id, 'nome' => $nome, 'status' => $status]);
    }

    public function update(string $id): void {
        if (!$this->model->existe((int)$id)) erro('Evento não encontrado', 404);

        $data = body();

        if (!empty($data['data']) && !empty($data['data_fim'])) {
            $this->validarPeriodo(
                $data['data'],
                $data['hora_inicio'] ?? null,
                $data['data_fim'],
                $data['hora_fim'] ?? null
            );
        }

        $this->model->atualizar((int)$id, $data);
        ok(['mensagem' => 'Evento atualizado']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Evento removido'])
            : erro('Evento não encontrado', 404);
    }

    /** Garante que a data/hora final não seja anterior à inicial. */
    private function validarPeriodo(string $dataIni, ?string $horaIni, string $dataFim, ?string $horaFim): void {
        $ini = strtotime($dataIni . ' ' . ($horaIni ?: '00:00'));
        $fim = strtotime($dataFim . ' ' . ($horaFim ?: '23:59'));
        if ($fim < $ini) {
            erro('A data/horário de término não pode ser anterior ao início');
        }
    }
}