const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config.json');
const pex = require('../config/pex.json');
const ped = require('../config/database/ped.json');
const veh = require('../config/database/veh.json');
const chalk = require('chalk');
const axios = require('axios');

const ticketFile = require('../config/ticket.json');
const warnFile = require("../config/warn.json");
const muteFile = require("../config/muted.json");
const kickFile = require("../config/kick.json");
const banFile = require("../config/ban.json");
const indicatifFile = require('../config/indicatif.json');
const shiftFile = require('../config/shift.json');

const packageJson = require('../package.json');

async function loader() {
    console.log(
        chalk.bgGreen.black('Chargement des informations du package.\n'),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Auth. : ${packageJson.author}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Depd. : ${packageJson.dependencies ? Object.keys(packageJson.dependencies).join(", ") : "Aucune"}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Desc. : ${packageJson.description}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Lisc. : ${packageJson.license}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Main. : ${packageJson.main}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Name. : ${packageJson.name}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Scrp. : ${JSON.stringify(packageJson.scripts)}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Vers. : ${packageJson.version}\n`),
        chalk.bgCyan('[PACKAGE]'), chalk.green(`Patch Note. : ${packageJson.patchnote}\n`)
    );
}

async function saveJSON(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 4));
        console.log(`✅ Fichier ${path.basename(filePath)} enregistré avec succès !`);
    } catch (err) {
        console.error(`❌ Erreur lors de l'écriture dans ${path.basename(filePath)} :`, err);
    }
}

// Fonctions spécifiques à partir de saveJSON
const savePex = () => saveJSON('./config/pex.json', pex);
const saveConfig = () => saveJSON('./config/config.json', config);
const saveTicket = () => saveJSON('./config/ticket.json', ticketFile);
const saveWarn = () => saveJSON('./config/warn.json', warnFile);
const saveMute = () => saveJSON('./config/muted.json', muteFile);
const saveKick = () => saveJSON('./config/kick.json', kickFile);
const saveBan = () => saveJSON('./config/ban.json', banFile);
const saveIndicatif = () => saveJSON('./config/indicatif.json', indicatifFile);
const saveShift = () => saveJSON('./config/shift.json', shiftFile);

async function saveDb(type) {
    if (!type) {
        return console.notify("hot", "Aucun type dans la fonction saveDb.");
    }
    switch (type) {
        case 'ped':
            await saveJSON('./config/database/ped.json', ped);
            break;
        case 'veh':
            await saveJSON('./config/database/veh.json', veh);
            break;
        default:
            console.warn(`Type inconnu dans saveDb: ${type}`);
    }
}

function addFooterToEmbeds(message) {
    if (!message.embeds?.length) return;

    const { EmbedBuilder } = require('discord.js');

    message.embeds = message.embeds.map(embedData => {
        const embed = EmbedBuilder.from(embedData);
        embed.setFooter({ text: `${packageJson.name} • ${packageJson.version} • Secretaire de la S.A.S.P.` });
        return embed;
    });
}

function patchSendMethod() {
    const { TextChannel, EmbedBuilder } = require('discord.js');
    const originalSend = TextChannel.prototype.send;

    TextChannel.prototype.send = async function (content, options) {
        if (typeof content === 'object' && content.embeds) {
            addFooterToEmbeds(content);
        } else if (typeof options === 'object' && options.embeds) {
            addFooterToEmbeds(options);
        }
        return originalSend.apply(this, [content, options]);
    };
}

async function searchYouTube(query) {
    const apiKey = config.token_youtube;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

    try {
        const response = await axios.get(searchUrl);
        const video = response.data.items[0];
        return { title: video.snippet.title, url: `https://www.youtube.com/watch?v=${video.id.videoId}` };
    } catch (error) {
        console.error('Erreur lors de la recherche sur YouTube', error);
        return null;
    }
}

async function updateVehiculeEmbed(client) {
    const shiftVeh = readJSON(shiftVehPath);
    const shiftVehDyn = readJSON(shiftDynPath);
    const shiftUser = readJSON(shiftUserPath);
    const config = readJSON(configPath);
    const embedId = config.embedMessageId;
    const embed = new EmbedBuilder()
        .setTitle("🚔 Disponibilité des véhicules")
        .setColor("Blue");
    let description = "";
    for (const veh in shiftVeh) {
        const total = shiftVeh[veh];
        const dispo = shiftVehDyn[veh] ?? total;
        const users = Object.entries(shiftUser)
            .filter(([_, v]) => v.veh === veh)
            .map(([id]) => `<@${id}>`)
            .join(", ");
        description += `**# ${veh}** — Nb : ${dispo}/${total}\n`;
        if (users) description += `> ${users}\n`;
        description += "\n";
    }
    embed.setDescription(description.trim());
    const channel = await client.channels.fetch(channelId);
    try {
        if (embedId) {
            const msg = await channel.messages.fetch(embedId);
            await msg.edit({ embeds: [embed] });
        } else {
            const sent = await channel.send({ embeds: [embed] });
            config.embedMessageId = sent.id;
            writeJSON(configPath, config);
        }
    } catch {
        const sent = await channel.send({ embeds: [embed] });
        config.embedMessageId = sent.id;
        writeJSON(configPath, config);
    }
}


try {
    module.exports = {
        saveBan,
        saveConfig,
        saveIndicatif,
        saveKick,
        saveMute,
        savePex,
        saveShift,
        saveTicket,
        saveWarn,
        loader,
        patchSendMethod,
        saveJSON,
        searchYouTube,
        saveDb,
        updateVehiculeEmbed
    };
    console.log("Les modules ", chalk.green('functions'), "ont correctement été exportés.");
} catch (err) {
    console.error("[FATAL_ERROR] Les fonctions n'ont pas été exportées correctement. Le processus va s'arrêter.", err);
    process.exit(1);
}
