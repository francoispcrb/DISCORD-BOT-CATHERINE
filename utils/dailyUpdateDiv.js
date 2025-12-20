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
    console.log('[Cron] 🕒 Démarrage de la régénération automatique de la hiérarchie... (DIV)');
    try {
        const channel = await client.channels.fetch('1252235098447810651');
        const guild = channel.guild;

        // 🔴 Supprimer l'ancien message
        if (config.tabs.id_message_div) {
            try {
                const oldMessage = await channel.messages.fetch(config.tabs.id_message_div);
                await oldMessage.delete();
            } catch {
                console.warn('[!] (DIV) Ancien message non trouvé ou déjà supprimé.');
            }
        }

        // ✅ Message initial
        const LSSD = '<:Logo_LSCSD:1451908624933720250>';
        const sentMessage = await channel.send({
            content: `# ${LSSD} Hiérarchie au sein du Los Santos Sheriff Department ${LSSD}`,
            embeds: [
                new EmbedBuilder().setDescription(
                    "# Patrol Division\n\n" +
                    "# Special Weapons and Tactics\n\n" +
                    "# Criminal Investigation\n\n" +
                    "# Internal Investigation Division\n\n" +
                    "# Administrative and Training Division\n\n" +
                    "# Air Support\n\n" +
                    "# K.9 Unit"
                )
            ]
        });

        config.tabs.id_message_div = sentMessage.id;
        saveConfig();

        const embed = EmbedBuilder.from(sentMessage.embeds[0]);

        const headers = embed.data.description
            .split('\n')
            .filter(l => l.startsWith('#'))
            .map(h => h.trim());

        // 🧱 Initialisation des sections
        const sections = {};
        for (const h of headers) {
            sections[cleanName(h)] = { commanders: [], others: [] };
        }

        // 🛡️ Utiliser le cache (anti-timeout)
        let members = guild.members.cache;
        if (members.size === 0) {
            await guild.members.fetch({ limit: 1000 });
            members = guild.members.cache;
        }

        const rankOrder = [
            "• Sheriff", "• Undersheriff", "• Major",
            "• Captain", "• Lieutenant",
            "• Sergeant",
            "• Corporal", "• Master Deputy", "• Deputy", "• Deputy Trainee"
        ];

        // 🔁 Traitement des membres
        members.forEach(member => {
            const roles = member.roles.cache;
            const nickname = member.displayName;

            // 🔍 Rank
            let matchedRank = null;
            for (const rank of Object.values(RANKS)) {
                if (roles.has(rank.id)) {
                    matchedRank = rank;
                    break;
                }
            }
            if (!matchedRank) return;

            const buildLine = (division, isCommander = false) => {
                const rankName = isCommander ? "Commander" : matchedRank.name;
                const emoji = isCommander ? "🛡️" : matchedRank.emoji;
                const line = isCommander ? "\n" : "";
                return `> - ${emoji} **\`${rankName}\` ${nickname}**${line}`;
            };

            /* =========================
               🟦 PATROL DIVISION (TOUS)
            ========================= */
            if (sections["Patrol Division"]) {
                const isCmd = COMMANDER["Patrol Division"] === member.id;
                if (isCmd) {
                    sections["Patrol Division"].commanders.push(
                        buildLine("Patrol Division", true)
                    );
                } else {
                    sections["Patrol Division"].others.push({
                        rankName: matchedRank.name,
                        line: buildLine("Patrol Division")
                    });
                }
            }

            /* =========================
               🟥 DIVISIONS SPÉCIALISÉES
            ========================= */
            for (const div of Object.values(DIV_MAP)) {
                if (!roles.has(div.id)) continue;

                const division = cleanName(div.name);
                if (!sections[division]) continue;

                const isCmd = COMMANDER[division] === member.id;
                if (isCmd) {
                    sections[division].commanders.push(
                        buildLine(division, true)
                    );
                } else {
                    sections[division].others.push({
                        rankName: matchedRank.name,
                        line: buildLine(division)
                    });
                }
            }
        });

        // 🧩 Reconstruction de l'embed
        const rebuilt = [];
        for (const h of headers) {
            const division = cleanName(h);
            const section = sections[division];

            rebuilt.push(h);

            if (section.commanders.length) {
                rebuilt.push(...section.commanders);
            }

            section.others.sort(
                (a, b) => rankOrder.indexOf(a.rankName) - rankOrder.indexOf(b.rankName)
            );

            rebuilt.push(...section.others.map(o => o.line), '');
        }

        let finalDesc = rebuilt.join('\n');
        if (finalDesc.length > 4096) {
            finalDesc = finalDesc.slice(0, 4080) + '\n...';
        }

        embed.setDescription(finalDesc);
        await sentMessage.edit({ embeds: [embed] });

        console.log('[✅] Hiérarchie DIV envoyée.');

    } catch (err) {
        console.error('[❌] Erreur dans la mise à jour auto de la hiérarchie DIV :', err);
    }

    console.log('[Cron] 🕒 Fin de la régénération automatique de la hiérarchie.');
}

module.exports = { divDaily };
