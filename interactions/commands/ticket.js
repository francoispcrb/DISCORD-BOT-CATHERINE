const { EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ActionRowBuilder, PermissionsBitField } = require('discord.js')
const ticketFile = require('../../config/ticket.json')
const {saveTicket} = require('../../utils/functions')
const config = require('../../config/config.json')

module.exports = {
    name: 'ticket',
    async execute(interaction) {
        if(config.plugin.ticket_plugin.avaible === true) {
            if(interaction.channel.parentId === config.category.ticket || interaction.channel.parentId === config.category.ticket2 || interaction.channel.parentId === config.category.archive) {
                if(interaction.options.getSubcommand() === 'init') {
                    console.log('🎫 Ouverture de ticket demandée !');
                    if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        const ticketInitEmbed = new EmbedBuilder()
                            .setTitle("🎟️ Ouvrir un Ticket")
                            .setDescription("Veuillez choisir le type de ticket à ouvrir. ⚠️ Toute utilisation abusive sera sanctionnée.")
                            .setColor("Yellow");
                    
                        const tickethrpEmbed = new EmbedBuilder()
                            .setTitle('<:EquipeCom:1375185931795042356> Ouvrir un Ticket Modération')
                            .setDescription("Veuillez choisir le type de ticket à ouvrir. ⚠️ Toute utilisation abusive sera sanctionnée. Ces tickets sont destinés à une utilisation HRP.")
                            .setColor('DarkPurple')
                        const ticketInitButton = new ActionRowBuilder()
                            .addComponents(
                            new ButtonBuilder()
                                .setCustomId('cmd')
                                .setLabel('👨‍💼 Ticket Commandement')
                                .setStyle(ButtonStyle.Primary)
                            )
                            .addComponents(
                            new ButtonBuilder()
                                .setCustomId('dir')
                                .setLabel('🏢 Ticket Direction')
                                .setStyle(ButtonStyle.Primary)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId('recruit')
                                .setLabel('⛪ Ticket Recrutement')
                                .setStyle(ButtonStyle.Primary)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('plainte')
                                    .setLabel('🔨 Porter Plainte')
                                    .setStyle(ButtonStyle.Danger)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('report')
                                    .setLabel('📁 Ouvrir un rapport')
                                    .setStyle(ButtonStyle.Danger)
                            )
                        
                        const ticketHrpButton = new ActionRowBuilder()
                            .addComponents(new ButtonBuilder()
                                .setEmoji('<:EquipeCom:1375185931795042356>')
                                .setLabel('Ticket Modération')
                                .setCustomId('ticket-mod')
                                .setStyle(ButtonStyle.Success))
                            .addComponents(new ButtonBuilder()
                                .setEmoji('<:EquipeDev:1375185933288079445>')
                                .setLabel('Ticket Développement')
                                .setCustomId('ticket-dev')
                                .setStyle(ButtonStyle.Success))
                        
                      interaction.channel.send({
                        embeds: [ticketInitEmbed, tickethrpEmbed],
                        components: [ticketInitButton, ticketHrpButton]
                      });
                  
                      interaction.reply({
                        content: "✅ Ticket initialisé !", 
                        ephemeral: true
                      });
                  
                      console.log(`COMMANDE Un /ticket (init) a été exécuté par ${interaction.user.displayName} 🎫`);
                    } else return interaction.reply({
                        content: ":x: Manque de permission",
                        flags: MessageFlags.Ephemeral
                    })
                
                }
                if(interaction.options.getSubcommand() === 'close') {
                    console.log('🛑 Fermeture de ticket demandée !');
                    const warnClosing = new EmbedBuilder()
                      .setTitle("🚨 Fermeture de Ticket")
                      .setDescription("Êtes-vous sûr de vouloir fermer ce ticket ? 🤔")
                      .setColor('DarkRed');
                    
                    const warnClosingB = new ActionRowBuilder()
                      .addComponents(
                        new ButtonBuilder()
                          .setCustomId('close_def')
                          .setLabel("🔒 Fermer le ticket")
                          .setStyle(ButtonStyle.Danger)
                      );
                  
                    interaction.channel.send({
                      embeds: [warnClosing], 
                      components: [warnClosingB]
                    });
                    
                    interaction.reply({
                      content: "✅ Action effectuée !", 
                      ephemeral: true
                    });
                    
                    delete ticketFile[interaction.channel.id];
                    saveTicket();
                
                }
                if (interaction.options.getSubcommand() === 'add') {
                    const channel = interaction.channel;

                    if (channel.parentId === config.category.ticket || channel.parentId === config.category.ticket2) {
                        const user = interaction.options.getUser('user');

                        if (!user) {
                            return interaction.reply({ content: "❌ Utilisateur non spécifié.", ephemeral: true });
                        }

                        try {
                            console.debug("ticket.json avant modification:", ticketFile);

                            if (!ticketFile[channel.id]) {
                                console.debug("Ticket non trouvé, création...");
                                ticketFile[channel.id] = { users: [], type: "unknown" };
                            }

                            const userIds = ticketFile[channel.id].users;

                            if (!userIds.includes(user.id)) {
                                console.debug(`Ajout de l'utilisateur ${user.id}...`);
                                userIds.push(user.id);
                                saveTicket();
                            } else {
                                console.debug(`L'utilisateur ${user.id} est déjà dans le ticket.`);
                            }

                            console.debug("ticket.json après modification:", ticketFile);

                            // Générer les permissions
                            const permissionsArray = userIds.map(uid => ({
                                id: uid,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.ReadMessageHistory
                                ]
                            }));

                            // Interdire l'accès à @everyone
                            permissionsArray.push({
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            });

                            await channel.permissionOverwrites.set(permissionsArray);

                            // // Créer bouton
                            const viewButton = new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`view_${user.id}`)
                                    .setLabel('✅ Vu')
                                    .setStyle(ButtonStyle.Success)
                            );

                            const ticketNotifChannel = interaction.guild.channels.cache.get(config.channel.ticket);
                            if (ticketNotifChannel) {
                                ticketNotifChannel.send({
                                    content: `<@${user.id}>, vous avez été ajouté au channel <#${channel.id}>`,
                                    components: [viewButton]
                                });
                            }
                            const addedEmbed = new EmbedBuilder()
                                .setColor(0x2ECC71)
                                .setDescription(`📩 <@${user.id}> a été ajouté au ticket par <@${interaction.user.id}>.`)
                                .setTimestamp();

                            await channel.send({ embeds: [addedEmbed] });

                            await interaction.reply({ content: `✅ Utilisateur **${user.tag}** ajouté au ticket.`, ephemeral: true });

                        } catch (err) {
                            console.error("❌ Erreur lors de la mise à jour du ticket :", err);
                            console.error("❌ Stack trace :", err?.stack || err);
                            interaction.reply({ content: "❌ Une erreur est survenue, vérifiez les logs.", ephemeral: true });
                        }
                    } else {
                        interaction.reply({ content: "⚠️ Cette commande ne peut être utilisée que dans un ticket.", ephemeral: true });
                    }
                }
                if (interaction.options.getSubcommand() === 'remove') {
                    if (interaction.channel.parentId === config.category.ticket || interaction.channel.parentId === config.category.ticket2) {
                        const user = interaction.options.getUser('user');
                    
                        if (user) {
                            try {
                                console.debug("ticket.json avant modification:", ticketFile);
                            
                                if (!ticketFile[interaction.channel.id]) {
                                    console.debug("Ticket non trouvé, création...");
                                    ticketFile[interaction.channel.id] = { users: [], type: "unknown" };
                                }
                            
                                const userids = ticketFile[interaction.channel.id].users;
                            
                                if (userids.includes(user.id)) {
                                    console.debug(`Suppression de l'utilisateur ${user.id}...`);
                                    ticketFile[interaction.channel.id].users = userids.filter(id => id !== user.id);
                                    saveTicket();
                                } else {
                                    console.debug(`L'utilisateur ${user.id} n'est pas dans le ticket.`);
                                }
                            
                                console.debug("ticket.json après modification:", ticketFile);
                            
                                let permissionsArray = ticketFile[interaction.channel.id].users.map(uid => ({
                                    id: uid,
                                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                                }));
                            
                                permissionsArray.push({
                                    id: interaction.guild.roles.everyone,
                                    deny: [PermissionsBitField.Flags.ViewChannel]
                                });
                            
                                interaction.channel.permissionOverwrites.set(permissionsArray);
                            
                                const addedEmbed = new EmbedBuilder()
                                    .setColor(0xCC2E3A)
                                    .setDescription(`📩 <@${user.id}> a été retiré au ticket par <@${interaction.user.id}>.`)
                                    .setTimestamp();

                                await interaction.channel.send({ embeds: [addedEmbed] });

                                interaction.reply({ content: `Utilisateur ${user.tag} retiré du ticket.`, ephemeral: true });
                            
                            } catch (err) {
                                console.error("Erreur lors de la mise à jour du fichier ticket.json :", err);
                                                            console.error("❌ Stack trace :", err?.stack || err);
                                interaction.reply({ content: "Erreur lors de la mise à jour du ticket. Vérifiez les logs.", ephemeral: true });
                            }
                        }
                    } else {
                        interaction.reply({ content: "⚠️ Veuillez effectuer la commande dans un ticket.", ephemeral: true });
                    }
                }
                if (interaction.options.getSubcommand() === 'lock') {
                    const ticketChannelId = interaction.channel.id;
                    if (!ticketFile[ticketChannelId]) {
                        return interaction.reply({ content: "⚠️ Aucune information trouvée pour ce ticket.", ephemeral: true });
                    }
                
                    const userids = ticketFile[ticketChannelId]['users'];
                    let permissionOverwrites = [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        ...userids.map(id => ({
                            id: id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages]
                        }))
                    ];
                    
                    interaction.channel.permissionOverwrites.set(permissionOverwrites);
                    ticketFile[ticketChannelId]['islock'] = true;
                    saveTicket();
                
                    const lockedEmbedTicket = new EmbedBuilder()
                                    .setColor(0xCC2E3A)
                                    .setDescription(`📩 Le ticket a été vérouillé par <@${interaction.user.id}>.`)
                                    .setTimestamp();
                    
                    const unlockButton = new ActionRowBuilder()
                        .addComponents(new ButtonBuilder()
                            .setCustomId('unlock')
                            .setLabel('Déverrouiller le ticket')
                            .setStyle(ButtonStyle.Success));
                
                    interaction.channel.send({ embeds: [lockedEmbedTicket], components: [unlockButton] });
                    console.log(`[TICKET] Ticket ID ${interaction.channel.id} verrouillé.`);
                
                    return interaction.reply({ content: '✅ Le ticket a été verrouillé avec succès !', ephemeral: true });
                }
                if (interaction.options.getSubcommand() === 'unlock') {
                    const ticketChannelId = interaction.channel.id;
                    if (!ticketFile[ticketChannelId]) {
                        return interaction.reply({ content: "⚠️ Aucune information trouvée pour ce ticket.", ephemeral: true });
                    }
                
                    if(ticketFile[ticketChannelId]['islock'] === false) {
                        return interaction.reply({ content: "⚠️ Le ticket n'est pas verrouillé.", ephemeral: true });
                    }

                    const userids = ticketFile[ticketChannelId]['users'];
                    let permissionOverwrites = [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        ...userids.map(id => ({
                            id: id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        }))
                    ];
                    
                    interaction.channel.permissionOverwrites.set(permissionOverwrites);
                    ticketFile[ticketChannelId]['islock'] = false;
                    saveTicket();
                
                    const unlockedEmbedTicket = new EmbedBuilder()
                                    .setColor(0x2ECC71)
                                    .setDescription(`📩 Le ticket a été dévérouillé par <@${interaction.user.id}>.`)
                                    .setTimestamp();
                
                    interaction.channel.send({ embeds: [unlockedEmbedTicket] });
                    console.log(`[TICKET] Ticket ID ${interaction.channel.id} déverrouillé.`);
                
                    return interaction.reply({ content: '✅ Le ticket a été déverrouillé avec succès !', ephemeral: true });                                
                }
                if (interaction.options.getSubcommand() === 'info') {
                    const ticketChannelId = interaction.channel.id;
                    if (!ticketFile[ticketChannelId]) {
                        return interaction.reply({ content: "⚠️ Aucune information trouvée pour ce ticket.", ephemeral: true });
                    }
                
                    const ticketData = ticketFile[ticketChannelId];
                    const userMentions = ticketData.users.map(id => `<@${id}>`).join(', ') || "Aucun utilisateur";
                    const ticketAuthTb = interaction.channel.name.split('-');
                
                    const embed = new EmbedBuilder()
                        .setTitle(`📌 Information sur le Ticket n°${ticketData.nb}`)
                        .setDescription(
                            `👥 **Utilisateurs présents :** ${userMentions}` +
                            `\n🆔 **Numéro du ticket :** ${ticketData.nb}` +
                            `\n👤 **Auteur du ticket :** ${ticketData.auth}` +
                            `\n📌 **Nom du ticket :** ${ticketData.ticketname}` +
                            `\n📂 **Type du ticket :** ${ticketData.type}` +
                            `\n🔒 **Verrouillé :** ${ticketData.islock ? "Oui" : "Non"}`
                        )
                        .setColor("#00AE86");
                    interaction.reply({ embeds: [embed] });
                }
                if (interaction.options.getSubcommand() === 'archive') {
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
                }
                if (interaction.options.getSubcommand() === 'rename') {
                    const newName = interaction.options.getString('str');
                    try {
                        await interaction.channel.setName(newName);
                        ticketFile[interaction.channel.id]['ticketname'] = newName;
                        interaction.reply({ content: `✅ Salon renommé en **${newName}** !`, ephemeral: true });
                    } catch (err) {
                        console.error("Erreur lors du renommage du salon.", err);
                        interaction.reply({ content: "❌ Impossible de renommer le salon.", ephemeral: true });
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