<?php

$settings = new stdClass();
//$settings->secretWord = 'bimbo';

// only these extensions can ever be listed (or deleted); options in the viewer can narrow this list but never extend it
$settings->allowedFileTypes = 'jpg, jpeg, png, gif, webp, avif, bmp, svg, mp4, webm, mov, m4v';

// show subfolders as tiles and allow browsing into them (hidden folders starting with '.' are never shown)
$settings->showSubfolders = true;

// purely optional and to be changed only from backend
// if set to true it will automatically delete files older than x days specified by parameter
// keeping folder clean
$settings->deleteOlderFiles = false;
$settings->deleteOlderThanDays = 14;

// these do not really matter
$settings->startIndex = 0;
$settings->itemsPerPage = 10;
