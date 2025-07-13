const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('..');
const chalk = require('chalk');

if (!globalThis.clientData) {
    globalThis.clientData = {}; // Initialise un objet global
}

module.exports = {
    name: 'guildMemberAdd',

    async execute(member) {
        try {
            // Envoi du log
            const embed = new EmbedBuilder()
                .setTitle("✅ Nouveau membre")
                .setColor("Green")
                .setDescription(`**${member.user.tag}** a rejoint le serveur.`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            sendLog(embed);

            const date = new Date().toLocaleString();
            console.log(chalk.green(`[MEMBER ADD] ${member.user.tag} est arrivé à ${date}`));

            // Récupération du channel de bienvenue
            const channelId = '1252234176032411739';  // Ton channel ID
            const channel = await member.guild.channels.fetch(channelId);
            if (!channel) {
                console.error(`Le channel avec l'ID ${channelId} est introuvable.`);
                return;
            }

            // Création du message de bienvenue
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00BFFF')
                .setTitle('🎉 Bienvenue sur le serveur !')
                .setDescription(`Salut <@${member.id}> !\nBienvenue dans notre communauté.\nN'hésite pas à lire les règles et à te présenter !`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '📜 Règles', value: 'Merci de les respecter pour garder une bonne ambiance <#1252234244760141874>.' },
                    { name: '🤝 Présentation', value: "N'hésite pas à aller dans <#1252239174610718782> pour te faire recruter ou obtenir des renseignements !" },
                )
                .setFooter({ text: 'Nous sommes ravis de t\'avoir ici !', iconURL: member.guild.iconURL() })
                .setTimestamp();

            // Envoi du message dans le channel
            await channel.send({ embeds: [welcomeEmbed] });

        } catch (error) {
            console.error("[ERROR] Erreur dans guildMemberAdd :", error);
        }
    }
};
