# AKImageBrowser

## About

AKImageBrowser is quick deployable web image browser/gallery that will display images from given folder. It bases on php (backend side) and Vue 3 (frontend side).

Working example: <a href="http://cultrides.com/test/Github/AKImageBrowser/" target="_blank">AKImageBrowser example</a>

Youtube quick vid showing way to deploy and use: <a href="https://youtu.be/LktPTabEfws" target="_blank">AKImageBrowser video</a>

## Usage

The idea is to copy contents of AKImageBrowser to some webserver folder that contains images. Then open this folder address in webbrowser which will allow to browse these images in a bit more friendly manner.

There is no need to compile or build anything. All is prepared to be copied.

## How to use instruction

copy <b>inc</b> folder, and <b>index.html</b> file to some webfolder containg images and ... Thats it ;-)

Now browse to that folder address with your browser and you should see AKImageBrowset viewer displaying your images.

## Features (in settings of viewer)

AKImageBrowser has some features that make image browsing a bit more pleasant:
- paging with options to choose how many images per page should be displayed
- lazy loading -> images will load when user actually displays them
- filtering of image types -> user can set what type of file extensions should be displayed [in options]
- image scaling -> user can adjust size of images to be displayed in gallery. [in options]
- optional showing image name and image change date in images list
- option to hide image descriptions whenl image size lower than specified value
- option to autorefresh gallery, refresh interval can be changed

## Some settings in settings.php

These initial settings allow you to tweak some initial viewer behaviour

- secretWord - if enabled will ask for secret word defined in this setting. option to hide images behind some secret key - it is not really any security measure but comes in handy sometimes.
- deleteOlderFiles - if enabled will delete older files than x days (determined by deleteOlderThanDays setting) - it only works when someone views images since there is not scheduled task or anything ... 

## Note

This little tool comes in handy sometimes. I made it just to have easily deployable image browser with friendly interface for variety of needs (home camera images, vacation pics etc). Hope you will find it useful too ;-)

Wanna touch base? office@webproject.waw.pl

## Example Screen

![Image of AKImageBrowser #1](http://cultrides.com/test/Github/AKImageBrowserDemo20181124.JPG)

## todo
...

