const chalk = require("chalk");
const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('..');

if (!globalThis.clientData) {
    globalThis.clientData = {}; // global
}

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    try {
      if (message.author.bot) return;

      if (message.channel.type === 1) { // DM
        const prompt = message.content;
        console.log("Message privé reçu, prompt :", prompt);

        try {
          const res = await fetch("http://localhost:5000/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });

          const text = await res.text();
          console.log("Réponse brute du serveur IA :", text);

          let data;
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            console.error("Erreur de parsing JSON :", jsonErr);
            await message.reply("Erreur lors de la lecture de la réponse IA.");
            return;
          }

          await message.reply(data.response);
        } catch (err) {
          console.error("Erreur avec le serveur IA :", err);
          await message.reply("Erreur lors de la génération de la réponse.");
        }
      }


      const contentValue = message.content?.length > 1024
        ? message.content.substring(0, 1021) + '...'
        : message.content || "*Aucun contenu*";

      const embed = new EmbedBuilder()
        .setTitle("📝 Nouveau message")
        .setColor("Green")
        .addFields(
          { name: "Auteur", value: `<@${message.author.id}>`, inline: true },
          { name: "Salon", value: `<#${message.channel.id}>`, inline: true },
          { name: "Contenu", value: contentValue }
        )
        .setTimestamp();

      sendLog(embed);

      console.log(
        chalk.blueBright("[MESSAGE_SENT]"),
        chalk.green(message.author.tag),
        chalk.reset("a envoyé"),
        chalk.green(contentValue),
        chalk.reset("dans"),
        chalk.green(message.channel.name)
      );
    } catch (err) {
      console.error(chalk.red("[ERROR] Erreur dans le handler messageCreate :"), err);
    }
  }
};
