const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const shiftFilePath = path.join(__dirname, '../config/shift.json');
const shiftVehPath = path.join(__dirname, '../config/shift_veh.json');
const shiftDynPath = path.join(__dirname, '../config/shift_veh_dyn.json');
const shiftUserPath = path.join(__dirname, '../config/shift_user.json');
const configPath = path.join(__dirname, '../config/config.json');

function readJSON(p) {
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : {};
}
function writeJSON(p, data) {
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

async function autoEndShifts(client) {
    const shiftFile = readJSON(shiftFilePath);
    const shiftVeh = readJSON(shiftVehPath);
    const shiftVehDyn = readJSON(shiftDynPath);
    const shiftUser = readJSON(shiftUserPath);
    const config = readJSON(configPath);

    const channelId = config.channel.shift;
    const channel = await client.channels.fetch(channelId);
    const now = Date.now();

    const dateKey = `service du ${new Date().toISOString().split('T')[0]}`;

    for (const userId in shiftFile) {
        const start = shiftFile[userId].start;
        if (!start) continue;

        const duration = now - start;
        if (duration >= 5 * 3600000) {
            const hours = Math.floor(duration / 3600000);
            const minutes = Math.floor((duration % 3600000) / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);

            const usedVeh = shiftUser[userId]?.veh;
            const oldMsgId = shiftUser[userId]?.logMessageId;

            if (usedVeh && shiftVehDyn[usedVeh] !== undefined) {
                shiftVehDyn[usedVeh] = Math.min(shiftVeh[usedVeh], shiftVehDyn[usedVeh] + 1);
            }

            if (!shiftFile[userId][dateKey]) shiftFile[userId][dateKey] = [];
            shiftFile[userId][dateKey].push(`${hours}h ${minutes}m ${seconds}s`);
            delete shiftFile[userId].start;

            const embed = new EmbedBuilder()
                .setTitle("⏰ Fin automatique après 5h de service")
                .setDescription(`🔚 <@${userId}> a été retiré du service après **${hours}h ${minutes}m ${seconds}s**.`)
                .setColor('Orange')
                .setTimestamp();

            try {
                if (oldMsgId) {
                    const msg = await channel.messages.fetch(oldMsgId);
                    await msg.edit({ embeds: [embed] });
                } else {
                    await channel.send({ embeds: [embed] });
                }
            } catch {
                await channel.send({ embeds: [embed] });
            }

            delete shiftUser[userId];
        }
    }

    writeJSON(shiftFilePath, shiftFile);
    writeJSON(shiftUserPath, shiftUser);
    writeJSON(shiftDynPath, shiftVehDyn);
}

module.exports = autoEndShifts;
