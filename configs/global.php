<?php
	//define('URL', 'http://lapresse.ca/adfly');
	define('URL', 'http://localhost:8888/incontournables-du-voyage/');
	define('VERSION', '0.1');

	$culture = "fr";
	if(isset($_GET['lang'])) {
		$culture = $_GET['lang'];
	}
	define('CULTURE', $culture);
?>