<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

@session_start();

require_once("settings.php");
$request = file_get_contents('php://input');

$input = json_decode($request);
$pathPrefix = dirname(__DIR__).'/';

function isValidFile($file, $fileTypes) {

	if (!is_dir($file) && $file != "." && $file != "..") {
		$ext = pathinfo($file, PATHINFO_EXTENSION);
		$file_ext = explode(',',str_replace(' ', '', $fileTypes));

		if(in_array(strtolower($ext),$file_ext)) {
			return true;
		}
	}
	return false;
}

if(isset($input->receive))
{		
	if(isset($input->startIndex) && is_numeric($input->startIndex))
		$settings->startIndex = $input->startIndex;
	
	if(isset($input->itemsPerPage) && is_numeric($input->itemsPerPage))
		$settings->itemsPerPage = $input->itemsPerPage;
		
	if(isset($input->fileTypes))
		$settings->fileTypes = $input->fileTypes;
	
	if($settings->deleteOlderFiles) {
		$files = glob($pathPrefix."*");
		$now   = time();

		foreach ($files as $file) {
			if(isValidFile($file, $settings->fileTypes)) {
				if ($now - filemtime($file) >= 60 * 60 * 24 * $settings->deleteOlderThanDays) { 
					unlink($file);
				}
			}
		}
	}
	
	$files = array();
	$dir = opendir('..'); 

	while(false != ($file = readdir($dir))) {
		if(isValidFile($pathPrefix.$file, $settings->fileTypes))
			$files[] = $file;
	}
	
	//rsort($files);
	//natsort($files); // sort.
	
	// sort files by last modified date
	usort($files, function($x, $y) use($pathPrefix) {
		return filemtime($pathPrefix.$x) < filemtime($pathPrefix.$y);
	});

	$index = 0;
	$count = 0;
	$returnFiles = array();
	
	foreach($files as $file) 
	{
			if($index >= $settings->startIndex && $count < $settings->itemsPerPage)
			{
				$fileInfo = new StdClass();
				$fileInfo->name = $file;
				$fileInfo->changeDate = filemtime($pathPrefix.$file);
				$returnFiles[] = $fileInfo;
				$count++;
			}
			$index++;
	}
	
	$returnObject = new stdClass();
	$returnObject->images = $returnFiles;
	$returnObject->allCount = count($files);
	
	echo json_encode($returnObject);
}
?>