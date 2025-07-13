const { PermissionsBitField } = require('discord.js')

const { saveMute } = require('../../utils/functions')


module.exports = {
    name: 'mute',
    async execute(interaction) {
        const executor = interaction.member
        const user = interaction.options.getUser('user')
        const reason = interaction.options.getString('reason')
        const duration = interaction.options.getString('temps')

        // Récupérer le membre dans le serveur
        const memberToMute = await interaction.guild.members.fetch(user.id).catch(() => null)

        if (!memberToMute) {
            return interaction.reply({ content: "L'utilisateur n'est pas sur le serveur.", ephemeral: true })
        }

        if (memberToMute.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "Vous ne pouvez pas mute un administrateur.", ephemeral: true })
        }

        if (executor.roles.highest.position <= memberToMute.roles.highest.position) {
            return interaction.reply({ content: "Vous ne pouvez pas mute un membre de rang égal ou supérieur au vôtre.", ephemeral: true })
        }

        // Parse durée
        const timeRegex = /^(\d+)([smhd])$/
        const match = duration.match(timeRegex)
        if (!match) {
            return interaction.reply({ content: "Format de durée invalide ! Utilisez `10m`, `1h`, `1d`.", ephemeral: true })
        }

        const timeValue = parseInt(match[1])
        const timeUnit = match[2]
        let timeoutDuration

        switch (timeUnit) {
            case 's': timeoutDuration = timeValue * 1000; break
            case 'm': timeoutDuration = timeValue * 60 * 1000; break
            case 'h': timeoutDuration = timeValue * 60 * 60 * 1000; break
            case 'd': timeoutDuration = timeValue * 24 * 60 * 60 * 1000; break
            default:
                return interaction.reply({ content: "Unité de temps invalide.", ephemeral: true })
        }

        try {
            await memberToMute.timeout(timeoutDuration, reason)

            await interaction.reply({ content: `✅ ${user} a été mute pour ${duration}. Raison : ${reason}`, ephemeral: false })

            if (!muteFile[user.id]) {
                muteFile[user.id] = {
                    count: 1,
                    mute_01: {
                        date: new Date().toISOString(),
                        reason: reason,
                        author: executor.user.id,
                        duration: duration
                    }
                }
            } else {
                const count = muteFile[user.id].count || 0
                const newCount = count + 1
                const muteTitle = `mute_0${newCount}`

                muteFile[user.id].count = newCount
                muteFile[user.id][muteTitle] = {
                    date: new Date().toISOString(),
                    reason: reason,
                    author: executor.user.id,
                    duration: duration
                }
            }

            await saveMute()

        } catch (error) {
            console.error(error)
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "Une erreur est survenue lors du mute.", ephemeral: true })
            }
        }
    }
}
