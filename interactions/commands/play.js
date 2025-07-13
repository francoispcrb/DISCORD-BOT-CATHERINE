const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const play = require('play-dl');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { addToQueue } = require('../../music/player'); // ton module player.js

module.exports = {
  name: "play",

  async execute(interaction) {
    const query = interaction.options.getString('query').trim();
    const member = interaction.member;

    // 1. Vérifier que l'utilisateur est dans un channel vocal
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: 'Tu dois être dans un channel vocal pour utiliser cette commande.', ephemeral: true });
    }

    // 2. Joindre ou récupérer la connexion vocale
    let connection = getVoiceConnection(interaction.guildId);
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
    }

    // 3. Faire la recherche YouTube
    await interaction.deferReply(); // temps pour la recherche

    let searchResults;
    try {
      searchResults = await play.search(query, { limit: 10 });
      if (searchResults.length === 0) {
        return interaction.editReply('Aucun résultat trouvé pour ta recherche.');
      }
    } catch (error) {
      console.error('Erreur lors de la recherche YouTube:', error);
      return interaction.editReply('Une erreur est survenue lors de la recherche.');
    }

    // 4. Construire l'embed avec les résultats
    const embed = new EmbedBuilder()
      .setTitle(`Résultats pour : "${query}"`)
      .setDescription(searchResults.map((v, i) => `**${i + 1}.** [${v.title}](${v.url})`).join('\n'))
      .setColor('Blue');

    // 5. Construire les boutons en plusieurs rangées de max 5 boutons
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

    // 6. Envoyer l'embed + boutons
    const message = await interaction.editReply({ embeds: [embed], components: rows });

    // 7. Créer un collector pour gérer le clic sur boutons, limité à l'auteur et 30 sec
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on('collect', async i => {
      // désactiver les boutons après clic
      collector.stop();

      const index = parseInt(i.customId.split('_')[1], 10);
      const selectedVideo = searchResults[index];

      if (!selectedVideo) {
        return i.reply({ content: 'Sélection invalide.', ephemeral: true });
      }

      try {
        const result = await addToQueue(interaction.guildId, selectedVideo.url);
        await i.update({ content: `🎶 Ajouté à la queue : **${result.title}**`, embeds: [], components: [] });
      } catch (error) {
        console.error('Erreur lors de l\'ajout à la queue :', error);
        await i.update({ content: 'Erreur lors de l\'ajout à la queue.', embeds: [], components: [] });
      }
    });

    collector.on('end', collected => {
      // désactiver les boutons après la fin du temps
      const disabledRows = rows.map(row => {
        return new ActionRowBuilder()
          .addComponents(
            row.components.map(button => button.setDisabled(true))
          );
      });

      message.edit({ components: disabledRows }).catch(() => { });
    });
  }
};
