var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var debug = require('debug')('MediaFetcher');
var config = require('./bot-config.json');

// var pm = require(config['previousMediaPath'])['previousMedia'];
var parentFolderPath = '/Users/brendenknauss/Pictures/tweet_pics/';
// Default Refresh Period of 3 hours.
//var defaultRefreshPeriod = 1000 * 60 * 60 * 3;
var defaultRefreshPeriod = 1000 * 60 * 3;

function MediaFetcher(params){
    var self = this;
    this.root = params['path'];
    this.lastRefresh = new Date();
    this.previousMedia = [];
    this.previousMediaPath = params['previousMediaPath'];
    this.numPreviousMedia = params['numPreviousMedia'];

    // loadJSON(this.previousMediaPath).then((data) => {
    //     self.previousMedia = data['previousMedia'];
    // }).catch((error) => {
    //     console.log(error);
    //     console.log("ERROR reading " + self.previousMediaPath);
    //     saveJSON(self.previousMediaPath, {'previousMedia': []});
    //     self.previousMedia = [];
    // })
    // jsonfile.readFile(this.previousMediaPath, (error, data)=>{
    //     if(error){
    //         console.log(error);
    //     }
    //     this.previousMedia = data['previousMedia'] || [];
    // })
    this._folders = [];
    this._media = [];
    this._scheduler;
    this._scheduledRefresh = false;
    this.refreshPeriod = defaultRefreshPeriod;
    debug("previousMediaPath", this.previousMediaPath);
}

/** @param {string=} rootDirectory - Full path to Media Directory */
MediaFetcher.prototype.init = function(){
    var self = this;
    var promise = this.loadJSON(this.previousMediaPath);
    promise.then((result) => {
        if(result === false){
            self.save();
        }else{
            self.previousMedia = result.previousMedia;
            self.numPreviousMedia = result.numPreviousMedia;
        }
    });
    promise.catch((error)=> {
        console.log(error);
    })
    //this.refresh();
    this.startScheduledRefresh();
    // console.log(this);
}

MediaFetcher.prototype.startScheduledRefresh = function(){
    this._scheduler = setInterval(this.refresh.bind(this), this.refreshPeriod);
    this._scheduledRefresh = true;
}

MediaFetcher.prototype.stopScheduledRefresh = function(){
    clearInterval(this._scheduler);
    this._scheduledRefresh = false;
}
/** Re-reads the directory and updates the folders and files arrays. */
MediaFetcher.prototype.refresh = function(){
    debug("refreshing media: %s", this.root);
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
        self.save();
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
    this.save();
    if(!this._scheduledRefresh){
        var now = new Date();
        if(now.getTime() > (this.lastRefresh + this.refreshPeriod)){
            this.refresh();
        }
    }
    return media;
}

MediaFetcher.prototype.save = function(){
    var obj = { 
        'previousMedia': this.previousMedia, 
        'numPreviousMedia': this.numPreviousMedia
    };
    this.saveJSON(this.previousMediaPath, obj);
}

MediaFetcher.prototype.saveJSON = function(path, obj){
    fs.writeFile(path, JSON.stringify(obj, null, 4),(error)=> {
        if(error){
            console.log(error);
        }
    });
}

MediaFetcher.prototype.loadJSON = function(path){
    return new Promise(
        (resolve, reject) => {
            fileExists(path).then((data) => {
                // console.log(data.toString());
                var data = JSON.parse(data);
                resolve(data);
            }).catch((error)=> {
                if(error.code === 'ENOENT'){
                    debug("No JSON file found at [%s]", path);
                    resolve(false);
                }else{
                    reject(error);
                }
            });
        }
    );
}



function fileExists(path){
    return new Promise(function(resolve, reject){
        fs.readFile(path, (error, data)=> {
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        });
    });
}

function randomInt(max){
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

module.exports = MediaFetcher;