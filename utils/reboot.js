const cron = require('node-cron');

function reboot() {
    console.warn('[REBOOT] Attention, Catherine redémarre (checker les logs). Instruction reboot.js')
    process.exit(0)
}

module.exports = { reboot };