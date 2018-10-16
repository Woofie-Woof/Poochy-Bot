try {
    var Discord = require("discord.js");
}
catch (e) {
    console.log(e.stack);
    console.log(process.version);
    console.log("I think there is a complete lack of everything here... I mean, do you even want to start? There is no 'discord.js.'");
    process.exit();
}

try {
    var fs = require("fs"); 
}
catch(e) {
    console.log("Well, no reading files, then. 'fs' is kinda necessary for that.");
    process.exit()
}

try{
    var auth = require("./auth.json");
}
catch(e){
    console.log("You aren't getting very far without an 'auth.json'... just sayin'.");
    process.exit();
}

try {
    var Database = require('better-sqlite3');
    var db = new Database('./data/data.db');
}
catch(e) {
    console.error(e);
    process.exit();
}

try{
    var simpleGit = require('simple-git');
}
catch(e){
    console.log("You're missing 'simple-git' from your dependencies! Surely you want this bot to update, right?");
}

try{
    var exec = require('child_process').exec;
}
catch(e){
    console.log("Now now, if you don't have 'child_process', Yoshi won't be able to restart.");
}

let choice = 0;

let borks = [
    'Woof!',
    'Wuf wuf',
    'Bork',
    'Arf!',
    'Woof wuf woof!',
    'Wooooof woof',
    'Bork bork wuf'
];

let confusResponses = [
    'W-wha?',
    'Wuf, I dun\' understand!',
    'I thiiiink you need help..',
    'Um, arf?',
    'Wooferino confuserino',
    'Woof, speak up!',
    'I ruffly understand...'
];

let channelRegex = /^<#[0-9]+>$/;

