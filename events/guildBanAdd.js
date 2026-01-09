const chalk = require("chalk");

if (!globalThis.clientData) {
    globalThis.clientData = {}; // global
}

const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('..');

module.exports = {
    name: 'guildBanAdd',

    async execute(ban) {
        try {
            const embed = new EmbedBuilder()
                .setTitle("🚨 Membre banni")
                .setColor("DarkRed")
                .setDescription(`**${ban.user.tag}** a été banni du serveur.`)
                .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            sendLog(embed);

            const date = new Date().toLocaleString();
            console.log(chalk.bgYellowBright.red("[BAN ADD]"), chalk.red(ban.user.tag), chalk.reset("a été banni à"), chalk.green(date));
        } catch (error) {
            console.error("[ERROR] Erreur dans guildBanAdd :", error);
        }
    }
};
