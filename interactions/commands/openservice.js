const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const config = require('../../config/config.json');

module.exports = {
    name: 'openservice',
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

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
                new ButtonBuilder()
                    .setCustomId('yes')
                    .setLabel('✔️ Oui')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('no')
                    .setLabel('✖️ Non')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('maybe')
                    .setLabel('🤷‍♂️ Peut-être')
                    .setStyle(ButtonStyle.Secondary)
            );

        const message = await interaction.reply({ 
            embeds: [embed], 
            components: [buttons], 
            fetchReply: true,
            content: "@everyone, qui sera présent ce soir ?" 
        });

        // Initialisation globale
        globalThis.clientData[interaction.guildId] = { 
            messageId: message.id, 
            participants: { yes: [], no: [], maybe: [] }
        };

        console.log("✅ Données stockées :", globalThis.clientData[interaction.guildId]);

        // Sauvegarde dans config.json
        const participants = globalThis.clientData[interaction.guildId].participants;
        config.openservice_participants = { 
            yes: participants.yes, 
            no: participants.no, 
            maybe: participants.maybe 
        };
        config.openservice_last_id = message.id;

        fs.writeFileSync('../../config/config.json', JSON.stringify(config, null, 4), 'utf8');
        console.log("✅ Données écrites dans config.json :", JSON.stringify(globalThis.clientData[interaction.guildId], null, 4));
    }
}
