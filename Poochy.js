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

bot.login(auth.token);

bot.on("ready", function () {
    console.log('Poochy online and ready to woof!');
    bot.user.setPresence({game:{name:"in Yoshi's Island!"}, status: "online"});

    if(newDBFlag){
        db.prepare('CREATE TABLE Servers (id INTEGER PRIMARY KEY, is_welcome_enabled INTEGER DEFAULT 0, is_logging_enabled INTEGER DEFAULT 0, is_restricted INTEGER DEFAULT 0, name TEXT NOT NULL, prefix TEXT DEFAULT "!", welcome_channel TEXT, logging_channel TEXT, commands_channel TEXT)').run();
    }

    servers = bot.guilds.array();
    servers.forEach(function(element) {
        row = db.prepare(`SELECT * from Servers WHERE id = ?`).get(element.id);

        if(!row){
            db.prepare(`INSERT INTO Servers (id, name) VALUES (?, ?)`).run(element.id, element.name);
        }
    });
});

bot.on("message", function (msg) {
    guild = db.prepare(`SELECT * from Servers WHERE id = ?`).get(msg.guild.id);
    if(msg.author.id != bot.user.id && msg.content.startsWith(guild.prefix)){
        var msgcmd = msg.content.split(" ")[0].substring(1);
        var params = msg.content.substring(msgcmd.length + 2);

        if(msgcmd == "help"){
            console.log("<@" + msg.author.id + ">" + " asks for &" + msgcmd + " " + params);
            var info = "```";
            if(params){
                if(commands[params]){
                    msg.channel.send("These are the commands for the module **" + params + "**:").then(msg => {
                        for(var command in commands[params].commands){
                            info += "&" + command;
                            var usage = commands[params].commands[command].usage;
                            if(usage){
                                info += " " + usage;
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
                            info += " - " + help;
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
                console.log("Received command `&" + msgcmd + "` from user <@" + msg.author.id + ">");
                cmd.process(msg, params);
            }
        }
    }
    else if(msg.author.id != bot.user.id && msg.isMentioned(bot.user)){
        if(greetingRegex.test(msg.content)){
            choice = Math.floor((Math.random() * randomGreetings.length));
            msg.reply(randomGreetings[choice]);
        }
        else{
            choice = Math.floor((Math.random() * randomRes.length));
            msg.channel.send(randomRes[choice]);
        }
    }
});