var fs = require('fs');
var _ = require('lodash');
var Twit = require('twit');
var debug = require('debug')('appjs');
// var Bot = require('./bot');
var TwitterUser = require('./twitter-user');

var tokens = require("./tokens.json");
var lewdoxy = require('./lewdoxy.json');
var NymphoImages = require('./files.js');

var imgs = new NymphoImages('/Users/brendenknauss/Pictures/tweet_pics/');
var numOfTweets = 0;
var tweetInterval = 1 * 60 * 1000;
var T = new Twit(lewdoxy);
var gifPath = '/Users/brendenknauss/code/doxy-twitterbot/cute_bunny_girl.gif';



var sampleUser = {
    "id": "2279992836",
    "followers": 500,
    "screenName": "sample",
    "name": "sample user",
    "initialFollowers": 30,
    "lastMilestone": 200,
    "trackingMilestone": true,
    "admin": false,
    "retweets": true,
    "friend": true,
    "mentions": true,
    "dedicatedRetweet": false,
    "lastRetweet": "2017-05-13T07:04:39.919Z"
};

var us = new TwitterUser(sampleUser.id);
console.log(us);
var user = _.extend(us, sampleUser);
console.log(user);
_.each(sampleUser, (item)=> {
    console.log(item);
});


//var img = require("fs").readFileSync("sakura.jpg");

// T.get('friends/ids', {screen_name: "NymphoNode", stringify_ids: true}, function (error, data, response){
//     console.log(data);
// })

// T.get('friends/ids', {stringify_ids: true}, function (error, data, response){
//     console.log(data);
// })

// T.get('lists/ownerships',  function (error, data, response){
//     console.log(data);
// })

// function init(){
//     console.log("beginning tweets...");
//     //T.get('search/tweets', { q: 'banana since:2011-07-11', count: 1 }, function(err, data, response) {
//         //     console.log(data)
//         // })
//     //tweetRandomImage2();
//     setInterval(tweetRandomImage, tweetInterval);
//     T.postMediaChunked({file_path: gifPath}, function(error, data, response){
//         console.log(data);
//     });
// }
var doxyId = "802436237227278336";
var params = { 
    count: 250, 
    include_entities:false, 
    skip_status: true, 
    slug: "my-dewds", 
    owner_id: doxyId };

// T.get('lists/members', params, (err, data, resp) => {
//     console.log(data);
// })


// T.get('friends/list', {count: 200, skip_status: true, include_user_entities: false}, (err, data, response)=> {
//     if(err){
//         console.log(err);
//     }
//     console.log(data);
// });
// var params = {
//     user_id: "802436237227278336",
//     trim_user: true,
//     include_rts: true,
//     count: 5,
//     exclude_replies: true,
//     contributor_details: false
// };
var keepRetweeting = true;
var timelineParams = {
    count: 3,
    trim_user: false,
    include_rts: true
}
// T.get('statuses/user_timeline', timelineParams, (error, data, response)=> {
//     if(error){
//         console.log(error);
//     }else{
//         console.log(data);
//         _.each(data, (tweet)=> {
//             if(_.has(tweet, 'retweeted_status')){
//                 var rtstat = tweet['retweeted_status'];
//                 if(_.has(rtstat, 'entities')){
//                     console.log("ENTITIES");
//                     console.log(rtstat['entities']);
//                 }
//             }
//         })
//     }
// });
// T.get('users/show', {}, (error, data, response)=> {
//     if(error){
//         console.log(error);
//     }else{
//         console.log(data);
//     }
// });

// T.postMediaChunked({file_path: './sakura.jpg'}, (err, data, resp)=> {
//     if(err){
//         console.log(err);
//     }else{
//         console.log(data);
//     }
// })


function retweet(tweetId){
    return new Promise(
        (resolve, reject) => {
            T.post('statuses/retweet/:id', {id: tweetId}, (err, data, response)=>{
                if(err){
                    console.log("ERROR:" + tweetId);
                    console.log(err);
                    console.log(data);
                    console.log(response);
                    reject(err);
                }else{
                    var user = data['user'];
                    var debugInfo = {
                        screen_name: user['screen_name'],
                        tweet_id: data['id_str'],
                        text: data['text']
                    };
                    debug("twit-rest[retweet]: %O", debugInfo);
                    resolve(data);
                }
            });
        }
    );
}

// Bot.prototype.init = function(beginScheduledTweeting){
//     var self = this;
//     self._twit.get('users/show', {user_id: self.uid}, (error, data, response) => {
//         if(error){
//             console.log("ERROR[init]:", error);
//             throw error;
//         }
//         self.uid = data.id_str;
//         self.username = data.screen_name;
//         self.displayName = data.name;
//         self.friendsCount = data.friends_count;
//         self.followersCount = data.followers_count;
//         var params = { user_id: self.uid, count: 150, skip_status:true, include_user_entities: false };
//         self._twit.get('friends/list', { stringify_ids: true}, function (error, data, response){
//             self._friends = data.ids;
//         });
//     });
//     self._twit.get('lists/ownerships', function(err, data, res){
//         var lists = data.lists;
//         var list = _.find(lists, function(li){
//             return li.name === 'Mentions';
//         });
//         self._mentionListId = list.id_str;
//         self.updateMentionsList();
//     });
// }



// var stream = T.stream('user', {stringify_friend_ids: true});

// stream.on('tweet', function(message){
//     console.log("===================================");
//     console.log(message);
// });

// stream.on('tweet', function(message){
//     console.log("------------------- MESSAGE -----------------");
//     console.log(message['text']);
//     console.log(message['entities']['user_mentions']);
// })

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

// stream.on('tweet', function(msg){
//     console.log("------------------- MESSAGE -----------------");
//     console.log(msg);
// });

// stream.on('follow', function(msg){
//     console.log("------------------- USER EVENT -----------------");
//     console.log(msg);
//     var target = msg['target'];
//     console.log("CHECKING VALUE");
//     var following = target['following'];
//     console.log(typeof following);
//     if(_.isNil(following)){
//         console.log("NIL!");
//     }
//     if(_.isBoolean(following)){
//         console.log("BOOL!");
//     }
//     if(_.isString(following)){
//         console.log("STRING");
//     }
//     if(_.isObject(following)){
//         console.log("OBJECT");
//     }
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