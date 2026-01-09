const path = require('path');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

const pex = require('../config/pex.json');
const { PEX } = require('../utils/utils');
const shiftVeh = require('../config/shift_veh.json')
const { sendLog } = require('..');
const { executeButtons } = require('../interactions/buttons');
const { executeModal } = require('../interactions/modals');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {
        // Priorité: boutons et modals
        try {
            await executeButtons(interaction);
            await executeModal(interaction);
        } catch (err) {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: `Une erreur est survenue lors de l'exécution de l'interaction : ${err.message || err}`, ephemeral: true });
            }
            console.error("Erreur dans executeButtons/executeModal:", err);
            return;
        }

        // Autocomplete pex
        if (interaction.isAutocomplete() && interaction.commandName === 'pex') {
            const focused = interaction.options.getFocused(true);
            const selectedType = interaction.options.data.find(opt => opt.name === 'type')?.value;

            if (focused.name === 'permission' && selectedType && PEX[selectedType]) {
                const perms = Object.values(PEX[selectedType]);
                const filtered = perms.filter(p => p.toLowerCase().startsWith(focused.value.toLowerCase())).slice(0, 25);
                await interaction.respond(filtered.map(p => ({ name: p, value: p })));
            } else {
                await interaction.respond([]);
            }
            return;
        }

        if (interaction.isAutocomplete() && interaction.commandName === 'shift') {
            // Ici tu gères ton autocomplete
            const focused = interaction.options.getFocused();
            const type = interaction.options.getString('type');

            if (!type || !shiftVeh[type]) {
                return interaction.respond([]);
            }

            const vehList = Object.keys(shiftVeh[type]);
            const filtered = vehList.filter(v =>
                v.toLowerCase().includes(focused.toLowerCase())
            );

            return interaction.respond(
                filtered.map(v => ({ name: v, value: v }))
            );
        }


        // Gestion des commandes slash
        if (interaction.isCommand()) {
            // Log console & Discord
            const embed = new EmbedBuilder()
                .setTitle("📜 Commande exécutée")
                .setColor("Blue")
                .addFields(
                    { name: "Utilisateur", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Commande", value: `\`${interaction.commandName}\``, inline: true },
                    { name: "Salon", value: interaction.channel ? `<#${interaction.channel.id}>` : "DM", inline: true }
                )
                .setTimestamp();

            sendLog(embed);
            console.log(
                chalk.blueBright("[COMMAND]"),
                chalk.green(interaction.user.tag),
                chalk.reset("a exécuté la commande"),
                chalk.green(interaction.commandName || "null"),
                chalk.reset("dans"),
                chalk.green(interaction.channel?.name || "DM")
            );

            try {
                if (!PEX) throw new Error("❌ PEX est undefined !");
                if (!pex) throw new Error("❌ pex.json est undefined !");

                const commandName = interaction.commandName.toLowerCase();

                // Recherche permission requise dans PEX
                let requiredPermission = null;
                for (const category in PEX) {
                    if (PEX[category][commandName]) {
                        requiredPermission = PEX[category][commandName];
                        break;
                    }
                }

                // Bypass global
                if (pex['*']?.[interaction.user.id] === true) {
                    console.log(chalk.bgGreen(`✅ Utilisateur ${interaction.user.id} bypass les permissions.`));
                    await executeCommand(interaction);
                    return;
                }

                if (!requiredPermission) {
                    console.error(`⚠️ Aucune permission définie pour la commande "${commandName}".`);
                    await interaction.reply({ content: "🚫 Cette commande n'est pas configurée dans PEX.", ephemeral: true });
                    return;
                }

                if (!(requiredPermission in pex)) {
                    console.error(`⚠️ La permission "${requiredPermission}" n'existe pas dans pex.json.`);
                    await interaction.reply({ content: "🚫 Cette permission n'existe pas.", ephemeral: true });
                    return;
                }

                if (pex[requiredPermission] === 0) {
                    console.log(chalk.green(`La commande ${commandName} ne requiert pas de permission.`));
                    await executeCommand(interaction);
                    return;
                }

                // Vérifie que l'utilisateur a la permission
                const userHasPermission = pex[requiredPermission]?.[interaction.user.id] === true;

                if (!userHasPermission) {
                    console.log(`🚫 L'utilisateur ${interaction.user.id} n'a pas la permission "${requiredPermission}".`);
                    await interaction.reply({ content: `🚫 Tu n'as pas la permission d'utiliser cette commande. Permission requise : ${requiredPermission}.`, ephemeral: true });
                    return;
                }

                console.log(`✅ Permission accordée à ${interaction.user.id} pour la commande "${commandName}".`);
                await executeCommand(interaction);

            } catch (err) {
                console.error("❌ Erreur critique :", err);
                if (!interaction.replied) {
                    await interaction.reply({ content: "🚫 Une erreur interne est survenue.", ephemeral: true });
                }
            }
            return;
        }

        // Logs boutons
        if (interaction.isButton()) {
            const embed = new EmbedBuilder()
                .setTitle("📜 Interaction Bouton")
                .setColor("Blue")
                .addFields(
                    { name: "Utilisateur", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "ID Bouton", value: `\`${interaction.customId}\``, inline: true },
                    { name: "Salon", value: interaction.channel ? `<#${interaction.channel.id}>` : "DM", inline: true }
                )
                .setTimestamp();

            sendLog(embed);
            console.log(`[BUTTON] ${interaction.user.tag} a exécuté l'interaction bouton ${interaction.customId} dans ${interaction.channel?.id || "DM"}`);
            return;
        }

        // Logs modals
        if (interaction.isModalSubmit()) {
            const embed = new EmbedBuilder()
                .setTitle("📜 Interaction Modal")
                .setColor("Blue")
                .addFields(
                    { name: "Utilisateur", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "ID Modal", value: `\`${interaction.customId}\``, inline: true },
                    { name: "Salon", value: interaction.channel ? `<#${interaction.channel.id}>` : "DM", inline: true }
                )
                .setTimestamp();

            sendLog(embed);
            console.log(`[MODAL] ${interaction.user.tag} a exécuté l'interaction modal ${interaction.customId} dans ${interaction.channel?.id || "DM"}`);
            return;
        }
    }
};

async function executeCommand(interaction) {
    const commandName = interaction.commandName.toLowerCase();

    const commandDir = path.join(__dirname, '..', 'interactions', 'commands');

    // Liste les fichiers JS dans le dossier commands
    const files = fs.readdirSync(commandDir).filter(f => f.endsWith('.js'));

    // Cherche fichier correspondant à la commande (ex: ping.js pour commande "ping")
    const fileName = files.find(f => f.toLowerCase() === `${commandName}.js`);

    if (!fileName) {
        return interaction.reply({
            content: `Commande \`${commandName}\` introuvable.`,
            ephemeral: true
        });
    }

    const commandPath = path.join(commandDir, fileName);

    try {
        // Supprime le cache du module pour recharger à chaque exécution
        delete require.cache[require.resolve(commandPath)];

        const command = require(commandPath);

        if (typeof command.execute !== 'function') {
            return interaction.reply({
                content: `La commande \`${commandName}\` n'a pas de méthode \`execute\`.`,
                ephemeral: true
            });
        }

        await command.execute(interaction);
    } catch (err) {
        console.error(`Erreur lors de l'exécution de la commande ${commandName} :`, err);
        console.error("❌ Stack trace :", err?.stack || err);
        if (!interaction.replied) {
            await interaction.reply({
                content: 'Une erreur est survenue lors de l\'exécution de la commande.',
                ephemeral: true
            });
        }
    }
}
