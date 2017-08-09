var _ = require('lodash');
var debug = require('debug')('TwitterUser');

function TwitterUser(userId){
    this.id = userId;
    this.followers = 0;
    this.screenName = "";
    this.name = "";
    this.initialFollowers = 0;
    this.lastMilestone = 0;
    this.trackingMilestone = false;
    this.admin = false;
    this.retweets = false;
    this.friend = false;
    this.mentions = false;
    this.dedicatedRetweet = false;
    this.lastRetweet = new Date();
}

TwitterUser.prototype.update = function(obj){
    if(!validUserObject(obj, this.id)){
        return false;
    }
    if(this.id === 0){
        this.id = obj.str_id;
    }
    this._updateAttribute(obj, 'followers_count', 'followers');
    this._updateAttribute(obj, 'screen_name', 'screenName');
    this._updateAttribute(obj, 'name', 'name');
    this._updateAttribute(obj, 'following', 'friend');
    if(_.has(obj, 'followers_count') && this.initialFollowers === 0){
        this.initialFollowers = obj['followers_count'];
    }
}

TwitterUser.prototype._updateAttribute = function(obj, objAttr, thisAttr){
    if(_.has(obj, objAttr) && !_.isNil(obj[objAttr])){
        this[thisAttr] = obj[objAttr];
    }
}

function validUserObject(obj, id){
    if(!_.isObject(obj)){
        return false;
    }
    if(!_.has(obj, 'id_str')){
        return false;
    }
    if( id !== obj.id_str && id !== 0){
        return false;
    }
    return true;
}

module.exports = TwitterUser;