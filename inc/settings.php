<?php

$settings = new stdClass();
//$settings->secretWord = 'bimbo';

// only these extensions can ever be listed (or deleted); options in the viewer can narrow this list but never extend it
$settings->allowedFileTypes = 'jpg, jpeg, png, gif, webp, avif, bmp, svg, mp4, webm, mov, m4v';

// show subfolders as tiles and allow browsing into them (hidden folders starting with '.' are never shown)
$settings->showSubfolders = true;

// small cached copies of images for the gallery tiles: 'auto' = on when PHP GD is available and the inc folder is writable, true, false
// cache lives in inc/.thumbs (safe to delete), unused thumbnails are removed after 30 days, the cache is kept under thumbnailCacheMaxMB
$settings->thumbnails = 'auto';
$settings->thumbnailSize = 400;
$settings->thumbnailCacheMaxMB = 200;

// purely optional and to be changed only from backend
// if set to true it will automatically delete files older than x days specified by parameter
// keeping folder clean
$settings->deleteOlderFiles = false;
$settings->deleteOlderThanDays = 14;

// these do not really matter
$settings->startIndex = 0;
$settings->itemsPerPage = 10;
