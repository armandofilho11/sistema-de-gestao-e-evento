<?php
class RelacoesController {
    private Relacoes $model;

    public function __construct() {
        $this->model = new Relacoes(getDB());
    }

    public function index(): void {
        $tabela = param('tabela', '');
        match ($tabela) {
            'utiliza'   => ok($this->model->listarEspacosDoEvento((int)param('id_evento', 0))),
            'apresenta' => ok($this->model->listarProjetosDaTurma((int)param('id_turma', 0))),
            'agrupa'    => ok($this->model->listarParticipantesDaTurma((int)param('id_turma', 0))),
            default     => erro("Parâmetro 'tabela' deve ser: utiliza, apresenta ou agrupa"),
        };
    }

    public function store(): void {
        $data   = body();
        $tabela = $data['tabela'] ?? '';
        match ($tabela) {
            'utiliza'   => $this->model->sincronizarUtiliza((int)$data['id_evento'], $data['espacos'] ?? []),
            'apresenta' => $this->model->sincronizarApresenta((int)$data['id_projeto'], $data['turmas'] ?? []),
            'agrupa'    => $this->model->sincronizarAgrupa((int)$data['id_turma'], $data['participantes'] ?? []),
            default     => erro("Parâmetro 'tabela' inválido"),
        };
        ok(['mensagem' => "Vínculos de $tabela atualizados"]);
    }

    public function destroy(): void {
        $data   = body();
        $tabela = $data['tabela'] ?? '';
        match ($tabela) {
            'utiliza'   => $this->model->removerUtiliza((int)$data['id_evento'], (int)$data['id_espaco']),
            'apresenta' => $this->model->removerApresenta((int)$data['id_turma'], (int)$data['id_projeto']),
            'agrupa'    => $this->model->removerAgrupa((int)$data['id_turma'], (int)$data['id_participacao']),
            default     => erro("Parâmetro 'tabela' inválido"),
        };
        ok(['mensagem' => "Vínculo removido de $tabela"]);
    }
}
