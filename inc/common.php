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
	if(!thumbnailsEnabled($settings) || !isThumbnailType($relativeFile)) {
		return null;
	}
	return 'inc/thumb.php?f='.rawurlencode($relativeFile).'&v='.$mtime;
}

function isThumbnailType($file) {
	return in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), array('jpg', 'jpeg', 'png', 'webp', 'bmp'), true);
}

function thumbnailsEnabled($settings) {
	static $enabled = null;
	if($enabled === null) {
		$mode = isset($settings->thumbnails) ? $settings->thumbnails : false;
		$enabled = $mode === 'auto' ? function_exists('imagecreatetruecolor') && ensureWritableDir(__DIR__.'/.thumbs') : (bool)$mode;
	}
	return $enabled;
}

function ensureWritableDir($dir) {
	if(!is_dir($dir)) {
		@mkdir($dir, 0755);
	}
	return is_dir($dir) && is_writable($dir);
}

function writeFileAtomic($file, $content) {
	$temp = $file.'.'.getmypid().'.tmp';
	if(@file_put_contents($temp, $content) === false) {
		return false;
	}
	return @rename($temp, $file);
}

function readFolderListing($absolute, $allowedFileTypes, $showSubfolders, $isRoot, $basePath) {
	$absolute = rtrim($absolute, '/');
	$cacheDir = __DIR__.'/.cache';
	$cacheFile = $cacheDir.'/list-'.sha1($absolute.'|'.implode(',', $allowedFileTypes).'|'.($showSubfolders ? 1 : 0)).'.ser';
	clearstatcache();
	$dirTime = @filemtime($absolute);

	if(is_file($cacheFile)) {
		$cached = @unserialize((string)@file_get_contents($cacheFile), array('allowed_classes' => false));
		if(is_array($cached) && $cached['dirTime'] === $dirTime && time() - $cached['created'] < 300) {
			return $cached;
		}
	}

	$files = array();
	$folders = array();
	foreach(scandir($absolute) as $name) {
		$name = (string)$name;
		$path = $absolute.'/'.$name;
		if(isValidFile($path, $allowedFileTypes)) {
			$files[$name] = filemtime($path);
		} else if($showSubfolders && is_dir($path) && isVisibleFolderName($name, $isRoot)) {
			$real = realpath($path);
			if($real !== false && isInside($real, $basePath)) {
				$folders[] = $name;
			}
		}
	}
	arsort($files);
	$byName = array_keys($files);
	usort($byName, 'strnatcasecmp');
	usort($folders, 'strnatcasecmp');

	$typeCounts = array();
	$newestByType = array();
	foreach($files as $name => $mtime) {
		$ext = strtolower(pathinfo((string)$name, PATHINFO_EXTENSION));
		$typeCounts[$ext] = isset($typeCounts[$ext]) ? $typeCounts[$ext] + 1 : 1;
		if(!isset($newestByType[$ext])) {
			$newestByType[$ext] = (string)$name;
		}
	}

	$listing = array(
		'dirTime' => $dirTime,
		'created' => time(),
		'mtimes' => $files,
		'byDate' => array_map('strval', array_keys($files)),
		'byName' => array_map('strval', $byName),
		'folders' => $folders,
		'typeCounts' => $typeCounts,
		'newestByType' => $newestByType
	);
	if($dirTime !== false && $dirTime < time() - 1 && ensureWritableDir($cacheDir)) {
		writeFileAtomic($cacheFile, serialize($listing));
		cleanListingCache($cacheDir);
	}
	return $listing;
}

function cleanListingCache($cacheDir) {
	$marker = $cacheDir.'/.cleaned';
	if(is_file($marker) && time() - filemtime($marker) < 86400) {
		return;
	}
	@touch($marker);
	foreach(scandir($cacheDir) as $name) {
		$path = $cacheDir.'/'.$name;
		if($name[0] !== '.' && is_file($path) && time() - filemtime($path) > 30 * 86400) {
			@unlink($path);
		}
	}
}
