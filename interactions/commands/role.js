const {ROLE_MAP} = require('../../utils/utils')

try {
    module.exports = {
        name: 'role',
        async execute(interaction) {
            const targetUser = interaction.options.getUser('user');
            const action = interaction.options.getString('action');
            const roleKey = interaction.options.getString('role');
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (!member) {
                return interaction.reply({ content: `❌ Impossible de trouver cet utilisateur dans le serveur.`, ephemeral: true });
            }
            const roleId = ROLE_MAP[roleKey];
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                return interaction.reply({ content: `❌ Le rôle spécifié est introuvable.`, ephemeral: true });
            }
            try {
                if (action === 'add') {
                    if (member.roles.cache.has(role.id)) {
                        return interaction.reply({ content: `⚠️ ${member.user.tag} a déjà le rôle **${role.name}**.`, ephemeral: true });
                    }
                    await member.roles.add(role);
                    return interaction.reply({ content: `✅ Le rôle **${role.name}** a été ajouté à ${member.user.tag}.` });
                } else if (action === 'remove') {
                    if (!member.roles.cache.has(role.id)) {
                        return interaction.reply({ content: `⚠️ ${member.user.tag} n'a pas le rôle **${role.name}**.`, ephemeral: true });
                    }
                    await member.roles.remove(role);
                    return interaction.reply({ content: `✅ Le rôle **${role.name}** a été retiré de ${member.user.tag}.` });
                } else {
                    return interaction.reply({ content: `❌ Action invalide.`, ephemeral: true });
                }
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: `❌ Une erreur est survenue lors du traitement.`, ephemeral: true });
            }
        }
    }
} catch {}