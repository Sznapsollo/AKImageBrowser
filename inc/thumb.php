<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once(__DIR__.'/settings.php');
require_once(__DIR__.'/common.php');

$basePath = dirname(__DIR__).'/';
$file = isset($_GET['f']) && is_string($_GET['f']) ? str_replace('\\', '/', $_GET['f']) : '';
$slash = strrpos($file, '/');
$folderPart = $slash === false ? '' : substr($file, 0, $slash);
$name = $slash === false ? $file : substr($file, $slash + 1);

$showSubfolders = !isset($settings->showSubfolders) || $settings->showSubfolders;
$folder = resolveFolder($basePath, $folderPart, $showSubfolders);
if($folder === null || $name === '' || $name[0] === '.' || strpos($name, "\0") !== false) {
	notFound();
}

$path = $folder['absolute'].$name;
if(!isValidFile($path, parseFileTypes($settings->allowedFileTypes)) || !isThumbnailType($name)) {
	notFound();
}

$originalUrl = '../'.encodePath($folder['relative']).rawurlencode($name);
if(!thumbnailsEnabled($settings)) {
	redirect($originalUrl);
}

$size = isset($settings->thumbnailSize) ? max(50, (int)$settings->thumbnailSize) : 400;
$format = function_exists('imagewebp') ? 'webp' : 'jpeg';
$cacheDir = __DIR__.'/.thumbs';
$cacheFile = $cacheDir.'/'.sha1($folder['relative'].'/'.$name.'|'.filemtime($path).'|'.filesize($path).'|'.$size).'.'.$format;

if(!is_file($cacheFile)) {
	if(!ensureWritableDir($cacheDir)) {
		redirect($originalUrl);
	}
	$lock = acquireSlot($cacheDir, 2, 2.0);
	if(!$lock) {
		redirect($originalUrl);
	}
	if(!is_file($cacheFile) && !createThumbnail($path, $cacheFile, $size, $format)) {
		redirect($originalUrl);
	}
	maybeCleanCache($cacheDir, $settings, $cacheFile);
	flock($lock, LOCK_UN);
	fclose($lock);
} else if(time() - filemtime($cacheFile) > 86400) {
	@touch($cacheFile);
}

if(!is_file($cacheFile)) {
	redirect($originalUrl);
}
header('Content-Type: image/'.$format);
header('Content-Length: '.filesize($cacheFile));
header('Cache-Control: public, max-age=31536000, immutable');
readfile($cacheFile);

function notFound() {
	http_response_code(404);
	exit;
}

function redirect($url) {
	header('Cache-Control: no-store');
	header('Location: '.$url, true, 302);
	exit;
}

function acquireSlot($cacheDir, $slots, $maxWait) {
	$deadline = microtime(true) + $maxWait;
	do {
		for($i = 0; $i < $slots; $i++) {
			$lock = @fopen($cacheDir.'/.lock'.$i, 'c');
			if($lock && flock($lock, LOCK_EX | LOCK_NB)) {
				return $lock;
			}
			if($lock) {
				fclose($lock);
			}
		}
		usleep(100000);
	} while(microtime(true) < $deadline);
	return null;
}

function maybeCleanCache($cacheDir, $settings, $keep) {
	$marker = $cacheDir.'/.cleaned';
	if(is_file($marker) && time() - filemtime($marker) < 3600) {
		return;
	}
	@touch($marker);
	$maxBytes = (isset($settings->thumbnailCacheMaxMB) ? (int)$settings->thumbnailCacheMaxMB : 200) * 1024 * 1024;
	$maxAge = 30 * 86400;
	$files = array();
	$total = 0;
	foreach(scandir($cacheDir) as $name) {
		$path = $cacheDir.'/'.$name;
		if($name[0] === '.' || $path === $keep || !is_file($path)) {
			continue;
		}
		$time = filemtime($path);
		if(time() - $time > $maxAge || substr($name, -4) === '.tmp' && time() - $time > 3600) {
			@unlink($path);
			continue;
		}
		$size = filesize($path);
		$files[$path] = $time;
		$total += $size;
	}
	if($total <= $maxBytes) {
		return;
	}
	asort($files);
	foreach($files as $path => $time) {
		$total -= filesize($path);
		@unlink($path);
		if($total <= $maxBytes * 0.9) {
			break;
		}
	}
}

function createThumbnail($path, $cacheFile, $size, $format) {
	$info = @getimagesize($path);
	if(!$info || !$info[0] || !$info[1]) {
		return false;
	}
	list($width, $height, $type) = $info;
	$ratio = $size / min($width, $height);
	if($ratio * max($width, $height) > $size * 3) {
		$ratio = $size * 3 / max($width, $height);
	}
	if($ratio >= 1 || !ensureMemory($width * $height * 5 + 16 * 1024 * 1024)) {
		return false;
	}

	$loaders = array(IMAGETYPE_JPEG => 'imagecreatefromjpeg', IMAGETYPE_PNG => 'imagecreatefrompng', IMAGETYPE_GIF => 'imagecreatefromgif', IMAGETYPE_WEBP => 'imagecreatefromwebp', IMAGETYPE_BMP => 'imagecreatefrombmp');
	if(!isset($loaders[$type]) || !function_exists($loaders[$type])) {
		return false;
	}
	$source = @call_user_func($loaders[$type], $path);
	if(!$source) {
		return false;
	}

	$newWidth = max(1, (int)round($width * $ratio));
	$newHeight = max(1, (int)round($height * $ratio));
	$thumb = imagecreatetruecolor($newWidth, $newHeight);
	if($format === 'webp') {
		imagealphablending($thumb, false);
		imagesavealpha($thumb, true);
		imagefill($thumb, 0, 0, imagecolorallocatealpha($thumb, 0, 0, 0, 127));
	} else {
		imagefill($thumb, 0, 0, imagecolorallocate($thumb, 255, 255, 255));
	}
	imagecopyresampled($thumb, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
	imagedestroy($source);

	if($type === IMAGETYPE_JPEG) {
		$thumb = applyExifOrientation($thumb, $path);
	}

	$temp = $cacheFile.'.'.getmypid().'.tmp';
	$saved = $format === 'webp' ? imagewebp($thumb, $temp, 80) : imagejpeg($thumb, $temp, 82);
	imagedestroy($thumb);
	return $saved && rename($temp, $cacheFile);
}

function applyExifOrientation($image, $path) {
	if(!function_exists('exif_read_data')) {
		return $image;
	}
	$exif = @exif_read_data($path);
	$angles = array(3 => 180, 6 => -90, 8 => 90);
	if(!$exif || !isset($exif['Orientation']) || !isset($angles[$exif['Orientation']])) {
		return $image;
	}
	$rotated = imagerotate($image, $angles[$exif['Orientation']], 0);
	if(!$rotated) {
		return $image;
	}
	imagedestroy($image);
	return $rotated;
}

function ensureMemory($needed) {
	$limit = toBytes(ini_get('memory_limit'));
	if($limit < 0 || memory_get_usage() + $needed <= $limit) {
		return true;
	}
	@ini_set('memory_limit', (string)(memory_get_usage() + $needed));
	$limit = toBytes(ini_get('memory_limit'));
	return $limit < 0 || memory_get_usage() + $needed <= $limit;
}

function toBytes($value) {
	$value = trim((string)$value);
	if($value === '' || $value === '-1') {
		return -1;
	}
	$number = (int)$value;
	switch(strtolower(substr($value, -1))) {
		case 'g': return $number * 1024 * 1024 * 1024;
		case 'm': return $number * 1024 * 1024;
		case 'k': return $number * 1024;
	}
	return $number;
}
