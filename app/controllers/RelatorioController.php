<?php
class RelatorioController {
    private PDO $db;

    public function __construct() {
        $this->db = getDB();
    }

    public function eventosPdf(): void {
        $inicio   = param('data_inicio', '');
        $fim      = param('data_fim',    '');
        $status   = param('status',      '');
        $id_espaco= param('id_espaco',   '');

        $sql    = "SELECT e.nome, e.data, e.status, u.nome AS criado_por
                   FROM evento e
                   LEFT JOIN usuario u ON u.id_usuario = e.id_usuario_criado
                   WHERE 1=1";
        $params = [];

        if ($inicio) { $sql .= " AND e.data >= ?"; $params[] = $inicio; }
        if ($fim)    { $sql .= " AND e.data <= ?"; $params[] = $fim; }
        if ($status) { $sql .= " AND e.status = ?"; $params[] = $status; }
        if ($id_espaco) {
            $sql .= " AND e.id_evento IN (SELECT id_evento FROM utiliza WHERE id_espaco = ?)";
            $params[] = $id_espaco;
        }
        $sql .= " ORDER BY e.data DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $eventos = $stmt->fetchAll();

        $filtros = [];
        if ($inicio) $filtros[] = "De: $inicio";
        if ($fim)    $filtros[] = "Até: $fim";
        if ($status) $filtros[] = "Status: $status";

        $this->renderPdf(
            'Relatório de Eventos',
            $filtros,
            ['Nome', 'Data', 'Status', 'Criado por'],
            array_map(fn($e) => [
                $e['nome'],
                date('d/m/Y', strtotime($e['data'])),
                strtoupper($e['status']),
                $e['criado_por'] ?? '—',
            ], $eventos)
        );
    }

    public function projetosPdf(): void {
        $busca    = param('busca',    '');
        $id_turma = param('id_turma', '');

        $sql    = "SELECT pr.nome, pr.descricao,
                          GROUP_CONCAT(DISTINCT t.nome SEPARATOR ', ') AS turmas
                   FROM projeto pr
                   LEFT JOIN apresenta ap ON ap.id_projeto = pr.id_projeto
                   LEFT JOIN turma t      ON t.id_turma    = ap.id_turma
                   WHERE 1=1";
        $params = [];

        if ($busca)    { $sql .= " AND pr.nome LIKE ?";        $params[] = "%$busca%"; }
        if ($id_turma) { $sql .= " AND ap.id_turma = ?";       $params[] = $id_turma; }
        $sql .= " GROUP BY pr.id_projeto ORDER BY pr.nome";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $projetos = $stmt->fetchAll();

        $filtros = [];
        if ($busca)    $filtros[] = "Busca: $busca";
        if ($id_turma) $filtros[] = "Turma ID: $id_turma";

        $this->renderPdf(
            'Relatório de Projetos',
            $filtros,
            ['Nome', 'Descrição', 'Turmas vinculadas'],
            array_map(fn($p) => [
                $p['nome'],
                $p['descricao'] ?: '—',
                $p['turmas']    ?: '—',
            ], $projetos)
        );
    }

