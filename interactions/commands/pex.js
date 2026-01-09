const pex = require('../../config/pex')
const {PEX} = require('../../utils/utils')
const {savePex} = require('../../utils/functions')
const {EmbedBuilder} = require('discord.js')
const chalk = require('chalk')

try {
    module.exports = {
        name: 'pex',
        async execute(interaction) {
            const user = interaction.options.getUser('user');
            const action = interaction.options.getString('action'); // 'add' | 'remove' | 'check'
            const type = interaction.options.getString('type'); // MANAGE | MODERAT | USE | *
            const perm = interaction.options.getString('permission'); // ex: MANAGE_PEX
            const userId = user.id;
            const allPermissions = new Set();
            for (const category in PEX) {
                Object.values(PEX[category]).forEach(p => allPermissions.add(p));
            }
            if ((action === 'add' || action === 'remove') && !perm) {
                return interaction.reply({ content: '⛔ Vous devez spécifier une permission pour cette action.', ephemeral: true });
            }
            if (perm && !allPermissions.has(perm)) {
                return interaction.reply({ content: `⛔ La permission ${perm} n'existe pas.`, ephemeral: true });
            }
            if (perm && type && !(Object.values(PEX[type] || {}).includes(perm))) {
                return interaction.reply({ content: `⛔ La permission ${perm} ne correspond pas au type ${type}.`, ephemeral: true });
            }
            if (action === 'check') {
                const hasBypass = pex['*']?.[userId] === true;
                if (hasBypass) {
                    const embed = new EmbedBuilder()
                        .setTitle(`Cet utilisateur a la permission globale *`)
                        .setColor('Blue');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const userPermissions = Object.keys(pex).filter(permKey => pex[permKey]?.[userId]);
                if (userPermissions.length > 0) {
                    const embed = new EmbedBuilder()
                        .setTitle(`Permissions de ${user.tag}`)
                        .setDescription(userPermissions.join('\n'))
                        .setColor('Green');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    return interaction.reply({ content: `${user.tag} ne possède aucune permission.`, ephemeral: true });
                }
            }
            const hasBypass = pex['*']?.[interaction.user.id] === true;
            const hasEditPermission = pex['MANAGE_PEX']?.[interaction.user.id] || pex['ADD_REMOVE_PEX']?.[interaction.user.id];
            if (!hasBypass && !hasEditPermission) {
                return interaction.reply({ content: "⛔ Vous n'avez pas la permission de modifier les permissions (MANAGE_PEX ou ADD_REMOVE_PEX).", ephemeral: true });
            }
            if (action === 'add') {
                pex[perm] ??= {}; 
                if (pex[perm][userId]) {
                    return interaction.reply({ content: `✅ ${user.tag} possède déjà la permission ${perm}.`, ephemeral: true });
                }
                const isSensitive = ['ADD_REMOVE_PEX', '*_SHUTDOWN', '*'].includes(perm);
                if (isSensitive) {
                    console.log(`⚠️ Demande sensible : ajout de '${perm}' par ${interaction.user.tag} (${interaction.user.id})`);
                    console.log("Tapez 'oui' pour confirmer dans la console (30s)");
                    await interaction.reply({ content: "⚠️ Requête sensible. Confirmation requise dans la console.", ephemeral: true });
                    const readline = require('readline');
                    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    rl.question(chalk.bgYellow.red("Confirmer (oui/non) : "), answer => {
                        if (answer.toLowerCase() === 'oui') {
                            pex[perm][userId] = true;
                            savePex();
                            interaction.followUp({ content: `✅ Permission ${perm} ajoutée à ${user.tag}.`, ephemeral: true });
                            console.log("✅ Action confirmée.");
                        } else {
                            interaction.followUp({ content: "⛔ Action annulée par un opérateur.", ephemeral: true });
                            console.log("⛔ Action annulée.");
                        }
                        rl.close();
                    });
                    return;
                }
                pex[perm][userId] = true;
                savePex();
                return interaction.reply({ content: `✅ Permission ${perm} ajoutée à ${user.tag}.`, ephemeral: true });
            }
            if (action === 'remove') {
                if (!pex[perm]?.[userId]) {
                    return interaction.reply({ content: `⛔ ${user.tag} ne possède pas la permission ${perm}.`, ephemeral: true });
                }
                delete pex[perm][userId];
                savePex();
                return interaction.reply({ content: `✅ Permission ${perm} retirée à ${user.tag}.`, ephemeral: true });
            }
            savePex();
            return interaction.reply({
                content: `✅ Action terminée : ${action} ${perm} à ${user.tag}`,
                ephemeral: true
            });
 }
    }
} catch {
    return false
}