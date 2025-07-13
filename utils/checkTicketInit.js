const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');
const config = require('../config/config.json');
const fs = require('fs');
const { sendLog } = require('..'); 

async function checkTicketInit(client) {
  try {
    const messageId = config.ticket_message;
    const channelId = '1252239174610718782'; // Salon cible

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      console.error('❌ Le salon cible est introuvable ou non textuel.');
      return;
    }

    if (messageId) {
      try {
        const message = await channel.messages.fetch(messageId);
        if (message) {
          console.log('✅ Le message de ticket est déjà présent dans le salon.');
          return;
        }
      } catch (err) {
        console.warn('⚠️ Message introuvable, il va être reposté.');
      }
    }

    const ticketInitEmbed = new EmbedBuilder()
      .setTitle('🎟️ Ouvrir un Ticket')
      .setDescription("Veuillez choisir le type de ticket à ouvrir. ⚠️ Toute utilisation abusive sera sanctionnée.")
      .setColor('Yellow');

    const tickethrpEmbed = new EmbedBuilder()
      .setTitle('<:EquipeCom:1375185931795042356> Ouvrir un Ticket Modération')
      .setDescription("Veuillez choisir le type de ticket à ouvrir. ⚠️ Toute utilisation abusive sera sanctionnée. Ces tickets sont destinés à une utilisation HRP.")
      .setColor('DarkPurple');

    const ticketInitButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cmd').setLabel('👨‍💼 Ticket Commandement').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('dir').setLabel('🏢 Ticket Direction').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('recruit').setLabel('⛪ Ticket Recrutement').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('plainte').setLabel('🔨 Porter Plainte').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('report').setLabel('📁 Ouvrir un rapport').setStyle(ButtonStyle.Danger)
    );

    const ticketHrpButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setEmoji('<:EquipeCom:1375185931795042356>')
        .setLabel('Ticket Modération')
        .setCustomId('ticket-mod')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setEmoji('<:EquipeDev:1375185933288079445>')
        .setLabel('Ticket Développement')
        .setCustomId('ticket-dev')
        .setStyle(ButtonStyle.Success)
    );

    const sentMessage = await channel.send({
      embeds: [ticketInitEmbed, tickethrpEmbed],
      components: [ticketInitButton, ticketHrpButton]
    });

    config.ticket_message = sentMessage.id;
    fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 2));

    console.log(`✅ Message de ticket envoyé avec succès.`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du ticket :', error);

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Erreur')
      .setDescription('Une erreur est survenue pendant l\'initialisation du ticket.');

    sendLog(embed);
  }
}

module.exports = {
  checkTicketInit
};
