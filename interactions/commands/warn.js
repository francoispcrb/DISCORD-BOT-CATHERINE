const { EmbedBuilder } = require('discord.js')


const { warnFile } = require('../../config/warn.json')
const { saveWarn } = require('../../utils/functions')

module.exports = {
    name: 'warn',
    async execute(interaction) {
        const author = interaction.user.id
        const user = interaction.options.getUser('user')
        const userId = user.id
        const mark = interaction.options.getString('mark')

        console.debug(`Avertissement: ${author}, ${userId}, ${mark}`)

        if (!warnFile[userId]) {
            warnFile[userId] = {
                count: 1,
                warn_01: {
                    date: new Date().toISOString(),
                    mark: mark,
                    author: author
                }
            }
        } else {
            const count = warnFile[userId].count + 1
            const warnTitle = `warn_0${count}`

            warnFile[userId].count = count
            warnFile[userId][warnTitle] = {
                date: new Date().toISOString(),
                mark: mark,
                author: author
            }
        }

        await saveWarn()

        const confirmEmbed = new EmbedBuilder()
            .setTitle("⚠️ Avertissement")
            .setDescription(`L'utilisateur a été averti.
**Nombre total d'avertissements**: ${warnFile[userId].count}
**Raison**: ${mark}`)
            .setColor("#ffcc00")

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true })
        console.debug("Member averti")

        try {
            await user.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🔰 Vous avez été averti.")
                        .setDescription(`**Nombre total d'avertissements** : ${warnFile[userId].count}
**Raison**: ${mark}`)
                        .setColor("#ffcc00")
                ]
            })
        } catch (error) {
            console.error("Impossible d’envoyer le MP :", error)
        }
    }
}
