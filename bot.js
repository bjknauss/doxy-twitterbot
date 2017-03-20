var _ = require('lodash');
var fs = require('fs');
var Twit = require('twit');
var MediaFetcher = require('./media-fetcher');
var debug = require('debug')('bot');
var mime = require('mime');
var tokens = require("./tokens.json");

var defaultTweetInterval = 1 * 60 * 1000;
var mediaRoot = '/Users/brendenknauss/Pictures/tweet_pics/';


function Bot(username, twitterParams, mediaRoot){
    var self = this;
    self.username = username;
    self.uid = '';
    self.displayName = '';
    self.friendsCount = 0;
    self.followersCount = 0;
    
    self._mentionListId;
    self._mentions = [];
    self._running = false;
    self._scheduler;
    self._friends = [];
    self._retweet_times = {};
    self._twit = new Twit(twitterParams);
    self._mf = new MediaFetcher();
    self._mf.init(mediaRoot);
    self.isRunning = function(){
        return self._running;
    }
}

Bot.prototype.init = function(beginScheduledTweeting){
    var self = this;
    self._twit.get('users/show', {screen_name: self.username}, (error, data, response) => {
        if(error){
            console.log("ERROR[init]:", error);
            throw error;
        }
        self.uid = data.id_str;
        self.username = data.screen_name;
        self.displayName = data.name;
        self.friendsCount = data.friends_count;
        self.followersCount = data.followers_count;
        self._twit.get('friends/ids', { stringify_ids: true}, function (error, data, response){
            self._friends = data.ids;
        });
    });
    self._twit.get('lists/ownerships', function(err, data, res){
        var lists = data.lists;
        var list = _.find(lists, function(li){
            return li.name === 'Mentions';
        });
        self._mentionListId = list.id_str;
        self.updateMentionsList();
    });
}

Bot.prototype.startTweeting = function(interval){
    console.log("starting scheduled tweeting.")
    var self = this;
    debug(self);
    interval = interval || defaultTweetInterval;
    if(!self._running){
        self._scheduler = setInterval(self.postRandomMedia.bind(self), interval);
    }
}

Bot.prototype.stopTweeting = function(){
    var self = this;
    if(!_.isNil(self._scheduler)){
        clearInterval(self._scheduler);
    }
    self._running = false;

}


Bot.prototype.postMedia = function(mediaItem, mediaId){
    var self = this;
    var tweet = {
        status: self.writeStatus(mediaItem),
        media_ids: mediaId
    };

    self._twit.post('statuses/update', tweet, (error, data, response) => {
        if(error){
            console.log("ERROR[Bot.postMedia]:", error);
        }
    });
}
Bot.prototype.postRandomMedia = function(){
    var self = this;
    var mediaItem = self._mf.randomMedia();
    if(mime.lookup(mediaItem.name) === 'image/gif'){
        self._twit.postMediaChunked({file_path: gifPath}, (error, data, response) => {
            if(error){
                console.log("ERROR[Bot.postRandomMedia]:", error);
            }
            self.postMedia(mediaItem, data.media_id_string);
        });
    }else{
        var imgBuffer = fs.readFileSync(mediaItem.path, 'base64');
        self._twit.post('media/upload', {media: imgBuffer}, (error, data, response) => {
            if(error){
                console.log("ERROR[Bot.postRandomMedia]:", error);
            }
            self.postMedia(mediaItem, data.media_id_string);
        });
    }
}

Bot.prototype.updateMentionsList = function (){
    debug("updating Mentions List");
    var self = this;
    var params = {
        list_id: self._mentionListId,
        include_entities: false,
        skip_status: true
    };
    self._twit.get('lists/members', params, (err, data, res) => {
        if(err){
            console.log('ERROR[updateMentionsList]:', err);
        }
        var users = data.users;
        self._mentions = _.map(users, function (o){
            return {
                id: o.id_str,
                screen_name: o.screen_name,
                followers: o.followers_count
            };
        });
    });
}

Bot.prototype.randomMention = function(){
    var self = this;
    var index = randomInt(self._mentions.length);
    return "@" + self._mentions[index].screen_name;
}

Bot.prototype.updateFriends = function(){
    var self = this;
    self._twit.get('friends/ids', { stringify_ids: true}, function (error, data, response){
        self._friends = data.ids;
    });
}

Bot.prototype.writeStatus = function(mediaItem){
    var self = this;
    var i = 0;
    var status = "#lewd #hentai #" + mediaItem.parent;
    for(i = 0; i < 3; i++){
        status += '\n' + self.randomMention();
    }
    return status;
}

function randomInt(max){
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

var bot = new Bot("nymphonode", tokens, mediaRoot);
bot.init();
setTimeout(bot.startTweeting.bind(bot), 15*1000);
