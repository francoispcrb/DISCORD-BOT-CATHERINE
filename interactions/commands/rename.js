module.exports = {
    name: 'rename',
    async execute(interaction) {
        const newName = interaction.options.getString('str');

        try {
            await interaction.channel.setName(newName);
            await interaction.reply({
                content: `✅ Salon renommé en **${newName}** !`,
                ephemeral: true
            });
        } catch (err) {
            console.error("Erreur lors du renommage du salon :", err);
            await interaction.reply({
                content: "❌ Impossible de renommer le salon.",
                ephemeral: true
            });
        }
    }
};
