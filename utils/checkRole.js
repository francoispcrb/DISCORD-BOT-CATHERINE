const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const config = require('../config/config.json')

const ROLE_EXECUTIF = '1342563267910045749';
const ROLE_SUPERVISOR = '1342563302043025408';
const ROLE_COMMANDEMENT = '1342563289338744872';
const FILE_PATH = path.join(__dirname, '../api/access.json');

async function checkMemberRole(client) {
  try {
    const guild = client.guilds.cache.get(config.server.test.id); 
    if (!guild) return console.error("Serveur non trouvé.");

    await guild.members.fetch(); 

    const roleExecutif = guild.roles.cache.get(ROLE_EXECUTIF);
    const roleSupervisor = guild.roles.cache.get(ROLE_SUPERVISOR);
    const roleCommandement = guild.roles.cache.get(ROLE_COMMANDEMENT);

    if (!roleExecutif || !roleSupervisor || !roleCommandement) {
      return console.error("Un ou plusieurs rôles sont introuvables.");
    }

    const exe = roleExecutif.members.map(member => member.id);
    const spv = roleSupervisor.members.map(member => member.id);
    const cmd = roleCommandement.members.map(member => member.id);

    const jsonData = JSON.stringify({ exe, spv, cmd }, null, 2);
    fs.writeFileSync(FILE_PATH, jsonData, 'utf8');

    console.log(`[EXPORT] access.json mis à jour avec ${exe.length} exécutif(s), ${spv.length} superviseur(s) et ${cmd.length} commandement(s)`);
  } catch (error) {
    console.error("Erreur lors de l'export des membres :", error);
  }
}

module.exports = { checkMemberRole };
