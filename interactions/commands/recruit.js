const fs = require('fs');
const chalk = require('chalk');
const { RANKS, CORPS, DIV_MAP } = require('../../utils/utils'); // Adapte le chemin si besoin
const config = require('../../config/config.json');
const indicatifFile = require('../../config/indicatif.json');

module.exports = {
    name: 'recruit',
    async execute(interaction) {
        const user = interaction.options.getMember('user');
        const indicatif = interaction.options.getInteger('indicatif');
        const nick = interaction.options.getString('nickname');

        if (!user) {
            return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });
        }

        const alreadyTaken = indicatifFile.indicatif.includes(indicatif.toString());
        if (alreadyTaken) {
            return interaction.reply({ content: `L'indicatif ${indicatif} est déjà pris.`, ephemeral: true });
        }

        // Ajout de l’indicatif
        indicatifFile.indicatif.push(indicatif.toString());
        fs.writeFileSync('../../config/indicatif.json', JSON.stringify(indicatifFile, null, 4), 'utf8');

        const newNickname = `${indicatif} | ${nick}`;

        const rankRole = interaction.guild.roles.cache.get(RANKS.Trooper.id);
        const execRole = interaction.guild.roles.cache.get(CORPS.EXECUTIVE_BODY.id);
        const lssdRole = config.role.lssd;
        const poRole = interaction.guild.roles.cache.get(DIV_MAP["Patrol Operation"].id);

        try {
            await user.roles.add(rankRole);
            await user.roles.add(lssdRole);
            await user.roles.add(execRole);
            await user.roles.add(poRole);

            await user.setNickname(newNickname).catch(console.error);

            console.log(chalk.blueBright(`${newNickname} a été recruté avec les rôles assignés.`));

            return interaction.reply({ content: `${newNickname} a correctement été recruté.`, ephemeral: true });
        } catch (err) {
            console.error('Erreur pendant l\'assignation des rôles ou du pseudo :', err);
            return interaction.reply({ content: 'Une erreur est survenue lors du recrutement.', ephemeral: true });
        }
    }
};
