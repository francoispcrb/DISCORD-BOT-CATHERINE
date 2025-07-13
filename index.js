console.log("Initialisation...")

const chalk = require("chalk");
const fs = require('fs');
const path = require('path');
const config = require('./config/config.json');
const { loader, patchSendMethod } = require('./utils/functions');
const { compareVersion } = require('./win/compareVersion')

const Discord = require('discord.js');
const intents = new Discord.IntentsBitField(53608447);
const client = new Discord.Client({
    intents: [intents],
    partials: [Discord.Partials.Channel]
});

require('./utils/loggers');

await compareVersion()

function sendLog(embed) {
    const LOG_CHANNEL_ID = config.channel.log; 
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });
} 
module.exports = { sendLog };

// Chargement automatique des événements depuis le dossier 'events'
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(__dirname, 'events', file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    await console.notify('event', `Chargement de l'événement : ${event.name}`);
}


globalThis.clientData = {};

try {
    const rawData = fs.readFileSync('./config/config.json', 'utf8');
    const configData = JSON.parse(rawData);

    if (configData.openservice_last_id && configData.openservice_participants) {
        globalThis.clientData = {
            messageId: configData.openservice_last_id,
            participants: configData.openservice_participants
        };
        await console.log("✅ Données rechargées depuis config.json :", globalThis.clientData);
    } else {
        await console.log("⚠️ Aucune donnée trouvée dans config.json");
    }
} catch (error) {
    console.error("❌ Erreur lors du chargement de config.json :", error);
}

await console.debug('Hi !!');
await console.log(chalk.bgGreen.black("Chargement du fichier index.js"));
await console.notify('hot', 'Hey!');

await loader();
patchSendMethod();

// Chargement dynamique des commandes
client.commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'interactions', 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'interactions', 'commands', file));
    if (command.name) {
        client.commands.set(command.name, command);
        console.notify('commands', 'Commande chargée : ' + command.name);
    } else {
        console.warn(`Commande dans ${file} ignorée car elle n'a pas de propriété 'name'`);
    }
}

require('dotenv').config();
client.login(process.env.TOKEN);
