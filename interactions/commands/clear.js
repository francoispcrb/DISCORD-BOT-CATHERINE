module.exports = {
    name: 'clear',
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        if (amount < 1 || amount > 100) {
            return interaction.reply({
                content: "⚠️ Veuillez spécifier un nombre entre 1 et 100.",
                ephemeral: true
            });
        }

        try {
            await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({
                content: `✅ Vous avez supprimé **${amount}** messages.`,
                ephemeral: true
            });
        } catch (err) {
            console.error("Erreur lors de la suppression des messages :", err);
            await interaction.reply({
                content: "❌ Impossible de supprimer les messages. Vérifiez que je dispose des permissions nécessaires.",
                ephemeral: true
            });
        }
    }
};
