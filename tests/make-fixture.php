<?php
// usage: php make-fixture.php <target dir> [full|small]

$dir = rtrim($argv[1], '/');
$mode = isset($argv[2]) ? $argv[2] : 'full';
$now = time();

function makeImage($path, $width, $height, $label, $mtime) {
	$image = imagecreatetruecolor($width, $height);
	$hue = crc32($label) % 360;
	list($r, $g, $b) = hslToRgb($hue / 360, 0.55, 0.55);
	imagefill($image, 0, 0, imagecolorallocate($image, $r, $g, $b));
	imagestring($image, 5, 10, 10, $label, imagecolorallocate($image, 0, 0, 0));
	$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
	if($ext === 'png') {
		imagepng($image, $path);
	} else if($ext === 'gif') {
		imagegif($image, $path);
	} else {
		imagejpeg($image, $path, 80);
	}
	imagedestroy($image);
	touch($path, $mtime);
}

function hslToRgb($h, $s, $l) {
	$q = $l < 0.5 ? $l * (1 + $s) : $l + $s - $l * $s;
	$p = 2 * $l - $q;
	$rgb = array();
	foreach(array($h + 1 / 3, $h, $h - 1 / 3) as $t) {
		if($t < 0) $t += 1;
		if($t > 1) $t -= 1;
		if($t < 1 / 6) $v = $p + ($q - $p) * 6 * $t;
		else if($t < 1 / 2) $v = $q;
		else if($t < 2 / 3) $v = $p + ($q - $p) * (2 / 3 - $t) * 6;
		else $v = $p;
		$rgb[] = (int)round($v * 255);
	}
	return $rgb;
}

function makeVideo($path, $codecArgs, $mtime) {
	exec('ffmpeg -loglevel error -y -f lavfi -i testsrc=size=320x180:rate=25:duration=3 '.$codecArgs.' '.escapeshellarg($path).' 2>&1', $out, $code);
	if($code === 0) {
		touch($path, $mtime);
	}
}

@mkdir($dir, 0777, true);

for($i = 1; $i <= 60; $i++) {
	makeImage("$dir/img$i.jpg", 300 + ($i * 37) % 500, 200 + ($i * 53) % 600, "img$i", $now - 3600 - $i * 60);
}
makeImage("$dir/a b#.jpg", 400, 300, 'a b#', $now - 100);
makeImage("$dir/<img src=x onerror=alert(1)>.jpg", 400, 300, 'xss', $now - 110);
makeImage("$dir/Żółw.jpg", 400, 300, 'zolw', $now - 120);
makeImage("$dir/IMG10.JPG", 400, 300, 'IMG10', $now - 130);
makeImage("$dir/wide.png", 900, 200, 'wide', $now - 140);
makeImage("$dir/tall.jpg", 200, 700, 'tall', $now - 150);
makeImage("$dir/anim.gif", 300, 200, 'gif', $now - 170);
makeImage("$dir/big.jpg", 1200, 900, 'big', $now - 180);
@makeImage("$dir/bad\xff.jpg", 300, 200, 'bad utf8', $now - 160);
file_put_contents("$dir/notes.txt", 'not an image');
touch("$dir/notes.txt", $now - 86400 * 30);

if($mode === 'small') {
	exit(0);
}

@mkdir("$dir/2024/vacation #1", 0777, true);
@mkdir("$dir/2024/empty", 0777, true);
@mkdir("$dir/.hidden", 0777, true);
@mkdir("$dir/Żółwie", 0777, true);
for($i = 1; $i <= 18; $i++) {
	makeImage("$dir/2024/p$i.jpg", 400, 300, "2024 p$i", $now - $i * 60);
}
for($i = 1; $i <= 3; $i++) {
	makeImage("$dir/2024/vacation #1/v$i.jpg", 400, 300, "vac v$i", $now - $i * 60);
	makeImage("$dir/.hidden/h$i.jpg", 400, 300, "hidden $i", $now);
	makeImage("$dir/Żółwie/z$i.jpg", 400, 300, "zolwie $i", $now);
}

if(@mkdir("$dir/bad\xff folder", 0777, true)) {
	makeImage("$dir/bad\xff folder/inside.jpg", 400, 300, 'bad folder', $now);
}

$outside = $dir.'-outside';
@mkdir($outside, 0777, true);
makeImage("$outside/secret.jpg", 300, 200, 'outside', $now);
@symlink($outside, "$dir/escape");

if(trim((string)shell_exec('command -v ffmpeg')) !== '') {
	makeVideo("$dir/clip.webm", '-c:v libvpx-vp9 -b:v 200k', $now - 50);
	makeVideo("$dir/clip.mp4", '-c:v libx264 -pix_fmt yuv420p -movflags +faststart', $now - 60);
}
