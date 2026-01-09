const { EmbedBuilder } = require('discord.js');
const chalk = require('chalk');
const { sendLog } = require('..');

module.exports = {
  name: 'messageDelete',

  async execute(message) {
    try {
      if (message.partial) await message.fetch();
      if (!message.guild || message.author?.bot) return;

      const contentValue = message.content?.length > 1024
        ? message.content.substring(0, 1021) + '...'
        : message.content || "*Aucun contenu*";

      let executor = "Inconnu";

      try {
        const fetchedLogs = await message.guild.fetchAuditLogs({
          limit: 1,
          type: 'MESSAGE_DELETE',
        });

        const deletionLog = fetchedLogs.entries.first();
        if (deletionLog) {
          const { executor: logExecutor, target, createdTimestamp } = deletionLog;
          const timeDiff = Date.now() - createdTimestamp;

          if (target.id === message.author.id && timeDiff < 5000) {
            executor = logExecutor.tag;
          }
        }
      } catch (err) {
        console.error(chalk.red("Erreur lors de la récupération des logs d'audit :"), err);
      }

      const embed = new EmbedBuilder()
        .setTitle("🗑 Message supprimé")
        .setColor("Red")
        .addFields(
          { name: "Auteur du message", value: `<@${message.author.id}>`, inline: true },
          { name: "Salon", value: `<#${message.channel.id}>`, inline: true },
          { name: "Message", value: contentValue },
          { name: "Supprimé par", value: executor, inline: true }
        )
        .setTimestamp();

      sendLog(embed);

      console.log(
        chalk.blueBright("[MESSAGE_REMOVE]"),
        chalk.green(message.author.tag),
        chalk.reset("→ supprimé par"),
        chalk.green(executor),
        chalk.reset("dans"),
        chalk.green(message.channel.name)
      );

    } catch (err) {
      console.error(chalk.red("[ERROR] Erreur dans le handler messageDelete :"), err);
    }
  }
};
