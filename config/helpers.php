<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function ok(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['sucesso' => true, 'dados' => $data]);
    exit;
}

function created(mixed $data): void {
    ok($data, 201);
}

function erro(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['sucesso' => false, 'erro' => $msg]);
    exit;
}

function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function metodo(): string {
    return $_SERVER['REQUEST_METHOD'];
}

function param(string $key, mixed $default = null): mixed {
    return $_GET[$key] ?? $default;
}