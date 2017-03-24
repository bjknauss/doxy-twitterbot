var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var debug = require('debug')('MediaFetcher');
var config = require('./bot-config.json');
var jsonfile = require('jsonfile');

var pm = require(config['previousMediaPath'])['previousMedia'];
var parentFolderPath = '/Users/brendenknauss/Pictures/tweet_pics/';
// Default Refresh Period of 3 hours.
var defaultRefreshPeriod = 1000 * 60 * 60 * 3;

function MediaFetcher(){
    this.root = '';
    this.lastRefresh = new Date();
    this.previousMedia = pm;
    this._folders = [];
    this._media = [];
    this._scheduler;
    this._scheduledRefresh = false;
    this.refreshPeriod = defaultRefreshPeriod;
    this.numPreviousMedia = 25;
}

/** @param {string=} rootDirectory - Full path to Media Directory */
MediaFetcher.prototype.init = function(rootDirectory){
    this.root = rootDirectory || parentFolderPath;
    this.refresh();
    this.startScheduledRefresh();
}

MediaFetcher.prototype.startScheduledRefresh = function(){
    this._scheduler = setInterval(this.refresh, defaultRefreshPeriod);
    this._scheduledRefresh = true;
}

MediaFetcher.prototype.stopScheduledRefresh = function(){
    clearInterval(this._scheduler);
    this._scheduledRefresh = false;
}
/** Re-reads the directory and updates the folders and files arrays. */
MediaFetcher.prototype.refresh = function(){
    var self = this;
    fs.readdir(self.root, (err, files) => {
        if(err){
            debug("refresh error: %O", err);
        }
        var folders = _.filter(files, (name) =>{
            var fullpath = path.join(self.root, name);
            return fs.statSync(fullpath).isDirectory();
        });
        var files = [];
        _.each(folders, (folder)=>{
            var fp = path.join(self.root, folder);
            var items = fs.readdirSync(fp);
            items = _.filter(items, (i)=>{
                if(i.charAt(0) === '.'){
                    return false;
                }
                return fs.statSync(path.join(fp, i)).isFile();
            });
            _.each(items,(file)=>{
                files.push({
                    name: file,
                    parent: folder,
                    tags: [folder],
                    path: path.join(fp, file)
                });
            });
        });
        self._folders = folders;
        self._media = files;
        if(self._media.length > self.numPreviousMedia){
            self.numPreviousMedia = Math.floor(self._media.length / 2);
        }
        self.lastRefresh = new Date();
    });
}
/** Returns a random MediaItem object.
 * @returns {object} - MediaItem {name, parent, tags[], path}
 */
MediaFetcher.prototype.randomMedia = function(){
    var numOfImages = this._media.length;
    var imgIndex = randomInt(numOfImages);
    var media = this._media[imgIndex];
    while(_.includes(this.previousMedia,media.path)){
        media = this._media[randomInt(numOfImages)];
    }
    this.previousMedia.push(media.path);
    while(this.previousMedia.length > this.numPreviousMedia){
        this.previousMedia.shift();
    }
    savePreviousMedia(this.previousMedia);
    if(!this._scheduledRefresh){
        var now = new Date();
        if(now.getTime() > (this.lastRefresh + this.refreshPeriod)){
            this.refresh();
        }
    }
    return media;
}
function savePreviousMedia(media){
    var obj = {'previousMedia': media};
    jsonfile.writeFile(config['previousMediaPath'], obj, (error)=>{
        if(error){
            console.error(error);
        }
    });
}


function randomInt(max){
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

module.exports = MediaFetcher;