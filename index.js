const Telegraf = require('telegraf')
const TweetCaller = require('./tweetcaller.js')
const fs = require('fs');
var dbLocation = "";
var configLoc = "config.json";
var adminID = ""
var bot = "";
var homeChatID = "";
var dayCheckTimer = 300 * 1000 ; //update every 5 minutes
var spareCtx;
var currentTweetDB;
var tweetCaller;

function readInArgs()
{
    var configObj = JSON.parse(fs.readFileSync("./" + configLoc));
    bot = new Telegraf(configObj.authToken)
    dbLocation = configObj.dbLocation;
    homeChatID = configObj.homeChatID;
    adminID = configObj.adminID;
}

readInArgs();

bot.on('text', (ctx) => {
    spareCtx = ctx;
    var msg = ctx.message;
    var username = msg.from.username.toLowerCase();
    var msgText = msg.text;
    var splitStr= msgText.split(" ");
    var restOfStuff = splitStr.slice(1);
    switch(splitStr[0].toLowerCase()){
        case "/addlistener":
            addTweetListener(ctx, restOfStuff);
        break;
        case "/removelistener":
            removeTweetListener(ctx, restOfStuff);
        break;
        case "/sayspec":
            sayToChat(ctx, restOfStuff);
        break;
        default:
            if(splitStr[0].startsWith("/"))
            {
                ctx.reply("Command not found.");
            }
        break;
        
    }
});

function addTweetListener(ctx, params)
{
    var usernameToAdd= params[0];
    if(currentTweetDB[usernameToAdd] != null)
    {
        ctx.reply("already tracking " + usernameToAdd);
        return;
    }
    else
    {
        currentTweetDB[usernameToAdd]= {};
        tweetCaller.getTweetsForUser(usernameToAdd,retrieveTweetResult);
    }
}  
    
function removeTweetListener(ctx, params)
{
    var usernameToRemove= params[0];
    if(currentTweetDB[usernameToRemove] == null)
    {
        ctx.reply("not tracking " + usernameToRemove);
        return;
    }
    else
    {
        currentTweetDB.delete(usernameToRemove);
        tweetCaller.getTweetsForUser(usernameToRemove,retrieveTweetResult);
    }
}

function sentFromAdmin(ctx)
{
    return ctx.from.id == adminID;
}

function printHelp(ctx)
{
    var output= "Hi, I'm Teletweets! I'm a simple Twitter poller!\n";
    output+="Here are my commands:\n";
    output+="/addlistener [twitter username] : Add a listener for a specific twitter user!\n";
    output+="/removelistener [twitter username] : Remove a listener for a specific twitter user!\n";
    output+="/help: See my commands (but you knew that already!)\n";
    ctx.reply(output);
}

function writeData()
{
    fs.writeFileSync(dbLocation, JSON.stringify(currentTweetDB));  
}

function sayToChat(ctx, params)
{
    if(!sentFromAdmin(ctx))
    {
        console.log("NOT ADMIN");
        return;
    }
    
    var currentMsg = "";
    params.forEach(function(word) 
    {
      currentMsg += word + " ";
    });
    ctx.telegram.sendMessage(homeChatID, currentMsg);
}

function retrieveTweetResult(username, results)
{
    var currentKnownTweets = currentTweetDB[username];
    for(let i = 0; i < results.length; i++)
    {
        var currentTweetObj = results[i];
        
        var found = false;
        for(let j = 0; j < currentTweetDB[username].length; j++)
        {
            if(currentTweetDB[username][j].id == currentTweetObj.id)
            {
                found = true;
                break;
            }
        }
        
        if(!found)
        {
            displayTweet(username,currentTweetObj.text);
        }
    }
    
    currentTweetDB[username] = results;
    writeData();
}

function refreshAll()
{
    Object.keys(currentTweetDB).forEach(function(k)
    {
        tweetCaller.getTweetsForUser(k,retrieveTweetResult);
    });
}

function displayTweet(username, text)
{
    var toSend = "TWEET FROM " + username + ":\n" + text;
    spareCtx.telegram.sendMessage(homeChatID, toSend);
}

function beginBot()
{
    currentTweetDB = JSON.parse(fs.readFileSync("./" + dbLocation));
    tweetCaller = new TweetCaller();
    refreshAll();
    bot.startPolling();
    setInterval(refreshAll, dayCheckTimer, "");
    console.log("STARTUP SUCCESSFUL");
}

beginBot();