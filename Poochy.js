try {
    var Discord = require("discord.js");
}
catch (e) {
    console.log(e.stack);
    console.log(process.version);
    console.log("'discord.js' is my main component, woof! Please install it.");
    process.exit();
}

try{
    var auth = require("./auth.json");
}
catch(e){
    console.log("An 'auth.json' with the correct API keys is necessary to continue.");
    process.exit();
}

try {
    var fs = require("fs"); 
}
catch(e) {
    console.log("Well, no reading files, then. 'fs' is kinda necessary for that.");
    process.exit();
}

try {
    var request = require("request");
}
catch (e) {
    console.log("I'm REQUESTing you to get 'request.' I need it for pretty much everything.")
}

try {
    var moment = require('moment-timezone');
}
catch (e) {
    console.log("You don't seem to have Moment Timezone installed. Any time manipulation will be broken!");
}

try{
    var commands = require('./commands.js').commands;
}
catch(e){
    console.log("You see, if you don't have a 'commands.js', you can't really command me to do things...");
    process.exit();
}

try {
    var newDBFlag = false;
    if (!fs.existsSync("./data/data.db")){
        newDBFlag = true;
    }

    var Database = require('better-sqlite3');
    var db = new Database('./data/data.db');
}
catch(e) {
    console.error(e);
    process.exit();
}

const greetingRegex = /\bhey\w?\b|hi\b|\bhello\b/ig;
const loveRegex = /love\s+(you|u)|ily|<3|♥/ig;
const goodBoyRegex = /good\s+(boy|dog|pooch|pup)/ig;
const thankRegex = /(thank|thx|ty)/ig;

const bot = new Discord.Client({autoReconnect: true, disableEvents: ["TYPING_START", "TYPING_STOP", "GUILD_MEMBER_SPEAKING", "GUILD_MEMBER_AVAILABLE", "PRESSENCE_UPDATE"]});

let choice;

let randomRes = [
    'Woof?',
    'Wuf wuf!',
    'Did you need something?',
    '*rolls around*',
    'I can help, woof woof!'
];

let randomGreetings = [
    'woof, hi!',
    '*wags tail*',
    'hello there!',
    'hi hi hi!',
    'wuf wuf, heyo',
    'haaai'
];

let randomLove = [
    'awoo love you, too!',
    '♥♥♥!',
    'Poochy luv you!',
    'woof woof, wuv you, too',
    'Ruff ♥'
];

let randomGoodBoy = [
    '*does a trick to impress you*',
    '*jumps at you excitedly*',
    'Woof, me..?',
    '*poses playfully, wagging his tail*',
    '*sits and lifts a paw*'
];

let randomThank = [
    'wuf, my pleasure!',
    'no problem!',
    'you\'re absolutely welcome, ruff!',
    'anytime!',
    'arf, happy to help!'
];

bot.login(auth.token);

bot.on("ready", () => {
    console.log('Poochy online and ready to woof!');
    bot.user.setPresence({game:{name:"in Yoshi's Island!"}, status: "online"});

    if(newDBFlag){
        db.prepare('CREATE TABLE Migrations (id INTEGER NOT NULL PRIMARY KEY, current_batch INTEGER NOT NULL').run();
        db.prepare('INSERT INTO Migrations (id, current_batch) VALUES (?, ?)').run(1, 1);
        db.prepare('CREATE TABLE Servers (id INTEGER PRIMARY KEY, is_welcome_enabled INTEGER DEFAULT 0, is_logging_enabled INTEGER DEFAULT 0, is_restricted INTEGER DEFAULT 0, name TEXT NOT NULL, prefix TEXT DEFAULT "!", welcome_channel TEXT, logging_channel TEXT, commands_channel TEXT)').run();
    }

    migration = db.prepare('SELECT * from Migrations WHERE id = ?').get(1);

    if(migration.current_batch < 2){
        db.prepare('ALTER TABLE Servers ADD COLUMN welcome_message TEXT').run();
        db.prepare('ALTER TABLE Servers ADD COLUMN timezone TEXT DEFAULT "UTC"').run();
        db.prepare('UPDATE Migrations SET current_batch = ? WHERE id = ?').run(2, 1);
    }

    if(migration.current_batch < 3){
        db.prepare('CREATE TABLE Flairs (id INTEGER NOT NULL PRIMARY KEY, server_id INTEGER NOT NULL, role_id TEXT NOT NULL, emoji_id TEXT NOT NULL)').run();
        db.prepare('ALTER TABLE Servers ADD COLUMN flair_channel TEXT').run();
        db.prepare('UPDATE Migrations SET current_batch = ? WHERE id = ?').run(3, 1);
    }

    if(migration.current_batch < 4){
        db.prepare('ALTER TABLE Servers ADD COLUMN mute_role TEXT').run();
        db.prepare('UPDATE Migrations SET current_batch = ? WHERE id = ?').run(4, 1);
    }

    servers = bot.guilds.array();
    servers.forEach((element) => {
        row = db.prepare(`SELECT * from Servers WHERE id = ?`).get(element.id);

        if(!row){
            db.prepare(`INSERT INTO Servers (id, name) VALUES (?, ?)`).run(element.id, element.name);
        }
        else{
            if(row.flair_channel){
                channel = element.channels.get(row.flair_channel);
                if(!channel){
                    db.prepare(`UPDATE Servers SET flair_channel = ? WHERE id = ?`).run(null, element.id);
                }
                else{
                    messages = element.channels.get(row.flair_channel).fetchMessages({limit: 20});
                }
            }
        }
    });
});

