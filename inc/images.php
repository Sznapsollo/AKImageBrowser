<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once(__DIR__.'/settings.php');
require_once(__DIR__.'/common.php');

$input = json_decode(file_get_contents('php://input'));
$pathPrefix = dirname(__DIR__).'/';

function hasFileType($name, $fileTypes) {
	return in_array(strtolower(pathinfo($name, PATHINFO_EXTENSION)), $fileTypes, true);
}

function summarizeFolder($listing, $fileTypes) {
	$count = 0;
	$preview = null;
	$previewTime = 0;
	foreach($fileTypes as $type) {
		if(!isset($listing['typeCounts'][$type])) {
			continue;
		}
		$count += $listing['typeCounts'][$type];
		$name = $listing['newestByType'][$type];
		if(!getVideoFormat($name) && ($preview === null || $listing['mtimes'][$name] > $previewTime)) {
			$preview = $name;
			$previewTime = $listing['mtimes'][$name];
		}
	}
	return array('count' => $count, 'preview' => $preview, 'previewTime' => $previewTime);
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

function respond($data) {
	header('Content-Type: application/json; charset=utf-8');
	header('Cache-Control: no-store');
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

$listing = readFolderListing($folderPath, $allowedFileTypes, $showSubfolders, $folder['relative'] === '', $pathPrefix);

$ordered = $sort === 'nameAsc' || $sort === 'nameDesc' ? $listing['byName'] : $listing['byDate'];
if($sort === 'dateAsc' || $sort === 'nameDesc') {
	$ordered = array_reverse($ordered);
}
$files = array();
foreach($ordered as $name) {
	if(hasFileType($name, $fileTypes) && matchesSearch($name, $search)) {
		$files[] = $name;
	}
}

$folders = array();
foreach($listing['folders'] as $name) {
	if(matchesSearch($name, $search)) {
		$folders[] = $name;
	}
}
if($sort === 'nameDesc') {
	$folders = array_reverse($folders);
}

$returnFiles = array();
foreach(array_slice($files, $startIndex, $itemsPerPage) as $file) {
	$changeDate = $listing['mtimes'][$file];
	$videoFormat = getVideoFormat($file);
	$size = $videoFormat ? false : @getimagesize($folderPath.$file);
	$relativeFile = ($folder['relative'] === '' ? '' : $folder['relative'].'/').$file;
	$returnFiles[] = array(
		'name' => $file,
		'url' => encodePath($folder['relative']).rawurlencode($file),
		'changeDate' => $changeDate,
		'type' => $videoFormat ? 'video' : 'image',
		'format' => $videoFormat,
		'thumb' => getThumbnailUrl($settings, $relativeFile, $changeDate),
		'fileSize' => @filesize($folderPath.$file),
		'width' => $size ? $size[0] : null,
		'height' => $size ? $size[1] : null
	);
}

$returnFolders = array();
foreach($folders as $name) {
	$relative = $folder['relative'] === '' ? $name : $folder['relative'].'/'.$name;
	$returnFolder = array(
		'name' => $name,
		'path' => $relative
	);
	if($startIndex === 0) {
		$summary = summarizeFolder(readFolderListing($folderPath.$name, $allowedFileTypes, $showSubfolders, false, $pathPrefix), $fileTypes);
		$returnFolder['count'] = $summary['count'];
		$returnFolder['preview'] = $summary['preview'] === null ? null : encodePath($relative).rawurlencode($summary['preview']);
		$returnFolder['previewThumb'] = $summary['preview'] === null ? null : getThumbnailUrl($settings, $relative.'/'.$summary['preview'], $summary['previewTime']);
	}
	$returnFolders[] = $returnFolder;
}

$response = array(
	'path' => $folder['relative'],
	'folders' => $returnFolders,
	'images' => $returnFiles,
	'allCount' => count($files)
);
$response['version'] = sha1(serialize($response));
if(isset($input->knownVersion) && $input->knownVersion === $response['version']) {
	respond(array('status' => 0, 'version' => $response['version']));
}
respond($response);
