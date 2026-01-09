console.log("Initialisation...");

const ora = require('ora');
const chalk = require("chalk");
const fs = require('fs');
const path = require('path');
const config = require('./config/config.json');
const { loader, patchSendMethod } = require('./utils/functions');
const { compareVersion } = require('./win/compareVersion');

const Discord = require('discord.js');
const intents = new Discord.IntentsBitField(53608447);
const client = new Discord.Client({
    intents: [intents],
    partials: [Discord.Partials.Channel]
});


require('./utils/loggers');

function sendLog(embed) {
    const LOG_CHANNEL_ID = config.channel.log;
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });
}
module.exports = { sendLog };

//  load events
const eventsSpinner = ora("Chargement des événements...\n").start();
try {
    const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(__dirname, 'events', file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.notify('event', `Chargé : ${event.name}`);
    }
    eventsSpinner.succeed("✅ Événements chargés.");
} catch (err) {
    eventsSpinner.fail("❌ Erreur lors du chargement des événements.");
    console.error(err);
}

// loazd commands
const commandsSpinner = ora("Chargement des commandes...\n").start();
try {
    client.commands = new Map();
    const commandFiles = fs.readdirSync(path.join(__dirname, 'interactions', 'commands')).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(__dirname, 'interactions', 'commands', file));
        if (command.name) {
            client.commands.set(command.name, command);
            console.notify('commands', `Chargée : ${command.name}`);
        } else {
            console.warn(`⚠️ Commande ignorée : ${file} (pas de propriété 'name')`);
        }
    }

    commandsSpinner.succeed("✅ Commandes chargées.");
} catch (err) {
    commandsSpinner.fail("❌ Erreur lors du chargement des commandes.");
    console.error(err);
}

// load config
const configSpinner = ora("Chargement de config.json...\n").start();
globalThis.clientData = {};
try {
    const rawData = fs.readFileSync('./config/config.json', 'utf8');
    const configData = JSON.parse(rawData);

    if (configData.openservice_last_id && configData.openservice_participants) {
        globalThis.clientData = {
            messageId: configData.openservice_last_id,
            participants: configData.openservice_participants
        };
        configSpinner.succeed("✅ Données config.json rechargées.");
    } else {
        configSpinner.warn("⚠️ Aucune donnée trouvée dans config.json");
    }
} catch (error) {
    configSpinner.fail("❌ Erreur de lecture de config.json");
    console.error(error);
}

// load func
const utilSpinner = ora("Initialisation des fonctions utilitaires...\n").start();
try {
    loader();
    patchSendMethod();
    utilSpinner.succeed("✅ Fonctions utilitaires prêtes.");
} catch (error) {
    utilSpinner.fail("❌ Erreur pendant l'initialisation des fonctions.");
    console.error(error);
}

// connect discord
const connectSpinner = ora("Connexion à Discord...").start();
require('dotenv').config();
client.login(process.env.TOKEN)
    .then(() => {
        connectSpinner.succeed("✅ Connecté à Discord !");
    })
    .catch(err => {
        connectSpinner.fail("❌ Échec de la connexion à Discord.");
        console.error(err);
    });
