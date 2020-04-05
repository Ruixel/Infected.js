const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

const timeForSymptomatic = 240000; // ms
const timeForReinfectionAttempt = 3000; // ms
const infectionChance = 30; // 1 in infectionChance
const infectedRoleID = "694913069113147452";
const infoChannel = "694888284177825813";
var infectedUsers = new Map();

client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({status: 'invisible'});
    
    // Disinfect users
    let server = client.guilds.cache.get("293438748018999297");
    let infectedRole = server.roles.cache.get(infectedRoleID);
    for (let member of server.members.cache.values()) {
        if (member.roles.cache.get(infectedRoleID)) {
            member.roles.remove(infectedRoleID);
        }
    }

    log("Reset infected to 0...");
});

client.on('message', message => {
    // Infect on purpose
	if (message.content.charAt(0) === '!') {
        var msg = message.content.split(' ');
        if (msg[0] == "!infect" && message.channel.id == infoChannel) {
            if (!message.mentions.users.size) {
                message.channel.send('You need to tag someone to infect them.');
                return;
            }

            const taggedUser = message.mentions.users.first();
            var gUser = message.guild.member(taggedUser);

            let info = client.channels.cache.get(infoChannel);
            infectUser(gUser, "An evil admin", message.channel.name);
        }

        if (msg[0] == "!getinfo" && message.channel.id == infoChannel) {
            var msg = "{"
            /*for (var [key, val] of infectedUsers.values()) {
                msg += key + ":" + JSON.stringify(val) + ",";
            }*/
            var first = true;
            for (var key of infectedUsers.keys()) {
                if (!first) {
                    msg += ",";
                } else {
                    first = false;
                }

                msg += "\"" + key + "\"" + ":" + JSON.stringify(infectedUsers.get(key));
            }
            msg += "}";

            
            fs.writeFile("data-" + Date.now() + ".json", msg, function(err) {
                if(err) {
                    return console.log(err);
                }
                log("The data file was saved!");
            }); 
        }
    }    

    // Infect not on purpose
    if (message.member.roles.cache.has(infectedRoleID))
    {
        message.channel.messages.fetch({ limit: 2 })
            .then(messages => {
                var prevMsg = messages.last();
                if (prevMsg.member.id == message.member.id) {
                    return;
                }

                // Check if the user is infective now
                let infectionTime = infectedUsers.get(message.member.id).can_infect;
                if (Date.now() < infectionTime) {
                    //log(`${message.member.displayName} must wait a bit before infecting`);
                    return;
                }

                infectUser(prevMsg.member, message.member.displayName, message.channel.name);
                infectedUsers.get(message.member.id).can_infect = Date.now() + timeForReinfectionAttempt;
            })
            .catch(console.error);
    }
});

function infectUser(gUser, infectorName, channelName) {
    if (gUser.roles.cache.has(infectedRoleID)) {
        //log(`${gUser.displayName} is already infected`);
        return;
    }

    var chance = Math.floor((Math.random() * 5) + 1);
    if (chance != 2 && infectorName != "An evil admin") {
        // You're lucky
        return;
    }
    
    setTimeout(() => {
        let infectedRole = gUser.guild.roles.cache.get(infectedRoleID);
        gUser.roles.add(infectedRole);
    }, timeForSymptomatic);

    var canInfect = Date.now() + timeForSymptomatic;
    infectedUsers.set(gUser.id, {
        "username": gUser.displayName,
        "infected_at": Date.now(),
        "infected_in_channel": channelName,
        "can_infect": canInfect,
        "infected_by": infectorName
    });

    log(`${infectorName} has infected: ${gUser.displayName}`);

    var infectionRate = infectedUsers.size/gUser.guild.memberCount;
    let info = client.channels.cache.get(infoChannel);
    info.send(`**Statistics**\nInfections: ${infectedUsers.size}/${gUser.guild.memberCount}`
        + `, Infection Rate: ${infectionRate*100}%`); 
}

function log(msg) {
    let info = client.channels.cache.get(infoChannel);
    info.send(msg);
};

client.login('nice try dickhead');
