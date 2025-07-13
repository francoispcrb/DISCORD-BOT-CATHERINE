const { EmbedBuilder } = require('discord.js')
const package = require('../../package.json')

try {
    module.exports = {
        name: 'info',
        async execute(interaction) {
            const embed = new EmbedBuilder()
            .setTitle("Info sur Catherine")
            .addFields(
                { name: "Nom", value: package.name?.toString() || "Inconnu" },
                { name: "Développeur", value: package.author?.toString() || "Inconnu" },
                { name: "Dépendences utilisées", value: package.dependencies ? Object.keys(package.dependencies).join(", ") : "Aucune" },
                { name: "Description", value: package.description?.toString() || "Aucune description" },
                { name: "Licence JS", value: package.license?.toString() || "Non spécifiée" },
                { name: "Fichier principal", value: package.main?.toString() || "Inconnu" },
                { name: "Scripts", value: package.scripts ? Object.keys(package.scripts).join(", ") : "Aucun" },
                { name: "Version", value: package.version?.toString() || "Inconnue" },
                { name: "Patch Note", value: package.patchnote?.toString() || "Inconnue" }
            )
            .setColor('DarkGreen');
            try {
                await interaction.reply({ embeds: [embed] });
            } catch (err) { interaction.reply(err), console.log(err)}
        }
    }
} catch(err) {
    return false
}