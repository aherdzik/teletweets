const get = require('simple-get');
var Twitter = require('twitter');
var config = require('./twitterconfig.js');
var T = new Twitter(config);
var updateTimeout = 900* 1000 ; //update every 15 minutes
class TweetCaller{
    constructor() 
    {
    }
};

TweetCaller.prototype.getTweetsForUser = function(userToGrab, callback)
{
    var params = { screen_name: "realDonaldTrump", count: 5};
    T.get('statuses/user_timeline', params, function(err, data, response) 
    {
      // If there is no error, proceed
      if(!err)
      {
        // Loop through the returned tweets
        var newJsonObj = [];
        for(let i = 0; i < data.length; i++)
        {
          // Get the tweet Id from the returned data
          var tweetObj = {}
          tweetObj.id = data[i].id;
          tweetObj.text = data[i].text;
          newJsonObj.push(tweetObj);
        }
        callback(userToGrab, newJsonObj);
      } 
      else 
      {
        console.log(err);
      }
    })
}
module.exports = TweetCaller;