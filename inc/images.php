<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once(__DIR__.'/settings.php');

$input = json_decode(file_get_contents('php://input'));
$pathPrefix = dirname(__DIR__).'/';

function parseFileTypes($fileTypes) {
	$types = array_map('strtolower', array_map('trim', explode(',', (string)$fileTypes)));
	return array_values(array_filter($types, 'strlen'));
}

function isValidFile($path, $fileTypes) {
	return is_file($path) && in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), $fileTypes, true);
}

function respond($data) {
	header('Content-Type: application/json; charset=utf-8');
	echo json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
	exit;
}

if(!isset($input->receive)) {
	exit;
}

if(isset($settings->secretWord)) {
	if(!isset($input->secretWord) || !is_string($input->secretWord) || !hash_equals((string)$settings->secretWord, $input->secretWord)) {
		respond(array('status' => -2));
	}
}

$allowedFileTypes = parseFileTypes($settings->allowedFileTypes);
$fileTypes = $allowedFileTypes;
if(isset($input->fileTypes) && is_string($input->fileTypes)) {
	$fileTypes = array_values(array_intersect(parseFileTypes($input->fileTypes), $allowedFileTypes));
}

$startIndex = $settings->startIndex;
if(isset($input->startIndex) && is_numeric($input->startIndex)) {
	$startIndex = max(0, (int)$input->startIndex);
}

$itemsPerPage = $settings->itemsPerPage;
if(isset($input->itemsPerPage) && is_numeric($input->itemsPerPage)) {
	$itemsPerPage = min(1000, max(1, (int)$input->itemsPerPage));
}

if($settings->deleteOlderFiles) {
	$maxAge = 60 * 60 * 24 * $settings->deleteOlderThanDays;
	$now = time();
	foreach(scandir($pathPrefix) as $file) {
		$path = $pathPrefix.$file;
		if(isValidFile($path, $allowedFileTypes) && $now - filemtime($path) >= $maxAge) {
			unlink($path);
		}
	}
}

$files = array();
foreach(scandir($pathPrefix) as $file) {
	$path = $pathPrefix.$file;
	if(isValidFile($path, $fileTypes)) {
		$files[$file] = filemtime($path);
	}
}
arsort($files);

$returnFiles = array();
foreach(array_slice($files, $startIndex, $itemsPerPage, true) as $file => $changeDate) {
	$size = @getimagesize($pathPrefix.$file);
	$returnFiles[] = array(
		'name' => (string)$file,
		'url' => rawurlencode((string)$file),
		'changeDate' => $changeDate,
		'width' => $size ? $size[0] : null,
		'height' => $size ? $size[1] : null
	);
}

respond(array(
	'images' => $returnFiles,
	'allCount' => count($files)
));
