const { EmbedBuilder } = require('discord.js');
const banFile = require('../../config/ban.json');
const { saveBan } = require('../../utils/functions');

module.exports = {
    name: 'ban',
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
        const temp = interaction.options.getInteger('temp'); // en jours

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) {
                return interaction.reply({ content: 'Utilisateur introuvable sur le serveur.', ephemeral: true });
            }

            // MP l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('Tu as été banni')
                    .setDescription(`Tu as été banni du serveur **${interaction.guild.name}**.`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Durée', value: temp ? `${temp} jours` : 'Permanent' }
                    )
                    .setColor('Red')
                    .setFooter({ text: 'Respectez les règles pour éviter de nouvelles sanctions.' });

                await user.send({ embeds: [dmEmbed] });
            } catch (err) {
                console.error('Impossible d\'envoyer un MP à l\'utilisateur:', err);
            }

            // Bannir l'utilisateur
            await interaction.guild.members.ban(user, { reason });

            // Planifier débannissement si temporaire
            if (temp) {
                setTimeout(async () => {
                    try {
                        await interaction.guild.members.unban(user.id);
                        console.log(`${user.tag} a été débanni après ${temp} jours.`);
                    } catch (err) {
                        console.error(`Erreur lors du débannissement de ${user.tag}:`, err);
                    }
                }, temp * 24 * 60 * 60 * 1000);
            }

            const dur = temp ? `${temp} jours` : 'Bannissement définitif';
            const isDay = temp ? '' : '(day)';

            // Enregistrement dans le fichier
            if (!banFile[user.id]) {
                banFile[user.id] = {
                    count: 1,
                    ban_01: {
                        date: new Date().toISOString(),
                        reason: reason,
                        author: interaction.member.user.id,
                        temp: `${dur} ${isDay}`
                    }
                };
            } else {
                const count = banFile[user.id].count;
                const newCount = count + 1;
                const banTitle = `ban_0${newCount}`;
                banFile[user.id].count = newCount;
                banFile[user.id][banTitle] = {
                    date: new Date().toISOString(),
                    reason: reason,
                    author: interaction.member.user.id,
                    temp: `${dur} ${isDay}`
                };
            }

            saveBan();

            return interaction.reply({ content: `${user.tag} a été banni ${temp ? `pour ${temp} jours` : 'définitivement'}.`, ephemeral: false });

        } catch (err) {
            return interaction.reply({ content: `Erreur lors du bannissement de ${user.tag} : ${err.message}`, ephemeral: true });
        }
    }
};