bot.on("guildMemberAdd", (member) => {
    dbGuild = db.prepare('SELECT * FROM Servers WHERE id = ?').get(member.guild.id);
    if(dbGuild.is_logging_enabled){
        if(member.guild.channels.get(dbGuild.logging_channel) == null){
            db.prepare('UPDATE Servers SET is_logging_enabled = ? AND logging_channel = ? WHERE id = ?').run(0, null, member.guild.id);
            return;
        }
        var t = moment.tz(dbGuild.timezone).format('YYYY-MMM-DD HH:mm:ss');
        bot.channels.get(dbGuild.logging_channel).send(`\`\`\`${t}\`\`\` **${member.user.username}#${member.user.discriminator}** just joined the server! (ID: ${member.id})`);
    }

	if(dbGuild.is_welcome_enabled){
		if(member.guild.channels.get(dbGuild.welcome_channel) == null || dbGuild.welcome_message == null){
			db.prepare('UPDATE Servers SET is_welcome_enabled = ? WHERE id = ?').run(0, member.guild.id);
            return;
		}
		bot.channels.get(dbGuild.welcome_channel).send(`<@${member.id}> ${dbGuild.welcome_message}`);
	}
});

bot.on("guildMemberRemove", (member) => {
    dbGuild = db.prepare('SELECT * FROM Servers WHERE id = ?').get(member.guild.id);
    if(dbGuild.is_logging_enabled){
        if(member.guild.channels.get(dbGuild.logging_channel) == null){
            db.prepare('UPDATE Servers SET is_logging_enabled = ? AND logging_channel = ? WHERE id = ?').run(0, null, member.guild.id);
            return;
        }
        var t = moment.tz(dbGuild.timezone).format('YYYY-MMM-DD HH:mm:ss');
        bot.channels.get(dbGuild.logging_channel).send(`\`\`\`${t}\`\`\` **${member.user.username}#${member.user.discriminator}** just left or was kicked from the server. (ID: ${member.id})`);
    }
});

bot.on("messageDelete", (message) => {
	if(message && message.channel.type != "dm"){
        dbGuild = db.prepare('SELECT * FROM Servers WHERE id = ?').get(message.guild.id);
		if(dbGuild.is_logging_enabled && message.channel.id != dbGuild.logging_channel){
			if(message.guild.channels.get(dbGuild.logging_channel) == null){
				db.prepare('UPDATE Servers SET is_logging_enabled = ? AND logging_channel = ? WHERE id = ?').run(0, null, dbGuild.id);
                return;
			}
			var t = moment.tz(dbGuild.timezone).format('YYYY-MMM-DD HH:mm:ss');
            bot.channels.get(dbGuild.logging_channel).send(
                `\`\`\`${t}\`\`\` Message by **${message.author.username}#${message.author.discriminator}** was deleted in ${message.channel}
                **Message: **${message.cleanContent}
                **Attachments:**
                ${message.attachments.map(attachment => attachment.url).join("\n")}`.replace(/^[^\S\n]+/gm, '')
            );
		}
	}
});

bot.on("messageUpdate", (oldMessage, newMessage) =>{
    dbGuild = db.prepare('SELECT * FROM Servers WHERE id = ?').get(oldMessage.guild.id);
    var d = moment.tz(dbGuild.timezone).format('YYYY-MMM-DD HH:mm:ss');
    if(oldMessage.author.id !== bot.user.id && oldMessage.channel.type != "dm"){
        if((oldMessage && newMessage) && (oldMessage.content != newMessage.content)){
        	if(dbGuild.is_logging_enabled){
        		if(newMessage.guild.channels.get(dbGuild.logging_channel) == null){
					db.prepare('UPDATE Servers SET is_logging_enabled = ? AND logging_channel = ? WHERE id = ?').run(0, null, dbGuild.id);
                    return;
				}
                bot.channels.get(dbGuild.logging_channel).send(
                    `\`\`\`${d}\`\`\` Message by **${newMessage.author.username}#${newMessage.author.discriminator}** was updated in ${newMessage.channel}
                    **Old:** ${oldMessage.cleanContent}
                    **New:** ${newMessage.cleanContent}`.replace(/^[^\S\n]+/gm, '')
                );
        	}
        }
    }
});

