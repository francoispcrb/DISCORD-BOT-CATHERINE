const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('..');
const chalk = require('chalk');

if (!globalThis.clientData) {
    globalThis.clientData = {}; // Initialise un objet global
}

module.exports = {
    name: 'guildBanRemove', // correction du nom de l'event

    async execute(ban) {
        try {
            const embed = new EmbedBuilder()
                .setTitle("🛑 Membre débanni")
                .setColor("DarkGreen")
                .setDescription(`**${ban.user.tag}** a été débanni du serveur.`)
                .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            sendLog(embed);

            const date = new Date().toLocaleString();
            console.log(chalk.green(`[BAN REMOVE] ${ban.user.tag} a été débanni à ${date}`));
        } catch (error) {
            console.error("[ERROR] Erreur dans guildBanRemove :", error);
        }
    }
};
