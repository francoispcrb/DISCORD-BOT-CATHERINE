const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "voiceStateUpdate",
    async execute(oldState, newState) {
        const targetVoiceChannelId = '1252637467991998524';
        const notificationChannelId = '1383552275556991178';
        module.exports = { notificationChannelId };

        if (newState.channelId === targetVoiceChannelId && oldState.channelId !== targetVoiceChannelId) {
            const member = newState.member;

            const notifChannel = await newState.guild.channels.fetch(notificationChannelId);
            if (!notifChannel || !notifChannel.isTextBased()) return;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim')
                    .setEmoji('🛡️')
                    .setLabel('Claim')
                    .setStyle(ButtonStyle.Primary)
            );

            const message = await notifChannel.send({
                content: `@here <@${member.user.id}> vient de se connecter dans <#${targetVoiceChannelId}>.`,
                allowedMentions: { parse: ['everyone'] },
                components: [row] 
            });

            const cachePath = path.join(__dirname, '../assets/cache.json');
            module.exports = { cachePath }
            let cacheData = [];
            if (fs.existsSync(cachePath)) {
                try {
                    const raw = fs.readFileSync(cachePath, 'utf-8');
                    const parsed = JSON.parse(raw);
                    cacheData = Array.isArray(parsed) ? parsed : [];

                } catch (err) {
                    console.error('Erreur lors de la lecture de cache.json :', err);
                }
            }

            cacheData.push({
                messageId: message.id,
                userId: member.user.id,
                timestamp: Date.now()
            });

            try {
                fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
                console.log(`Message ${message.id} enregistré dans cache.json`);
            } catch (err) {
                console.error('Erreur lors de l’écriture dans cache.json :', err);
            }
        }
    }
}