bot.on("messageReactionAdd", (reaction, user) => {
    guild = reaction.message.guild;
    dbGuild = db.prepare('SELECT * FROM Servers WHERE id = ?').get(guild.id);
    if(dbGuild.flair_channel && dbGuild.flair_channel == reaction.message.channel.id){
        if(guild.channels.get(dbGuild.flair_channel) == null){
            db.prepare('UPDATE Servers SET flair_channel = ? WHERE id = ?').run(null, dbGuild.id);
            return;
        }

        dbFlair = db.prepare('SELECT * FROM Flairs WHERE emoji_id = ?').get(reaction.emoji.id);
        if(dbFlair){
            role = guild.roles.get(dbFlair.role_id);
            emoji = guild.emojis.get(dbFlair.emoji_id);
            if(!role || !emoji){
                db.prepare('DELETE FROM Flairs WHERE id = ?').run(dbFlair.id);
            }
            else{
                member = guild.member(user);
                if(!member.roles.has(dbFlair.role_id)){
                    member.addRole(dbFlair.role_id);
                    reaction.message.channel.send(`Wuf, added role ${role.name} to ${user}!`).then(sentMessage => sentMessage.delete(5000));
                }
            }
        }
    }
});

bot.on("messageReactionRemove", (reaction, user) => {
    guild = reaction.message.guild;
    dbGuild = db.prepare('SELECT * FROM Servers WHERE id = ?').get(guild.id);
    if(dbGuild.flair_channel && dbGuild.flair_channel == reaction.message.channel.id){
        if(guild.channels.get(dbGuild.flair_channel) == null){
            db.prepare('UPDATE Servers SET flair_channel = ? WHERE id = ?').run(null, dbGuild.id);
            return;
        }

        dbFlair = db.prepare('SELECT * FROM Flairs WHERE emoji_id = ?').get(reaction.emoji.id);
        if(dbFlair){
            role = guild.roles.get(dbFlair.role_id);
            emoji = guild.emojis.get(dbFlair.emoji_id);
            if(!role || !emoji){
                db.prepare('DELETE FROM Flairs WHERE id = ?').run(dbFlair.id);
            }
            else{
                member = guild.member(user);
                if(member.roles.has(dbFlair.role_id)){
                    member.removeRole(dbFlair.role_id);
                    reaction.message.channel.send(`Wuf, removed role ${role.name} from ${user}!`).then(sentMessage => sentMessage.delete(5000));
                }
            }
        }
    }
});

bot.on("message", (msg) => {
    guild = db.prepare(`SELECT * from Servers WHERE id = ?`).get(msg.guild.id);
    if(msg.author.id != bot.user.id && msg.content.startsWith(guild.prefix)){
        var contentSplit = msg.content.split(" ");
        var msgcmd = contentSplit[0].substring(guild.prefix.length);
        var params = contentSplit.slice(1);

        if(msgcmd == "help"){
            console.log(`<@${msg.author.id}> asks for ${guild.prefix}${msgcmd} ${params}`);
            var info = "```";
            if(params.length > 0){
                if(commands[params]){
                    msg.channel.send("These are the commands for the module **" + params + "**:").then(msg => {
                        for(var command in commands[params].commands){
                            info += guild.prefix + command;
                            var usage = commands[params].commands[command].usage;
                            if(usage){
                                info += " - " + guild.prefix + usage;
                            }
                            var description = commands[params].commands[command].description;
                            if(description){
                                info += "\n\t" + description + "\n\n";
                            }
                        }
                        info += "```";
                        msg.channel.send(info);
                    });
                }
                else{
                     msg.channel.send("I was unable to find that module.");
                }
                return;
            }
            else{
                msg.channel.send("Choose a module to see commands for:").then(msg => {
                    for(var module in commands) {
                        info += module;
                        var help = commands[module].help;
                        if(help){
                            info += " - " + guild.prefix + help;
                        }
                        var description = commands[module].description;
                        if(description){
                            info += "\n\t" + description + "\n\n";
                        }
                    }
                    info += "```";
                    msg.channel.send(info);
                    return;
                });
            }
        }

        for(var module in commands){
            var cmd = commands[module].commands[msgcmd];
            if(cmd){
                console.log("Received command `" + guild.prefix + msgcmd + "` from user <@" + msg.author.id + ">");
                cmd.process(msg, params, guild, bot);
            }
        }
    }
    else if(msg.author.id != bot.user.id && msg.isMentioned(bot.user)){
        if(greetingRegex.test(msg.content)){
            choice = Math.floor((Math.random() * randomGreetings.length));
            msg.reply(randomGreetings[choice]);
        }
        else if(loveRegex.test(msg.content)){
            choice = Math.floor((Math.random() * randomLove.length));
            msg.reply(randomLove[choice]);
        }
        else if(thankRegex.test(msg.content)){
            choice = Math.floor((Math.random() * randomThank.length));
            msg.reply(randomThank[choice]);
        }
        else if(goodBoyRegex.test(msg.content)){
            choice = Math.floor((Math.random() * randomGoodBoy.length));
            msg.channel.send(randomGoodBoy[choice]);
        }
        else{
            choice = Math.floor((Math.random() * randomRes.length));
            msg.channel.send(randomRes[choice]);
        }
    }
});