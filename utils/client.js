const Discord = require('discord.js');
const intents = new Discord.IntentsBitField(53608447);
const Client = new Discord.Client({
    intents: [intents],
    partials: [Discord.Partials.Channel]
});

module.exports = Client