const chalk = require('chalk');
const { ActivityType } = require('discord.js');
const config = require('../config/config.json');
const commands = require('../utils/commands');
const cron = require('node-cron');
const { compareVersion } = require('../win/compareVersion');

module.exports = {
    name: 'ready',
    async execute(client) {
        // --- Console startup ---

        await compareVersion()
        console.log(chalk.blue("=============================="));
        console.log(chalk.green("🚀 Démarrage du bot..."));
        console.log(chalk.yellow("🔗 Connexion à Discord API..."));
        console.log(chalk.cyan(`✅ Bot RP en ligne ! Connecté en tant que ${client.user.tag}`));
        console.log(chalk.blue("==============================\n"));

        // --- Initialisation de la musique ---
        const { initPlayer } = require('../music/player');
        initPlayer(client);

        // --- Ligne de commande interactive ---
        const fs = require('fs').promises;
        const readline = require('readline');
        const { EmbedBuilder } = require('discord.js');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });

        rl.prompt();

        rl.on('line', async (input) => {
            if (!input.startsWith('>send')) {
                rl.prompt();
                return;
            }

            try {
                const args = input.slice(5).trim().split(' ');
                const type = args[0];

                if (!['embed', 'text', 'file'].includes(type)) {
                    console.log('❌ Type invalide. Utilise "embed", "text" ou "file".');
                    return rl.prompt();
                }

                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

                if (type === 'file') {
                    const fileName = args[1];
                    const channelId = args[2];

                    if (!fileName || !channelId) {
                        console.log('❌ Syntaxe invalide. Utilise : >send file nom_du_fichier.txt channel_id');
                        return rl.prompt();
                    }

                    const channel = await client.channels.fetch(channelId).catch(() => null);
                    if (!channel || !channel.isTextBased()) {
                        console.log('❌ Salon introuvable ou non textuel.');
                        return rl.prompt();
                    }

                    const filePath = `./src/${fileName}`;
                    let content;
                    try {
                        content = await fs.readFile(filePath, 'utf8');
                    } catch (err) {
                        console.log(`❌ Impossible de lire le fichier "${fileName}" :`, err.message);
                        return rl.prompt();
                    }

                    if (fileName === 'Rules/rules_2.txt') {
                        // Création du bouton
                        const button = new ButtonBuilder()
                            .setCustomId('rulescheck')
                            .setLabel("✅ J'ai lu et accepté le règlement.")
                            .setStyle(ButtonStyle.Success);

                        const row = new ActionRowBuilder().addComponents(button);

                        await channel.send({ content, components: [row] });
                        console.log(`✅ Fichier "${fileName}" envoyé avec le bouton dans le salon ${channelId}`);
                    } else {
                        await channel.send(content);
                        console.log(`✅ Fichier "${fileName}" envoyé dans le salon ${channelId}`);
                    }

                    return rl.prompt();
                }

                const channelId = args[1];
                const contentParts = args.slice(2).join(' ').split('|');
                const message = contentParts[0]?.trim();
                const title = contentParts[1]?.trim() || null;

                const target = await client.channels.fetch(channelId).catch(() => null);

                if (target && target.isTextBased()) {
                // C’est un salon texte du guild, on peut envoyer dedans
                await target.send('Ton message ici');
                } else {
                // Ce n’est pas un salon texte, on tente un MP à un utilisateur avec cet ID
                const user = await client.users.fetch(channelId).catch(() => null);
                if (!user) {
                    console.log('❌ Salon introuvable, non textuel, et utilisateur non trouvé.');
                    return rl.prompt();
                }
                await user.send('Ton message ici');
                }


                if (type === 'embed') {
                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setDescription(message);
                    if (title) embed.setTitle(title);
                    await channel.send({ embeds: [embed] });
                    console.log('✅ Embed envoyé !');
                } else {
                    await channel.send(message);
                    console.log('✅ Message texte envoyé !');
                }
            } catch (err) {
                console.error('❌ Erreur lors de l\'envoi du message :', err);
            }

            rl.prompt();
        });

        // --- Enregistrement des commandes ---
        try {
            const GUILD_ID = config.server.test.id;
            const guild = await client.guilds.fetch(GUILD_ID);
            console.log(`📥 Serveur trouvé : ${guild.name}`);

            const existingCommands = await guild.commands.fetch();
            const commandNames = Array.from(existingCommands.values()).map(c => c.name);
            console.log(`🔍 Commandes déjà présentes : ${commandNames.join(', ') || 'Aucune'}`);

            const launchArgs = process.argv.slice(2);
            const mode = launchArgs.find(arg => ['clearcommand', 'debug'].includes(arg));

            if (mode === 'clearcommand') {
                console.warn("🧹 Suppression de toutes les commandes...");
                await guild.commands.set([]);
                return console.log(`✅ Toutes les commandes du serveur ${guild.name} ont été supprimées.`);
            }

            const commandsArray = Object.values(commands.commands || {});
            if (!commandsArray.length) {
                return console.error("❌ Aucune commande chargée dans commands.commands !");
            }

            if (!commandNames.length || mode === 'debug') {
                console.log(`📦 Enregistrement de ${commandsArray.length} commande(s)...`);
                await guild.commands.set(commandsArray);
                console.log("✅ Commandes enregistrées !");
            } else {
                console.warn("⚠️ Les commandes sont déjà enregistrées. Lance avec 'debug' pour forcer l'écrasement.");
            }

            // --- Activité du bot ---
            const activity = {
                name: 'gérer la SASP',
                type: ActivityType.Playing
            };
            client.user.setPresence({
                activities: [activity],
                status: "online"
            });

            console.log("🎮 Statut et activité mis à jour.");
            console.log("📌 Mode de lancement :", mode || chalk.yellow("Aucun"));
        } catch (error) {
            console.error("❌ Erreur lors de l'enregistrement des commandes :", error);
            if (error.code === 10003) {
                console.error("🔎 Le serveur avec l'ID fourni est introuvable. Vérifie le fichier de config.");
            }
        }

        console.log(`✅ Bot prêt en tant que ${client.user.tag}`);

        const autoEndShifts = require('../utils/autoEndShifts');

        setInterval(() => {
            autoEndShifts(client); // ← bien passer Client ici
        }, 1 * 60 * 1000);

        const {tabsDaily} = require('../utils/dailyUpdateTabs');
        const {divDaily} = require('../utils/dailyUpdateDiv');
        const {checkAndSendRules} = require('../utils/checkRulesMessages');
        const {checkMemberRole} = require('../utils/checkRole');
        const {sendOpenService} = require('../utils/openService');
        const {reboot} = require('../utils/reboot');
        const {checkTicketInit} = require('../utils/checkTicketInit');
        
        tabsDaily(client); divDaily(client)

        function taskMorning() {
            console.log(chalk.green("🌅 Tâches du matin exécutées !"));
            tabsDaily(client);
            divDaily(client);
            checkAndSendRules(client);
            checkMemberRole(client);
            compareVersion()
        }

        function taskEvening() {
            console.log(chalk.green("🌇 Tâches du soir exécutées !"));
            tabsDaily(client);
            divDaily(client);
            checkAndSendRules(client);
            checkMemberRole(client);
            sendOpenService(client);
            compareVersion()
        }

        function taskNight() {
            console.log(chalk.green("🌙 Tâches de la nuit exécutées !"));
            checkTicketInit(client);
            compareVersion()
            reboot();
        }

        cron.schedule('0 5 * * *', taskNight, {
            scheduled: true,
            timezone: "Europe/Paris"
        });

        cron.schedule('0 8 * * *', taskMorning, {
            scheduled: true,
            timezone: "Europe/Paris"
        });

        cron.schedule('0 16 * * *', taskEvening, {
            scheduled: true,
            timezone: "Europe/Paris"
        });
    }
};