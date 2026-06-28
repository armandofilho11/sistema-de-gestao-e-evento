<?php
class DashboardController {
    private Evento $eventoModel;

    public function __construct() {
        $this->eventoModel = new Evento(getDB());
    }

    public function index(): void {
        ok([
            'totais'           => $this->eventoModel->totais(),
            'por_status'       => $this->eventoModel->porStatus(),
            'proximos_eventos' => $this->eventoModel->proximos(5),
            'dias_com_eventos' => $this->eventoModel->diasComEventos(),
        ]);
    }
}