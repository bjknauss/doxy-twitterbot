var twit = require('twit');
var _ = require('lodash');
var fs = require('fs');
var mime = require('mime');
var debug = require('debug')('TwitRest');
var intervalPeriod = 1000 * 60 * 5;

var TwitRest = function(twit){
    this.twit = twit;
    this.retweetQueue = [];
    this.retweetScheduler = null;
}

TwitRest.prototype.start = function(){
    var self = this;
    debug("starting retweet scheduler.");
    self.retweetScheduler = setInterval(self.intervalRetweet.bind(self), intervalPeriod);
}
TwitRest.prototype.stop = function(){
    if(!_.isNil(this.retweetScheduler)){
        debug("stopping retweet scheduler.");
        clearInterval(this.retweetScheduler);
    }
}

TwitRest.prototype.intervalRetweet = function(){
    debug("retweet check.");
    if(this.retweetQueue.length > 0){
        var tweet = this.retweetQueue.shift();
        var promise = this.retweet(tweet);
        promise.catch((error)=> {
            if(error.code === 327){
                debug("already retweeted [%s]", tweet);
            }else{
                console.error(error);
            }
        })
        debug("retweeting id: %s", tweet);
    }
}

TwitRest.prototype.timeline = function(userId, params){
    if(_.isNil(params)){
        params = {
            user_id: userId,
            trim_user: false,
            include_rts: true,
            exclude_replies: true,
            contributor_details: false,
            count: 150
        };
    }
    params['user_id'] = userId;
    return new Promise(
        (resolve, reject) => {
            this.twit.get('statuses/user_timeline', params,(err, data, response) => {
                if(err){
                    reject(err);
                }else{
                    resolve(data);
                }
            });
        }
    );
}
/**
 * @param {string=} userId - Specifies the user to get friends list. Authenticated user is used if none specified.
 * @returns {array<users>} Returns an array of Twitter Users. 
 */
TwitRest.prototype.friends = function(userId){
    return new Promise(
        (resolve, reject) => {
            var params = {count: 200, skip_status: true, include_user_entities: false};
            if(_.isString(userId)){
                params['user_id'] = userId;
            }
            this.twit.get('friends/list', params, (err, data, resp)=>{
                if(err){
                    reject(err);
                }else{
                    if(!_.has(data, 'users')){
                        reject("No users array found!");
                    }
                    else{
                        resolve(data['users']);
                    }
                }
            });
        }
    );
}

TwitRest.prototype.user = function(userId){
    return new Promise(
        (resolve, reject) => {
            var params = {
                user_id: userId,
                include_entities: false
            };
            this.twit.get('users/show', params, (err, data, resp) => {
                if(err){
                    reject(err);
                }else{
                    resolve(data);
                }
            });
        }
    );
}

TwitRest.prototype.lists = function(userId){
    return new Promise(
        (resolve, reject) => {
            var params = {count: 100};
            if(_.isString(userId)){
                params['user_id'] = userId;
            }
            this.twit.get('lists/ownerships', params, (err, data, resp) => {
                if(err){
                    reject(err);
                }
                else{
                    if(!_.has(data, 'lists')){
                        reject("No list array returned!");
                    }else{
                        resolve(data['lists']);
                    }
                }
            });
        }
    );
}

TwitRest.prototype.listMembers = function(listOwnerId, listSlug){
    return new Promise(
        (resolve, reject) => {
            var params = {count: 250, include_entities:false, skip_status: true, slug: listSlug, owner_id: listOwnerId};
            console.log(params);
            this.twit.get('lists/members', params, (err, data, resp)=>{
                if(err){
                    reject(err);
                }else{
                    if(!_.has(data, 'users')){
                        reject("No users array found!");
                    }else{
                        resolve(data['users']);
                    }
                }
            });
        }
    );
}

TwitRest.prototype.retweet = function(tweetId){
    return new Promise(
        (resolve, reject) => {
            this.twit.post('statuses/retweet/:id', {id: tweetId}, (err, data, response)=>{
                if(err){
                    console.log("ERROR:" + tweetId);
                    console.log(err);
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

TwitRest.prototype.tweet = function(status, mediaItem){
    var self = this;
    debug("tweet: %s", status);
    if(_.isNil(mediaItem)){
        return new Promise(
            (resolve, reject) => {
                this.twit.post('statuses/update', {status: status}, (err, data, response)=> {
                    if(error){
                        reject(err);
                    }else{
                        resolve(data);
                    }
                });
            }
        );
    }
    return new Promise(
        (resolve, reject) => {
            self.uploadMedia(mediaItem.path)
                .then((data)=> {
                    var t = {
                        status: status,
                        media_ids: data.media_id_string
                    };
                    self.twit.post('statuses/update', t, (err, data, response)=>{
                        if(err){
                            reject(err);
                        }else{
                            resolve(data);
                        }
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        }
    );
}

TwitRest.prototype.uploadMedia = function(path, cb){
    return new Promise(
        (resolve, reject) => {
            this.twit.postMediaChunked({file_path: path}, (err, data, resp)=>{
                if(_.isFunction(cb)){
                    cb(err, data);
                }
                if(err){
                    reject(err);
                }else{
                    resolve(data);
                }
            });
        }
    );  
}
TwitRest.prototype.queueRetweet = function(tweetId){
    if(!_.includes(this.retweetQueue, tweetId)){
        debug("retweetQueued: %s", tweetId);
        this.retweetQueue.push(tweetId);
    }
}

module.exports = TwitRest;
