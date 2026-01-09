const { Player, useQueue } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

let playerInstance;

function initPlayer(client) {
  if (!playerInstance) {
    playerInstance = new Player(client, {
      ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      },
    });

    playerInstance.extractors.loadMulti(DefaultExtractors).then(() => {
      console.log('[player] Extracteurs chargés avec succès.');
    }).catch(err => {
      console.error('[player] Erreur lors du chargement des extracteurs :', err);
    });

    playerInstance.events.on('error', (queue, error) => {
      console.error(`[discord-player] Erreur dans la queue de ${queue.guild.name} :`, error);
    });

    playerInstance.events.on('playerError', (queue, error) => {
      console.error(`[discord-player] Erreur de lecture dans ${queue.guild.name} :`, error);
    });

    console.log('[player] Initialisation du Player terminée.');
  }

  return playerInstance;
}

module.exports = {
  initPlayer,

  async play(guild, memberVoiceChannel, query) {
    const player = playerInstance;
    const queue = useQueue(guild.id) ?? player.nodes.create(guild, {
      metadata: {
        channel: memberVoiceChannel,
      },
      leaveOnEmpty: true,
      leaveOnEnd: true,
      leaveOnStop: true,
      skipOnNoStream: true,
    });

    try {
      const result = await player.search(query, {
        requestedBy: memberVoiceChannel.client.user,
      });

      if (!result || !result.tracks.length)
        throw new Error(`Aucun résultat trouvé pour "${query}".`);

      const connection = await queue.connect(memberVoiceChannel);
      if (!connection)
        throw new Error('Impossible de rejoindre le salon vocal.');

      await queue.addTrack(result.tracks[0]);

      if (!queue.isPlaying()) await queue.node.play();

      return {
        title: result.tracks[0].title,
        url: result.tracks[0].url,
        startedPlaying: true,
      };
    } catch (err) {
      console.error(`[discord-player] Erreur pendant la lecture :`, err);
      throw err;
    }
  },

  skip(guildId) {
    const queue = useQueue(guildId);
    if (queue && queue.isPlaying()) {
      queue.node.skip();
    }
  },

  stop(guildId) {
    const queue = useQueue(guildId);
    if (queue) {
      queue.delete();
    }
  },

  pause(guildId) {
    const queue = useQueue(guildId);
    if (queue && queue.isPlaying()) {
      queue.node.pause();
    }
  },

  resume(guildId) {
    const queue = useQueue(guildId);
    if (queue && queue.node.isPaused()) {
      queue.node.resume();
    }
  },

  getQueueSongs(guildId) {
    const queue = useQueue(guildId);
    return queue
      ? queue.tracks.toArray().map(track => ({
          title: track.title,
          url: track.url,
        }))
      : [];
  },
};
