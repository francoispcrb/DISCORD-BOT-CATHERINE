const { EmbedBuilder, MessageFlags } = require('discord.js');
const pex = require('../../config/pex.json');
const kickFile = require('../../config/kick.json');
const muteFile = require('../../config/muted.json');
const banFile = require('../../config/ban.json');
const warnFile = require('../../config/warn.json');

module.exports = {
    name: 'userinfo',
    async execute(interaction) {
        let user = interaction.options.getUser('user');

        if (!user) {
            user = interaction.user;
            console.notify('soft', "Aucun utilisateur inscrit pour /userinfo, il sera pris en compte ", interaction.user.id);
        }

        const userId = user.id;
        const member = interaction.guild.members.cache.get(user.id);
        const embed = new EmbedBuilder()
            .setTitle(`📋 **Historique de ${user.username}**`)
            .setColor('Yellow');

        embed.addFields({
            name: 'Informations sur le Client',
            value: `Tag : **${user.tag}**\nID : **${user.id}**\nNick : **${member?.nickname || user.username}**\nArrivé le <t:${Math.floor(parseInt(member?.joinedTimestamp || 0, 10) / 1000)}:R>`
        });

        const userPermission = [];
        for (const permission in pex) {
            if (pex[permission] && pex[permission][user.id] === true) {
                userPermission.push(permission);
            }
        }

        if (pex['*']?.[user.id]) {
            embed.addFields({
                name: 'Permissions octroyées sur le Client.',
                value: "Cet utilisateur a la **`Permission '*'`**."
            });
        } else {
            embed.addFields({
                name: 'Permissions octroyées sur le Client',
                value: userPermission.length > 0
                    ? `**${userPermission.join('\n')}**`
                    : 'Aucune permission sauf les permissions de bases.'
            });
        }

        if (kickFile[userId]) {
            const kicks = [];
            for (let i = 1; i <= kickFile[userId].count; i++) {
                const kick = kickFile[userId][`kick_0${i}`];
                kicks.push(`- ${kick.date} | **Raison:** ${kick.reason} | **Auteur:** <@${kick.author}>`);
            }
            embed.addFields({ name: `🚫 Kicks (${kickFile[userId].count})`, value: kicks.join('\n'), inline: true });
        }

        if (muteFile[userId]) {
            const mutes = [];
            for (let i = 1; i <= muteFile[userId].count; i++) {
                const mute = muteFile[userId][`mute_0${i}`];
                mutes.push(`- ${mute.date} | **Raison:** ${mute.reason} | **Durée:** ${mute.duration} | **Auteur:** <@${mute.author}>`);
            }
            embed.addFields({ name: `🔇 Mutes (${muteFile[userId].count})`, value: mutes.join('\n'), inline: true });
        }

        if (banFile[userId]) {
            const bans = [];
            for (let i = 1; i <= banFile[userId].count; i++) {
                const ban = banFile[userId][`ban_0${i}`];
                bans.push(`- ${ban.date} | **Raison:** ${ban.reason} | **Auteur:** <@${ban.author}> | **Durée:** ${ban.duration}`);
            }
            embed.addFields({ name: `❌ Bans (${banFile[userId].count})`, value: bans.join('\n'), inline: true });
        }

        if (warnFile[userId]) {
            const warns = [];
            for (let i = 1; i <= warnFile[userId].count; i++) {
                const warn = warnFile[userId][`warn_0${i}`];
                warns.push(`- ${warn.date} | **Raison:** ${warn.mark} | **Auteur:** <@${warn.author}>`);
            }
            embed.addFields({ name: `⚠️ Avertissements (${warnFile[userId].count})`, value: warns.join('\n'), inline: true });
        }

        if (!kickFile[userId] && !muteFile[userId] && !banFile[userId] && !warnFile[userId]) {
            embed.setDescription("✅ Aucun historique trouvé pour cet utilisateur.");
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};
