<?php
session_start();

$host = 'aws-0-eu-west-2.pooler.supabase.com';
$port = 5432;
$dbname = 'postgres';
$user = 'postgres.lhhdtpwficaykinzrlaq';
$password = 'afehz:resliuhbhbmqauh:ghb?';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Connexion réussie, on n'affiche rien pour éviter d'envoyer du contenu avant header()
} catch (PDOException $e) {
    // Affiche l'erreur puis stoppe le script
    die("Erreur de connexion : " . $e->getMessage());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $mot_de_passe = $_POST['mot_de_passe'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE email = ?");
    $stmt->execute([$email]);
    $utilisateur = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($utilisateur) {
        // ⚠️ En production, utilise password_verify pour les mots de passe hashés
        if ($mot_de_passe === $utilisateur['mot_de_passe']) {
            $_SESSION['id'] = $utilisateur['id'];
            $_SESSION['nom'] = $utilisateur['nom'];
            $_SESSION['prenom'] = $utilisateur['prenom'];
            $_SESSION['email'] = $utilisateur['email'];
            $_SESSION['role'] = $utilisateur['role'];

            header("Location: ../index2.php");
            exit;
        } else {
            echo "<p style='color:red;'>Mot de passe incorrect.</p>";
        }
    } else {
        echo "<p style='color:red;'>Utilisateur introuvable.</p>";
    }
}
?>


<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Connexion</title>
    <link rel="stylesheet" href="../styles/PageConnection.css">
    <link rel="stylesheet" href="../styles/main.css">
    <link rel="stylesheet" href="../styles/auth.css">

</head>
<body>
<nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">
                <i class="fas fa-seedling"></i>
                <span>FraiseConnect Pro</span>
            </div>
            <ul class="nav-menu">
                <li><a href="../index.html">Accueil</a></li>
                <li><a href="../dashboard.php">Tableau de bord</a></li>
                <li><a href="../sensors.php">Capteurs</a></li>
                <li><a href="Pageinscription.php" class="active">Inscription</a></li>
            </ul>
        </div>
    </nav>
    
    <div class="form-container">
        <h2>Connexion</h2>
        <form method="post" action="PageConnection.php">
            <label for="email">Email :</label>
            <input type="email" id="email" name="email" required>

            <label for="mot_de_passe">Mot de passe :</label>
            <input type="password" id="mot_de_passe" name="mot_de_passe" required>

            <button type="submit">Se connecter</button>
        </form>
    </div>

    
</body>
</html>
