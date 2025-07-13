const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'send',
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const obj = interaction.options.getString('obj');
        const msg = interaction.options.getString('msg');
        const auth = interaction.options.getBoolean('auth') ?? false;

        const signature = auth
            ? `\n\n✉️ **Envoyé par**: ${interaction.user.displayName}`
            : "";

        const confirmEmbedDM = new EmbedBuilder()
            .setTitle("📩 Nouveau message")
            .setDescription(`**Objet:** ${obj}\n\n${msg}${signature}`)
            .setColor("#0099ff");

        try {
            await user.send({ embeds: [confirmEmbedDM] });
            return interaction.reply({ content: "✅ Message envoyé avec succès !", ephemeral: true });
        } catch (err) {
            console.error("Impossible d'envoyer ce message à ce membre.", err);
            return interaction.reply({ content: "❌ Impossible d'envoyer le message à cet utilisateur.", ephemeral: true });
        }
    }
};
