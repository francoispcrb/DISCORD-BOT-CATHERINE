// src/utils/dailyUpdate.js

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const { RANKS } = require('./utils');
const fs = require('fs');

function saveConfig() {
    fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 4));
}

async function tabsDaily(client) {
    console.log('[Cron] 🕒 Démarrage de la régénération automatique de la hiérarchie (tabs)...');
        try {
            const guild = await client.guilds.fetch(config.server.test.id);
            const channel = await guild.channels.fetch('1252235098447810651');

            // 🔴 Supprimer l'ancien message
            if (config.tabs.id_message) {
                try {
                    const oldMessage = await channel.messages.fetch(config.tabs.id_message);
                    await oldMessage.delete();
                    console.notify('soft', 'Message TABS supprimé')
                } catch (err) {
                    console.warn('[!] (TABS) Ancien message non trouvé ou déjà supprimé.');
                }
            }

            // INIT
            const BCSO = "<:Seal_of_the_Broward_County_Sheri:1456714284062212137>";
            const CMD = '<:CMD:1379898553157025984>';
            const SPV = '<:SPV:1379898592361189376>';
            const TRP = '<:TRP:1379898584371298355>';

            const SECTION_LABELS = {
                CMD: `# ${CMD} Corps de Commandement`,
                SPV: `# ${SPV} Corps de Supervision`,
                TRP: `# ${TRP} Corps d'Application`,
            };

            const sections = {
                [SECTION_LABELS.CMD]: [],
                [SECTION_LABELS.SPV]: [],
                [SECTION_LABELS.TRP]: [],
            };

            const rankOrder = [
                "• Sheriff", "• Undersheriff", "• Major",
                "• Captain", "• Lieutenant",
                "• Master Sergeant", "• Sergeant",
                "• Corporal", "• Master Deputy", "• Deputy", "• Deputy Trainee"
            ];

            const getSectionForGrade = (gradeName) => {
                if (["• Corporal", "• Master Deputy", "• Deputy", "• Deputy Trainee"].includes(gradeName)) {
                    return SECTION_LABELS.TRP;
                } else if (["• Master Sergeant", "• Sergeant"].includes(gradeName)) {
                    return SECTION_LABELS.SPV;
                } else if (["• Sheriff", "• Undersheriff", "• Major", "• Captain", "• Lieutenant"].includes(gradeName)) {
                    return SECTION_LABELS.CMD;
                }
                return null;
            };

            // Envoyer le message initial
            const newMessage = await channel.send({
                content: `# ${BCSO} Hiérarchie au sein du Broward County Sheriff Office ${BCSO}`,
                embeds: [
                    new EmbedBuilder().setDescription(
                        `${SECTION_LABELS.CMD}\n\n${SECTION_LABELS.SPV}\n\n${SECTION_LABELS.TRP}`
                    )
                ]
            });

            config.tabs.id_message = newMessage.id;
            saveConfig();

            let members = guild.members.cache;

            if (members.size === 0) {
                console.log('[Cron] Cache membres vide, fetch partiel...');
                await guild.members.fetch({ limit: 1000 });
                members = guild.members.cache;
            }
            for (const member of members.values()) {
                const userRoles = member.roles.cache;
                const matchedRanks = [];

                for (const [rankName, rankData] of Object.entries(RANKS)) {
                    if (userRoles.has(rankData.id)) {
                        matchedRanks.push({ name: rankData.name, emoji: rankData.emoji });
                    }
                }

                if (matchedRanks.length > 0) {
                    matchedRanks.sort((a, b) =>
                        rankOrder.indexOf(a.name) - rankOrder.indexOf(b.name)
                    );
                    const matchedRank = matchedRanks[0];
                    const gradeName = matchedRank.name;
                    const section = getSectionForGrade(gradeName);

                    if (section) {
                        const nickname = member.displayName;
                        const entry = `> - ${matchedRank.emoji} **\`${gradeName}\` ${nickname}**`;
                        sections[section].push(entry);
                    }
                }
            }

            let description = '';
            for (const [section, entries] of Object.entries(sections)) {
                description += `${section}\n`;

                if (entries.length > 0) {
                    const sortedEntries = entries.sort((a, b) => {
                        const gradeA = a.match(/`([^`]+)`/)[1];
                        const gradeB = b.match(/`([^`]+)`/)[1];
                        return rankOrder.indexOf(gradeA) - rankOrder.indexOf(gradeB);
                    });
                    description += sortedEntries.join('\n') + '\n\n';
                } else {
                    description += "Aucun membre\n\n";
                }
            }

            if (description.length > 6000) {
                console.warn('[Cron] ⚠️ Description trop longue pour un embed, tronquée.');
                description = description.slice(0, 5990) + '\n...';
            }

            const embed = EmbedBuilder.from(newMessage.embeds[0]);
            embed.setDescription(description);
            await newMessage.edit({ embeds: [embed] });

            console.log(`[✅] Hiérarchie TABS envoyée.`);
        } catch (err) {
            console.error('[Cron] ❌ Erreur lors de la régénération automatique :', err);
        }
    console.log('[Cron] 🕒 Fin de la régénération automatique de la hiérarchie.');
    }

module.exports = { tabsDaily };