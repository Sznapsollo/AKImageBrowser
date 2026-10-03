<?php

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

function getThumbnailUrl($settings, $relativeFile, $mtime) {
	if(empty($settings->thumbnails) || !isThumbnailType($relativeFile)) {
		return null;
	}
	return 'inc/thumb.php?f='.rawurlencode($relativeFile).'&v='.$mtime;
}

function isThumbnailType($file) {
	return in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), array('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'), true);
}
