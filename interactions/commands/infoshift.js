const { EmbedBuilder } = require('discord.js');

// Adapte ces imports à ta structure de projet
const shiftFile = require('../../config/shift.json');
const pex = require('../../config/pex.json');

module.exports = {
    name: 'infoshift',
    async execute(interaction) {
        const option = interaction.options.getString('top');

        if (!option) {
            const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
            const targetId = targetUser.id;
            const isSelfQuery = targetId === interaction.user.id;
            const requiredPermission = "MANAGE_SHIFT";

            const hasPermission = pex['MANAGE_SHIFT']?.[interaction.user.id] || pex['*']?.[interaction.user.id];

            if (!isSelfQuery && !hasPermission) {
                console.log(`${interaction.user.tag} n'a pas la permission "MANAGE_SHIFT"`);
                return interaction.reply({ 
                    content: `🚫 Tu n'as pas la permission d'utiliser cette commande sur d'autres membres. Tu dois avoir la permission ${requiredPermission}.`, 
                    ephemeral: true 
                });
            }

            if (!shiftFile[targetId] || Object.keys(shiftFile[targetId]).length === 0) {
                return interaction.reply({ content: `❌ <@${targetId}> n'a aucun shift enregistré.`, ephemeral: true });
            }

            let historyText = Object.entries(shiftFile[targetId])
                .map(([date, durations]) => {
                    const formattedDurations = Array.isArray(durations) ? durations.join(', ') : 'Aucune donnée';
                    return `**${date}** : ${formattedDurations}`;
                })
                .join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`📊 Historique des shifts de ${targetUser.username}`)
                .setDescription(historyText)
                .setColor("Blue");

            return interaction.reply({ embeds: [embed] });
        }
    }
}
