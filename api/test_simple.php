<?php
// API de test simplifiée
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Test de base sans base de données
$testData = [
    'status' => 'success',
    'message' => 'API de test fonctionnelle',
    'timestamp' => date('Y-m-d H:i:s'),
    'test_data' => [
        'temperature' => [
            'val' => 23.5,
            'status' => 'normal'
        ],
        'humidity' => [
            'val' => 65.0,
            'status' => 'normal'
        ],
        'light' => [
            'val' => 1200,
            'status' => 'normal'
        ]
    ]
];

echo json_encode($testData, JSON_PRETTY_PRINT);
?>
