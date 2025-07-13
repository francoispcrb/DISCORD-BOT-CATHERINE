const { RANKS, CORPS } = require('../../utils/utils')

module.exports = {
    name: 'promote',
    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const rank = interaction.options.getString('grade');

        if (!member) {
            return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });
        }

        if (!RANKS[rank]) {
            return interaction.reply({ content: "Grade invalide.", ephemeral: true });
        }

        const newRankRole = interaction.guild.roles.cache.get(RANKS[rank].id);
        if (!newRankRole) {
            return interaction.reply({ content: "Rôle de grade introuvable.", ephemeral: true });
        }

        // Suppression des anciens grades
        for (const key in RANKS) {
            const oldRole = interaction.guild.roles.cache.get(RANKS[key].id);
            if (oldRole && member.roles.cache.has(oldRole.id)) {
                await member.roles.remove(oldRole);
            }
        }

        // Réaffectation des corps selon le nouveau grade
        const removeCorps = [
            CORPS.EXECUTIVE_BODY.id,
            CORPS.SUPERVISION_BODY.id,
            CORPS.COMMANDEMENT_BODY.id,
            CORPS.DIRECTION_BODY.id
        ];

        await member.roles.remove(removeCorps);

        if (rank === 'Sergeant') {
            await member.roles.add(CORPS.SUPERVISION_BODY.id);
        } else if (rank === 'Lieutenant') {
            await member.roles.add(CORPS.COMMANDEMENT_BODY.id);
        } else if (rank === 'Major') {
            await member.roles.add(CORPS.DIRECTION_BODY.id);
        }

        await member.roles.add(newRankRole);

        return interaction.reply({
            content: `✅ <@${member.id}> a été promu au grade de **${rank}**.`,
            ephemeral: false
        });
    }
};