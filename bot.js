var _ = require('lodash');
var fs = require('fs');
var Twit = require('twit');
var MediaFetcher = require('./media-fetcher');
var debug = require('debug')('bot');
var mime = require('mime');
// var botConfig = require('./bot-config.json')['bots'][0];
var botConfig = require('./bot-config.json')['bots'];
var tokens = require("./tokens.json");
var sn = require('./misc/twitter_screennames_from_34.json');
var UserManager = require('./user-manager');
var TwitRest = require('./twit-rest');
var TwitStream = require('./twit-stream');

var mediaRoot = '/Users/brendenknauss/Pictures/tweet_pics/';


function Bot(params){
    var self = this;
    self.username = '';
    self.uid = params['user-id'];
    self.displayName = '';
    self.friendsCount = 0;
    self.followersCount = 0;
    self.retweetInterval = params['user-manager']['retweetInterval'];
    self.tweetInterval = params['tweetInterval'];
    self._mentionListId;
    self._mentions = [];
    self._running = false;
    self._scheduler;
    self._friends = [];
    self._retweet_times = {};
    self._twit = new Twit(params['twitter']);
    self._mf = new MediaFetcher(params['media-fetcher']);
    self._mf.init();
    self.userManager = new UserManager(params['user-manager']);
    self.userManager.load();
    self.twitRest = new TwitRest(self._twit);
    self.twitRest.start();
    self.lists = params['lists'];
    self.twitStream = new TwitStream(self.uid, self._twit, self.twitRest, self.userManager, self.lists);
    self.isRunning = function(){
        return self._running;
    }
}

Bot.prototype.init = function(beginScheduledTweeting){
    var self = this;
    console.log("Initializing bot for twitter id:" + self.uid);
    // console.log(self.userManager);
    var promises = [];
    var userPromise = self.twitRest.user(self.uid)
        .then((user)=> {
            // console.log("Entering user....");
            self.username = user['screen_name'];
            self.displayName = user['name'];
            self.friendsCount = user['friends_count'];
            self.followersCount = user['followers_count'];
        }).catch((error)=> {
            if(error){
                console.log("Couldn't enter User...");
                console.log(error);
            }
        });
    promises.push(userPromise);
    promises.push(
        self.twitRest.friends()
            .then((users)=> {
                // console.log("Entering friends...");
                _.each(users, (user)=>{
                    var u = self.userManager.updateUser(user);
                    // u.friend = true;
                    // u.retweets = true;
                    // u.trackingMilestone = true;
                    // u.mentions = true;
                });
                self.userManager.setAll('friend', users);
                _.each(self.lists, (list, property) => {
                    if(list === "friends"){
                        self.userManager.setAll(property, users);
                    }
                })
                // console.log(self.userManager);
            })
    );

    userPromise.then((users) => {
        _.each(self.lists, (list, property) => {
            console.log("property:" + property + ", list:" + list);
            if(list !== "friends"){
                debug("LIST OF: %s" + property);
                promises.push(self.twitRest.listMembers(self.uid, list)
                    .then((users) => {
                        self.userManager.update(users);
                        self.userManager.setAll(property, users);
                    }).catch((error) => {
                        console.log(error);
                    }))
            }
        });
    });
    
    Promise.all(promises).then((vals)=> {
        // console.log("Entering Promise.all...");
        // debug(self);

        self.userManager.save();
        self._mf.save();
        //self.scheduledTweetHandler();
        self.startTweeting(self.tweetInterval);
        self.userManager.emitter.on('milestoneReached', self.milestoneReachedHandler.bind(this));
        self.twitStream.init();
        self.twitRest.start();
        self._mf.refresh();
        // console.log(self.userManager);
    });
}


Bot.prototype.dedicatedRetweetHandler = function(){
    var self = this;
    var users = this.userManager.dedicatedRetweets();
    _.each(users, (user) => {
        self.twitRest.timeline(user.id)
            .then((tweet) => {
                if(_.has(tweet, 'retweeted') && !tweet['retweeted']){
                    self.twitRest.queueRetweet(tweet['id_str']);
                }
            });
    });
}

Bot.prototype.scheduledTweetHandler = function(){
    var media = this._mf.randomMedia();
    var status = this.writeStatus(media);
    this.twitRest.tweet(status, media);
    this.userManager.save();
    this._mf.save();
}

Bot.prototype.milestoneReachedHandler = function(user, milestone){
    var media = this._mf.randomMedia();
    var status = "Congratulations to @" + user.screenName;
    status += " on " + milestone + " followers!";
    debug("milestoneReachedHandler: %s", user.name);
    this.twitRest.tweet(status, media);
}


Bot.prototype.startTweeting = function(interval){
    debug("starting scheduled tweeting.");
    var self = this;
    // debug(self);
    interval = interval || defaultTweetInterval;
    if(!self._running){
        self._scheduler = setInterval(self.scheduledTweetHandler.bind(self), interval);
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
    debug(tweet);
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



Bot.prototype.writeStatus = function(mediaItem){
    var i = 0;
    var status = "#lewd #hentai #" + mediaItem.parent + '\n';
    for(i = 0; i < 3; i++){
        var m = this.userManager.randomMention();
        status += '\n' + '@' + m.screenName; 
    }
    return status;
}


function randomInt(max){
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

_.each(botConfig, (botInfo) => {
    var bot = new Bot(botInfo);
    bot.init();
});

// var bot = new Bot(botConfig);
// bot.init();
// console.log("test");
// bot.startTweeting(1000*30);