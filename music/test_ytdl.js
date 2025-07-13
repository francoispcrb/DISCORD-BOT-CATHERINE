const ytdl = require('ytdl-core');

(async () => {
  const url = 'https://www.youtube.com/watch?v=1zEIuTPho34'; // remplace par une autre vidéo si besoin

  try {
    const info = await ytdl.getInfo(url);
    console.log('Titre:', info.videoDetails.title);
  } catch (err) {
    console.error('Erreur ytdl-core :', err?.stack || err?.message || err);
  }
})();
