const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');
const { RANKS, DIV_MAP, COMMANDER } = require('./utils');

function saveConfig() {
    fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 4));
}

function cleanName(str) {
    return str.replace(/[»#]/g, '').trim();
}

async function divDaily(client) {
    console.log('[Cron] 🕒 Démarrage de la régénération automatique de la hiérarchie... (div)');
        try {
            const channel = await client.channels.fetch('1252235098447810651');
            const guild = channel.guild;

            // 🔴 Supprimer l'ancien message
            if (config.tabs.id_message_div) {
                try {
                    const oldMessage = await channel.messages.fetch(config.tabs.id_message_div);
                    await oldMessage.delete();
                    console.notify('soft', 'Message DIV supprimé')
                } catch (err) {
                    console.warn('[!] (DIV) Ancien message non trouvé ou déjà supprimé.');
                }
            }

            // ✅ Envoyer le nouveau message (init)
            const LSSD = '<:Logo_LSCSD:1414975735164305499>';
            const sentMessage = await channel.send({
                content: `# ${LSSD} Hiérarchie au sein du Los Santos Sheriff Department ${LSSD}`,
                embeds: [
                    new EmbedBuilder().setDescription(
                        "# Patrol Diviion"
                        +"\n"
                        +"\n# Special Enforcement Bureau"
                        +"\n"
                        +"\n# Traffic Enforcement Bureau"
                        +"\n"
                        +"\n# Detective Division"
                        +"\n"
                        +"\n# Division de protection Judiciaire"
                        +"\n"
                        +"\n# Administrative and Training Division"
                        +"\n"
                        +"\n# Bureau Executif"
                    )
                ]
            });

            config.tabs.id_message_div = sentMessage.id;
            saveConfig();

            // 🔁 Régénérer l'embed
            const embed = EmbedBuilder.from(sentMessage.embeds[0]);
            const lines = embed.data.description.split('\n');
            const sectionHeaders = lines.filter(line => line.startsWith('#')).map(line => line.trim());

            const sectionMap = {};
            for (const header of sectionHeaders) {
                const division = cleanName(header);
                sectionMap[division] = {
                    commanders: [],
                    others: []
                };
            }

            const members = await guild.members.fetch();
            const rankOrder = [
                "• Sheriff", "• Deputy Sheriff", "• Assistant Sheriff", "• Captain", "• Lieutenant",
                "• Chief Sergeant", "• Sergeant",
                "• Deputy Sheriff FTO", "• Deputy Sheriff II", "• Deputy Sheriff", "• Deputy Sheriff Trainee"
            ];

            members.forEach(member => {
                const roles = member.roles.cache;
                const nickname = member.displayName;

                let matchedRank = null;
                for (const rank of Object.values(RANKS)) {
                    if (roles.has(rank.id)) {
                        matchedRank = { name: rank.name, emoji: rank.emoji };
                        break;
                    }
                }

                if (!matchedRank) return;

                for (const [key, div] of Object.entries(DIV_MAP)) {
                    if (!roles.has(div.id)) continue;

                    const division = cleanName(div.name);
                    if (!sectionMap[division]) continue;

                    const isCmd = COMMANDER[division] === member.id;
                    const rank = isCmd ? "Commander" : matchedRank.name;
                    const emoji = isCmd ? "🛡️" : matchedRank.emoji;
                    const line = `> - ${emoji} **\`${rank}\` ${nickname}**`;

                    if (isCmd) sectionMap[division].commanders.push(line);
                    else sectionMap[division].others.push({ rankName: matchedRank.name, line });
                }
            });

            const rebuilt = [];
            for (const header of sectionHeaders) {
                rebuilt.push(header);
                const division = cleanName(header);
                const section = sectionMap[division];

                if (section.commanders.length) rebuilt.push(...section.commanders, '');

                section.others.sort((a, b) => rankOrder.indexOf(a.rankName) - rankOrder.indexOf(b.rankName));
                rebuilt.push(...section.others.map(o => o.line), '');
            }

            embed.setDescription(rebuilt.join('\n'));
            await sentMessage.edit({ embeds: [embed] });

            console.log(`[✅] Hiérarchie DIV envoyée.`);

        } catch (err) {
            console.error('[❌] Erreur dans la mise à jour auto de la hiérarchie :', err);
        }
        console.log('[Cron] 🕒 Fin de la régénération automatique de la hiérarchie.');
    }

module.exports = {divDaily};
