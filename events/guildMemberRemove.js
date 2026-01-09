const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('..');
const chalk = require('chalk');

if (!globalThis.clientData) {
    globalThis.clientData = {}; // global
}

module.exports = {
    name: 'guildMemberRemove',

    async execute(member) {
        try {
            const embed = new EmbedBuilder()
                .setTitle("❌ Membre parti")
                .setColor("Red")
                .setDescription(`**${member.user.tag}** a quitté le serveur.`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            sendLog(embed);

            const date = new Date().toLocaleString();
            console.log(chalk.red(`[MEMBER REMOVE] ${member.user.tag} / ${member.user.id} est parti à ${date}`));

            const channelId = '1252234176032411739';  // Remplace par le channel voulu
            const channel = await member.guild.channels.fetch(channelId);
            if (!channel) {
                console.error(`Le channel avec l'ID ${channelId} est introuvable.`);
                return;
            }

            const goodbyeEmbed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle('😢 Un membre nous a quitté')
                .setDescription(`Au revoir <@${member.id}>. Nous espérons te revoir bientôt !`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Nous sommes tristes de te voir partir.', iconURL: member.guild.iconURL() })
                .setTimestamp();

            await channel.send({ embeds: [goodbyeEmbed] });

        } catch (error) {
            console.error("[ERROR] Erreur dans guildMemberRemove :", error);
        }
    }
};
