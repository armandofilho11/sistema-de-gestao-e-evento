<?php
class RelacoesController {
    private Relacoes $model;

    public function __construct() {
        $this->model = new Relacoes(getDB());
    }

    public function index(): void {
        $tabela = param('tabela', '');
        match ($tabela) {
            'utiliza'            => ok($this->model->listarEspacosDoEvento((int)param('id_evento', 0))),
            'evento_projeto'     => ok($this->model->listarProjetosDoEvento((int)param('id_evento', 0))),
            'evento_turma'       => ok($this->model->listarTurmasDoEvento((int)param('id_evento', 0))),
            'evento_responsavel' => ok($this->model->listarResponsaveisDoEvento((int)param('id_evento', 0))),
            'apresenta'          => ok($this->model->listarProjetosDaTurma((int)param('id_turma', 0))),
            'agrupa'             => ok($this->model->listarParticipantesDaTurma((int)param('id_turma', 0))),
            default              => erro("Parâmetro 'tabela' inválido"),
        };
    }

    public function store(): void {
        $data   = body();
        $tabela = $data['tabela'] ?? '';
        match ($tabela) {
            'utiliza'            => $this->model->sincronizarUtiliza((int)$data['id_evento'], $data['espacos'] ?? []),
            'evento_projeto'     => $this->model->sincronizarEventoProjeto((int)$data['id_evento'], $data['projetos'] ?? []),
            'evento_turma'       => $this->model->sincronizarEventoTurma((int)$data['id_evento'], $data['turmas'] ?? []),
            'evento_responsavel' => $this->model->sincronizarEventoResponsavel((int)$data['id_evento'], $data['participantes'] ?? []),
            'apresenta'          => $this->model->sincronizarApresenta((int)$data['id_projeto'], $data['turmas'] ?? []),
            'agrupa'             => $this->model->sincronizarAgrupa((int)$data['id_turma'], $data['participantes'] ?? []),
            default              => erro("Parâmetro 'tabela' inválido"),
        };
        ok(['mensagem' => "Vínculos de $tabela atualizados"]);
    }

    public function destroy(): void {
        $data   = body();
        $tabela = $data['tabela'] ?? '';
        match ($tabela) {
            'utiliza'            => $this->model->removerUtiliza((int)$data['id_evento'], (int)$data['id_espaco']),
            'evento_projeto'     => $this->model->removerEventoProjeto((int)$data['id_evento'], (int)$data['id_projeto']),
            'evento_turma'       => $this->model->removerEventoTurma((int)$data['id_evento'], (int)$data['id_turma']),
            'evento_responsavel' => $this->model->removerEventoResponsavel((int)$data['id_evento'], (int)$data['id_participacao']),
            'apresenta'          => $this->model->removerApresenta((int)$data['id_turma'], (int)$data['id_projeto']),
            'agrupa'             => $this->model->removerAgrupa((int)$data['id_turma'], (int)$data['id_participacao']),
            default              => erro("Parâmetro 'tabela' inválido"),
        };
        ok(['mensagem' => "Vínculo removido de $tabela"]);
    }
}