const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
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

function readAccessData() {
  const pApi = path.join(__dirname, 'api', 'access.json');
  const pData = path.join(__dirname, 'data', 'access.json');
  let filePath = null;
  if (fs.existsSync(pApi)) filePath = pApi;
  else if (fs.existsSync(pData)) filePath = pData;
  else throw new Error(`Aucun access.json trouvé (cherché ${pApi} et ${pData})`);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

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

function panelAccessMiddleware(sectionsAllowed) {
  return (req, res, next) => {
    if (!req.session.userId) return res.status(403).send('Non connecté');

    let accessData;
    try {
      accessData = readAccessData();
    } catch (err) {
      console.error('Erreur lecture access.json dans middleware:', err);
      return res.status(500).send('Erreur serveur');
    }

    const userId = req.session.userId;

    const allowed = sectionsAllowed.some(section => {
      const s = String(section).toLowerCase();

      if (s.includes('command') || s.includes('commission') || s === 'cmd') {
        return (accessData.cmd || accessData.commandement || []).includes(userId);
      }
      if (s.includes('superv') || s.includes('supervision') || s === 'spv') {
        return (accessData.spv || accessData.supervisor || []).includes(userId);
      }
      if (s.includes('exec') || s === 'exe' || s === 'executif') {
        return (accessData.exe || accessData.executif || []).includes(userId);
      }
      if (s === 'public' || s === 'everyone' || s === 'all') return true;

      return false;
    });

    if (!allowed) return res.status(403).send('Accès refusé');
    next();
  };
}

app.get('/gen_panel', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'gen_panel.html'));
});

app.get('/commission_panel.html', panelAccessMiddleware(['commission']), (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'commission_panel.html'));
});

app.get('/commandement_panel.html', panelAccessMiddleware(['commandement', 'commission']), (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'commandement_panel.html'));
});

app.get('/supervision_panel.html', panelAccessMiddleware(['supervisor']), (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'supervision_panel.html'));
});

app.get('/api/access', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Non connecté' });

  try {
    const accessData = readAccessData();
    const userId = req.session.userId;

    let accessLevel = 'none';
    if ((accessData.cmd || []).includes(userId) || (accessData.commandement || []).includes(userId)) {
      accessLevel = 'commandement';
    } else if ((accessData.spv || []).includes(userId) || (accessData.supervisor || []).includes(userId)) {
      accessLevel = 'supervisor';
    } else if ((accessData.exe || []).includes(userId) || (accessData.executif || []).includes(userId)) {
      accessLevel = 'executif';
    }

    const BOT_TOKEN = process.env.TOKEN || process.env.DISCORD_BOT_TOKEN;
    let nickname = req.session.nickname || req.session.username || 'Invité';
    let avatarUrl = req.session.avatar || null;

    if (BOT_TOKEN) {
      try {
        const userResp = await axios.get(`https://discord.com/api/users/${userId}`, {
          headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        const discordUser = userResp.data;

        let guildId;
        try {
          const config = require('./config/config.json');
          guildId = config?.server?.id || config?.server?.test?.id || "1252231195312259073";
        } catch {
          guildId = "1252231195312259073";
        }

        if (guildId) {
          try {
            const memberResp = await axios.get(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
              headers: { Authorization: `Bot ${BOT_TOKEN}` }
            });
            if (memberResp.data && memberResp.data.nick) nickname = memberResp.data.nick;
          } catch (err) {
            console.warn('Impossible de récupérer le nickname guild:', err.response?.data || err.message);
          }
        }

        nickname = nickname || discordUser.global_name || discordUser.username || 'Invité';
        if (discordUser.avatar) {
          const isAnimated = discordUser.avatar.startsWith('a_');
          const ext = isAnimated ? 'gif' : 'png';
          avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}`;
        } else {
          avatarUrl = `https://cdn.discordapp.com/embed/avatars/0.png`;
        }
      } catch (err) {
        console.warn('Erreur récupération infos Discord via Bot API:', err.response?.data || err.message);
      }
    }

    console.log(`Access check: user=${userId} -> ${accessLevel}`);
    return res.json({ accessLevel, nickname, avatar: avatarUrl });

  } catch (err) {
    console.error('Erreur endpoint /api/access:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/executif-members', async (req, res) => {
  try {
    const access = readAccessData();
    const executifIds = access.exe || access.executif || [];
    if (executifIds.length === 0) return res.json([]);

    let guildId;
    try {
      const config = require('./config/config.json');
      guildId = config?.server?.id || config?.server?.test?.id;
    } catch {
      guildId = "1252231195312259073";
    }

    const token = process.env.TOKEN || process.env.DISCORD_BOT_TOKEN;
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
  if (!reportName || !classification) return res.status(400).json({ message: 'reportName et classification requis' });

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

app.get('/recrutement', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'recrutement.html'));
});

app.post('/submit-recrutement', async (req, res) => {
  const data = req.body;
  const username = req.session.username || 'Anonyme';
  const userId = req.session.userId || 'unknown';
  const reportName = `Candidature - ${username}`;
  const classification = 'recrutement';

  const folder = path.join(__dirname, 'submit');
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  fs.writeFileSync(path.join(folder, `${reportName}.json`), JSON.stringify(data, null, 2));

  try {
    const client = await auth.getClient();
    const newDocName = `${reportName}`;
    const docId = await copyGoogleDoc(client, TEMPLATE_DOC_ID, newDocName);

    const pdfPath = path.join(folder, `${reportName}.pdf`);
    await exportDocToPDF(client, docId, pdfPath);
    await google.drive({ version: 'v3', auth: client }).files.delete({ fileId: docId });

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

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Erreur déconnexion");
    res.redirect('/');
  });
});


app.get('/member/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/members', 'member.html'));
});

