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
	if($absolute === false && strpos($path, '%') !== false) {
		$segments = array_map('rawurldecode', $segments);
		foreach($segments as $segment) {
			if(!isVisibleFolderName($segment, false) || strpos($segment, '/') !== false || strpos($segment, "\0") !== false) {
				return null;
			}
		}
		$absolute = realpath($basePath.implode('/', $segments));
	}
	if($absolute === false || !is_dir($absolute) || !isInside($absolute, $basePath) || isInside($absolute, __DIR__)) {
		return null;
	}
	return array('relative' => implode('/', $segments), 'absolute' => $absolute.'/');
}

function displayPath($relative) {
	return implode('/', array_map(function($segment) {
		return function_exists('mb_check_encoding') && !mb_check_encoding($segment, 'UTF-8') ? rawurlencode($segment) : $segment;
	}, explode('/', $relative)));
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

function getThumbnailUrl($settings, $relativeFile, $mtime, $width = null, $height = null) {
	if(!thumbnailsEnabled($settings) || !isThumbnailType($relativeFile)) {
		return null;
	}
	if($width && $height && min($width, $height) <= getThumbnailSize($settings)) {
		return null;
	}
	return 'inc/thumb.php?f='.rawurlencode($relativeFile).'&v='.$mtime;
}

function getThumbnailSize($settings) {
	return isset($settings->thumbnailSize) ? max(50, (int)$settings->thumbnailSize) : 400;
}

function readImageSize($path) {
	$size = @getimagesize($path);
	if(!$size) {
		return null;
	}
	$width = $size[0];
	$height = $size[1];
	if($size[2] === IMAGETYPE_JPEG && in_array(getExifOrientation($path), array(5, 6, 7, 8), true)) {
		list($width, $height) = array($height, $width);
	}
	return array($width, $height);
}

function getExifOrientation($path) {
	if(!function_exists('exif_read_data')) {
		return 1;
	}
	$exif = @exif_read_data($path);
	return $exif && isset($exif['Orientation']) ? (int)$exif['Orientation'] : 1;
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
		if(!@mkdir($dir, 0755)) {
			return false;
		}
		@file_put_contents($dir.'/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
		@file_put_contents($dir.'/index.html', '');
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
		if(is_array($cached) && $cached['dirTime'] === $dirTime && time() - $cached['created'] < 30) {
			return $cached;
		}
	}

	$files = array();
	$folders = array();
	$incPath = realpath(__DIR__);
	foreach(scandir($absolute) ?: array() as $name) {
		$name = (string)$name;
		$path = $absolute.'/'.$name;
		if(isValidFile($path, $allowedFileTypes)) {
			$files[$name] = filemtime($path);
		} else if($showSubfolders && is_dir($path) && isVisibleFolderName($name, $isRoot)) {
			$real = realpath($path);
			if($real !== false && isInside($real, $basePath) && !isInside($real, $incPath)) {
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
	foreach(scandir($cacheDir) ?: array() as $name) {
		$path = $cacheDir.'/'.$name;
		if($name[0] !== '.' && $name !== 'index.html' && is_file($path) && time() - filemtime($path) > 30 * 86400) {
			@unlink($path);
		}
	}
}
