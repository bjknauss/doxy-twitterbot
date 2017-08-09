var _ = require('lodash');
var fs = require('fs');
var mime = require('mime');
var Twit = require('twit');
var TwitterUser = require('./twitter-user.js');
var MilestoneUtil = require('./milestone-util.js');
var events = require('events');
var debug = require('debug')('user-manager');
// var botConfig = require('./bot-config.json');
// var tokens = require("./tokens.json");
// var sn = require('./misc/twitter_screennames_from_34.json');

/**
 * @param {object} params 
 */
var UserManager = function(params){
    this.path = params['path'];
    this.mentionedPath = params['mentionedUsersPath'];
    this.users = {};
    this.mentionedUsers = [];
    this.retweetInterval = params['retweetInterval'];
    this.mu = new MilestoneUtil(params['milestones']);
    this.numRememberedMentions = params['numRememberedMentions'];
    this.emitter = new events.EventEmitter();
    // debug(this);
}


UserManager.prototype.checkRetweet = function(uid){
    var user = this.get(uid);
    var now = new Date();
    var dateRetweet = new Date(user.lastRetweet);
    if(user){
        debug("checkRetweet: %s, lastRetweet:%s", user.name, user.lastRetweet);
    }
    if(!user){
        return false;
    }
    if(user.dedicatedRetweet){
        return true;
    }
    if(!user.retweets){
        return false;
    }
    if(now.getTime() > (dateRetweet.getTime() + this.retweetInterval)){
        debug("retweets");
        return true;
    }
    return false;
}

UserManager.prototype.setAll = function(property, setUsers){
    var self = this;
    // debug("USERS: %O", this.users);
    _.each(this.users, (user) => {
        var u = _.find(setUsers, {'id_str' : user.id});
        if (_.isObject(u)){
            user[property] = true;
        }else{
            user[property] = false;
        }
    });
}


UserManager.prototype.update = function(users){
    var self = this;
    if(_.isArray(users)){
        var arr = [];
        _.each(users, (u)=>{
            var user = self.updateUser(u);
            if(_.isObject(user)){
                arr.push(user);
            }
        });
        return arr;
    }else if(_.isObject(users)){
        return self.updateUser(users);
    }else{
        debug("Invalid users object in update.");
        return false;
    }
}

UserManager.prototype.mentions = function(){
    return _.filter(this.users, (user) => {
        return user.mentions;
    });
}


UserManager.prototype.randomMention = function(){
    var mentions = this.mentions();
    // debug("mentions: %O", this.mentions());
    if(mentions.length === 0){
        console.log("Could not get random mention because mentions is empty.");
        return false;
    }
    if(this.numRememberedMentions === 0){
        return mentions[randomInt(mentions.length)];
    }
    var m = mentions[randomInt(mentions.length)];
    while(_.includes(this.mentionedUsers, m.id)){
        m = mentions[randomInt(mentions.length)];
    }
    this.mentionedUsers.push(m.id);
    if(this.mentionedUsers.length > this.numRememberedMentions){
        this.mentionedUsers.shift();
    }
        return m;
}

UserManager.prototype.calculateMentionsSize = function(){
    var mentions = this.mentions();
    if(mentions.length < 10){
        this.numRememberedMentions = 0;
    }else if(mentions.length > this.numRememberedMentions){
        this.numRememberedMentions = Math.floor(mentions.length / 2);
    }
    debug(this.numRememberedMentions);
}

UserManager.prototype.get = function(uid){
    if(_.has(this.users, uid)){
        return this.users[uid];
    }else{
        return false;
    }
}

UserManager.prototype.milestoneUsers = function(){
    return _.filter(this.users, (user) => {
        return user.trackingMilestone;
    });
}

UserManager.prototype.dedicatedRetweets = function(){
    return _.filter(this.users, (user) => {
        return user.dedicatedRetweet;
    });
}
UserManager.prototype.retweets = function(){
    return _.filter(this.users, (user) => {
        return user.retweets;
    });
}
UserManager.prototype.friends = function(){
    return _.filter(this.users, (user) => {
        return user.friend;
    });
}

UserManager.prototype.updateUser = function(user){
    if(_.isObject(user)){
        if(!_.has(user, 'id_str')){
            return false;
        }
        if(!_.has(this.users, user.id_str)){
            this.users[user.id_str] = new TwitterUser(user.id_str);
        }
        var u = this.users[user.id_str];
        // if(!_.isFunction(u.update)){
        //     debug("TESTING SOMETHING STUPID.");
        //     u = _.extend(new TwitterUser(u.id), u);
        // }
        if(u){
            u.update(user);
            this.checkMilestone(u);
            return u;
        }
    }
    return false;
}

UserManager.prototype.checkMilestone = function(user){
    if(!user.trackingMilestone){
        return;
    }
    // debug("checkingMilestone: %O", user);
    var close = this.mu.closest(user.followers);
    var inRange = this.mu.inRange(user.followers);
    // debug("checkingMilestone:%s, close: %d, inRange:%d, lastMilestone:%d, followers:%d", user.name, close, inRange, user.lastMilestone, user.followers);
    if(close !== user.lastMilestone && inRange){
        this.users[user.id].lastMilestone = close;
        this.emitter.emit("milestoneReached", user, close);
        this.save();
    }
    if(close !== user.lastMilestone){
        user.lastMilestone = close;
    }
}

UserManager.prototype.save = function(){
    var obj = {
        "users": this.users,
        "mentioned": this.mentionedUsers
    }
    debug("saving...");
    saveJSON(this.path, obj );
}

UserManager.prototype.load = function(){
    var self = this;
    loadJSON(this.path).then((data) => {
        if(_.has(data, 'users')){
            debug("loading users...");
            var tempUsers = data['users'];
            self.users = _.mapValues(tempUsers, (user) => {
                var u = new TwitterUser(user.id);
                user = _.extend(u, user);
                return user;
            });
        }
        if(_.has(data, 'mentioned')){
            self.mentionedUsers = data['mentioned'];
        }
    }).catch((error)=> {
        console.log(error);
    });
}

function saveJSON(path, obj){
    fs.writeFile(path, JSON.stringify(obj, null, 4),(error)=> {
        if(error){
            console.log(error);
        }
    });
}

function loadJSON(path){
    return new Promise(
        (resolve, reject) => {
            fileExists(path).then((data) => {
                resolve(JSON.parse(data));
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

module.exports = UserManager;