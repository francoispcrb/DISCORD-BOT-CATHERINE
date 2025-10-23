const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commanderFile = path.join(__dirname, '../../config/commander.json');

module.exports = {
    name: "commander",
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commanderData = JSON.parse(fs.readFileSync(commanderFile, 'utf8'));

        if (subcommand === 'view') {
            const embed = new EmbedBuilder()
                .setTitle('📋 Liste des Commanders')
                .setColor('#3498db')
                .setTimestamp();

            for (const [division, userId] of Object.entries(commanderData)) {
                let displayValue = userId.startsWith('ID_USER') ? 'Aucun membre' : `<@${userId}>`;
                embed.addFields({
                    name: division,
                    value: displayValue,
                    inline: true
                });
            }

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (subcommand === 'set') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
                    ephemeral: true
                });
            }

            const user = interaction.options.getUser('user');
            const division = interaction.options.getString('division');

            // Met à jour le fichier JSON
            commanderData[division] = user.id;
            fs.writeFileSync(commanderFile, JSON.stringify(commanderData, null, 4));

            const embed = new EmbedBuilder()
                .setTitle('✅ Commander mis à jour')
                .setDescription(`Le nouveau **commander** de la division **${division}** est désormais ${user}.`)
                .setColor('#2ecc71')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }
    }
};
