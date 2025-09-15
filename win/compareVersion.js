// compareVersions.js
const getLocalVersion = require('./getLocalVersion');
const getGitVersion = require('./getGitVersion');

require('../utils/loggers')

async function compareVersion() {
    try {
    const localVersion = getLocalVersion();
    const gitVersion = await getGitVersion();

    if (localVersion === gitVersion) {
      console.notify('info','✅ Les versions sont identiques.');
      return true;
    } else {
      console.warn(`⚠️ Les versions diffèrent : locale (${localVersion}) ≠ distante (${gitVersion})`);
      return false;
    }
  } catch (err) {
    console.error('❌ Erreur de comparaison :', err.message);
    return err;
  }
}

module.exports = {compareVersion}

compareVersion()