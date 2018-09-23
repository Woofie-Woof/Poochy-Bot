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
    process.exit()
}

try {
    var request = require("request");
}
catch (e) {
    console.log("I'm REQUESTing you to get 'request.' I need it for pretty much everything.")
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
    'Woof, hi!',
    '*wags tail*',
    'Hello there!',
    'Hi hi hi!',
    'Wuf wuf, heyo',
    'Haaai'
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