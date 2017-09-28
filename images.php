<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

@session_start();

$request = file_get_contents('php://input');

$input = json_decode($request);

$startIndex = 5;
$itemsPerPage = 10;
$fileTypes = '';

if(isset($input->receive))
{		
	if(isset($input->startIndex) && is_numeric($input->startIndex))
		$startIndex = $input->startIndex;
	
	if(isset($input->itemsPerPage) && is_numeric($input->itemsPerPage))
		$itemsPerPage = $input->itemsPerPage;
		
	if(isset($input->fileTypes))
		$fileTypes = $input->fileTypes;
	
	$files = array();
	$dir = opendir('.'); // open the cwd..also do an err check.
	while(false != ($file = readdir($dir))) {
		if (!is_dir($file) && $file != "." && $file != "..") {		
			$ext = pathinfo($file, PATHINFO_EXTENSION);
			$file_ext = explode(',',str_replace(' ', '', $fileTypes));

			if(in_array(strtolower($ext),$file_ext)) {
				$files[] = $file;
			}			
		}
	}
	
	rsort($files);

	//natsort($files); // sort.

	$index = 0;
	$count = 0;
	$returnFiles = array();
	// print.
	foreach($files as $file) 
	{
			if($index >= $startIndex && $count < $itemsPerPage)
			{
				$returnFiles[] = $file;
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