const { EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ActionRowBuilder, PermissionsBitField } = require('discord.js')
const ticketFile = require('../../config/ticket.json')
const {saveTicket} = require('../../utils/functions')
const config = require('../../config/config.json')

module.exports = {
    name: 'ticket',
    async execute(interaction) {
        if(config.plugin.ticket_plugin.avaible === true) {
            if(interaction.channel.parentId === config.category.ticket || interaction.channel.parentId === config.category.ticket2 || interaction.channel.parentId === config.category.archive) {
                if (interaction.options.getSubcommand() === 'init') {
                    console.log('🎫 Ouverture de ticket demandée !');

                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Permission refusée')
                                    .setDescription('Vous devez être administrateur pour utiliser cette commande.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    const ticketInitEmbed = new EmbedBuilder()
                        .setTitle('🎟️ Ouvrir un Ticket')
                        .setDescription('Veuillez choisir le type de ticket à ouvrir.\n⚠️ Toute utilisation abusive sera sanctionnée.')
                        .setColor('#F1C40F')
                        .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    const ticketHrpEmbed = new EmbedBuilder()
                        .setTitle('<:EquipeCom:1375185931795042356> Tickets Modération & HRP')
                        .setDescription('Ces tickets sont destinés à une utilisation hors RP (HRP).')
                        .setColor('#6A0DAD');

                    const ticketInitButton = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('cmd')
                            .setLabel('👨‍💼 Ticket Commandement')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('spv')
                            .setLabel('🏢 Ticket Supervision')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('recruit')
                            .setLabel('⛪ Ticket Recrutement')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('plainte')
                            .setLabel('🔨 Porter Plainte')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('report')
                            .setLabel('📁 Ouvrir un rapport')
                            .setStyle(ButtonStyle.Danger)
                    );

                    const ticketHrpButton = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('ticket-mod')
                            .setLabel('Ticket Modération')
                            .setEmoji('<:EquipeCom:1375185931795042356>')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('ticket-dev')
                            .setLabel('Ticket Développement')
                            .setEmoji('<:EquipeDev:1375185933288079445>')
                            .setStyle(ButtonStyle.Success)
                    );

                    await interaction.channel.send({
                        embeds: [ticketInitEmbed, ticketHrpEmbed],
                        components: [ticketInitButton, ticketHrpButton]
                    });

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#2ECC71')
                                .setDescription('✅ **Ticket initialisé avec succès !**')
                                .setTimestamp()
                        ],
                        ephemeral: true
                    });

                    console.log(`COMMANDE /ticket init exécutée par ${interaction.user.tag} 🎫`);
                }
                if (interaction.options.getSubcommand() === 'close') {
                    console.log('🛑 Fermeture de ticket demandée !');

                    const warnClosing = new EmbedBuilder()
                        .setTitle('🚨 Fermeture de Ticket')
                        .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ? 🤔\n*Cette action est irréversible.*')
                        .setColor('#8B0000')
                        .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    const warnClosingButton = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('close_def')
                            .setLabel('🔒 Fermer le ticket')
                            .setStyle(ButtonStyle.Danger)
                    );

                    await interaction.channel.send({
                        embeds: [warnClosing],
                        components: [warnClosingButton]
                    });

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#2ECC71')
                                .setDescription('✅ Confirmation demandée, merci de cliquer sur le bouton pour fermer.')
                                .setTimestamp()
                        ],
                        ephemeral: true
                    });

                    // Suppression du ticket dans le fichier
                    if (ticketFile[interaction.channel.id]) {
                        delete ticketFile[interaction.channel.id];
                        saveTicket();
                        console.log(`Ticket ${interaction.channel.id} supprimé du fichier.`);
                    } else {
                        console.log(`Aucun ticket à supprimer pour le channel ${interaction.channel.id}.`);
                    }
                }
                if (interaction.options.getSubcommand() === 'add') {
                    const channel = interaction.channel;

                    if (channel.parentId !== config.category.ticket && channel.parentId !== config.category.ticket2) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#F39C12')
                                    .setTitle('⚠️ Commande impossible')
                                    .setDescription('Cette commande ne peut être utilisée que dans un ticket.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    const user = interaction.options.getUser('user');
                    if (!user) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Utilisateur non spécifié')
                                    .setDescription('Vous devez spécifier un utilisateur à ajouter.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    try {
                        console.debug("ticket.json avant modification:", ticketFile);

                        if (!ticketFile[channel.id]) {
                            console.debug("Ticket non trouvé, création...");
                            ticketFile[channel.id] = { users: [], type: "unknown" };
                        }

                        const userIds = ticketFile[channel.id].users;

                        if (userIds.includes(user.id)) {
                            return interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('#F1C40F')
                                        .setTitle('⚠️ Utilisateur déjà présent')
                                        .setDescription(`<@${user.id}> est déjà dans ce ticket.`)
                                        .setTimestamp()
                                ],
                                ephemeral: true
                            });
                        }

                        console.debug(`Ajout de l'utilisateur ${user.id}...`);
                        userIds.push(user.id);
                        saveTicket();

                        console.debug("ticket.json après modification:", ticketFile);

                        // Permissions
                        const permissionsArray = userIds.map(uid => ({
                            id: uid,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        }));

                        permissionsArray.push({
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        });

                        await channel.permissionOverwrites.set(permissionsArray);

                        // Bouton "Vu"
                        const viewButton = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`view_${user.id}`)
                                .setLabel('✅ Vu')
                                .setStyle(ButtonStyle.Success)
                        );

                        try {
                            user.send({
                                content: `<@${user.id}>, vous avez été ajouté au ticket <#${channel.id}>.`,
                                components: [viewButton]
                            }).catch(err => {
                                console.error("❌ Erreur lors de l'envoi du message privé :", err);
                            })
                        } catch (err) {
                            const ticketNotifChannel = interaction.guild.channels.cache.get(config.channel.ticket);
                            if (ticketNotifChannel) {
                                await ticketNotifChannel.send({
                                    content: `<@${user.id}>, vous avez été ajouté au ticket <#${channel.id}>.`,
                                    components: [viewButton]
                                });
                            }
                        }

                        const addedEmbed = new EmbedBuilder()
                            .setColor('#2ECC71')
                            .setTitle('📩 Utilisateur ajouté')
                            .setDescription(`<@${user.id}> a été ajouté au ticket par <@${interaction.user.id}>.`)
                            .setTimestamp();

                        await channel.send({ embeds: [addedEmbed] });
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#27AE60')
                                    .setDescription(`✅ Utilisateur **${user.tag}** ajouté au ticket avec succès !`)
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });

                    } catch (err) {
                        console.error("❌ Erreur lors de la mise à jour du ticket :", err);
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Erreur')
                                    .setDescription('Une erreur est survenue lors de l\'ajout de l\'utilisateur. Veuillez vérifier les logs.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                }
                if (interaction.options.getSubcommand() === 'remove') {
                    const channel = interaction.channel;

                    if (channel.parentId !== config.category.ticket && channel.parentId !== config.category.ticket2) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#F39C12')
                                    .setTitle('⚠️ Commande impossible')
                                    .setDescription('Cette commande ne peut être utilisée que dans un ticket.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    const user = interaction.options.getUser('user');
                    if (!user) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Utilisateur non spécifié')
                                    .setDescription('Vous devez spécifier un utilisateur à retirer.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    try {
                        console.debug("ticket.json avant modification:", ticketFile);

                        if (!ticketFile[channel.id]) {
                            console.debug("Ticket non trouvé, création...");
                            ticketFile[channel.id] = { users: [], type: "unknown" };
                        }

                        const userIds = ticketFile[channel.id].users;

                        if (!userIds.includes(user.id)) {
                            return interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('#F1C40F')
                                        .setTitle('⚠️ Utilisateur non présent')
                                        .setDescription(`<@${user.id}> n'est pas dans ce ticket.`)
                                        .setTimestamp()
                                ],
                                ephemeral: true
                            });
                        }

                        console.debug(`Suppression de l'utilisateur ${user.id}...`);
                        ticketFile[channel.id].users = userIds.filter(id => id !== user.id);
                        saveTicket();

                        console.debug("ticket.json après modification:", ticketFile);

                        const permissionsArray = ticketFile[channel.id].users.map(uid => ({
                            id: uid,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        }));

                        permissionsArray.push({
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        });

                        await channel.permissionOverwrites.set(permissionsArray);

                        const removedEmbed = new EmbedBuilder()
                            .setColor('#CC2E3A')
                            .setTitle('📩 Utilisateur retiré')
                            .setDescription(`<@${user.id}> a été retiré du ticket par <@${interaction.user.id}>.`)
                            .setTimestamp();

                        await channel.send({ embeds: [removedEmbed] });

                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setDescription(`✅ Utilisateur **${user.tag}** retiré du ticket avec succès !`)
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });

                    } catch (err) {
                        console.error("❌ Erreur lors de la mise à jour du ticket :", err);
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Erreur')
                                    .setDescription('Une erreur est survenue lors du retrait de l\'utilisateur. Veuillez vérifier les logs.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                }
                if (interaction.options.getSubcommand() === 'lock') {
                    const ticketChannelId = interaction.channel.id;

                    if (!ticketFile[ticketChannelId]) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('⚠️ Erreur')
                                    .setDescription('❌ Aucune information trouvée pour ce ticket.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    if (ticketFile[ticketChannelId]['islock'] === true) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#F1C40F')
                                    .setTitle('⚠️ Attention')
                                    .setDescription('🔒 Ce ticket est déjà verrouillé.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    const userIds = ticketFile[ticketChannelId]['users'];

                    const permissionOverwrites = [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        ...userIds.map(id => ({
                            id: id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages]
                        }))
                    ];

                    try {
                        await interaction.channel.permissionOverwrites.set(permissionOverwrites);

                        ticketFile[ticketChannelId]['islock'] = true;
                        saveTicket();

                        const lockedEmbed = new EmbedBuilder()
                            .setColor('#E74C3C')
                            .setTitle('🔒 Ticket verrouillé')
                            .setDescription(`Le ticket a été **verrouillé** avec succès par ${interaction.user}.`)
                            .setTimestamp()
                            .setFooter({ text: 'Gestion des tickets' });

                        const unlockButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('unlock')
                                    .setLabel('Déverrouiller le ticket')
                                    .setStyle(ButtonStyle.Success)
                                    .setEmoji('🔓')
                            );

                        await interaction.channel.send({ embeds: [lockedEmbed], components: [unlockButton] });

                        console.log(`[TICKET] Ticket ID ${ticketChannelId} verrouillé par ${interaction.user.tag}`);

                        return interaction.reply({ content: '✅ Le ticket a été verrouillé avec succès !', ephemeral: true });
                    } catch (error) {
                        console.error(`[TICKET] Erreur lors du verrouillage du ticket ${ticketChannelId}:`, error);
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Erreur')
                                    .setDescription('Une erreur est survenue lors du verrouillage du ticket. Veuillez réessayer plus tard.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                }
                if (interaction.options.getSubcommand() === 'unlock') {
                    const ticketChannelId = interaction.channel.id;

                    if (!ticketFile[ticketChannelId]) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('⚠️ Erreur')
                                    .setDescription('❌ Aucune information trouvée pour ce ticket.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    if (ticketFile[ticketChannelId]['islock'] === false) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#F1C40F')
                                    .setTitle('⚠️ Attention')
                                    .setDescription('🔓 Ce ticket n\'est pas verrouillé.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    const userIds = ticketFile[ticketChannelId]['users'];

                    const permissionOverwrites = [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        ...userIds.map(id => ({
                            id: id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        }))
                    ];

                    try {
                        await interaction.channel.permissionOverwrites.set(permissionOverwrites);

                        ticketFile[ticketChannelId]['islock'] = false;
                        saveTicket();

                        const unlockedEmbed = new EmbedBuilder()
                            .setColor('#2ECC71')
                            .setTitle('🔓 Ticket déverrouillé')
                            .setDescription(`Le ticket a été **déverrouillé** avec succès par ${interaction.user}.`)
                            .setTimestamp()
                            .setFooter({ text: 'Gestion des tickets' });

                        await interaction.channel.send({ embeds: [unlockedEmbed], components: [] });

                        console.log(`[TICKET] Ticket ID ${ticketChannelId} déverrouillé par ${interaction.user.tag}`);

                        return interaction.reply({ content: '✅ Le ticket a été déverrouillé avec succès !', ephemeral: true });
                    } catch (error) {
                        console.error(`[TICKET] Erreur lors du déverrouillage du ticket ${ticketChannelId}:`, error);
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Erreur')
                                    .setDescription('Une erreur est survenue lors du déverrouillage du ticket. Veuillez réessayer plus tard.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                }
                if (interaction.options.getSubcommand() === 'info') {
                    const ticketChannelId = interaction.channel.id;

                    if (!ticketFile[ticketChannelId]) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('⚠️ Erreur')
                                    .setDescription('❌ Aucune information trouvée pour ce ticket.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    const ticketData = ticketFile[ticketChannelId];
                    const userMentions = ticketData.users.length > 0 ? ticketData.users.map(id => `<@${id}>`).join(', ') : 'Aucun utilisateur';
                    
                    const infoEmbed = new EmbedBuilder()
                        .setTitle(`📌 Informations sur le Ticket n°${ticketData.nb}`)
                        .setColor('#0099ff')
                        .setDescription(
                            `👥 **Utilisateurs présents :** ${userMentions}\n` +
                            `🆔 **Numéro du ticket :** ${ticketData.nb}\n` +
                            `👤 **Auteur du ticket :** <@${ticketData.auth}>\n` +
                            `📌 **Nom du ticket :** ${ticketData.ticketname}\n` +
                            `📂 **Type du ticket :** ${ticketData.type}\n` +
                            `🔒 **Verrouillé :** ${ticketData.islock ? "✅ Oui" : "❌ Non"}\n` +
                            `📦 **Archivé :** ${ticketData.isarchived ? "✅ Oui" : "❌ Non"}`
                        )
                        .setTimestamp()
                        .setFooter({ text: `Informations demandées par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

                    return interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                }
                if (interaction.options.getSubcommand() === 'archive') {
                    try {
                        // Bloquer la vue pour tout le monde, sauf overrides déjà présents (mais avec ViewChannel denied)
                        const newOverwrites = [
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            },
                            ...interaction.channel.permissionOverwrites.cache.map(ow => ({
                                id: ow.id,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            }))
                        ];

                        await interaction.channel.permissionOverwrites.set(newOverwrites);
                        await interaction.channel.setParent(config.category.archive);

                        ticketFile[interaction.channel.id]['isarchived'] = true;
                        saveTicket();

                        const archiveEmbed = new EmbedBuilder()
                            .setColor('#8E44AD')
                            .setTitle('📦 Ticket archivé')
                            .setDescription(`Le ticket a été archivé avec succès par ${interaction.user}.`)
                            .setTimestamp()
                            .setFooter({ text: 'Gestion des tickets' });

                        await interaction.reply({ embeds: [archiveEmbed], ephemeral: true });
                        console.log(`[TICKET] Ticket ID ${interaction.channel.id} archivé par ${interaction.user.tag}`);
                    } catch (error) {
                        console.error(`[TICKET] Erreur lors de l'archivage du ticket ${interaction.channel.id}:`, error);
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Erreur')
                                    .setDescription('Une erreur est survenue lors de l\'archivage du ticket. Veuillez réessayer plus tard.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                }
                if (interaction.options.getSubcommand() === 'rename') {
                    const newName = interaction.options.getString('str');

                    if (!newName || newName.length < 2 || newName.length > 100) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#F1C40F')
                                    .setTitle('⚠️ Nom invalide')
                                    .setDescription('Le nom doit contenir entre 2 et 100 caractères.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }

                    try {
                        await interaction.channel.setName(newName);
                        ticketFile[interaction.channel.id]['ticketname'] = newName;
                        saveTicket();

                        const renameEmbed = new EmbedBuilder()
                            .setColor('#27AE60')
                            .setTitle('✏️ Ticket renommé')
                            .setDescription(`Le salon a été renommé en **${newName}** par ${interaction.user}.`)
                            .setTimestamp()
                            .setFooter({ text: 'Gestion des tickets' });

                        return interaction.reply({ embeds: [renameEmbed], ephemeral: true });
                    } catch (err) {
                        console.error(`[TICKET] Erreur lors du renommage du salon ${interaction.channel.id}:`, err);
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#E74C3C')
                                    .setTitle('❌ Erreur')
                                    .setDescription('Impossible de renommer le salon. Assurez-vous que j\'ai les permissions nécessaires.')
                                    .setTimestamp()
                            ],
                            ephemeral: true
                        });
                    }
                }
            } else {
                interaction.reply({content: 'Mauvais salon', ephemeral: true})
                console.error('Mauvais salon')
            }
        } else {
            console.err("Plugin désactivé")
            interaction.reply({content:"Plugin désactivé", ephemeral: true})
        }
    }
}            