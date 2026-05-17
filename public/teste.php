<?php
require_once __DIR__ . '/../config/db.php';

try {
    $db   = getDB();
    $stmt = $db->query("SHOW TABLES");
    $tabelas = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "<h2>✅ Conectado ao banco: <b>gestao_eventos</b></h2>";
    echo "<h3>Tabelas encontradas:</h3><ul>";
    foreach ($tabelas as $t) {
        echo "<li>$t</li>";
    }
    echo "</ul>";

} catch (Exception $e) {
    echo "<h2>❌ Erro de conexão</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
}