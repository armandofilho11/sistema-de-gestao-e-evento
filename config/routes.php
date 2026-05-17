<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';

require_once __DIR__ . '/../app/models/Usuario.php';
require_once __DIR__ . '/../app/models/Evento.php';
require_once __DIR__ . '/../app/models/Participante.php';
require_once __DIR__ . '/../app/models/Espaco.php';
require_once __DIR__ . '/../app/models/Turma.php';
require_once __DIR__ . '/../app/models/Projeto.php';
require_once __DIR__ . '/../app/models/Progamacao.php';
require_once __DIR__ . '/../app/models/Relacoes.php';

require_once __DIR__ . '/../app/controllers/AuthController.php';
require_once __DIR__ . '/../app/controllers/UsuarioController.php';
require_once __DIR__ . '/../app/controllers/EventoController.php';
require_once __DIR__ . '/../app/controllers/ParticipanteController.php';
require_once __DIR__ . '/../app/controllers/EspacoController.php';
require_once __DIR__ . '/../app/controllers/TurmaController.php';
require_once __DIR__ . '/../app/controllers/ProjetoController.php';
require_once __DIR__ . '/../app/controllers/ProgamacaoController.php';
require_once __DIR__ . '/../app/controllers/DashboardController.php';
require_once __DIR__ . '/../app/controllers/RelacoesController.php';

$uri = $_GET['route'] 
    ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim(str_replace('/sistema-de-gestao-e-evento/public', '', $uri), '/');
$method = metodo();

$routes = [
    'POST /auth/login'    => [AuthController::class,        'login'],
    'POST /auth/logout'   => [AuthController::class,        'logout'],
    'GET  /auth/me'       => [AuthController::class,        'me'],

    'GET    /usuarios'    => [UsuarioController::class,     'index'],
    'GET    /usuarios/{id}' => [UsuarioController::class,   'show'],
    'POST   /usuarios'    => [UsuarioController::class,     'store'],
    'PUT    /usuarios/{id}' => [UsuarioController::class,   'update'],
    'DELETE /usuarios/{id}' => [UsuarioController::class,   'destroy'],

    'GET    /eventos'     => [EventoController::class,      'index'],
    'GET    /eventos/{id}'=> [EventoController::class,      'show'],
    'POST   /eventos'     => [EventoController::class,      'store'],
    'PUT    /eventos/{id}'=> [EventoController::class,      'update'],
    'DELETE /eventos/{id}'=> [EventoController::class,      'destroy'],

    'GET    /participantes'       => [ParticipanteController::class, 'index'],
    'GET    /participantes/{id}'  => [ParticipanteController::class, 'show'],
    'POST   /participantes'       => [ParticipanteController::class, 'store'],
    'PUT    /participantes/{id}'  => [ParticipanteController::class, 'update'],
    'DELETE /participantes/{id}'  => [ParticipanteController::class, 'destroy'],

    'GET    /espacos'     => [EspacoController::class,      'index'],
    'GET    /espacos/{id}'=> [EspacoController::class,      'show'],
    'POST   /espacos'     => [EspacoController::class,      'store'],
    'PUT    /espacos/{id}'=> [EspacoController::class,      'update'],
    'DELETE /espacos/{id}'=> [EspacoController::class,      'destroy'],

    'GET    /turmas'      => [TurmaController::class,       'index'],
    'GET    /turmas/{id}' => [TurmaController::class,       'show'],
    'POST   /turmas'      => [TurmaController::class,       'store'],
    'PUT    /turmas/{id}' => [TurmaController::class,       'update'],
    'DELETE /turmas/{id}' => [TurmaController::class,       'destroy'],

    'GET    /projetos'      => [ProjetoController::class,   'index'],
    'GET    /projetos/{id}' => [ProjetoController::class,   'show'],
    'POST   /projetos'      => [ProjetoController::class,   'store'],
    'PUT    /projetos/{id}' => [ProjetoController::class,   'update'],
    'DELETE /projetos/{id}' => [ProjetoController::class,   'destroy'],

    'GET    /progamacao'      => [ProgamacaoController::class, 'index'],
    'GET    /progamacao/{id}' => [ProgamacaoController::class, 'show'],
    'POST   /progamacao'      => [ProgamacaoController::class, 'store'],
    'PUT    /progamacao/{id}' => [ProgamacaoController::class, 'update'],
    'DELETE /progamacao/{id}' => [ProgamacaoController::class, 'destroy'],

    'GET  /relacoes'  => [RelacoesController::class,        'index'],
    'POST /relacoes'  => [RelacoesController::class,        'store'],
    'DELETE /relacoes'=> [RelacoesController::class,        'destroy'],

    'GET /dashboard'  => [DashboardController::class,       'index'],
];

function dispatch(array $routes, string $method, string $uri): void {
    foreach ($routes as $route => $handler) {
        [$routeMethod, $routePath] = explode(' ', $route, 2);

        $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $routePath);
        $pattern = "#^{$pattern}$#";

        if ($routeMethod === $method && preg_match($pattern, $uri, $matches)) {
            array_shift($matches);
            [$class, $action] = $handler;
            $controller = new $class();
            call_user_func_array([$controller, $action], $matches);
            return;
        }
    }
    erro('Rota não encontrada', 404);
}

dispatch($routes, $method, $uri);