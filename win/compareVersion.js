// compareVersions.js
const getLocalVersion = require('./getLocalVersion');
const getGitVersion = require('./getGitVersion');

require('../utils/loggers')

(async () => {
  try {
    const localVersion = getLocalVersion();
    const gitVersion = await getGitVersion();

    if (localVersion === gitVersion) {
      console.log('✅ Les versions sont identiques.');
    } else {
      console.warn(`⚠️ Les versions diffèrent : locale (${localVersion}) ≠ distante (${gitVersion})`);
    }
  } catch (err) {
    console.error('❌ Erreur de comparaison :', err.message);
  }
})();