app.get('/api/member/:id', async (req, res) => {
  const memberId = req.params.id;
  const BOT_TOKEN = process.env.TOKEN || process.env.DISCORD_BOT_TOKEN;

  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token non configuré' });

  let guildId = "1252231195312259073";
  try {
    const config = require('./config/config.json');
    guildId = config?.server?.id || config?.server?.test?.id || guildId;
  } catch {}

  try {
    const [userRes, memberRes] = await Promise.all([
      axios.get(`https://discord.com/api/users/${memberId}`, { headers: { Authorization: `Bot ${BOT_TOKEN}` } }),
      axios.get(`https://discord.com/api/guilds/${guildId}/members/${memberId}`, { headers: { Authorization: `Bot ${BOT_TOKEN}` } })
    ]);

    return res.json({
      id: memberId,
      username: userRes.data.username,
      nickname: memberRes.data.nick,
      roles: memberRes.data.roles || []
    });
  } catch (err) {
    console.error('Erreur API membre:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Impossible de récupérer le membre' });
  }
});

app.post('/api/member/:id/nickname', async (req, res) => {
  const memberId = req.params.id;
  const { nickname } = req.body;

  const BOT_TOKEN = process.env.TOKEN || process.env.DISCORD_BOT_TOKEN;
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token non configuré' });

  let guildId = "1252231195312259073";
  try {
    const config = require('./config/config.json');
    guildId = config?.server?.id || config?.server?.test?.id || guildId;
  } catch {}

  try {
    await axios.patch(
      `https://discord.com/api/guilds/${guildId}/members/${memberId}`,
      { nick: nickname },
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );
    res.json({ success: true, nickname });
  } catch (err) {
    console.error("Erreur changement pseudo:", err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible de changer le pseudo' });
  }
});


app.post('/api/change-nick', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Non connecté' });

  const { targetId, newNick } = req.body;
  if (!targetId || !newNick) return res.status(400).json({ error: 'targetId et newNick requis' });

  const BOT_TOKEN = process.env.TOKEN || process.env.DISCORD_BOT_TOKEN;
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token non configuré' });

  let guildId = "1252231195312259073"; 
  try {
    const config = require('./config/config.json');
    if (config?.server?.test?.id) guildId = config.server.test.id;
    else if (config?.server?.id) guildId = config.server.id;
  } catch (err) {
    console.warn('Impossible de charger config/config.json pour guildId, fallback utilisé.');
  }

  try {
    const response = await axios.patch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${targetId}`,
      { nick: newNick },
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );
    return res.json({ success: true, newNick });
  } catch (err) {
    console.error('Erreur changement pseudo:', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});


const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

const mailData = require('./api/mail.json');

// API: récupérer les boîtes mail de l'utilisateur connecté
app.get('/api/getUserMails', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Non connecté' });
  }

  const userId = req.session.userId;

  const mails = Object.keys(mailData).filter(
    email => mailData[email] === userId
  );

  res.json({ mails });

  console.log(mails, userId)

});

app.get('/api/getAllMails', (req, res) => {
  const mails = Object.keys(mailData);
  res.json({ mails });
});


app.get('/api/folder', (req, res) => {
  const { mailbox, folder } = req.query;
  if (!mailbox || !folder) return res.status(400).json({ error: 'mailbox et folder requis' });

  const dir = path.join(__dirname, 'mails', mailbox, folder);
  if (!fs.existsSync(dir)) return res.json([]);

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const mails = files.map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    return JSON.parse(raw);
  }).sort((a, b) => b.date - a.date);

  res.json(mails);
});

app.post('/api/sendMail', upload.array('attachments'), (req, res) => {
  const { from, to, cc, bcc, subject, body, folderAction } = req.body;
  const attachments = req.files.map(f => f.path);

  if (!from || !mailData[from]) {
    return res.status(400).json({ success: false, message: 'Adresse mail invalide' });
  }

  const userId = mailData[from];
  const mailFile = getUserMailFile(userId);
  const userMails = JSON.parse(fs.readFileSync(mailFile, 'utf-8'));

  const mailEntry = {
    from,
    to: to ? to.split(',').map(x => x.trim()) : [],
    cc: cc ? cc.split(',').map(x => x.trim()) : [],
    bcc: bcc ? bcc.split(',').map(x => x.trim()) : [],
    subject,
    body,
    attachments,
    date: new Date().toISOString()
  };

  let folder = 'sent';
  if (folderAction === 'draft') folder = 'draft';
  else if (folderAction === 'archive') folder = 'archive';

  userMails[folder].push(mailEntry);
  fs.writeFileSync(mailFile, JSON.stringify(userMails, null, 2));

  res.json({ success: true, message: `Mail ajouté dans ${folder} avec succès !` });
});

app.post('/member/:id/nickname', async (req, res) => {
  const id = req.params.id;
  const nickname = req.body.nickname;

  try {
    let guildId;
    try {
      const config = require('./config/config.json');
      guildId = config?.server?.id || config?.server?.test?.id;
    } catch {
      guildId = "1252231195312259073";
    }

    if (!guildId) return res.status(500).send("GuildId non défini");

    await axios.patch(
      `https://discord.com/api/guilds/${guildId}/members/${id}`,
      { nick: nickname },
      { headers: { Authorization: `Bot ${process.env.TOKEN}` } }
    );

    res.send(`Pseudo du membre ${id} changé en ${nickname}`);
  } catch (err) {
    console.error("Erreur changement pseudo:", err.response?.data || err.message);
    res.status(500).send("Impossible de changer le pseudo.");
  }
});


