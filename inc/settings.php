<?php

$settings = new stdClass();
$settings->startIndex = 5;
$settings->itemsPerPage = 10;
$settings->fileTypes = '';

// purely optional and to be changed only from backend
// if set to true it will automatically delete files older than x days specified by parameter
// keeping folder clean
$settings->deleteOlderFiles = false;
$settings->deleteOlderThanDays = 14;

?>