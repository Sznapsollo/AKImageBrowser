<?php

$settings = new stdClass();
//$settings->secretWord = 'bimbo';

// purely optional and to be changed only from backend
// if set to true it will automatically delete files older than x days specified by parameter
// keeping folder clean
$settings->deleteOlderFiles = false;
$settings->deleteOlderThanDays = 14;

// these do not really matter
$settings->startIndex = 0;
$settings->itemsPerPage = 10;
$settings->fileTypes = '';

?>