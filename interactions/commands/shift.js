const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, calculateUserDefaultAvatarIndex } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config/config.json');
const { useId } = require('react');

module.exports = {
    name: 'shift',
    async execute(interaction) {
        try {
            const now = Date.now();
            const userId = interaction.user.id;
            const type = interaction.options.getString('type');
            const veh = interaction.options.getString('veh');

            // Fonctions utilitaires
            const readJSON = (p) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};
            const writeJSON = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

            // Chemins
            const configPath = path.join(__dirname, '../../config/config.json');
            const vehPath = path.join(__dirname, '../../config/shift_veh.json');
            const dynPath = path.join(__dirname, '../../config/shift_veh_dyn.json');
            const userPath = path.join(__dirname, '../../config/shift_user.json');
            const filePath = path.join(__dirname, '../../config/shift.json');

            // Lecture des fichiers
            const shiftVeh = readJSON(vehPath);       // Stock fixe
            const shiftVehDyn = readJSON(dynPath);   // Stock dynamique
            const shiftUser = readJSON(userPath);    // Utilisateurs
            const shiftFile = readJSON(filePath);    // Historique
            const dateKey = `service du ${new Date().toISOString().split('T')[0]}`;

            if (!shiftFile[userId]) shiftFile[userId] = {};

            for (const t in shiftVeh) {
                if (!shiftVehDyn[t]) shiftVehDyn[t] = {};
                for (const v in shiftVeh[t]) {
                    if (typeof shiftVehDyn[t][v] !== 'number') {
                        shiftVehDyn[t][v] = shiftVeh[t][v];
                    }
                }
            }

            async function updateVehiculeEmbed(client) {
                const embedId = config.embedMessageId;
                const channel = await client.channels.fetch(config.channel.shift);

                const embed = new EmbedBuilder()
                    .setTitle("🚔 Disponibilité des véhicules")
                    .setColor("Blue");

                let desc = "";
                for (const t in shiftVeh) {
                    desc += `# **${t}**\n`;
                    for (const v in shiftVeh[t]) {
                        const total = Number(shiftVeh[t][v]) || 0;
                        const dispo = Number(shiftVehDyn[t]?.[v]) ?? total;
                        const users = Object.entries(shiftUser)
                            .filter(([_, d]) => d.type === t && d.veh === v)
                            .map(([id]) => `<@${id}>`)
                            .join(", ");

                        desc += `• **${v}** — ${dispo}/${total}\n`;
                        if (users) desc += `> ${users}\n`;
                    }
                    desc += `\n`;
                }

                embed.setDescription(desc.trim());

                if (!channel || !channel.isTextBased()) return console.error("[updateEmbed] Salon introuvable.");

                try {
                    if (embedId) {
                        const msg = await channel.messages.fetch(embedId);
                        await msg.edit({ embeds: [embed] });
                    } else {
                        throw new Error("embedMessageId manquant");
                    }
                } catch (e) {
                    console.warn("[updateEmbed] Nouveau message envoyé :", e.message);
                    const msg = await channel.send({ embeds: [embed] });
                    config.embedMessageId = msg.id;
                    writeJSON(configPath, config);
                }
            }

            if (shiftFile[userId].start) {
                await interaction.deferReply({ ephemeral: true });

                const start = shiftFile[userId].start;
                const duration = now - start;
                const h = Math.floor(duration / 3600000);
                const m = Math.floor((duration % 3600000) / 60000);
                const s = Math.floor((duration % 60000) / 1000);

                const usedType = shiftUser[userId]['type'];
                const usedVeh = shiftUser[userId]['veh'];
                console.debug(userId, usedType, usedVeh)

                if (usedType && usedVeh) {
                    const max = Number(shiftVeh[usedType][usedVeh]) || 0;
                    const current = Number(shiftVehDyn[usedType][usedVeh]) || 0;
                    shiftVehDyn[usedType][usedVeh] += 1;
                }

                if (!shiftFile[userId][dateKey]) shiftFile[userId][dateKey] = [];
                shiftFile[userId][dateKey].push(`${h}h ${m}m ${s}s`);

                delete shiftFile[userId].start;
                delete shiftUser[userId];

                const embed = new EmbedBuilder()
                    .setTitle("🚨 Fin de service")
                    .setDescription(`⏳ <@${userId}> a terminé son shift après **${h}h ${m}m ${s}s** !`)
                    .setColor('Red')
                    .setTimestamp();

                await interaction.channel.send({ embeds: [embed] });

                writeJSON(dynPath, shiftVehDyn);
                writeJSON(userPath, shiftUser);
                writeJSON(filePath, shiftFile);

                await updateVehiculeEmbed(interaction.client);
                await interaction.editReply({ content: "Good !", ephemeral: true });

            } else {
                if (!shiftVehDyn[type]) shiftVehDyn[type] = {};
                if (typeof shiftVehDyn[type][veh] !== 'number') {
                    shiftVehDyn[type][veh] = shiftVeh[type]?.[veh] ?? 0;
                }

                if (shiftVehDyn[type][veh] <= 0) {
                    return interaction.reply({ content: `🚫 Aucun véhicule disponible pour **${veh}** (${type}).`, ephemeral: true });
                }

                shiftFile[userId].start = now;
                shiftVehDyn[type][veh] -= 1;

                const embed = new EmbedBuilder()
                    .setTitle("🚨 Début de service")
                    .setDescription(`✅ <@${userId}> a commencé son service !\n**Véhicule utilisé** : ${veh} (${type})`)
                    .setColor("Green");

                const endButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`end_shift_${userId}`)
                        .setLabel('🛑 Arrêter le service')
                        .setStyle(ButtonStyle.Danger)
                );

                const msg = await interaction.channel.send({ embeds: [embed], components: [endButton] });

                shiftUser[userId] = { type, veh, logMessageId: msg.id };

                writeJSON(dynPath, shiftVehDyn);
                writeJSON(userPath, shiftUser);
                writeJSON(filePath, shiftFile);

                await updateVehiculeEmbed(interaction.client);
                await interaction.reply({ content: "Good !", ephemeral: true });
            }

        } catch (error) {
            console.error("Erreur dans la commande /shift :", error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "❌ Une erreur est survenue, contacte un administrateur.", ephemeral: true });
            } else {
                await interaction.reply({ content: "❌ Une erreur est survenue, contacte un administrateur.", ephemeral: true });
            }
        }
    }
};
