const { SlashCommandBuilder } = require('discord.js')
const shift_veh = require('../config/shift_veh.json')
const { RANKS, ROLE_MAP, DIV_MAP, PEX } = require('../utils/utils')
const chalk = require('chalk')

const commands = {

    play: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Recherche et joue une musique depuis YouTube')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Titre ou artiste à chercher')
        .setRequired(true)),

    rules: new SlashCommandBuilder()
        .setName('rules').setDescription('rules'),

    createreport: new SlashCommandBuilder()
        .setName('createreport')
        .setDescription('Crée un rapport')
        .addStringOption(option => option.setName('name').setDescription('nom du ticket').setRequired(true)),

    div: new SlashCommandBuilder()
        .setName('div')
        .setDescription('Gère les divisions des utilisateurs')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur ciblé')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action à effectuer')
                .setRequired(true)
                .addChoices(
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' }
                )
        )
        .addStringOption(option => {
            let divOption = option
                .setName('div')
                .setDescription('Division à attribuer')
                .setRequired(true); // Rendu obligatoire pour garantir que l'action est bien ciblée

            for (const permission in DIV_MAP) {
                divOption = divOption.addChoices({ name: permission, value: permission });
            }

            return divOption;
        }),

    role: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Gère les rôles des utilisateurs')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur ciblé')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action à effectuer')
                .setRequired(true)
                .addChoices(
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' }
                )
        )
        .addStringOption(option => {
            let roleOption = option
                .setName('role')
                .setDescription('Rôle à attribuer')
                .setRequired(true); // obligatoire pour le bon fonctionnement

            for (const permission in ROLE_MAP) {
                roleOption = roleOption.addChoices({ name: permission, value: permission });
            }

            return roleOption;
        }),

    info: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Vous donne quelques informations sur le bot.'),

    pex: new SlashCommandBuilder()
        .setName('pex')
        .setDescription('Gérer les permissions personnalisées')
        .addUserOption(option =>
            option.setName('user')
            .setDescription('Utilisateur ciblé')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
            .setDescription('Action à effectuer')
            .setRequired(true)
            .addChoices(
                { name: 'add', value: 'add' },
                { name: 'remove', value: 'remove' },
                { name: 'check', value: 'check' }
            ))
        .addStringOption(option =>
            option.setName('type')
            .setDescription('Type de permission')
            .setRequired(false)
            .addChoices(
                { name: 'MANAGE', value: 'MANAGE' },
                { name: 'MODERAT', value: 'MODERAT' },
                { name: 'USE', value: 'USE' },
                { name: '*', value: '*' }
            ))
        .addStringOption(option =>
            option.setName('permission')
            .setDescription('Permission complète')
            .setAutocomplete(true) // ✅ obligatoire pour l’autocomplete
            .setRequired(false)),

    openserivce: new SlashCommandBuilder()
        .setName('openservice')
        .setDescription('Crée un message pour savoir qui sera présent ce soir'),

    infoshift: new SlashCommandBuilder()
        .setName('infoshift')
        .setDescription("Affiche l'historique des shifts d'un utilisateur.")
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription("L'utilisateur dont vous voulez voir les shifts")
                .setRequired(false)
        ),

    recruit: new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Permet de recruter un membre au sein du LSSD')
        .addUserOption(opt => opt.setName('user').setDescription('Utilisateur à recruter').setRequired(true))
        .addIntegerOption(opt => opt.setName('indicatif').setDescription('Indicatif du membre').setRequired(true))
        .addStringOption(opt => opt.setName('nickname').setDescription('Prénom et Nom du membre').setRequired(true)),

    help: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste des commandes disponibles')
        .addStringOption(opt => {
            let commandOptn = opt.setName('commandes').setDescription("Aide pour une commande spécifique").setRequired(false);
            for (const commands in PEX) {
                commandOptn = commandOptn.addChoices({ name: commands, value: commands });
            }; return commandOptn;
        }),

    ban: new SlashCommandBuilder()
        .setName('ban').setDescription('Bannit un membre du serveur.')
        .addUserOption(opt => opt.setName('user').setDescription('Utilisateur à bannir').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Raison du bannissement'))
        .addIntegerOption(opt => opt.setName('temp').setDescription('Durée en jours (laisser vide pour un ban définitif)')),

    ticket: new SlashCommandBuilder()
        .setName('ticket').setDescription('Plugin ticket')
        .addSubcommand(sub => sub.setName('init').setDescription('Ticket Init'))
        .addSubcommand(sub => sub.setName('add').setDescription('Ajouter un membre').addUserOption(opt => opt.setName('user').setDescription('Utilisateur à ajouter')))
        .addSubcommand(sub => sub.setName('remove').setDescription('Retirer un membre').addUserOption(opt => opt.setName('user').setDescription('Utilisateur à retirer')))
        .addSubcommand(sub => sub.setName('archive').setDescription('Archiver un ticket'))
        .addSubcommand(sub => sub.setName('close').setDescription('Supprimer un ticket'))
        .addSubcommand(sub => sub.setName('lock').setDescription('Verrouiller un ticket'))
        .addSubcommand(sub => sub.setName('unlock').setDescription('Déverrouiller un ticket'))
        .addSubcommand(sub => sub.setName('info').setDescription('Informations sur le ticket'))
        .addSubcommand(sub => sub.setName("rename").setDescription('Change le nom du ticket').addStringOption(opt => opt.setName('str').setDescription('Nouveau nom'))),

    shutdown: new SlashCommandBuilder().setName('shutdown').setDescription('Arrête le bot.'),

    userinfo: new SlashCommandBuilder()
        .setName('userinfo').setDescription('Obtenir des informations sur un utilisateur')
        .addUserOption(opt => opt.setName('user').setDescription('Utilisateur')),

    send: new SlashCommandBuilder()
        .setName('send').setDescription('Envoyer un message')
        .addBooleanOption(opt => opt.setName('auth').setDescription('Autorisation').setRequired(true))
        .addUserOption(opt => opt.setName('user').setDescription('Utilisateur'))
        .addStringOption(opt => opt.setName('obj').setDescription('Objet'))
        .addStringOption(opt => opt.setName('msg').setDescription('Message')),

    clear: new SlashCommandBuilder().setName('clear').setDescription('Effacer des messages.')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Nombre de message à supprimer.').setRequired(true)),

    kick: new SlashCommandBuilder()
        .setName('kick').setDescription('Expulser un membre.')
        .addUserOption(opt => opt.setName('user').setDescription('Utilisateur à expulser').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Raison du kick')),

    warn: new SlashCommandBuilder()
        .setName('warn').setDescription("Gérer les avertissements")
        .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        .addStringOption(opt => opt.setName('mark').setDescription('Motif').setRequired(true)),


    mute: new SlashCommandBuilder()
        .setName('mute').setDescription('Rendre muet un membre')
        .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Raison').setRequired(true))
        .addStringOption(opt => opt.setName('temps').setDescription('Durée')),

    rename: new SlashCommandBuilder()
        .setName('rename').setDescription('Renommer un salon')
        .addStringOption(opt => opt.setName('str').setDescription('Nouveau nom')),

    shift: new SlashCommandBuilder().setName('shift').setDescription("Démarrer ou arrêter votre service.")
                .addStringOption(opt => {
            let veh = opt.setName('veh').setDescription("Véhicule à attribuer").setRequired(true);
            for (const key in shift_veh) veh = veh.addChoices({ name: key, value: key });
            return veh;
        }),

    promote: new SlashCommandBuilder()
        .setName('promote').setDescription("Promouvoir un utilisateur à un grade supérieur.")
        .addUserOption(opt => opt.setName('user').setDescription("Utilisateur à promouvoir").setRequired(true))
        .addStringOption(opt => {
            let gradeOption = opt.setName('grade').setDescription("Grade à attribuer").setRequired(true);
            for (const key in RANKS) gradeOption = gradeOption.addChoices({ name: key, value: key });
            return gradeOption;
        })
};

try {
    module.exports = {  commands: Object.values(commands)}
    console.log("Les modules ", chalk.green('commands.js'), chalk.reset(" ont correctement été exporté."))
} catch(err) {
    console.error("[FATAL_ERROR] Les commandes n'ont pas été exporté correctement. Le processus va s'arrêter., ", err)
    process.exit(0);
}