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
var gifPath = '/Users/brendenknauss/code/doxy-twitterbot/cute_bunny_girl.gif';

//var img = require("fs").readFileSync("sakura.jpg");

// T.get('friends/ids', {screen_name: "NymphoNode", stringify_ids: true}, function (error, data, response){
//     console.log(data);
// })

// T.get('friends/ids', {stringify_ids: true}, function (error, data, response){
//     console.log(data);
// })

T.get('lists/ownerships',  function (error, data, response){
    console.log(data);
})

function init(){
    console.log("beginning tweets...");
    //T.get('search/tweets', { q: 'banana since:2011-07-11', count: 1 }, function(err, data, response) {
        //     console.log(data)
        // })
    //tweetRandomImage2();
    setInterval(tweetRandomImage, tweetInterval);
    T.postMediaChunked({file_path: gifPath}, function(error, data, response){
        console.log(data);
    });
}


//var stream = T.stream('user', {stringify_friend_ids: true});

/*
stream.on('friends', function(friendsMessage){
    // returns friends_str as key to array
    console.log("Entered Friend event:", friendsMessage);
});

stream.on('retweeted_tweet', (retweet)=>{
    console.log('retweeted', retweet);
});

stream.on('quoted_tweet', (quoted)=>{
    console.log('quoted', quoted);
})
stream.on('favorite', (event)=>{
    console.log('favorite', event);
})
*/

// stream.on('message', function(msg){
//     console.log("------------------- MESSAGE -----------------");
//     console.log(msg);
// })

// stream.on('user_event', function(msg){
//     console.log("------------------- USER EVENT -----------------");
//     console.log(msg);
// })


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
    status += ", #lewd #hentai #" + tweet.parent;
    return status;
}


function tweetRandomImage(){
    console.log("entering tweetrandom");
    var tweetImage = imgs.randomMedia();
    var imgBuffer = fs.readFileSync(tweetImage.path, 'base64');
    console.log("img buffered");
    T.post('media/upload', {media: imgBuffer}, function(error, data, response){
        if(error){
            throw error;
        }
        console.log("entering update status");
        debug("result.data", data);
        var tweet = {
            status: writeStatus(tweetImage),
            media_ids: data.media_id_string
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
//tweetRandomImage();

//init();


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