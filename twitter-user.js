var _ = require('lodash');


function TwitterUser(userId){
    this.id = userId;
    this.followersCount = 0;
    this.screenName = "";
    this.name = "";
    this.initialFollowers = 0;
    this.lastMilestone = 0;
    this.trackingMilestone = false;
    this.admin = false;
    this.lastRetweet = new Date();
}

TwitterUser.prototype.update = function(obj){
    if(!validUserObject(obj, this.id)){
        return false;
    }
    if(this.id === 0){
        this.id = obj.str_id;
    }
    this._updateAttribute(obj, 'followers_count', 'followersCount');
    this._updateAttribute(obj, 'screen_name', 'screenName');
    this._updateAttribute(obj, 'name', 'name');
}

TwitterUser.prototype._updateAttribute = function(obj, objAttr, thisAttr){
    if(_.has(obj, objAttr) && obj[objAttr] !== this[thisAttr]){
        this[thisAttr] = obj[objAttr];
    }
}

function validUserObject(obj, id){
    if(typeof obj !== 'object'){
        return false;
    }
    if(!_.has(obj, 'id_str')){
        return false;
    }
    if( this.id !== obj.id_str && this.id !== 0){
        return false;
    }
    return true;
}

module.exports = TwitterUser;