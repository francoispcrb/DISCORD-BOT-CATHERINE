const Discord = require('discord.js')
const intents = new Discord.IntentsBitField(53608447)
const chalk = require("chalk");
const fs = require('fs')
const Client = new Discord.Client({intents})

if (!globalThis.clientData) {
    globalThis.clientData = {}; // Initialise un objet global
}
const config     = require('../config/config.json')
const ticketFile = require('../config/ticket.json')

const { EmbedBuilder } = require('discord.js')
const { ActionRowBuilder } = require('discord.js')
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js')
const { PermissionsBitField } = require('discord.js')
const { ThreadAutoArchiveDuration } = require('discord.js')
const { ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js')

const { saveBan, saveConfig, saveKick, saveMute, saveShift, saveTicket, saveWarn } = require('../utils/functions')
const { RANKS, CORPS, commands } = require('../utils/utils')
const { sendLog } = require('..');
const { createTranscript } = require('discord-html-transcripts')
const {createTicketChannel, showModalForm} = require ('../utils/ticket');
const path = require('path')

const { skip, stop, pause, resume } = require('../music/player');

var nbTicket = config.plugin.ticket_plugin.var

try {
    module.exports = {
        name: 'interactionCreate',
        async executeButtons(interaction) {
            
            if (interaction.isButton()) {
                const closeTicketEmbed = new EmbedBuilder()
                .setTitle(`Bienvenue dans votre ticket ${interaction.user.tag} ! `)
                .setDescription(`Bonjour, bienvenue dans votre espace. Nous vous prions de bien vouloir patienter le temps que nos équipes prennent en compte votre demande. À votre service <@${interaction.user.id}> !`)
                .setColor("DarkButNotBlack")

                const closeTicketButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_but')
                        .setLabel("❎ Fermer le ticket.")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('lock')
                        .setLabel("⛔ Vérouiller le ticket.")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('archive')
                        .setLabel("📜 Archiver le ticket.")
                        .setStyle(ButtonStyle.Success)
                );
                
                if (interaction.customId.startsWith('view_')) {
                    const idToView = interaction.customId.split('_')[1];
                    const clickId = interaction.user.id

                    const admins = config.adminss || [];


                    if(clickId !== idToView && !admins.includes(clickId)) {
                        return await interaction.reply({content: "Ce message n'est pas pour vous !", ephemeral: true})
                    }

                    else {
                        interaction.message.delete()
                        interaction.reply({content:"Vous avez vu le message.", ephemeral:true})
                    }
                }

                if (interaction.customId.startsWith('end_shift_')) {
                try {
                    const channelId = config.channel.shift;
                    function readJSON(path) {
                                        return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : {};
                    }
                                    
                    function writeJSON(path, data) {
                                        fs.writeFileSync(path, JSON.stringify(data, null, 2));
                    }
                    
                    async function updateVehiculeEmbed(client) {
                        const shiftVeh = readJSON(shiftVehPath);
                        const shiftVehDyn = readJSON(shiftDynPath);
                        const shiftUser = readJSON(shiftUserPath);
                        const embedId = config.embedMessageId;

                        const embed = new EmbedBuilder()
                            .setTitle("🚔 Disponibilité des véhicules")
                            .setColor("Blue");

                        let description = "";

                        for (const veh in shiftVeh) {
                            const total = shiftVeh[veh];
                            const dispo = shiftVehDyn[veh] ?? total;
                            const users = Object.entries(shiftUser)
                                .filter(([_, v]) => v.veh === veh)
                                .map(([id]) => `<@${id}>`)
                                .join(", ");

                            description += `**# ${veh}** — Nb : ${dispo}/${total}\n`;
                            if (users) description += `> ${users}\n`;
                            description += "\n";
                        }

                        embed.setDescription(description.trim());

                        const channel = await client.channels.fetch(channelId);

                        try {
                            if (embedId) {
                                const msg = await channel.messages.fetch(embedId);
                                await msg.edit({ embeds: [embed] });
                            } else {
                                const sent = await channel.send({ embeds: [embed] });
                                config.embedMessageId = sent.id;
                                writeJSON(configPath, config);
                            }
                        } catch {
                            const sent = await channel.send({ embeds: [embed] });
                            config.embedMessageId = sent.id;
                            writeJSON(configPath, config);
                        }
                    }
                    

                    const userIdToStop = interaction.customId.split('_')[2];
                    const clickerId = interaction.user.id;

                    const configPath = path.join(__dirname, '../config/config.json');
                    const shiftVehPath = path.join(__dirname, '../config/shift_veh.json');
                    const shiftDynPath = path.join(__dirname, '../config/shift_veh_dyn.json');
                    const shiftUserPath = path.join(__dirname, '../config/shift_user.json');
                    const shiftFilePath = path.join(__dirname, '../config/shift.json');

                    const admins = config.admins || [];

                    const shiftVeh = readJSON(shiftVehPath);
                    const shiftVehDyn = readJSON(shiftDynPath);
                    const shiftUser = readJSON(shiftUserPath);
                    const shiftFile = readJSON(shiftFilePath);

                    const dateKey = `service du ${new Date().toISOString().split('T')[0]}`;
                    const now = Date.now();

                    if (clickerId !== userIdToStop && !admins.includes(clickerId)) {
                    return interaction.reply({ content: "🚫 Vous n'avez pas la permission d'arrêter ce service.", ephemeral: true });
                    }

                    if (!shiftFile[userIdToStop]?.start) {
                    return interaction.reply({ content: "⚠️ Ce membre n'est pas actuellement en service.", ephemeral: true });
                    }

                    const startTime = shiftFile[userIdToStop].start;
                    const durationMs = now - startTime;
                    const hours = Math.floor(durationMs / 3600000);
                    const minutes = Math.floor((durationMs % 3600000) / 60000);
                    const seconds = Math.floor((durationMs % 60000) / 1000);

                    const usedVeh = shiftUser[userIdToStop]?.veh;

                    if (usedVeh && shiftVehDyn[usedVeh] !== undefined) {
                    shiftVehDyn[usedVeh] = Math.min(shiftVeh[usedVeh], shiftVehDyn[usedVeh] + 1);
                    }

                    if (!shiftFile[userIdToStop][dateKey]) shiftFile[userIdToStop][dateKey] = [];
                    shiftFile[userIdToStop][dateKey].push(`${hours}h ${minutes}m ${seconds}s`);
                    delete shiftFile[userIdToStop].start;
                    delete shiftUser[userIdToStop];

                    console.log('Writing shiftVehDyn:', JSON.stringify(shiftVehDyn, null, 2));
                    writeJSON(shiftDynPath, shiftVehDyn);

                    console.log('Writing shiftUser:', JSON.stringify(shiftUser, null, 2));
                    writeJSON(shiftUserPath, shiftUser);

                    console.log('Writing shiftFile:', JSON.stringify(shiftFile, null, 2));
                    writeJSON(shiftFilePath, shiftFile);

                    const embed = new EmbedBuilder()
                    .setTitle("🚨 Fin de service")
                    .setDescription(`⏳ <@${userIdToStop}> a terminé son shift après **${hours}h ${minutes}m ${seconds}s** !`)
                    .setColor('Red')
                    .setTimestamp();

                    await interaction.update({
                    embeds: [embed],
                    components: []
                    });

                    await updateVehiculeEmbed(interaction.client);

                } catch (error) {
                    console.error('Erreur dans le bouton end_shift:', error);
                    await interaction.reply({ content: '❌ Une erreur est survenue, contacte un administrateur.', ephemeral: true });
                }
                }


                module.exports = { closeTicketButton, closeTicketEmbed }

                if (interaction.customId === 'yes' || interaction.customId === 'no' || interaction.customId === 'maybe') {
                    console.log("🔵 Interaction détectée :", interaction.customId);
                
                    const clientData = globalThis.clientData[interaction.guildId];
                
                    let messageId;
                    let participants;
                
                    if (!clientData) {
                        console.log("🔴 Pas de clientData trouvé, utilisation de config !");
                        messageId = config.openservice_last_id;
                        participants = config.openservice_participants;
                    } else {
                        console.log("🟢 clientData trouvé :", clientData);
                        messageId = clientData.messageId;
                        participants = clientData.participants;
                    }
                
                    console.log("📌 ID du message enregistré :", messageId);
                    console.log("📌 ID du message de l'interaction :", interaction.message.id);
                
                    if (interaction.message.id !== messageId) {
                        console.log("🔴 Le message de l'interaction ne correspond pas !");
                        return;
                    }
                
                    console.log("🟢 Avant modification des participants :", participants);
                
                    // Mise à jour des participants
                    const username = interaction.member.nickname;
                    const category = interaction.customId;
                
                    const wasInCategory = participants[category].includes(username);
                
                    if (wasInCategory) {
                        // Si l'utilisateur était déjà dans cette catégorie, on le retire (annulation du choix)
                        participants[category] = participants[category].filter(user => user !== username);
                    } else {
                        // Sinon, on le retire des autres catégories et on l'ajoute à celle-ci
                        for (const key in participants) {
                            participants[key] = participants[key].filter(user => user !== username);
                        }
                        participants[category].push(username);
                    }
                
                    console.log("🟢 Après modification des participants :", participants);
                
                    // Création de l'embed mis à jour
                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('Qui sera présent ce soir ?')
                        .setDescription('Veuillez indiquer votre présence en appuyant sur un bouton ci-dessous.')
                        .setColor(0x00AE86)
                        .addFields(
                            { name: '✅ Oui', value: participants.yes.length ? participants.yes.map(name => `\`${name}\``).join(', ') : 'Aucun', inline: true },
                            { name: '❌ Non', value: participants.no.length ? participants.no.map(name => `\`${name}\``).join(', ') : 'Aucun', inline: true },
                            { name: '🤔 Peut-être', value: participants.maybe.length ? participants.maybe.map(name => `\`${name}\``).join(', ') : 'Aucun', inline: true }
                        );
                
                    console.log("🟢 Embed mis à jour :", updatedEmbed);
                
                    await interaction.deferUpdate();
                    await interaction.editReply({ content: "@everyone, qui sera présent ce soir ?", embeds: [updatedEmbed] });
                
                    // Mise à jour du fichier config.json
                    config.openservice_participants = {
                        yes: participants.yes,
                        no: participants.no,
                        maybe: participants.maybe
                    };
                    config.openservice_last_id = messageId;
                
                    fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 4), 'utf8');
                
                    // Gestion du thread
                    const threadName = `Présents - ${new Date().toLocaleDateString()}`;
                    let thread = interaction.message.channel.threads.cache.find(t => t.name === threadName);
                
                    if (category === 'yes') {
                        if (!thread) {
                            thread = await interaction.message.startThread({
                                name: threadName,
                                autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                            });
                        }
                        if (participants.yes.includes(username)) {
                            try {
                                await thread.members.add(interaction.user.id);
                            } catch (error) {
                                console.error("⚠️ Impossible d'ajouter l'utilisateur au thread :", error);
                            }
                        } else {
                            try {
                                await thread.members.remove(interaction.user.id);
                            } catch (error) {
                                console.error("⚠️ Impossible de retirer l'utilisateur du thread :", error);
                            }
                        }
                    } else if (wasInCategory && thread) {
                        // Retirer l'utilisateur du thread s'il était dans "Oui" et change de catégorie
                        try {
                            await thread.members.remove(interaction.user.id);
                        } catch (error) {
                            console.error("⚠️ Impossible de retirer l'utilisateur du thread :", error);
                        }
                    }
                }

                const roleMap = {
                    'role_gov': config.role.gov,
                    'role_lspd': config.role.lspd,
                    'role_lsmc': config.role.lsmc,
                    'role_doj': config.role.doj,
                    'wazel_news': config.role.wazel
                };

                const ticketConfigMap = {
                    'cmd':        { emoji: '🔰', role: config.role.cmd },
                    'dir':        { emoji: '⚔️', role: config.role.dir },
                    'ticket-mod': { emoji: '🌐', role: config.role.comm },
                    'ticket-dev': { emoji: '🌐', role: config.role.dev }
                };

                if (roleMap[interaction.customId]) {
                    const roleId = roleMap[interaction.customId];
                    const role = interaction.guild.roles.cache.get(roleId);

                    if (!role) {
                        return interaction.reply({
                            content: "Le rôle spécifié est introuvable.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const member = interaction.member;

                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role);
                        return interaction.reply({
                            content: "Votre rôle vous a été retiré.",
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await member.roles.add(role);
                        return interaction.reply({
                            content: "Votre rôle vous a été ajouté.",
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if(interaction.customId === 'rulescheck') {
                    const member = interaction.member
                    if(member.roles.cache.has('1252266446050951378')) {
                        return interaction.reply({content: 'Déjà accepté!', ephemeral:true})
                    } else {
                        await member.roles.add('1252266446050951378')
                        return interaction.reply({content: 'Accepté!', ephemeral:true})
                    }
                }
                
                const ticketConf = ticketConfigMap[interaction.customId];
                if (ticketConf) {
                    return createTicketChannel(interaction, ticketConf.emoji, ticketConf.role);
                }

                if (interaction.customId === 'recruit') {
                    await showModalForm(interaction, {
                        customId: 'recruit_modal',
                        title: 'Formulaire de Recrutement',
                        fields: [
                            { id: 'roleplay_name', label: 'Nom (Rôleplay)' },
                            { id: 'roleplay_firstname', label: 'Prénom (Rôleplay)' },
                            { id: 'roleplay_birthdate', label: 'Date de naissance (Rôleplay)' },
                            { id: 'roleplay_nationality', label: 'Nationalité (Rôleplay)' },
                            { id: 'roleplay_unit', label: "Indiquez l'unité spéciale voulue", required: false }
                        ]
                    });
                }

                if (interaction.customId === 'plainte') {
                    await showModalForm(interaction, {
                        customId: 'complaint_modal',
                        title: 'Formulaire de plainte',
                        fields: [
                            { id: 'complain_name', label: 'Nom (Plaignant)' },
                            { id: 'complain_firstname', label: 'Prénom (Plaignant)' },
                            { id: 'complain_email', label: 'Mail (Votre Discord)' },
                            { id: 'complain_date', label: 'Date de plainte' },
                            { id: 'complain_motif', label: 'Motif' }
                        ]
                    });
                }

                if (interaction.customId === 'report') {
                    await showModalForm(interaction, {
                        customId: 'report_modal',
                        title: 'Création de rapport',
                        fields: [
                            { id: 'report_name', label: 'Nom du rapport' },
                            { id: 'report_date', label: 'Date du rapport' }
                        ]
                    });
                }

                if(interaction.customId === 'close_but'){
                    interaction.channel.permissionOverwrites.set([
                        {
                            id: interaction.guild.roles.everyone, 
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        ...interaction.channel.permissionOverwrites.cache.map(overwrite => ({
                            id: overwrite.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        }))
                    ]);
                    const name = interaction.channel.name
                    interaction.channel.setName(`❌${name}`)
                    interaction.channel.setParent(config.category.archive);

            
                    ticketFile[interaction.channel.id]['delete'] = "waiting";
                    saveTicket();
                    console.log(`Ticket ID ${interaction.channel.id} a été archivé dans la console.`);
                    interaction.channel.send('# Ticket supprimé. Faites /ticket close pour le fermer définitivement.')
                    interaction.reply({ content: "Ticket supprimé !", ephemeral: true });
                }

                if (interaction.customId === 'close_def') {
                        const channel = interaction.channel;
                        const guild = interaction.guild;

                        const logChannel = guild.channels.cache.get(config.channel.log);

                        if (!logChannel || logChannel.type !== ChannelType.GuildText) {
                            console.error('⚠️ Salon de logs introuvable ou non textuel.');
                            return interaction.reply({
                                content: "⚠️ Impossible d'envoyer les logs, salon de logs non configuré.",
                                ephemeral: true
                            });
                        }

                        // Génère la transcription
                        createTranscript(channel, {
                            limit: -1,
                            returnBuffer: false,
                            fileName: `${channel.name}_transcript.html`,
                        }).then(async (attachment) => {
                            // Envoie la transcription dans le salon de logs
                            await logChannel.send({
                                content: `📁 Transcription du ticket \`${channel.name}\` fermé par <@${interaction.user.id}> :`,
                                files: [attachment],
                            });

                            // Supprime le fichier du système de tickets (si applicable)
                            delete ticketFile[channel.id];
                            saveTicket();

                            // Supprime le salon
                            await channel.delete('Ticket fermé');

                            console.notify("soft", "🗑️ [ACTION BUTTON] : Ticket supprimé avec succès.");
                        }).catch(err => {
                            console.error('Erreur lors de la génération de la transcription :', err);
                            interaction.reply({
                                content: "❌ Une erreur est survenue lors de la fermeture du ticket.",
                                ephemeral: true
                            });
                        });
                }
        
                if(interaction.customId === 'lock') {
                    if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        const userids = ticketFile[interaction.channel.id]['users']; // Tableau d'IDs utilisateur
        
                        let permissionOverwrites = [
                            {
                                id: interaction.guild.roles.everyone.id, // Bloque @everyone
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            },
                            ...userids.map(id => ({
                                id: id,
                                allow: [PermissionsBitField.Flags.ViewChannel], // Seuls les utilisateurs listés peuvent voir le channel
                                deny: [PermissionsBitField.Flags.SendMessages] // Mais ne peuvent pas envoyer de messages
                            }))
                        ];
        
                        interaction.channel.permissionOverwrites.set(permissionOverwrites);
        
                        ticketFile[interaction.channel.id]['islock'] = true
                        saveTicket()
                        console.log(`Ticket ID ${interaction.channel.id} a été vérouillé dans la console.`)
        
                        const lockedEmbedTicket = new EmbedBuilder()
                .setTitle("🔒 Ticket verrouillé !")
                .setDescription("Ce ticket a été verrouillé. Seul le personnel autorisé peut désormais y accéder.")
                .setColor("Yellow");
        
                const unlockedButtonTicket = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("unlock")
                        .setLabel("🔓 Déverrouiller le ticket")
                        .setStyle(ButtonStyle.Success)
                );
        
                        interaction.channel.send({embeds: [lockedEmbedTicket], components:[unlockedButtonTicket]})
                        console.log("[TICKET] Ticket Vérouillé")
                        // channelLog.send({embeds: [lockedEmbedTicket]})
        
                        interaction.reply({content: 'Done !', ephemeral:true}) 
                    } else {
                            interaction.reply({content:"Vous n'avez pas la permission !", ephemeral:true})
        
                    }
                }
        
                if(interaction.customId === 'unlock'){
                    if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        const userids = ticketFile[interaction.channel.id]['users']; // Tableau d'IDs utilisateur
        
                        let permissionOverwrites = [
                            {
                                id: interaction.guild.roles.everyone.id, // Bloque @everyone
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            },
                            ...userids.map(id => ({
                                id: id,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Seuls les utilisateurs listés peuvent voir le channel
                            }))
                        ];
                
                        interaction.channel.permissionOverwrites.set(permissionOverwrites);
                
                        ticketFile[interaction.channel.id]['islock'] = false
                        saveTicket()
                        console.log(`Ticket ID ${interaction.channel.id} a été dévérouillé dans la console.`)
        
        
                        const unlockedEmbedTicket = new EmbedBuilder()
                        .setTitle("🔓 Ticket déverrouillé !")
                        .setDescription("Ce ticket est à nouveau accessible. Vous pouvez continuer la conversation.")
                        .setColor("Yellow");
                    
                        interaction.channel.send({embeds: [unlockedEmbedTicket]})
                        //channelLog.send({embeds: [unlockedEmbedTicket]})
                        console.log("[TICKET] Ticket dévérouillé")
        
                        interaction.reply({content: 'Done !', ephemeral:true}) 
                    } else {
                        interaction.reply({content:"Vous n'avez pas la permission !", ephemeral:true})
        
                    }
                }
        
                if (interaction.customId === 'archive') {
                    if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        interaction.channel.permissionOverwrites.set([
                            {
                                id: interaction.guild.roles.everyone, // Bloque tout le monde
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            },
                            ...interaction.channel.permissionOverwrites.cache.map(overwrite => ({
                                id: overwrite.id,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            }))
                        ]);
                
                        interaction.channel.setParent(config.category.archive);
                        interaction.reply({ content: "Ticket archivé !", ephemeral: true });
                
                        ticketFile[interaction.channel.id]['isarchived'] = true;
                        saveTicket();
                        console.log(`Ticket ID ${interaction.channel.id} a été archivé dans la console.`);
                    } else {
                        interaction.reply({ content: "Vous n'avez pas la permission !", ephemeral: true });
                    }
                }  

                if (interaction.customId === 'view') {
                    const userId = interaction.user.id;
                    const messageId = interaction.message.id;

                    // Vérifie si le message correspond à celui enregistré pour cet utilisateur
                    if (config.message[userId] === messageId) {
                        interaction.message.delete().catch(console.error);
                        await interaction.reply({ content: 'Message marqué comme vu et supprimé ✅', ephemeral: true });
                        
                        delete config.message[userId];
                    } else {
                        await interaction.reply({ content: "Ce message ne vous est pas destiné ❌", ephemeral: true });
                    }
                }

                const guildId = interaction.guildId;

                if (interaction.customId === 'pause') {
                pause(guildId);
                await interaction.reply({ content: '⏸️ Musique en pause', ephemeral: true });
                } else if (interaction.customId === 'skip') {
                skip(guildId);
                await interaction.reply({ content: '⏭️ Morceau passé', ephemeral: true });
                } else if (interaction.customId === 'stop') {
                stop(guildId);
                await interaction.reply({ content: '⏹️ Musique arrêtée', ephemeral: true });
                }
            }
        }
    }
    console.log("L'interaction ", chalk.green('buttons.js'), chalk.reset(" ont correctement été exporté."))

} catch (err) {
    console.error("[FATAL_ERROR] Les boutons n'ont pas été exporté correctement. Le processus va s'arrêter., ", err)
    process.exit(0); // Arrête le processus du bot
};