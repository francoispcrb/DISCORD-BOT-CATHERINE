if (!globalThis.clientData) {
    globalThis.clientData = {}; // Initialise un objet global
}

const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('..');

module.exports = {
  name: 'messageUpdate',

  async execute(oldMessage, newMessage) {
    try {
      // Ignore si c'est un bot ou si le contenu n'a pas changé
      if (oldMessage.author?.bot || oldMessage.content === newMessage.content) return;

      // Sécurise les contenus avec fallback et tronque si trop long
      const truncate = (text) => text?.length > 1024 ? text.substring(0, 1021) + '...' : text || "*Aucun contenu*";

      const contentOfOldMessage = truncate(oldMessage.content);
      const contentOfNewMessage = truncate(newMessage.content);

      const embed = new EmbedBuilder()
        .setTitle("✏️ Message modifié")
        .setColor("Yellow")
        .addFields(
          { name: "Auteur", value: `<@${oldMessage.author.id}>`, inline: true },
          { name: "Salon", value: `<#${oldMessage.channel.id}>`, inline: true },
          { name: "Avant", value: contentOfOldMessage },
          { name: "Après", value: contentOfNewMessage }
        )
        .setTimestamp();

      sendLog(embed);

      console.log(`[MESSAGE UPDATED] ${oldMessage.author.tag} a modifié un message dans #${oldMessage.channel.name}: "${contentOfOldMessage}" → "${contentOfNewMessage}"`);
    } catch (err) {
      console.error("[ERROR] Erreur dans messageUpdate :", err);
    }
  }
};
