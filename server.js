const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(session({
  secret: process.env.SESSION_SECRET || 'un-secret-tres-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1h
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// === Routes publiques ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/auth/discord', (req, res) => {
  const redirectUrl = new URL('https://discord.com/api/oauth2/authorize');
  redirectUrl.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID);
  redirectUrl.searchParams.set('redirect_uri', process.env.DISCORD_REDIRECT_URI);
  redirectUrl.searchParams.set('response_type', 'code');
  redirectUrl.searchParams.set('scope', 'identify');
  res.redirect(redirectUrl.toString());
});

app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
      scope: 'identify'
    });

    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    req.session.userId = userRes.data.id;
    req.session.username = userRes.data.username;
    res.redirect('/gen_panel');
  } catch (err) {
    console.error('OAuth callback error:', err.response?.data || err.message);
    res.status(500).send('Erreur OAuth');
  }
});

// === Contrôle d'accès ===
function panelAccessMiddleware(sectionsAllowed) {
  return (req, res, next) => {
    if (!req.session.userId) return res.status(403).send('Non connecté');

    let accessData;
    try {
      accessData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'access.json'), 'utf8'));
    } catch (err) {
      console.error('Erreur lecture access.json:', err);
      return res.status(500).send('Erreur serveur');
    }

    if (sectionsAllowed.includes('SUPERVISION')) return next();

    const allowed = sectionsAllowed.some(section => {
      const users = accessData[section] || [];
      return users.includes(req.session.userId);
    });

    if (!allowed) return res.status(403).send('Accès refusé');
    next();
  };
}

// === Pages protégées ===
app.get('/gen_panel', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'gen_panel.html'));
});

app.get('/commission_panel.html', panelAccessMiddleware(['COMMISSION']), (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'commission_panel.html'));
});

app.get('/commandement_panel.html', panelAccessMiddleware(['COMMANDEMENT', 'COMMISSION']), (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'commandement_panel.html'));
});

app.get('/supervision_panel.html', panelAccessMiddleware(['SUPERVISION']), (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'supervision_panel.html'));
});

// === API accès utilisateur ===
app.get('/api/access', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Non connecté' });

  try {
    const accessData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'access.json'), 'utf8'));
    res.json({
      isInCommission: (accessData.COMMISSION || []).includes(req.session.userId),
      isInCommandement: (accessData.COMMANDEMENT || []).includes(req.session.userId),
      isInSupervision: (accessData.SUPERVISION || []).includes(req.session.userId),
    });
  } catch (err) {
    console.error('Erreur lecture access.json:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// === API exécutif-members ===
// const RANKS = require('./utils/utils').RANKS;

app.get('/api/executif-members', async (req, res) => {
  try {
    const access = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'access.json'), 'utf8'));
    const executifIds = access.executif || [];
    if (executifIds.length === 0) return res.json([]);

    const config = require('./config/config.json');
    const guildId = config.server.test.id;
    const token = process.env.TOKEN;

    const results = [];
    for (const id of executifIds) {
      try {
        const [userRes, memberRes] = await Promise.all([
          axios.get(`https://discord.com/api/users/${id}`, { headers: { Authorization: `Bot ${token}` } }),
          axios.get(`https://discord.com/api/guilds/${guildId}/members/${id}`, { headers: { Authorization: `Bot ${token}` } }),
        ]);

        results.push({
          id,
          username: userRes.data.username,
          nickname: memberRes.data.nick,
          roles: memberRes.data.roles,
        });
      } catch (err) {
        console.warn(`Erreur récupération utilisateur ${id}:`, err.response?.data || err.message);
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Erreur dans /api/executif-members:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// === Google Docs integration ===
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'config', 'catherine-461314-b18ed30046d7.json');
const TEMPLATE_DOC_ID = '1YimPZpfgvii1jdnJ5EkZ0asZI5-OeFVWLH1nAXtAmiA';

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
});

async function copyGoogleDoc(client, templateId, newName) {
  const drive = google.drive({ version: 'v3', auth: client });
  const copyResponse = await drive.files.copy({
    fileId: templateId,
    requestBody: { name: newName },
  });
  return copyResponse.data.id;
}

async function exportDocToPDF(client, fileId, savePath) {
  const drive = google.drive({ version: 'v3', auth: client });
  const dest = fs.createWriteStream(savePath);
  const res = await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'stream' });

  return new Promise((resolve, reject) => {
    res.data.on('end', () => resolve()).on('error', err => reject(err)).pipe(dest);
  });
}

app.get('/write_report', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  if (!TEMPLATE_DOC_ID) return res.status(500).send("Template non configurée.");

  try {
    const client = await auth.getClient();
    const newDocName = `Rapport_FHP_${req.session.userId}_${Date.now()}`;
    const newDocId = await copyGoogleDoc(client, TEMPLATE_DOC_ID, newDocName);
    res.redirect(`/write_report.html?docId=${newDocId}`);
  } catch (err) {
    console.error("Erreur création document:", err);
    res.status(500).send("Erreur lors de la génération du document");
  }
});

app.post('/api/generate-pdf', async (req, res) => {
  const { reportName, classification } = req.body;
  if (!reportName || !classification) {
    return res.status(400).json({ message: 'reportName et classification requis' });
  }

  try {
    const client = await auth.getClient();
    const newDocName = `${reportName} - ${classification}`;
    const copiedDocId = await copyGoogleDoc(client, TEMPLATE_DOC_ID, newDocName);

    const dirPath = path.join(__dirname, 'src', classification);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const pdfPath = path.join(dirPath, `${reportName}.pdf`);
    await exportDocToPDF(client, copiedDocId, pdfPath);

    await google.drive({ version: 'v3', auth: client }).files.delete({ fileId: copiedDocId });
    res.json({ success: true, path: pdfPath });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ message: error.message || 'Erreur interne' });
  }
});

// === Recrutement ===
app.get('/recrutement', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'recrutement.html'));
});

app.post('/submit-recrutement', async (req, res) => {
  const data = req.body;
  const username = req.session.username || 'Anonyme';
  const userId = req.session.userId || 'unknown';
  const reportName = `Candidature - ${username}`;
  const classification = 'recrutement';

  // Sauvegarde dans /submit/
  const folder = path.join(__dirname, 'submit');
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  fs.writeFileSync(path.join(folder, `${reportName}.json`), JSON.stringify(data, null, 2));

  // Génération PDF
  try {
    const client = await auth.getClient();
    const newDocName = `${reportName}`;
    const docId = await copyGoogleDoc(client, TEMPLATE_DOC_ID, newDocName);

    const pdfPath = path.join(folder, `${reportName}.pdf`);
    await exportDocToPDF(client, docId, pdfPath);
    await google.drive({ version: 'v3', auth: client }).files.delete({ fileId: docId });

    // Envoi via Webhook Discord
    const webhookURL = process.env.RECRUTEMENT_WEBHOOK_URL;
    const fileStream = fs.createReadStream(pdfPath);

    await axios.post(webhookURL, {}, {
      headers: { 'Content-Type': 'multipart/form-data' },
      data: {
        file: fileStream,
        content: `📩 Nouvelle candidature de **${username}** (ID: ${userId})`,
      }
    });

    res.send("Merci pour votre candidature !");
  } catch (err) {
    console.error("Erreur lors de la génération ou l’envoi:", err);
    res.status(500).send("Une erreur est survenue.");
  }
});

// === Déconnexion ===
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Erreur déconnexion");
    res.redirect('/');
  });
});

// === Start server ===
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

// Correction export
module.exports = TEMPLATE_DOC_ID;
