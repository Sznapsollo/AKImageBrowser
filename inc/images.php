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

function getVideoFormat($file) {
	$formats = array('mp4' => 'video/mp4', 'm4v' => 'video/mp4', 'mov' => 'video/mp4', 'webm' => 'video/webm', 'ogv' => 'video/ogg');
	$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
	return isset($formats[$ext]) ? $formats[$ext] : null;
}

function isValidFile($path, $fileTypes) {
	return is_file($path) && in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), $fileTypes, true);
}

function matchesSearch($name, $search) {
	if($search === '') {
		return true;
	}
	if(stripos($name, $search) !== false) {
		return true;
	}
	return function_exists('mb_stripos') && @mb_stripos($name, $search, 0, 'UTF-8') !== false;
}

function resolveFolder($basePath, $path, $showSubfolders) {
	$path = trim(str_replace('\\', '/', (string)$path), '/');
	if($path === '') {
		return array('relative' => '', 'absolute' => $basePath);
	}
	if(!$showSubfolders || strpos($path, "\0") !== false) {
		return null;
	}
	$segments = explode('/', $path);
	foreach($segments as $segment) {
		if(!isVisibleFolderName($segment, false)) {
			return null;
		}
	}
	if($segments[0] === 'inc') {
		return null;
	}
	$absolute = realpath($basePath.$path);
	if($absolute === false || !is_dir($absolute) || !isInside($absolute, $basePath)) {
		return null;
	}
	return array('relative' => implode('/', $segments), 'absolute' => $absolute.'/');
}

function isVisibleFolderName($name, $isRoot) {
	$name = (string)$name;
	return $name !== '' && $name[0] !== '.' && !($isRoot && $name === 'inc');
}

function isInside($absolute, $basePath) {
	$base = realpath($basePath);
	return $absolute === $base || strpos($absolute.'/', rtrim($base, '/').'/') === 0;
}

function encodePath($relative) {
	return $relative === '' ? '' : implode('/', array_map('rawurlencode', explode('/', $relative))).'/';
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
	$requestedFileTypes = parseFileTypes($input->fileTypes);
	if(count($requestedFileTypes)) {
		$fileTypes = array_values(array_intersect($requestedFileTypes, $allowedFileTypes));
	}
}

$startIndex = $settings->startIndex;
if(isset($input->startIndex) && is_numeric($input->startIndex)) {
	$startIndex = max(0, (int)$input->startIndex);
}

$itemsPerPage = $settings->itemsPerPage;
if(isset($input->itemsPerPage) && is_numeric($input->itemsPerPage)) {
	$itemsPerPage = min(1000, max(1, (int)$input->itemsPerPage));
}

$showSubfolders = !isset($settings->showSubfolders) || $settings->showSubfolders;
$folder = resolveFolder($pathPrefix, isset($input->path) && is_string($input->path) ? $input->path : '', $showSubfolders);
if($folder === null) {
	respond(array('status' => -3));
}
$folderPath = $folder['absolute'];

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

$search = '';
if(isset($input->search) && is_string($input->search)) {
	$search = trim($input->search);
}

$sort = 'dateDesc';
if(isset($input->sort) && in_array($input->sort, array('dateDesc', 'dateAsc', 'nameAsc', 'nameDesc'), true)) {
	$sort = $input->sort;
}

$files = array();
$folders = array();
foreach(scandir($folderPath) as $file) {
	$file = (string)$file;
	$path = $folderPath.$file;
	if(isValidFile($path, $fileTypes)) {
		if(matchesSearch($file, $search)) {
			$files[$file] = filemtime($path);
		}
	} else if($showSubfolders && is_dir($path) && isVisibleFolderName($file, $folder['relative'] === '') && matchesSearch($file, $search)) {
		$absolute = realpath($path);
		if($absolute !== false && isInside($absolute, $pathPrefix)) {
			$folders[] = $file;
		}
	}
}
usort($folders, 'strnatcasecmp');
if($sort === 'nameDesc') {
	$folders = array_reverse($folders);
}

switch($sort) {
	case 'dateAsc':
		asort($files);
		break;
	case 'nameAsc':
		uksort($files, 'strnatcasecmp');
		break;
	case 'nameDesc':
		uksort($files, function($a, $b) { return strnatcasecmp((string)$b, (string)$a); });
		break;
	default:
		arsort($files);
}

$returnFiles = array();
foreach(array_slice($files, $startIndex, $itemsPerPage, true) as $file => $changeDate) {
	$videoFormat = getVideoFormat((string)$file);
	$size = $videoFormat ? false : @getimagesize($folderPath.$file);
	$returnFiles[] = array(
		'name' => (string)$file,
		'url' => encodePath($folder['relative']).rawurlencode((string)$file),
		'changeDate' => $changeDate,
		'type' => $videoFormat ? 'video' : 'image',
		'format' => $videoFormat,
		'width' => $size ? $size[0] : null,
		'height' => $size ? $size[1] : null
	);
}

$returnFolders = array();
foreach($folders as $name) {
	$returnFolders[] = array(
		'name' => $name,
		'path' => $folder['relative'] === '' ? $name : $folder['relative'].'/'.$name
	);
}

respond(array(
	'path' => $folder['relative'],
	'folders' => $returnFolders,
	'images' => $returnFiles,
	'allCount' => count($files)
));
