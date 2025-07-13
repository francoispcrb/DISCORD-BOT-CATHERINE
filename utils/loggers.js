const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const { WebhookClient } = require('discord.js');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// === Webhook configuration ===
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1383562906708348970/cW6RHXJfDOjF3pINBn-4uCyEbcHCKA1djJmx9Zs_dqEmKlPXn3VADE6cVtrVi8VfeSEp'; // À personnaliser
const webhookClient = new WebhookClient({ url: WEBHOOK_URL });

let webhookQueue = [];
let webhookBusy = false;

async function sendToWebhook(message) {
    webhookQueue.push(message);
    if (webhookBusy) return;
    webhookBusy = true;

    while (webhookQueue.length > 0) {
        const msg = webhookQueue.shift();
        try {
            await webhookClient.send({ content: msg });
        } catch (e) {
            if (e.status === 429 && e.response?.headers['retry-after']) {
                const retryAfter = parseInt(e.response.headers['retry-after']) * 1000;
                await new Promise(r => setTimeout(r, retryAfter));
                webhookQueue.unshift(msg);
            } else {
                process.stderr.write(`[WEBHOOK LOG ERROR] ${e.message || e}\n`);
            }
        }
    }
    webhookBusy = false;
}

const writeLog = (message, type = 'LOG') => {
    try {
        const logFile = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`);
        const fullMessage = `[${new Date().toISOString()}] ${message}`;
        fs.appendFileSync(logFile, fullMessage + '\n');

        const webhookFormatted = `\`\`\`[${type}]\ ${fullMessage}\`\`\``;
        sendToWebhook(webhookFormatted);
    } catch (error) {
        process.stderr.write(`[LOG ERROR] ${error.message}\n`);
    }
};

const logWithLevel = (level, colorFn, stream, ...args) => {
    const date = DateTime.now().setZone('Europe/Paris').toFormat('yyyy-MM-dd HH:mm:ss');
    const prefix = `[${level}]`;
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    const fullMsg = `${date} ${prefix} ${message}`;

    writeLog(fullMsg, level);
    const colored = colorFn(fullMsg);
    stream.write(colored + '\n');
};

console.log = (...args) => logWithLevel('CLIENT DISCORD', chalk.bgBlueBright.black, process.stdout, ...args);
console.error = (...args) => logWithLevel('ERROR', chalk.bgRed.black, process.stderr, ...args);
console.warn = (...args) => logWithLevel('WARN', chalk.bgYellow.black, process.stdout, ...args);
console.debug = (...args) => logWithLevel('DEBUG', chalk.bgMagenta.black, process.stdout, ...args);
console.notify = (type = 'soft', ...args) => {
    if (args.length === 0) {
        args = [type];
        type = 'soft';
    }

    const date = DateTime.now().setZone('Europe/Paris').toFormat('yyyy-MM-dd HH:mm:ss');
    let prefix = '';
    let colorFn = chalk.reset;
    let level = '';

    switch(type.toLowerCase()) {
        case 'soft':
            prefix = '🟢 SOFT NOTIFY';
            colorFn = chalk.bgGreen.black;
            level = 'NOTIFY';
            break;
        case 'warm':
            prefix = '🟡 WARM NOTIFY';
            colorFn = chalk.bgYellow.black;
            level = 'WARN';
            break;
        case 'hot':
            prefix = '🔴 CRITICAL NOTIFY';
            colorFn = chalk.bgRed.black;
            level = 'ERROR';
            break;
        case 'commands':
            prefix = '📌 COMMANDS NOTIFY';
            colorFn = chalk.bgBlueBright.black;
            level = 'COMMANDS';
            break;
        case 'event':
            prefix = '📅 EVENT NOTIFY';
            colorFn = chalk.bgCyan.black;
            level = 'EVENT';
            break;
        case 'info':
            prefix = 'ℹ️ INFO NOTIFY';
            colorFn = chalk.bgWhite.black;
            level = 'INFO';
            break;
        default:
            console.log(...args);
            return;
    }

    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    const fullMsg = `[${level}] ${date} [${prefix}] ${message}`;
    writeLog(fullMsg, level);
    process.stdout.write(colorFn(fullMsg) + '\n');
};

try {
    module.exports = { writeLog };
    console.log("Les modules", chalk.green('loggers'), "ont correctement été exportés.");
} catch(err) {
    console.error("[FATAL_ERROR] Les utils n'ont pas été exportés correctement. Le processus va s'arrêter.", err);
    //console.notify('hot', 'Stopping process...');
    process.exit(1);
}
