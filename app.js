var fs = require('fs');
var _ = require('lodash');
var Twit = require('twit');
var debug = require('debug')('appjs');

var tokens = require("./tokens.json");
var NymphoImages = require('./files.js');

var imgs = new NymphoImages('/Users/brendenknauss/Pictures/tweet_pics/');
var numOfTweets = 0;
var tweetInterval = 1 * 60 * 1000;
var T = new Twit(tokens);

//var img = require("fs").readFileSync("sakura.jpg");

function init(){
    console.log("beginning tweets...");
    //T.get('search/tweets', { q: 'banana since:2011-07-11', count: 1 }, function(err, data, response) {
        //     console.log(data)
        // })
    tweetRandomImage2();
    setInterval(tweetRandomImage, tweetInterval);
}


/*
client.stream('user', {'stringify_friends_ids': true, "replies":"all", "filter_level":"none"}, function(stream){
    stream.on('data', function(event){
        console.log(event);
    });
    stream.on('error', function(error){
        console.log("error:" + error);
    });
});
*/

//var stream = client.stream('user', {'stringify_friends_ids': true, "replies":"all"}, function());
/*
stream.on('data', function(event){
    console.log("event:" + event);
    console.log("target:", event.target);
    if(_.isNil(event.target_object)){
        console.log("target obj is Nil");
    }else{
        console.log(event.target_object);
    }
});

stream.on('error', function(error) {
    console.log(error);
})
*/

function writeStatus(tweet){
    var status = "Tweet " + numOfTweets;
    status += ", #lewd #hentai #" + tweet.parentFolder;
    return status;
}


function tweetRandomImage(){
    console.log("entering tweetrandom");
    var tweetImage = imgs.randomImage();
    var imgBuffer = fs.readFileSync(tweetImage.fullPath, 'base64');
    console.log("img buffered");
    T.post('media/upload', {media: imgBuffer}, function(error, data, response){
        if(error){
            throw error;
        }
        console.log("entering update status");
        debug("result.data", data);
        var tweet = {
            status: writeStatus(tweetImage),
            media_ids: [data.media_id_string]
        };
        T.post('statuses/update', tweet, function(err, data, res){
            if(err){
                console.log("app:tweetRandomImage", err);
            }else{
                numOfTweets += 1;
            }
        });
    });
}



function tweetRandomImage2(){
    console.log("entering tweetrandom");
    var tweetImage = imgs.randomImage();
    var imgBuffer = fs.readFileSync(tweetImage.fullPath, 'base64');
    console.log("img buffered");
    T.post('media/upload', {media_data: imgBuffer})
        .catch(function(error){
            console.log(error);
        })
        .then(function(result){
            console.log("entering update status");
            debug("result.data", result.data);
            var tweet = {
                status: writeStatus(tweetImage),
                media_ids: [result.data.media_id_string]
            };
            T.post('statuses/update', tweet, function(err, data, res){
                if(err){
                    console.log("app:tweetRandomImage", err);
                }else{
                    numOfTweets += 1;
                }
            })
        });
}


init();


/*

client.get("users/lookup", {screen_name: "twitterapi,twitter"}, function(err, tweet, response){
    if(!err){
        console.log(tweet);
    }else{
        console.log(err);
    }
})


client.post('statuses/update', {status: 'First post using NodeJS'},  function(error, tweet, response){
  if(error){
    console.log(error);
  }
  console.log(tweet);  // Tweet body.
  console.log(response);  // Raw response object.
});
*/