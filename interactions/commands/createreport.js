const { closeTicketButton } = require('../buttons')
const { ChannelType, EmbedBuilder } = require('discord.js')
const config = require('../../config/config.json')

try {
    module.exports = {
        name: 'createreport',
        async execute(interaction) {
                                const name = interaction.options.getString('name')

                    const channel = await interaction.guild.channels.create({
                        name: name,
                        type: ChannelType.GuildText,
                        parent: config.category.ticket2,
                        reason: "Via commande /createreport"
                    })

                    channel.send({
                        embeds:[
                            new EmbedBuilder()
                                .setTitle(channel.name)
                                .setDescription('Bienvenue sur le rapport. Faites /ticket add ou /ticket remove pour ajouter des membres.')
                        ],
                        components:[closeTicketButton]
                    })

                    await interaction.reply(`Salon crée : <#${channel.id}>`)
        }
    }
} catch {
    return false
}