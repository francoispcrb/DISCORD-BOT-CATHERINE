const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const { play } = require('../../music/player');
const playdl = require('play-dl');

module.exports = {
  name: 'play',

  async execute(interaction) {
    const query = interaction.options.getString('query').trim();
    const member = interaction.member;

    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: 'Tu dois être dans un salon vocal pour utiliser cette commande.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    let searchResults;
    try {
      console.log(`[play.js] Recherche YouTube pour : ${query}`);
      searchResults = await playdl.search(query, { limit: 10 });
      if (!searchResults.length) {
        return interaction.editReply('Aucun résultat trouvé pour ta recherche.');
      }
      console.log(`[play.js] ${searchResults.length} résultats trouvés`);
    } catch (err) {
      console.error('[play.js] Erreur de recherche YouTube :', err);
      return interaction.editReply('Une erreur est survenue pendant la recherche.');
    }

    const embed = new EmbedBuilder()
      .setTitle(`Résultats pour : "${query}"`)
      .setDescription(searchResults.map((v, i) => `**${i + 1}.** [${v.title}](${v.url})`).join('\n'))
      .setColor('Blue');

    const rows = [];
    for (let i = 0; i < searchResults.length; i += 5) {
      const row = new ActionRowBuilder();
      for (let j = i; j < i + 5 && j < searchResults.length; j++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`select_${j}`)
            .setLabel(`${j + 1}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
      rows.push(row);
    }

    const message = await interaction.editReply({
      embeds: [embed],
      components: rows
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      const index = parseInt(i.customId.split('_')[1], 10);
      const selected = searchResults[index];

      if (!selected) {
        return message.edit({ content: 'Sélection invalide.', embeds: [], components: [] });
      }

      try {
        console.log(`[play.js] Lecture de la piste sélectionnée : ${selected.title}`);
        const result = await play(
          interaction.guild,
          voiceChannel,
          selected.url
        );

        await message.edit({
          content: `🎶 Lecture : **[${result.title}](${result.url})**`,
          embeds: [],
          components: []
        });
      } catch (error) {
        console.error('[play.js] Erreur lors de la lecture :', error);
        console.error("[play.js] Détails de l'erreur :", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        await message.edit({
          content: 'Une erreur est survenue lors de la lecture.',
          embeds: [],
          components: []
        });
      }
    });

    collector.on('end', () => {
      const disabledRows = rows.map(row =>
        new ActionRowBuilder().addComponents(
          row.components.map(button => button.setDisabled(true))
        )
      );
      message.edit({ components: disabledRows }).catch(() => {});
    });
  }
};
