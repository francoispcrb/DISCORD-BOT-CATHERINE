const Discord = require('discord.js')
const intents = new Discord.IntentsBitField(53608447)
const chalk = require("chalk");
const fs = require('fs')
const Client = new Discord.Client({intents})
const PDFDocument = require('pdfkit')

if (!globalThis.clientData) {
    globalThis.clientData = {}; // Initialise un objet global
}
const config     = require('../config/config.json')
const shiftFile  = require('../config/shift.json')
const ticketFile = require('../config/ticket.json')
const warnFile   = require("../config/warn.json")
const muteFile   = require("../config/muted.json")
const kickFile   = require("../config/kick.json")
const banFile    = require("../config/ban.json")
const indicatifFile = require('../config/indicatif.json')

const { EmbedBuilder } = require('discord.js')
const { ActionRowBuilder } = require('discord.js')
const { ButtonBuilder, ButtonStyle } = require('discord.js')
const { PermissionsBitField } = require('discord.js')
const { ThreadAutoArchiveDuration } = require('discord.js')
const { ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js')
const { ActivityType } = require('discord.js')

const { saveBan, saveConfig, saveKick, saveMute, saveShift, saveTicket, saveWarn } = require('../utils/functions')
const { RANKS, CORPS, commands } = require('../utils/utils')
const { sendLog } = require('..');

var nbTicket = config.plugin.ticket_plugin.var

try {
    module.exports = {
        name: 'interactionCreate',
        async executeModal(interaction) {

            if (interaction.isModalSubmit()) {
                const { user, customId, guild, member } = interaction;

                const createTicketChannel = async (name, type) => {
                    console.log("📂 Création du salon en cours...");
                    return await guild.channels.create({
                        name,
                        type: ChannelType.GuildText,
                        parent: config.category.ticket2,
                        permissionOverwrites: [
                            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                            { id: config.role.spv ?? "", allow: [PermissionsBitField.Flags.ViewChannel] },
                            { id: config.role.cpl ?? "", allow: [PermissionsBitField.Flags.ViewChannel] },
                            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }
                        ].filter(p => p.id) // évite un ID vide si spv est non défini
                    });
                };

                const saveTicketData = (channelId, name) => {
                    nbTicket++;
                    config.plugin.ticket_plugin.var = nbTicket;
                    saveConfig();
                    ticketFile[channelId] = {
                        users: [user.id],
                        type: customId,
                        ticketname: name,
                        islock: false,
                        isarchived: false,
                        nb: nbTicket
                    };
                    saveTicket();
                };

                const sendTicketMessage = async (channel, embeds) => {
                    const buttons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('close_but').setLabel("Fermer le ticket").setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('lock').setLabel("Vérouiller le ticket").setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('archive').setLabel("Archiver le ticket").setStyle(ButtonStyle.Success)
                    );
                    await channel.send({ embeds, components: [buttons] });
                };

                const baseWelcomeEmbed = (color) =>
                    new EmbedBuilder()
                        .setTitle(`Bienvenue dans votre ticket ${user.tag} !`)
                        .setDescription(`Ci-dessous des boutons vous permettant de contrôler le ticket ! À votre service <@${user.id}> !`)
                        .setColor(color);

                try {
                    console.log(`📩 Formulaire soumis : ${customId} par ${user.tag}`);

                    if (!config.category.ticket2) {
                        console.error("❌ La catégorie des tickets n'est pas définie !");
                        return interaction.reply({ content: "❌ Erreur interne : catégorie de ticket manquante.", ephemeral: true });
                    }

                    if (customId === 'recruit_modal') {
                        const name = interaction.fields.getTextInputValue('roleplay_name');
                        const firstName = interaction.fields.getTextInputValue('roleplay_firstname');
                        const birthDate = interaction.fields.getTextInputValue('roleplay_birthdate');
                        const nationality = interaction.fields.getTextInputValue('roleplay_nationality');
                        const specialUnit = interaction.fields.getTextInputValue('roleplay_unit');

                        console.log("✅ Données reçues :", { name, firstName, birthDate, nationality });

                        const channel = await createTicketChannel(`👥recruit-${member.nickname}`, 'recruit');
                        saveTicketData(channel.id, channel.name);

                        const recruitEmbed = new EmbedBuilder()
                            .setTitle("Nouvelle Candidature 📩")
                            .setColor("Blue")
                            .addFields(
                                { name: "👤 Nom", value: name, inline: true },
                                { name: "📝 Prénom", value: firstName, inline: true },
                                { name: "📅 Date de naissance", value: birthDate, inline: false },
                                { name: "🌍 Nationalité", value: nationality, inline: false },
                                { name: "📌 Candidat", value: `<@${user.id}>`, inline: false },
                                { name: "📚 Unité spéciale désirée", value: specialUnit || "Aucune unité spécifiée.", inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: "Système de recrutement", iconURL: user.displayAvatarURL() });

                        const specialWarning = new EmbedBuilder()
                            .setTitle(`⚠️ Attention ${user.tag}`)
                            .setColor('Yellow')
                            .setDescription(`Si vous avez renseigné une unité spéciale, vous devrez répondre à des **conditions spécifiques**. Une admission dans cette unité dépend de la **décision du Commandant** de cette unité.`);

                        const PDFDocument = require('pdfkit');
                        const fs = require('fs');
                        const path = require('path');
                        // Créer le chemin vers le dossier
                        const pdfFolderPath = path.resolve(__dirname, '../submit/discord');
                        if (!fs.existsSync(pdfFolderPath)) {
                            fs.mkdirSync(pdfFolderPath, { recursive: true });
                        }
                        const fileName = `recruit_${user.id}_${Date.now()}.pdf`;
                        const filePath = path.join(pdfFolderPath, fileName);
                        // Créer le PDF
                        const doc = new PDFDocument();
                        doc.pipe(fs.createWriteStream(filePath));
                        doc.font('Helvetica-Bold').fontSize(16).text('Candidature Recrutement', { align: 'center' });
                        doc.fontSize(20).text('📩 Nouvelle Candidature', { align: 'center' });
                        doc.moveDown();
                        doc.fontSize(12).text(`👤 Nom : ${name}`);
                        doc.text(`📝 Prénom : ${firstName}`);
                        doc.text(`📅 Date de naissance : ${birthDate}`);
                        doc.text(`🌍 Nationalité : ${nationality}`);
                        doc.text(`📌 Candidat : ${user.tag} (${user.id})`);
                        doc.text(`📚 Unité spéciale désirée : ${specialUnit || "Aucune"}`);
                        doc.end();
                        console.log(`📄 PDF créé : ${filePath}`);

                        doc.on('finish', async () => {
                            const recruitChannel = interaction.guild.channels.cache.get(config.channel.RECRUIT_CHANNEL);
                            if (recruitChannel) {
                                await recruitChannel.send({
                                    content: `📄 Nouvelle candidature reçue de <@${user.id}>`,
                                    files: [filePath]
                                });
                            }
                        });

                        const embeds = specialUnit.trim() ? [recruitEmbed, baseWelcomeEmbed("DarkButNotBlack"), specialWarning] : [recruitEmbed, baseWelcomeEmbed("DarkButNotBlack")];

                        await sendTicketMessage(channel, embeds);
                        await interaction.reply({ content: `✅ Votre candidature a été envoyée ! Ticket : <#${channel.id}>`, ephemeral: true });
                    }

                    if (customId === 'complaint_modal') {
                        const name = interaction.fields.getTextInputValue('complain_name');
                        const firstName = interaction.fields.getTextInputValue('complain_firstname');
                        const email = interaction.fields.getTextInputValue('complain_email');
                        const date = interaction.fields.getTextInputValue('complain_date');
                        const motif = interaction.fields.getTextInputValue('complain_motif');

                        console.log("✅ Données reçues :", { name, firstName, email, date, motif });

                        const channel = await createTicketChannel(`📜plainte-${member.nickname}`, 'complaint');
                        saveTicketData(channel.id, channel.name);

                        const complaintEmbed = new EmbedBuilder()
                            .setTitle("Nouvelle plainte 📩")
                            .setColor("Blue")
                            .addFields(
                                { name: "👤 Nom", value: name, inline: true },
                                { name: "📝 Prénom", value: firstName, inline: true },
                                { name: "📧 Email", value: email, inline: false },
                                { name: "📅 Date", value: date, inline: false },
                                { name: "📌 Plaignant", value: `<@${user.id}>`, inline: false },
                                { name: "📚 Motif", value: motif || "Aucun motif renseigné.", inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: "Système de gestion", iconURL: user.displayAvatarURL() });

                        await sendTicketMessage(channel, [complaintEmbed, baseWelcomeEmbed("Red")]);
                        await interaction.reply({ content: `✅ Votre plainte a été envoyée ! Ticket : <#${channel.id}>`, ephemeral: true });
                    }

                    if (customId === 'report_modal') {
                        const name = interaction.fields.getTextInputValue('report_name');
                        const date = interaction.fields.getTextInputValue('report_date');

                        console.log("✅ Données reçues :", { name, date });

                        const channel = await createTicketChannel(`📁report-${name}-${date}`, 'report');
                        saveTicketData(channel.id, channel.name);

                        const reportEmbed = new EmbedBuilder()
                            .setTitle("Nouveau rapport 📩")
                            .setColor("Blue")
                            .setDescription("Faites `/ticket add|remove|info|rename` pour modifier ce rapport.")
                            .addFields(
                                { name: "📜 Nom", value: name, inline: true },
                                { name: "📝 Date", value: date, inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: "Système de gestion", iconURL: user.displayAvatarURL() });

                        await sendTicketMessage(channel, [reportEmbed, baseWelcomeEmbed("Red")]);
                        await interaction.reply({ content: `✅ Votre rapport a été envoyé ! Ticket : <#${channel.id}>`, ephemeral: true });
                    }

                } catch (err) {
                    console.error("❌ Erreur lors du traitement du formulaire :", err);
                    await interaction.reply({ content: "❌ Une erreur est survenue lors de la création du ticket.", ephemeral: true });
                }
            }

        }
    }
    console.log("L'interaction ", chalk.green('modals.js'), chalk.reset(" ont correctement été exporté."))

} catch (err) {
    console.error("[FATAL_ERROR] Les modals n'ont pas été exporté correctement. Le processus va s'arrêter., ", err)
    console.notify('hot', 'FATAL ERROR IN PROCESS, TYPING process.exit(0).')
    process.exit(0); // Arrête le processus du bot
}