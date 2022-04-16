const Discord = require("discord.js");
const Enmap = require("enmap");
const client = new Discord.Client({
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_WEBHOOKS'],
    partials: ['CHANNEL', 'GUILD_MEMBER', 'USER'],
    failIfNotExists: false,
});
const fs = require(`fs`);
client.suggestSettings = new Enmap({
    name: 'suggest',
    dataDir: './databases/suggest'
});
client.prefixSettings = new Enmap({
    name: 'prefix',
    dataDir: './databases/prefix'
});
client.on('ready', () => {
    require('./suggestions')(client);
    console.log(`${client.user.tag} is ready!`);

});
require('dotenv').config();
client.login(process.env.botToken);