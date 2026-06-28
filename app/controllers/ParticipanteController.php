<?php
class ParticipanteController {
    private Participante $model;

    public function __construct() {
        $this->model = new Participante(getDB());
    }

    public function index(): void {
        ok($this->model->listar(
            param('busca', ''),
            param('categoria', ''),
            (int)param('id_evento', 0)
        ));
    }

    public function show(string $id): void {
        $p = $this->model->buscarPorId((int)$id);
        $p ? ok($p) : erro('Participante não encontrado', 404);
    }

    public function store(): void {
        $data      = body();
        $nome      = trim($data['nome'] ?? '');
        $email     = trim($data['email'] ?? '');
        $categoria = $data['categoria'] ?? '';
        $id_evento  = !empty($data['id_evento'])  ? (int)$data['id_evento']  : null;
        $id_turma   = !empty($data['id_turma'])   ? (int)$data['id_turma']   : null;
        $id_projeto = !empty($data['id_projeto']) ? (int)$data['id_projeto'] : null;

        if (!$nome)      erro('Nome é obrigatório');
        if (!$email)     erro('Email é obrigatório');
        if (!in_array($categoria, ['estudante','professor','externo','convidado','coordenador'])) {
            erro('Categoria inválida');
        }

        $id = $this->model->criar($nome, $email, $categoria, $id_evento, $id_turma, $id_projeto);
        created(['id_participacao' => $id, 'nome' => $nome]);
    }

    public function update(string $id): void {
        if (!$this->model->existe((int)$id)) erro('Participante não encontrado', 404);
        $this->model->atualizar((int)$id, body());
        ok(['mensagem' => 'Participante atualizado']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Participante removido'])
            : erro('Participante não encontrado', 404);
    }
}