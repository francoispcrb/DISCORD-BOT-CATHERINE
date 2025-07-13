const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { kickFile } = require('../../config/kick.json'); // Modifie le chemin selon ta structure
const { saveKick } = require('../../utils/functions')

module.exports = {
    name: 'kick',
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Aucune raison fournie';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'Tu n\'as pas la permission de kicker des membres.', ephemeral: true });
        }

        try {
            // Essayer d'envoyer un DM
            try {
                await user.send(
                    new EmbedBuilder()
                        .setTitle('Tu as été kické')
                        .setDescription(`Tu as été kické du serveur ${interaction.guild.name} pour la raison suivante : ${reason}`)
                        .setColor('DarkRed')
                        .setFooter({ text: 'Règles du serveur : Respectez-les pour éviter de nouvelles sanctions.' })
                );
            } catch (err) {
                console.error('Impossible d\'envoyer un message privé à l\'utilisateur :', err);
            }

            await interaction.guild.members.kick(user, { reason });

            // Enregistrement du kick
            if (!kickFile[user.id]) {
                kickFile[user.id] = {
                    count: 1,
                    kick_01: {
                        date: new Date().toISOString(),
                        reason,
                        author: interaction.user.id
                    }
                };
            } else {
                const count = kickFile[user.id].count + 1;
                kickFile[user.id].count = count;
                const key = `kick_0${count}`;
                kickFile[user.id][key] = {
                    date: new Date().toISOString(),
                    reason,
                    author: interaction.user.id
                };
            }

            saveKick();

            return interaction.reply({ content: `${user.tag} a été kické avec succès.`, ephemeral: true });
        } catch (err) {
            return interaction.reply({ content: `Erreur lors du kick de ${user.tag} : ${err.message}`, ephemeral: true });
        }
    }
};
