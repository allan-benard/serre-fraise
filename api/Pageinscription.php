<?php
session_start();

// Connexion à la base de données
$host = 'aws-0-eu-west-2.pooler.supabase.com';
$port = 5432;
$dbname = 'postgres';
$user = 'postgres.lhhdtpwficaykinzrlaq';
$password = 'afehz:resliuhbhbmqauh:ghb?';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}

// Traitement du formulaire
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? '';
    $motdepasse = $_POST['motdepasse'] ?? '';
    $prenom = $_POST['prenom'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $email = $_POST['email'] ?? '';
    $role = 1; // rôle par défaut

    if (empty($id) || empty($motdepasse) || empty($prenom) || empty($nom) || empty($email)) {
        echo "<p style='color:red;'>Tous les champs sont requis.</p>";
    } else {
        try {
            $check = $pdo->prepare("SELECT * FROM utilisateur WHERE email = ?");
            $check->execute([$email]);

            if ($check->rowCount() > 0) {
                echo "<p style='color:red;'>Un utilisateur avec cet e-mail existe déjà.</p>";
            } else {
                $stmt = $pdo->prepare("INSERT INTO utilisateur (id, mot_de_passe, prenom, nom, email, role) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$id, $motdepasse, $prenom, $nom, $email, $role]);

                header("Location: ../index2.php");

                exit;
            }
        } catch (PDOException $e) {
            echo "<p style='color:red;'>Erreur : " . $e->getMessage() . "</p>";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulaire d'inscription</title>
    <link rel="stylesheet" href="../styles/Pageinscription.css">
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
                <li><a href="PageConnection.php" class="active">Connexion</a></li>
            </ul>
        </div>
    </nav>
    

    <form action="" method="post">
        <h2>Inscription</h2>

        <label for="id">Identifiant :</label>
        <input type="text" id="id" name="id" required>

        <label for="motdepasse">Mot de passe :</label>
        <input type="password" id="motdepasse" name="motdepasse" required>

        <label for="prenom">Prénom :</label>
        <input type="text" id="prenom" name="prenom" required>

        <label for="nom">Nom :</label>
        <input type="text" id="nom" name="nom" required>

        <label for="email">Adresse e-mail :</label>
        <input type="email" id="email" name="email" required>

        <button type="submit">S'inscrire</button>
    </form>
    
</body>
</html>
