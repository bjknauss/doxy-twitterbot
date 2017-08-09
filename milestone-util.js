var _ = require('lodash');

function MilestoneUtil(params){
    this.milestones = params;
}

MilestoneUtil.prototype.closest = function(number){
    // console.log("NUMBER: ", number);
    var value = _.find(this.milestones, (miles) => {
        // console.log(miles);
        return miles[0] < number;
    });
    // console.log("MilestoneUtil[closest]:", value);
    if (_.isArray(value)){
        return value[0];
    }
    return false;
}


MilestoneUtil.prototype.inRange = function(number){
    var value = _.find(this.milestones, function(miles){
        var lo = miles[1];
        var hi = miles[2];
        if( lo < number && number < hi ){
            return miles[0];
        }
    });
    if(_.isArray(value)){
        return value[0];
    }
    return false;
}

module.exports = MilestoneUtil;