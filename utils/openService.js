const cron = require('node-cron');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');

async function sendOpenService(client) {
    try {
        const channelId = config.openservice_channel_id;
        if (!channelId) {
            console.error('❌ openservice_channel_id non défini dans config.json');
            return;
        }
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            console.error('❌ Salon introuvable ou non textuel');
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle('Qui sera présent ce soir ?')
            .setDescription('Veuillez indiquer votre présence en appuyant sur un bouton ci-dessous.')
            .setColor(0x00AE86)
            .addFields(
                { name: '✅ Oui', value: 'Aucun', inline: true },
                { name: '❌ Non', value: 'Aucun', inline: true },
                { name: '🤔 Peut-être', value: 'Aucun', inline: true }
            );
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('yes').setLabel('✔️ Oui').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('no').setLabel('✖️ Non').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('maybe').setLabel('🤷‍♂️ Peut-être').setStyle(ButtonStyle.Secondary)
            );
        const message = await channel.send({ 
            content: "@everyone, qui sera présent ce soir ?", 
            embeds: [embed], 
            components: [buttons] 
        });
        globalThis.clientData = globalThis.clientData || {};
        globalThis.clientData[channel.guild.id] = {
            messageId: message.id,
            participants: { yes: [], no: [], maybe: [] }
        };
        config.openservice_participants = globalThis.clientData[channel.guild.id].participants;
        config.openservice_last_id = message.id;
        fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 4), 'utf8');
        console.log("✅ Données écrites dans config.json");
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi du message de service ouvert :", error);
    }
}

module.exports = { sendOpenService }