const savedDataDir = path.join(__dirname, "views", "register", "saved_data");

app.get("/api/getVehicles", (req, res) => {
  try {
    const files = fs.readdirSync(savedDataDir).filter(f => f.endsWith(".html"));
    res.json({ files });
  } catch (e) {
    res.json({ files: [] });
  }
});

app.post("/api/addVehicle", (req, res) => {
  const { name, plate, owner, infraction } = req.body;

  if (!name || !plate) {
    return res.status(400).json({ message: "Nom et plaque requis !" });
  }

  const fileName = `${name.replace(/\s+/g, "_")}_${plate}.html`;
  const filePath = path.join(__dirname, "gen_panel/register/saved_data", fileName);

  const template = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche véhicule - ${name} ${plate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Poppins', sans-serif;
      background: #12121b;
      color: #eee;
      margin: 0;
      padding: 20px;
    }
    .card {
      max-width: 700px;
      margin: auto;
      background: rgba(0,0,0,0.6);
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 0 15px rgba(0,0,0,0.5);
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: #5865F2;
    }
    .info {
      margin: 15px 0;
      padding: 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
    }
    .label {
      font-weight: 600;
      color: #aaa;
      display: block;
      margin-bottom: 5px;
    }
    .value {
      font-size: 1.1em;
      color: #fff;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 0.9em;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚓 Fiche véhicule</h1>

    <div class="info">
      <span class="label">Nom du véhicule</span>
      <span class="value">${name}</span>
    </div>

    <div class="info">
      <span class="label">Plaque d'immatriculation</span>
      <span class="value">${plate}</span>
    </div>

    <div class="info">
      <span class="label">Propriétaire</span>
      <span class="value">${owner || "Non renseigné"}</span>
    </div>

    <div class="info">
      <span class="label">Infraction commise</span>
      <span class="value">${infraction || "Aucune"}</span>
    </div>

    <div class="footer">
      Enregistré automatiquement par le système | LSSD ©
    </div>
  </div>
</body>
</html>
`;

  try {
    fs.writeFileSync(filePath, template, "utf-8");
    res.json({ message: `Véhicule ${name} enregistré avec succès !` });
  } catch (err) {
    console.error("Erreur écriture fichier:", err);
    res.status(500).json({ message: "Erreur lors de la sauvegarde" });
  }
});
// start server 
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
