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

exports.commands = {
    "mod": {
        description: "All commands to debug the bot or to carry out administrative tasks",
        help: "help mod",
        commands:{
            "bork": {
                usage: "bork",
                description: "I'll respond with a \"bork.\" Useful for checking if I'm alive.",
                process: function(msg, params){
                    choice = Math.floor(Math.random() * borks.length);
                    msg.channel.send(borks[choice]).then(m => m.edit(`Pong! | Took ${m.createdTimestamp - msg.createdTimestamp}ms`));
                }
            },
            "pull": {
                usage: "pull",
                description: "Will check if there is a new commit available. If commit is found, will attempt to restart with the new code.",
                process: function(msg, params){
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
                process: function(msg, params){
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
                process: function(msg, params){
                    console.log(msg);
                    if (msg.author.id === "110932722322505728") {
                        msg.channel.send("Wuf wuf, bye bye!").then(message => {
                            exec('forever stop poochy')
                        });
                    }
                    else {
                        msg.reply("I can't really take that order from you. Sorry. :c");
                    }
                }
            }
        }
    }
}