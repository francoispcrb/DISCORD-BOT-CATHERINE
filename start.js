const { spawn } = require("child_process");
const axios = require("axios");
const config = require('./config/config.json');
const chalk = require("chalk");

const WEBHOOK_URL = config.server.test.webhook_moderator_only;

async function sendDiscordMessage(content) {
    try {
        await axios.post(WEBHOOK_URL, { content });
    } catch (error) {
        console.error(chalk.red("[WEBHOOK ERROR]"), "Erreur en envoyant le message Discord :", error);
    }
}

async function startBot() {
    await sendDiscordMessage("🔄 **Le bot redémarre...**");

    const botProcess = spawn("node", ["index.js"], { stdio: "inherit" });
	// const serProcess = spawn("node", ["server.js"],{ stdio: "inherit" });

    botProcess.on("exit", async (code) => {
        console.log(chalk.yellow(`[BOT EXIT] Le bot s'est arrêté avec le code ${code}. Redémarrage dans 5 secondes...`));
        await sendDiscordMessage(`⚠️ **Le bot a crashé (code ${code}) et redémarre...**`);
        setTimeout(startBot, 5000);
    });

    botProcess.on("error", async (error) => {
        console.error(chalk.red("[BOT ERROR]"), "Erreur lors du lancement du bot :", error);
        await sendDiscordMessage("❌ **Erreur critique lors du lancement du bot ! Tentative de redémarrage dans 5 secondes...**");
        setTimeout(startBot, 5000);
    });
}

console.log(chalk.green("[START] Lancement du bot via start.js"));
startBot();
