const { spawn } = require("child_process");
const axios = require("axios");
const config = require("./config/config.json");
const chalk = require("chalk");

// =======================
// ARGUMENTS CLI
// =======================
// ex: node start tty1
const args = process.argv.slice(2); // ["tty1"]
const mode = args[0] || "default";

// =======================
// WEBHOOK
// =======================
const WEBHOOK_URL = config.server.test.webhook_moderator_only;

async function sendDiscordMessage(content) {
    try {
        await axios.post(WEBHOOK_URL, { content });
    } catch (error) {
        console.error(
            chalk.red("[WEBHOOK ERROR]"),
            "Erreur en envoyant le message Discord :",
            error.message
        );
    }
}

// =======================
// START BOT
// =======================
async function startBot() {
    console.log(chalk.cyan(`[MODE] Lancement en mode : ${mode}`));
    await sendDiscordMessage(`🔄 **Le bot redémarre** (mode : \`${mode}\`)`);

    // ----- BOT DISCORD -----
    const botProcess = spawn(
        "node",
        ["index.js", ...args],
        { stdio: "inherit" }
    );

    // ----- SERVER WEB -----
    const serProcess = spawn(
        "node",
        ["server.js", ...args],
        { stdio: "inherit" }
    );

    botProcess.on("exit", async (code) => {
        console.log(
            chalk.yellow(`[BOT EXIT] Code ${code}. Redémarrage dans 5 secondes...`)
        );

        await sendDiscordMessage(
            `⚠️ **Le bot a crashé** (code ${code}) – redémarrage en cours...`
        );

        setTimeout(startBot, 5000);
    });

    botProcess.on("error", async (error) => {
        console.error(
            chalk.red("[BOT ERROR]"),
            "Erreur lors du lancement du bot :",
            error
        );

        await sendDiscordMessage(
            "❌ **Erreur critique lors du lancement du bot !** Redémarrage dans 5 secondes..."
        );

        setTimeout(startBot, 5000);
    });
}

// =======================
// INIT
// =======================
console.log(chalk.green("[START] Lancement du bot via start.js"));
startBot();
