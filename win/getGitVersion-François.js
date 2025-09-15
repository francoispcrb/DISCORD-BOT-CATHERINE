const https = require('https');
const fs = require('fs');
const path = require('path');

// 🔧 Configuration
const githubUser = 'francoispiano';       // ← Remplace par ton nom GitHub
const githubRepo = 'CATHERINE-BOT';       // ← Remplace par ton dépôt
const githubBranch = 'main';     // ← ou 'master', selon ton cas

const githubUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/package.json`;
const localPackagePath = path.join(__dirname, 'package.json');

// 🔽 Fonction pour récupérer le fichier package.json sur GitHub
function getRemoteVersion(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version);
        } catch (e) {
          reject("Erreur lors de l'analyse JSON distant : " + e.message);
        }
      });
    }).on('error', err => {
      reject("Erreur de requête HTTPS : " + err.message);
    });
  });
}

// 🔍 Fonction principale
async function checkVersion() {
  try {
    const localPackage = JSON.parse(fs.readFileSync(localPackagePath, 'utf8'));
    const localVersion = localPackage.version;

    const remoteVersion = await getRemoteVersion(githubUrl);

    console.log(`📦 Version locale  : ${localVersion}`);
    console.log(`🌐 Version GitHub : ${remoteVersion}`);

    if (localVersion === remoteVersion) {
      console.log("✅ Le projet est à jour.");
    } else {
      console.log("⚠️  Le projet n'est pas à jour.");
    }
  } catch (err) {
    console.error("❌ Erreur :", err);
  }
}

checkVersion();
