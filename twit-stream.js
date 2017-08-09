var _ = require('lodash');
var Twit = require('twit');
var TwitRest = require('./twit-rest');
var UserManager = require('./user-manager');
var debug = require('debug')('TwitStream');


function TwitStream(userId, twit, twitRest, userManager, lists){
    this.twit = twit;
    this.twitRest = twitRest;
    this.userManager = userManager;
    this.id = userId;
    this.lists = lists;
    this.stream = null;
}

TwitStream.prototype.init = function(params){
    if(!_.isObject(params)){
        params = { stringify_friend_ids: true };
    }
    this.stream = this.twit.stream('user', params);
    this.stream.on('tweet', this.tweetHandler.bind(this));
    this.stream.on('follow', this.followHandler.bind(this));
    this.stream.on('unfollow', this.unfollowHandler.bind(this));
    this.stream.on('list_member_added', this.listAddedHandler.bind(this));
    this.stream.on('list_member_removed', this.listRemovedHandler.bind(this));
    debug("initialization completed.");
}

TwitStream.prototype.tweetHandler = function(tweet){
    var tweeter = tweet['user'];
    var tweeterId = tweeter['id_str'];
    var id = tweet['id_str'];
    var rted = tweet['retweeted'];    
    debug("tweetHandler: %s", tweeter['name']);
    if(_.has(tweet, 'extended_entities.media') && rted !== true){
        if(this.userManager.checkRetweet(tweeter['id_str'])){
            this.userManager.update(tweeter);
            var user = this.userManager.get(tweeterId);
            user.lastRetweet = new Date();
            this.twitRest.queueRetweet(id);
            debug("tweet queued: %s", tweet['text']);
            this.userManager.save();
        }
    }
}


TwitStream.prototype.followHandler = function(event){
    var src = event['source'];
    var target = event['target'];
    if(src['id_str'] === this.id){
        var user = this.userManager.updateUser(target);
        if(_.isObject(user)){
            user.friend = true;

            _.each(this.lists, (list, property) => {
                if(list === 'friends'){
                    user[property] = true;
                }
            });
            debug("followed: %O", user);
            this.userManager.save();
        }    
    }
}

TwitStream.prototype.unfollowHandler = function(event){
    var src = event['source'];
    var target = event['target'];
    if(src['id_str'] === this.id){
        var user = this.userManager.updateUser(target);
        if(_.isObject(user)){
            user.friend = false;
            _.each(this.lists, (list, property) => {
                if(list === 'friends'){
                    user[property] = false;
                }
            });
            debug("unfollowed: %O", user);
            this.userManager.save();
        }    
    }
}

TwitStream.prototype.listAddedHandler = function(event){
    var src = event['source'];
    var target = event['target'];
    var listSlug = event['target_object']['slug'];
    if(src['id_str'] === this.id){
        var user = this.userManager.updateUser(target);
        if(_.isObject(user)){
            _.each(this.lists, (list, property) => {
                if(list.toUpperCase() === listSlug.toUpperCase()){
                    user[property] = true;
                }
            });
            debug("added [%s] to [%s] list", user.name, listSlug);
            this.userManager.save();
        }
    }
}

TwitStream.prototype.listRemovedHandler = function(event){
    var src = event['source'];
    var target = event['target'];
    var listSlug = event['target_object']['slug'];
    if(src['id_str'] === this.id){
        var user = this.userManager.updateUser(target);
        if(_.isObject(user)){
            _.each(this.lists, (list, property) => {
                if(list.toUpperCase() === listSlug.toUpperCase()){
                    user[property] = false;
                }
            });
            debug("removed [%s] from [%s] list", user.name, listSlug);
            this.userManager.save();
        }
    }
}

module.exports = TwitStream;