exports.commands = {
    "mod": {
        description: "All commands to debug the bot or to carry out administrative tasks",
        help: "help mod",
        commands:{
            "bork": {
                usage: "bork",
                description: "I'll respond with a \"bork.\" Useful for checking if I'm alive.",
                process: function(msg){
                    choice = Math.floor(Math.random() * borks.length);
                    msg.channel.send(borks[choice]).then(m => m.edit(`${borks[choice]} | Took ${m.createdTimestamp - msg.createdTimestamp}ms`));
                }
            },
            "pull": {
                usage: "pull",
                description: "Will check if there is a new commit available. If commit is found, will attempt to restart with the new code.",
                process: function(msg){
                    if (msg.author.id === "110932722322505728"){
                        msg.channel.send("Checking for updates...");
                        simpleGit().pull(function(error, update) {
                            if(update && update.summary.changes) {
                                msg.channel.send("Be right back, arf!").then(message => {
                                    exec('forever restart poochy', (error, stdout, stderr) => {
                                        if (error) {
                                            console.error(`exec error: ${error}`);
                                            return;
                                        }
                                        console.log(`stdout: ${stdout}`);
                                        console.log(`stderr: ${stderr}`);
                                    });
                                }).catch(console.log);
                            }
                            else{
                                msg.channel.send("Already up to date.");
                                console.log(error);
                            }
                        });
                    }
                    else{
                        msg.reply("I can't really take that order from you. Sorry. :c");
                    }
                }
            },

            "restart": {
                usage: "restart",
                description: "Forces Poochy to restart without needing to update.",
                process: function(msg){
                    if (msg.author.id === "110932722322505728"){
                        msg.channel.send("Be right back, arf!").then(message => {
                            exec('forever restart poochy', (error, stdout, stderr) => {
                                if (error) {
                                    console.error(`exec error: ${error}`);
                                    return;
                                }
                                console.log(`stdout: ${stdout}`);
                                console.log(`stderr: ${stderr}`);
                            });
                        }).catch(console.log);
                    }
                }
            },

            "bye": {
                usage: "bye",
                description: "Shuts down the bot.",
                process: function(msg){
                    if (msg.author.id === "110932722322505728") {
                        msg.channel.send("Wuf wuf, bye bye!").then(message => {
                            exec('forever stop poochy')
                        });
                    }
                    else {
                        msg.reply("I can't really take that order from you. Sorry. :c");
                    }
                }
            },

            "config": {
                usage: "<setting to configure> <parameter> (Ex. !config prefix ^)",
                description: "Allows you to configure different settings about the bot for your server, such as a prefix for commands, logging, and welcome messages.",
                process: function(msg, params, guild){
                    choice = Math.floor(Math.random() * borks.length);

                	if(msg.channel.type == "dm"){
                		msg.channel.send("You cannot change the settings for these Direct Messages (for now).");
                		return;
                	}
                    if(msg.member.roles.find('name', "Poochy")){
                        switch(params[0]){
                            case "help":
                                var helpString = "Here's how you can configure the bot for your server:\n";
                                helpString += "`!config prefix <special character>`: Customizes the prefix to use for commands in your server. Cannot be a number or a letter.\n";
                                helpString += "`!config logging <(enable|disable)/channel> [channel link]`: Enables logging (deleted/edited messages) or sets the logging channel. A logging channel must be set to enable.\n";
                                helpString += "`!config welcome <(enable|disable)/channel/message> [channel link/message]`: Enables welcome messages for new users, sets the channel to say welcomes in, or sets the welcome message.\n";
                                msg.channel.send(helpString);
                                break;
                            case "prefix":
                                prefix = params[1].trim();
                                if(prefix.length > 2){
                                    msg.channel.send("The prefix doesn't have to be that long, woof!");
                                    return;
                                }
                                var regex = /^[^\w\s]+$/;
                                if(regex.test(prefix)){
                                    db.prepare(`UPDATE Servers SET prefix=? WHERE id=?`).run(prefix, msg.guild.id);
                                    msg.channel.send("Wuf, the prefix for this server has been successfully updated to `" + prefix + "`.");
                                }
                                else{
                                    msg.channel.send("Remember, you can only use special characters for the server prefix. Examples: `!`,`$`,`^`,`.`,`,`,`!!`,`!%`, etc.");
                                }
                                break;
                            case "logging":
                                if(params[1] == "enable"){
                                    row = db.prepare(`SELECT * FROM Servers WHERE id = ?`).get(msg.guild.id);
                                    if(row.logging_channel != null){
                                        db.prepare(`UPDATE Servers SET is_logging_enabled=? WHERE id=?`).run(1, msg.guild.id);
                                        msg.channel.send("Ruff, doggy eyes are **open** in this server!");
                                        return;
                                    }
                                    msg.channel.send("**There is no logging channel set**, grr... Set one with `!config logging channel <channel link>`.");
                                }
                                else if(params[1] == "disable"){
                                    db.prepare(`UPDATE Servers SET is_logging_enabled=? WHERE id=?`).run(0, msg.guild.id);
                                    msg.channel.send("Ruff, doggy eyes are **closed** in this server!");
                                }
                                else if(params[1] == "channel"){
                                    if(channelRegex.test(params[2])){
                                        db.prepare(`UPDATE Servers SET logging_channel=? WHERE id=?`).run(params[2].replace(/[^\w\s]/gi, ''), msg.guild.id);
                                        msg.channel.send("Woof woof, log diggy hole is in " + params[2] + "!");
                                        return;
                                    }
                                    msg.channel.send("*sniff sniff* \nGrr, can't smell channel link! Remember, a channel link looks like `#channel_name`.");
                                }
                                else{
                                    msg.channel.send(confusResponses[choice]);
                                }
                                break;
                            case "welcome":
                                if(params[1] == "enable"){
                                    row = db.prepare(`SELECT * FROM Servers WHERE id = ?`).get(msg.guild.id);
                                    if(row.welcome_channel != null){
                                        db.prepare(`UPDATE Servers SET is_welcome_enabled=? WHERE id=?`).run(1, msg.guild.id);
                                        msg.channel.send("Awoo, I am **now allowed to welcome** new friends!");
                                        return;
                                    }
                                    msg.channel.send("**There is no welcome message or channel set**, grr... Set one with `!config welcome channel <channel link>` **and then set a welcome message** with `!config welcome message <message>`.");
                                }
                                else if(params[1] == "disable"){
                                    db.prepare(`UPDATE Servers SET is_welcome_enabled=? WHERE id=?`).run(0, msg.guild.id);
                                    msg.channel.send("Arf, I **will not welcome** new friends.");
                                }
                                else if(params[1] == "channel"){
                                    if(channelRegex.test(params[2])){
                                        db.prepare(`UPDATE Servers SET welcome_channel=? WHERE id=?`).run(params[2].replace(/[^\w\s]/gi, ''), msg.guild.id);
                                        msg.channel.send("Awoo, welcome barks will be given in " + params[2] + "!");
                                        return;
                                    }
                                    msg.channel.send("*sniff sniff* \nGrr, can't smell channel link! Remember, a channel link looks like `#channel_name`.");
                                }
                                else if(params[1] == "message"){
                                    var welcomeMessage = params.slice(2).join(" ");

                                    db.prepare(`UPDATE Servers SET welcome_message=? WHERE id=?`).run(welcomeMessage, msg.guild.id);
                                    msg.channel.send("Woof woof, welcome barks will sound like this: \n```" + welcomeMessage + "```");
                                    return;
                                }
                                else{
                                    msg.channel.send(confusResponses[choice]);
                                }
                                break;
                            default:
                                msg.channel.send("Ruff, are you lost? Try `" + guild.prefix + "config help` first!");
                                break;
                        }
                    }
                    else{
                        msg.reply("I can't really take that order from you. You need a role named 'Poochy'. Sorry. :c");
                    }
                }
            },
        }
    }
}