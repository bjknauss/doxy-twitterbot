var fs = require('fs');
var path = require('path');

var parentFolderPath = '/Users/brendenknauss/Pictures/tweet_pics/';

function NymphoImages(imageDirectoryPath){
    this.imageDirectory = imageDirectoryPath;

    this.folders = function (){
        items = fs.readdirSync(this.imageDirectory);
        return items.filter(function(item){
            var fullPath = path.join(this.imageDirectory, item);
            return fs.statSync(fullPath).isDirectory();
        }, this);
    };

    this.childFiles = function(parentFolder){
        items = fs.readdirSync(path.join(this.imageDirectory, parentFolder));
        return items.filter(function(item){
            if(item.charAt(0) === '.'){
                return false;
            }
            var fullPath = path.join(this.imageDirectory, parentFolder, item);
            return fs.statSync(fullPath).isFile();
        }, this);
    };

    this.images = function(){
        var imgs = [];
        this.folders().forEach(function(folder){
            var pics = this.childFiles(folder);
            pics.forEach(function(file){
                imgs.push({
                    name: file,
                    parent: folder,
                    path: path.join(this.imageDirectory, folder, file)
                });
            }, this);
        }, this);
        return imgs;
    };

    this.randomMedia = function(){
        var numOfImages = this.images().length;
        var imgIndex = randomInt(numOfImages);
        return this.images()[imgIndex];
    }

    //console.log(this.childFiles(this.folders[0]));

}

function randomInt(max){
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

module.exports = NymphoImages;
//console.log(childFiles(path.join(parentFolderPath, subFolder)));

/*
fs.readdir(folderPath, (err, files) => {
    if(err){
        console.log(err);
    }
    files.map(function(file){
        return path.join(folderPath, file);
    }).forEach(function(file){
        console.log(file);
    })
});
*/