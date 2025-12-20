const fs = require('fs').promises;
const path = require('path');
const { ChannelType } = require('discord.js');
const config = require('../config/config.json');
const cron = require('node-cron');

const RULE_FILES = [
    path.join(__dirname, '../src/Rules/rules_1.txt'),
    path.join(__dirname, '../src/Rules/rules_2.txt')
];

const fileModificationTimes = {};

async function initModificationTimes() {
    for (let i = 0; i < RULE_FILES.length; i++) {
        try {
            const stat = await fs.stat(RULE_FILES[i]);
            fileModificationTimes[i] = stat.mtimeMs;
        } catch (err) {
            console.error(`❌ Impossible de lire l'état de rules_${i + 1}.txt`, err);
        }
    }
}

async function checkAndSendRules(client) {
    console.log("🔍 Vérification des règles...");
    await initModificationTimes();

        const rulesChannelId = config.rules_channel_id;
        const rulesMessages = config.rules_messages;

        const channel = await client.channels.fetch(rulesChannelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            console.error("❌ Salon introuvable ou invalide.");
            return;
        }

        for (let i = 0; i < RULE_FILES.length; i++) {
            const messageId = rulesMessages[i];
            const filePath = RULE_FILES[i];

            let fileModified = false;
            try {
                const stat = await fs.stat(filePath);
                if (!fileModificationTimes[i] || stat.mtimeMs > fileModificationTimes[i]) {
                    fileModified = true;
                    fileModificationTimes[i] = stat.mtimeMs;
                }
            } catch (err) {
                console.error(`❌ Impossible de vérifier la modification de rules_${i + 1}.txt`, err);
                continue;
            }

            const shouldReplace = fileModified || !messageId;

            if (shouldReplace) {
                if (messageId) {
                    try {
                        const oldMessage = await channel.messages.fetch(messageId);
                        await oldMessage.delete();
                        console.log(`🗑️ Ancien message #${i + 1} supprimé`);
                    } catch (err) {
                        console.warn(`⚠️ Impossible de supprimer le message ${messageId} :`, err.message);
                    }
                }

                try {
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const sentMessage = await channel.send(fileContent);
                    config.rules_messages[i] = sentMessage.id;

                    await fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
                    console.log(`📨 Message #${i + 1} envoyé et ID mis à jour (${sentMessage.id})`);
                } catch (fileErr) {
                    console.error(`❌ Erreur lecture/envoi de rules_${i + 1}.txt :`, fileErr);
                }
            } else {
                console.log(`✅ rules_${i + 1}.txt inchangé, pas de mise à jour.`);
            }
        }
        console.log("✅ Vérification des règles terminée.");
    }

module.exports = { checkAndSendRules };
