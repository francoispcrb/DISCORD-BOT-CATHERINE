// src/utils/ticketUtils.js

const { PermissionsBitField } = require('discord.js');
const { saveTicket } = require('./functions'); // à adapter
const { saveConfig } = require('./functions'); // à adapter
const config = require('../config/config.json'); // chemin à adapter
const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

let nbTicket = config.plugin.ticket_plugin.var;

async function createTicketChannel(interaction, emoji, roleId) {
    console.log(`[ACTION BUTTON] ${interaction.customId} of command /ticket has been used.`);

    nbTicket++;
    config.plugin.ticket_plugin.var = nbTicket;
    saveConfig();

    const channelName = `${emoji}-${interaction.customId}-${interaction.user.tag}`;

    const channel = await interaction.guild.channels.create({
        name: channelName,
        parent: config.category.ticket2,
        permissionOverwrites: [
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: roleId,
                allow: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            }
        ]
    });
    console.debug('[NEW TICKET CREATE]')
    console.log('[ACTION BUTTON] New channel created');

    const ticketFile = require('../config/ticket.json'); // à adapter

    ticketFile[channel.id] = {
        users: [interaction.user.id],
        auth: interaction.user.displayName,
        type: interaction.customId,
        ticketname: channel.name,
        islock: false,
        isarchived: false,
        nb: config.plugin.ticket_plugin.var
    };

    saveTicket();

    const { closeTicketEmbed, closeTicketButton } = require('../interactions/buttons'); // à adapter

    await channel.send({
        embeds: [closeTicketEmbed],
        components: [closeTicketButton]
    });

    await interaction.reply({
        content: `✅ Vous pouvez accéder à votre espace ici : <#${channel.id}>`,
        ephemeral: true
    });
}

async function showModalForm(interaction, { customId, title, fields }) {
    try {
        const modal = new ModalBuilder()
            .setCustomId(customId)
            .setTitle(title);

        for (const field of fields) {
            const input = new TextInputBuilder()
                .setCustomId(field.id)
                .setLabel(field.label)
                .setStyle(field.style || TextInputStyle.Short)
                .setRequired(field.required ?? true);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }

        console.log(`📩 Affichage du modal : ${customId}`);
        await interaction.showModal(modal);
    } catch (err) {
        console.error("❌ Erreur lors de l'affichage du modal :", err);
        return interaction.reply({
            content: "❌ Une erreur est survenue, veuillez réessayer.",
            ephemeral: true,
        });
    }
}

module.exports = { createTicketChannel, showModalForm };