    public function dashboardPdf(): void {
        $totais = [
            'eventos'       => $this->db->query("SELECT COUNT(*) FROM evento")->fetchColumn(),
            'responsaveis'  => $this->db->query("SELECT COUNT(*) FROM participante")->fetchColumn(),
            'projetos'      => $this->db->query("SELECT COUNT(*) FROM projeto")->fetchColumn(),
            'ambientes'     => $this->db->query("SELECT COUNT(*) FROM espaco WHERE status = 'ativo'")->fetchColumn(),
        ];

        $por_status = [];
        $rows = $this->db->query("SELECT status, COUNT(*) AS total FROM evento GROUP BY status")->fetchAll();
        foreach ($rows as $r) $por_status[$r['status']] = $r['total'];

        $data   = date('d/m/Y H:i');
        $ativos     = $por_status['ativo']     ?? 0;
        $encerrados = $por_status['encerrado'] ?? 0;
        $cancelados = $por_status['cancelado'] ?? 0;
        $rascunhos  = $por_status['rascunho']  ?? 0;

        header('Content-Type: text/html; charset=utf-8');
        echo <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Dashboard - Relatório</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin: 30px; }
  h1   { color: #005A24; font-size: 20px; border-bottom: 2px solid #005A24; padding-bottom: 8px; }
  .subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
  .card-num  { font-size: 32px; font-weight: bold; color: #005A24; }
  .card-label{ font-size: 11px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #005A24; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: right; }
  @media print { body { margin: 10px; } }
</style>
</head>
<body>
<h1>Sistema STGM — Relatório do Dashboard</h1>
<p class="subtitle">Gerado em: $data</p>

<div class="cards">
  <div class="card"><div class="card-num">$ativos</div><div class="card-label">Eventos ativos</div></div>
  <div class="card"><div class="card-num">$encerrados</div><div class="card-label">Eventos encerrados</div></div>
  <div class="card"><div class="card-num">$cancelados</div><div class="card-label">Eventos cancelados</div></div>
  <div class="card"><div class="card-num">{$totais['ambientes']}</div><div class="card-label">Ambientes disponíveis</div></div>
</div>

<table>
  <thead><tr><th>Indicador</th><th>Quantidade</th></tr></thead>
  <tbody>
    <tr><td>Total de eventos</td><td>{$totais['eventos']}</td></tr>
    <tr><td>Eventos ativos</td><td>$ativos</td></tr>
    <tr><td>Eventos encerrados</td><td>$encerrados</td></tr>
    <tr><td>Eventos cancelados</td><td>$cancelados</td></tr>
    <tr><td>Eventos em rascunho</td><td>$rascunhos</td></tr>
    <tr><td>Total de responsáveis</td><td>{$totais['responsaveis']}</td></tr>
    <tr><td>Total de projetos</td><td>{$totais['projetos']}</td></tr>
    <tr><td>Ambientes disponíveis</td><td>{$totais['ambientes']}</td></tr>
  </tbody>
</table>

<div class="footer">Sistema de Gestão e Eventos — $data</div>

<script>window.onload = () => window.print();</script>
</body>
</html>
HTML;
        exit;
    }

    private function renderPdf(string $titulo, array $filtros, array $colunas, array $linhas): void {
        $data = date('d/m/Y H:i');
        $filtroStr = $filtros ? implode(' | ', $filtros) : 'Sem filtros';
        $total = count($linhas);

        $thead = implode('', array_map(fn($c) => "<th>$c</th>", $colunas));
        $tbody = implode('', array_map(function($row) {
            $tds = implode('', array_map(fn($v) => "<td>$v</td>", $row));
            return "<tr>$tds</tr>";
        }, $linhas));

        header('Content-Type: text/html; charset=utf-8');
        echo <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>$titulo</title>
<style>
  body  { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 30px; }
  h1    { color: #005A24; font-size: 18px; border-bottom: 2px solid #005A24; padding-bottom: 8px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
  .filtros { background: #f0f9f4; border: 1px solid #d0e9d9; border-radius: 6px; padding: 8px 12px; font-size: 11px; margin-bottom: 16px; color: #254d35; }
  .total { font-size: 11px; color: #666; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #005A24; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  @media print { body { margin: 10px; } }
</style>
</head>
<body>
<h1>$titulo</h1>
<p class="meta">Gerado em: $data</p>
<div class="filtros"><strong>Filtros:</strong> $filtroStr</div>
<p class="total">Total de registros: <strong>$total</strong></p>
<table>
  <thead><tr>$thead</tr></thead>
  <tbody>$tbody</tbody>
</table>
<div class="footer">Sistema de Gestão e Eventos — $data</div>
<script>window.onload = () => window.print();</script>
</body>
</html>
HTML;
        exit;
    }
}