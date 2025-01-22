const Follow = require("../models/follow");

const followUserIds = async (identityUserId) => {
    try {
        //Inforamcion de seguimiento
        let following = await Follow.find({ "user": identityUserId })
            .select({ "followed": 1, "_id": 0 })
            .exec();

        let followers = await Follow.find({ "followed": identityUserId })
            .select({ "user": 1, "_id": 0 })
            .exec();

        //procesar array d3e identificaciones
        followingClean = [];

        following.forEach(follow => {
            followingClean.push(follow.followed);
        });


        followersClean = [];

        followers.forEach(follow => {
            followersClean.push(follow.user);
        });

        return {
            following: followingClean,
            followers: followersClean,
            followersCount: followers.length
        };
    }
    catch (error) {
        return false;
    }

};

const followThisUser = async (identityUserId, profileUserId) => {

    //Inforamcion de seguimiento
    let following = await Follow.findOne({ "user": identityUserId, "followed": profileUserId });

    let followers = await Follow.findOne({ "user": profileUserId, "followed": identityUserId});


        return {
            following: following,
            followers: followers
        }

};

module.exports = {
    followUserIds,
    followThisUser
};