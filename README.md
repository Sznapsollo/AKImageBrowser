# AKImageBrowser

## About

AKImageBrowser is a quickly deployable web image browser/gallery that displays images from the folder it is copied into. It is based on PHP (backend) and Vue 3 (frontend).

It is deliberately small (about 400 KB, ~90 KB transferred on first load) and has nothing to build or install.

Working example: <a href="http://cultrides.com/test/Github/AKImageBrowser/" target="_blank">AKImageBrowser example</a>

YouTube quick video showing how to deploy and use it: <a href="https://youtu.be/LktPTabEfws" target="_blank">AKImageBrowser video</a>

## Requirements

- Any web server with PHP 7.2 or newer (PHP 8.x recommended).
- A current browser (Chrome/Edge/Firefox, Safari 15.4+).

## How to use

Copy the <b>inc</b> folder and the <b>index.html</b> file into a web folder containing images and ... that's it ;-)

Now browse to that folder's address and AKImageBrowser will display your images.

You can also download `AKImageBrowser-<version>.zip` from the GitHub releases page - it contains only these two items. To build the same zip from a checkout:

```bash
git archive -o AKImageBrowser.zip HEAD index.html inc
```

Notes:
- an existing `index.html` in the folder will be replaced,
- if the folder already has its own `inc` folder, files will be mixed - use a different folder or rename one of them,
- subfolders are shown as tiles and can be browsed (except hidden ones starting with `.` and the `inc` folder itself); set `showSubfolders = false` to turn this off.

## Updating

Delete the old `inc` folder and `index.html`, then copy the new ones. Copying over the old `inc` works too, but leaves unused files from older versions behind. If you changed `inc/settings.php`, keep a copy and re-apply your changes.

The current version is shown in the footer of the page.

## Features (in viewer options)

AKImageBrowser has some features that make image browsing a bit more pleasant:
- paging with options to choose how many images per page should be displayed
- lazy loading -> images load when the user actually scrolls to them
- videos (mp4, webm, mov, m4v) -> shown with a first-frame thumbnail and played in the viewer
- filtering of file types -> user can set which file extensions should be displayed (empty = all allowed types)
- image scaling -> user can adjust the size of images in the gallery (also +/- buttons and keys)
- uniform tiles -> thumbnails as cropped squares (default), whole image fitted in a square, or original shape [in options]
- viewer toolbar with slideshow, fullscreen and download
- light / dark / auto theme (auto follows the system setting, also when it changes) switchable from the header
- sorting by date or name (newest/oldest, A-Z/Z-A)
- subfolder browsing with breadcrumbs (folder is kept in the page address); folder tiles show the newest image and file count
- search by file name (kept in the page address, so it survives reload and can be shared)
- optional showing of image name and image change date in the images list
- option to hide image descriptions when image size is lower than a specified value
- option to auto refresh the gallery, refresh interval can be changed

## Settings in inc/settings.php

- `allowedFileTypes` - extensions that can ever be listed (default: jpg, jpeg, png, gif, webp, avif, bmp, svg, mp4, webm, mov, m4v). Viewer options can narrow this list but never extend it.
- `showSubfolders` - show subfolders and allow browsing into them (default: true). Browsing never goes outside the folder AKImageBrowser is in.
- `secretWord` - if enabled, the viewer asks for this word before showing images. It is not really a security measure (images are still reachable by direct link) but comes in handy sometimes.
- `deleteOlderFiles` - if enabled, deletes media files (only `allowedFileTypes`, so videos too) older than `deleteOlderThanDays` days, in the main folder only (not subfolders). It only runs when someone views the gallery, there is no scheduled task.

## Changelog

- 1.60 - uniform rounded square tiles (with option), folder preview tiles, light/dark/auto theme switch in header, slideshow/fullscreen/download in viewer, AKIB header, section.css merged into cascade.css.
- 1.59 - video support (mp4, webm, mov, m4v); viewer file types empty by default = all allowed types. If you saved a file type list in Options before, clear it there to see videos.
- 1.58 - subfolder browsing with breadcrumbs, Vue 3.2 / vue-router 4.2.
- 1.57 - sorting (date/name) and file name search.
- 1.56 - security fixes (file type whitelist, safe captions, file names with special characters), about 10x smaller download (no jQuery/Bootstrap/axios), native lazy loading, version in footer.

## Note

This little tool comes in handy sometimes. I made it just to have an easily deployable image browser with a friendly interface for a variety of needs (home camera images, vacation pics etc). Hope you will find it useful too ;-)

Wanna touch base? office@webproject.waw.pl

## Example Screen

![Image of AKImageBrowser #1](http://cultrides.com/test/Github/AKImageBrowserDemo20181124.JPG)
