const pex = require('../../config/pex')
const {PEX} = require('../../utils/utils')
const {savePex} = require('../../utils/functions')

try {
    module.exports = {
        name: 'pex',
        async execute(interaction) {
            const user = interaction.options.getUser('user');
            const action = interaction.options.getString('action'); // 'add' | 'remove' | 'check'
            const type = interaction.options.getString('type'); // MANAGE | MODERAT | USE | *
            const perm = interaction.options.getString('permission'); // ex: MANAGE_PEX
            const userId = user.id;
            // 📦 Vérification globale des permissions connues
            const allPermissions = new Set();
            for (const category in PEX) {
                Object.values(PEX[category]).forEach(p => allPermissions.add(p));
            }
            // ⛔ Pour add/remove : permission obligatoire
            if ((action === 'add' || action === 'remove') && !perm) {
                return interaction.reply({ content: '⛔ Vous devez spécifier une permission pour cette action.', ephemeral: true });
            }
            // ⛔ La permission doit exister dans la liste
            if (perm && !allPermissions.has(perm)) {
                return interaction.reply({ content: `⛔ La permission ${perm} n'existe pas.`, ephemeral: true });
            }
            // ⛔ Vérifier que la permission correspond bien au type choisi
            if (perm && type && !(Object.values(PEX[type] || {}).includes(perm))) {
                return interaction.reply({ content: `⛔ La permission ${perm} ne correspond pas au type ${type}.`, ephemeral: true });
            }
            // ✅ Affichage des permissions de l'utilisateur
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
            // 🔐 Vérification de permission pour modifier (add/remove)
            const hasBypass = pex['*']?.[interaction.user.id] === true;
            const hasEditPermission = pex['MANAGE_PEX']?.[interaction.user.id] || pex['ADD_REMOVE_PEX']?.[interaction.user.id];
            if (!hasBypass && !hasEditPermission) {
                return interaction.reply({ content: "⛔ Vous n'avez pas la permission de modifier les permissions (MANAGE_PEX ou ADD_REMOVE_PEX).", ephemeral: true });
            }
            // ✅ Ajout d'une permission
            if (action === 'add') {
                pex[perm] ??= {}; // Initialise si nécessaire
                if (pex[perm][userId]) {
                    return interaction.reply({ content: `✅ ${user.tag} possède déjà la permission ${perm}.`, ephemeral: true });
                }
                // 🔒 Protection des permissions sensibles
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
                // Ajout normal
                pex[perm][userId] = true;
                savePex();
                return interaction.reply({ content: `✅ Permission ${perm} ajoutée à ${user.tag}.`, ephemeral: true });
            }
            // ✅ Suppression d'une permission
            if (action === 'remove') {
                if (!pex[perm]?.[userId]) {
                    return interaction.reply({ content: `⛔ ${user.tag} ne possède pas la permission ${perm}.`, ephemeral: true });
                }
                delete pex[perm][userId];
                savePex();
                return interaction.reply({ content: `✅ Permission ${perm} retirée à ${user.tag}.`, ephemeral: true });
            }
            // 🔁 Sécurité fallback
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