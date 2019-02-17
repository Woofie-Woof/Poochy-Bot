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

try {
    var moment = require('moment-timezone');
}
catch (e) {
    console.log("You don't seem to have Moment Timezone installed. Any time manipulation will be broken!");
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
                process: function(msg, params, guild, bot){
                    choice = Math.floor(Math.random() * borks.length);

                	if(msg.channel.type == "dm"){
                		msg.channel.send("You cannot change the settings for these Direct Messages (for now).");
                		return;
                	}
                    if(msg.member.roles.find(role => role.name == 'Poochy')){
                        switch(params[0]){
                            case "help":
                                var helpString = "Here's how you can configure the bot for your server:\n";
                                helpString += "`" + guild.prefix + "config prefix <special character>`: Customizes the prefix to use for commands in your server. Cannot be a number or a letter.\n";
                                helpString += "`" + guild.prefix + "config logging <(enable|disable)/channel> [channel link]`: Enables logging (deleted/edited messages) or sets the logging channel. A logging channel must be set to enable.\n";
                                helpString += "`" + guild.prefix + "config welcome <(enable|disable)/channel/message> [channel link/message]`: Enables welcome messages for new users, sets the channel to say welcomes in, or sets the welcome message.\n";
                                helpString += "`" + guild.prefix + "config timezone <valid timezone>`: Changes the timezone in which Poochy will report dates in for your server.\n";
                                helpString += "`" + guild.prefix + "config flairing <(channel|set|remove|list)>`: Enables self-flairing for users based on emojis, setting the channel, or listing already existing flairs.";
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
                            case "timezone":
                                if(moment.tz.zone(params[1])){
                                    db.prepare(`UPDATE Servers SET timezone=? WHERE id=?`).run(params[1], msg.guild.id);
                                    msg.channel.send("Arf, the timezone in this server has been updated to: **" + params[1] + "**");
                                    return;
                                }
                                else{
                                    msg.channel.send("Grr, that's no valid timezone! Try again.");
                                }
                            case "flairing":
                                if(params[1] == "channel"){
                                    if(channelRegex.test(params[2])){
                                        db.prepare(`UPDATE Servers SET flair_channel=? WHERE id=?`).run(params[2].replace(/[^\w\s]/gi, ''), msg.guild.id);
                                        msg.channel.send("Arf, flairs will be assigned in " + params[2] + "!");
                                        return;
                                    }
                                    msg.channel.send("*sniff sniff* \nGrr, can't smell channel link! Remember, a channel link looks like `#channel_name`.");
                                }
                                else if(params[1] == "set"){
                                    flairParams = msg.content.match(/"[^"]+"/g);
                                    if(flairParams.size > 0){
                                        msg.channel.send(`Grr, remember to surround the role name with \`"\`! Check \`${guild.prefix}config help\` for details!`);
                                        return;
                                    }
                                    
                                    let role = msg.guild.roles.find("name", flairParams[0].replace(/"/g, ''));
                                    if(role){
                                        let operation = 'INSERT INTO Flairs (server_id, role_id, emoji_id) VALUES (?, ?, ?)';
                                        let existing_id = 0;
                                        let existing = db.prepare(`SELECT * FROM flairs WHERE server_id=? AND role_id=?`).get(msg.guild.id, role.id);

                                        if(existing){
                                            existing_id = existing.id;
                                            operation = 'UPDATE Flairs SET server_id=?, role_id=?, emoji_id=? WHERE id=?';
                                        }

                                        emoji = null;
                                        numRegex = /[0-9]+/g;
                                        if(numRegex.test(flairParams[1])){
                                            inputEmoji = flairParams[1].match(numRegex)[0];
                                            emoji = msg.guild.emojis.get(inputEmoji);
                                        }

                                        if(!emoji){
                                            msg.channel.send("Arf, the given emoji does not exist in this server!");
                                            return;
                                        }

                                        taken = db.prepare(`SELECT * FROM flairs WHERE server_id=? AND emoji_id=?`).get(msg.guild.id, inputEmoji);
                                        if(taken){
                                            msg.channel.send("Ruff... this emoji is already associated with another flair! Unset it first, then try again.");
                                            return;
                                        }

                                        let statement = db.prepare(operation);
                                        if(existing_id > 0){
                                            statement.run(msg.guild.id, role.id, inputEmoji, existing_id);
                                        }
                                        else{
                                            statement.run(msg.guild.id, role.id, inputEmoji);
                                        }
                                        msg.channel.send(`The role ${role.name} was associated with the emoji <:${emoji.name}:${emoji.id}>!`);
                                        return;
                                    }
                                    else{
                                        msg.channel.send(`Arf, the given role does not exist in this server!`)
                                        return;
                                    }
                                }
                                else if(params[1] == "list"){
                                    flairs = db.prepare(`SELECT * FROM Flairs WHERE server_id=?`).all(msg.guild.id);

                                    messageString = "";

                                    flairs.forEach(f => {
                                        let role = msg.guild.roles.get(f.role_id);
                                        let emoji = msg.guild.emojis.get(f.emoji_id);
                                        if(!role || !emoji){
                                            db.prepare("DELETE FROM Flairs WHERE id=?").run(f.id);
                                        }
                                        else{
                                            messageString += `${role.name} - <:${emoji.name}:${emoji.id}>\n`;
                                        }
                                    });

                                    msg.channel.send(messageString);
                                    return;
                                }
                                else if(params[1] == "remove"){
                                    if(params.length < 3){
                                        msg.channel.send("Oops, please specify the name of the flair to remove!");
                                        return;
                                    }

                                    flairParams = msg.content.match(/"[^"]+"/g);

                                    let role = msg.guild.roles.find("name", flairParams[0].replace(/"/g, ''));
                                    let existing = db.prepare(`SELECT * FROM flairs WHERE server_id=? AND role_id=?`).get(msg.guild.id, role.id);

                                    if(!existing){
                                        msg.channel.send("Grr, no flair setting was found under this name!");
                                        return;
                                    }

                                    db.prepare("DELETE FROM Flairs WHERE id=?").run(existing.id);

                                    msg.channel.send(`Successfully removed ${role.name} from the flairing list!`);
                                    return;
                                }
                                break;
                            case "mute":
                                let exists = false;
                                if(guild.mute_role != null){
                                    exists = true;
                                    muteRole = msg.guild.roles.get(guild.mute_role);

                                    if(!muteRole){
                                        db.prepare('UPDATE Servers SET mute_role = ? WHERE id = ?').run(null, guild.id);
                                        exists = false;
                                    }
                                    else{
                                        msg.guild.channels.filter(channel => channel.type == 'text' || channel.type == 'category').forEach((channel) => {
                                            channel.overwritePermissions(muteRole, {'SEND_MESSAGES': false, 'ADD_REACTIONS': false, 'VIEW_CHANNEL': false}); 
                                        });
                                    }
                                }

                                if(!exists){
                                    msg.guild.createRole({
                                        name: "SILENCE",
                                        color: "#020000",
                                        position: 0,
                                        permissions: 0
                                    }).then((role) => {
                                        db.prepare('UPDATE Servers SET mute_role = ? WHERE id = ?').run(role.id, msg.guild.id);

                                        msg.guild.channels.filter(channel => channel.type == 'text' || channel.type == 'category').forEach((channel) => {
                                            channel.overwritePermissions(role, {'SEND_MESSAGES': false, 'ADD_REACTIONS': false, 'VIEW_CHANNEL': false}); 
                                        });
                                    });
                                }

                                msg.channel.send("Woof woof! Successfully configured the mute role `SILENCE`. Please move it as high as possible in the role list!");
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

            "ban": {
                usage: "ban <user ID or @> (Ex. '!ban 123456789' or '!ban @User#1234')",
                description: "Bans the given user from this server.",
                process: function(msg, params, guild){
                    if(msg.member.hasPermission('BAN_MEMBERS')){
                        if(params.size < 0){
                            msg.channel.send("Wuf? You forgot to tell me what user to ban!");
                            return;
                        }
                        banUser = msg.mentions.users.first();
                        if(!banUser){
                            banUser = params[0];
                        }
    
                        msg.guild.ban(banUser, {days: 7, reason: params[1]})
                            .then(user => msg.channel.send(`Ruff, successfully banned user '${user.username || user.id || user}' from this server!`))
                            .catch((error) => {msg.channel.send('Wuf... something went wrong when trying to ban this user!'); console.log(error)});
                    }
                    else{
                        msg.channel.send("Grr, arf! You don't have permission to ban users!");
                    }
                }
            },

            "mute": {
                usage: "mute <amount of time> <seconds/minutes/hours> <@user1> <@user2> ... <@user#> (Ex. '!mute 3 minutes @User#1234 @User#7890')",
                description: "Mutes the given users for the given amount of time (no more than 24 hours).",
                process: function(msg, params, guild){
                    if(msg.member.hasPermission('MANAGE_ROLES')){
                        let miliseconds = 1000;

                        if(params.size < 3){
                            msg.channel.send("Wuf? You didn't give me all the paramenters I need!");
                            return;
                        }

                        if(!guild.mute_role){
                            msg.channel.send(`*sniff* I can't smell the mute role! Configure it with \`${guild.prefix}config mute\``);
                            return;
                        }

                        muteRole = msg.guild.roles.get(guild.mute_role);

                        if(!muteRole){
                            db.prepare('UPDATE Servers SET mute_role = ? WHERE id = ?').run(null, guild.id);
                            msg.channel.send(`*sniff* I can't smell the mute role! Configure it with \`${guild.prefix}config mute\``);
                            return;
                        }

                        if(msg.mentions.users.size <= 0){
                            msg.channel.send('Arf, I can\'t sniff out any users! Did you properly mention them?');
                            return;
                        }

                        msg.mentions.users.forEach(user => {
                            msg.guild.fetchMember(user).then((member) => {
                                if(isNaN(params[0])){
                                    msg.channel.send("Grr, that's not a numeric amount of time!");
                                    return;
                                }
        
                                switch (params[1]) {
                                    case 'seconds':
                                        miliseconds *= params[0];
                                        break;
                                    case 'minutes':
                                        miliseconds *= (params[0] * 60);
                                        break;
                                    case 'hours':
                                        miliseconds *= (params[0] * 3600);
                                        break;
                                    default:
                                        miliseconds = 0;
                                        break;
                                }
        
                                if(miliseconds == 0){
                                    msg.channel.send("Wuf? That's not a time unit! Please use seconds, minutes, or hours!");
                                    return;
                                }
                                else if(miliseconds > 86400000){
                                    msg.channel.send("Grr, time cannot exceed 24 hours!");
                                    return;
                                }
    
                                let currentRoles = member.roles.map(role => role.id);
    
                                member.edit({roles: [guild.mute_role]});
                                setTimeout(function (){
                                    member.edit({roles: currentRoles});
                                }, miliseconds);
        
                                msg.channel.send(`Woof woof, successfully muted ${member.displayName} for ${params[0]} ${params[1]}`);
                            });
                        });
                    }
                    else{
                        msg.channel.send("Grr, arf! You don't have permission to mute users!");
                    }
                }
            },
            
            "test":{
                usage: "test",
                description: "A command used for testing that changes occasionally.",
                process: function(msg, params, guild){
                    msg.channel.send("Debugging...");
                    server = db.prepare(`SELECT * FROM Servers WHERE id=?`).get(msg.guild.id);
                    msg.channel.send(`${server.name} has mute role ${server.mute_role}`);
                    return;
                }
            },
        }
    }
}