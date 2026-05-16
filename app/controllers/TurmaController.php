<?php
class TurmaController {
    private Turma $model;

    public function __construct() {
        $this->model = new Turma(getDB());
    }

    public function index(): void {
        ok($this->model->listar(param('busca', '')));
    }

    public function show(string $id): void {
        $t = $this->model->buscarPorId((int)$id);
        $t ? ok($t) : erro('Turma não encontrada', 404);
    }

    public function store(): void {
        $data  = body();
        $nome  = trim($data['nome']  ?? '');
        $curso = trim($data['curso'] ?? '');
        $ano   = (int)($data['ano']  ?? 0);

        if (!$nome)  erro('Nome é obrigatório');
        if (!$curso) erro('Curso é obrigatório');
        if ($ano < 2000 || $ano > 2099) erro('Ano inválido');

        $id = $this->model->criar($nome, $curso, $ano);
        created(['id_turma' => $id, 'nome' => $nome, 'curso' => $curso, 'ano' => $ano]);
    }

    public function update(string $id): void {
        if (!$this->model->existe((int)$id)) erro('Turma não encontrada', 404);
        $this->model->atualizar((int)$id, body());
        ok(['mensagem' => 'Turma atualizada']);
    }

    public function destroy(string $id): void {
        $this->model->deletar((int)$id)
            ? ok(['mensagem' => 'Turma removida'])
            : erro('Turma não encontrada', 404);
    }
}