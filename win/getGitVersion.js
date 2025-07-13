// getGitVersion.js
const https = require('https');

module.exports = function getGitVersion() {
  console.log("🌐 Checking version from GitHub...");

  return new Promise((resolve, reject) => {
    const token = "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";
    const repoOwner = 'francoispcrb';
    const repoName = 'DISCORD-BOT-CATHERINE';
    const filePath = 'package.json';
    const branch = 'main';

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    };

    https.get(options, (res) => {
      let data = '';

      if (res.statusCode !== 200) {
        reject(new Error(`❌ HTTP ${res.statusCode} : ${res.statusMessage}`));
        return;
      }

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const pkg = JSON.parse(data);
          console.log(`📦 Nom GitHub : ${pkg.name}`);
          console.log(`🕒 Version distante : ${pkg.version}`);
          resolve(pkg.version);
        } catch (e) {
          reject(new Error('❌ JSON parse error : ' + e.message));
        }
      });
    }).on('error', err => {
      reject(new Error('❌ HTTPS error : ' + err.message));
    });
  });
};
