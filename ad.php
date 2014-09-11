<?php 
	include 'configs/global.php';
	include 'app/libraries/utilities.php';
	include 'app/controllers/Ad.php';
	include 'app/models/Ad.php'; 
	include 'app/views/Ad.php'; 
	include 'app/libraries/ChromePhp.php';

	require 'app/libraries/Mustache/Autoloader.php';
	Mustache_Autoloader::register();

	$model = new AdModel();
	$controller = new AdController($model);
	$view = new AdView($controller, $model);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title><?= $model->ad->meta->format ?></title>
	<meta name='format-detection' content='telephone=no'>
	<meta name='author' content='La Presse'>
	<meta name='dcterms.date' content='<?= date("Y-m-d"); ?>'>	
	<?= $view->outputStyles(); ?>
</head>
<body>
	<?= $view->outputBody(); ?>
	<?= $view->outputScripts(); ?>
</body>
</html>