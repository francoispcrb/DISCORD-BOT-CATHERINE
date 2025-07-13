const {DIV_MAP} = require('../../utils/utils')

try {
    module.exports = {
        name: 'div',
        async execute(interaction) {
                    const targetUser = interaction.options.getUser('user');
                    const action = interaction.options.getString('action');
                    const divKey = interaction.options.getString('div');

                    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
                    if (!member) {
                        return interaction.reply({ content: `❌ Impossible de trouver cet utilisateur dans le serveur.`, ephemeral: true });
                    }

                    const division = DIV_MAP[divKey];
                    if (!division) {
                        return interaction.reply({ content: `❌ La division spécifiée est introuvable.`, ephemeral: true });
                    }

                    const role = interaction.guild.roles.cache.get(division.id);
                    if (!role) {
                        return interaction.reply({ content: `❌ Le rôle correspondant à la division **${division.name}** est introuvable.`, ephemeral: true });
                    }

                    try {
                        if (action === 'add') {
                            if (member.roles.cache.has(role.id)) {
                                return interaction.reply({ content: `⚠️ ${member.user.tag} est déjà dans la division **${division.name}**.`, ephemeral: true });
                            }
                            await member.roles.add(role);
                            return interaction.reply({ content: `✅ La division **${division.name}** a été attribuée à ${member.user.tag}.` });
                        } else if (action === 'remove') {
                            if (!member.roles.cache.has(role.id)) {
                                return interaction.reply({ content: `⚠️ ${member.user.tag} n'est pas dans la division **${division.name}**.`, ephemeral: true });
                            }
                            await member.roles.remove(role);
                            return interaction.reply({ content: `✅ La division **${division.name}** a été retirée de ${member.user.tag}.` });
                        } else {
                            return interaction.reply({ content: `❌ Action invalide.`, ephemeral: true });
                        }
                    } catch (err) {
                        console.error(err);
                        return interaction.reply({ content: `❌ Une erreur est survenue lors du traitement.`, ephemeral: true });
                    }

        }
    }
} catch {
    return false
}