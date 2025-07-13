const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {DESC_COMMAND} = require('../../utils/utils'); // ou un autre fichier selon ton projet
const {PEX} = require('../../utils/utils'); // idem

module.exports = {
    name:'help',

    async execute(interaction) {
        const commandRequested = interaction.options.getString('commandes');
        const normalizedCmd = commandRequested?.trim().toLowerCase();
        const baseFooter = { text: "Utilisez chaque commande avec '/' suivi du nom de la commande." };

        console.log("Commande demandée:", commandRequested);
        console.log("Commande normalisée:", normalizedCmd);
        console.log("Clés disponibles:", Object.keys(DESC_COMMAND).toString());

        // --- Cas où une commande spécifique est demandée et existe ---
        if (normalizedCmd && DESC_COMMAND[normalizedCmd]) {
            const commandEmbed = new EmbedBuilder()
                .setTitle(`📜 Aide pour la commande /${normalizedCmd}`)
                .setDescription(`${DESC_COMMAND[normalizedCmd]}\nPermission requise : **${PEX[normalizedCmd] || "Aucune"}**`)
                .setColor("Blue")
                .setFooter(baseFooter);

            return interaction.reply({ embeds: [commandEmbed], ephemeral: true });
        }

        // --- Cas où 'false' est passé (sélecteur vide ou désactivé) ---
        if (commandRequested === 'false') {
            const helpEmbed = new EmbedBuilder()
                .setTitle("📜 Liste des commandes disponibles")
                .setDescription("Voici la liste des commandes que vous pouvez utiliser sur ce serveur :")
                .setColor("Blue")
                .addFields(Object.entries(DESC_COMMAND).map(([name, desc]) => ({
                    name: `/${name}`, value: desc
                })))
                .setFooter(baseFooter);

            return interaction.reply({ embeds: [helpEmbed], ephemeral: true });
        }

        // --- Cas par défaut : pas de commande spécifiée ou commande inconnue ---
        const helpEmbed = new EmbedBuilder()
            .setTitle("📜 Liste des commandes disponibles")
            .setDescription("Voici la liste des commandes que vous pouvez utiliser sur ce serveur :")
            .setColor("Blue")
            .addFields(Object.entries(DESC_COMMAND).map(([name, desc]) => ({
                name: `/${name}`, value: desc
            })))
            .setFooter(baseFooter);

        return interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }
};
