const chalk = require("chalk");
const fs = require('fs')

const CORPS = {
    "EXECUTIVE_BODY":       { id: "1342563267910045749" },
    "SUPERVISION_BODY":     { id: "1342563302043025408" },
    "COMMANDEMENT_BODY":    { id: "1342563289338744872" },
    "DIRECTION_BODY":       { id:"1342565895188254740" }
};

const RANKS = {
    //Application
    "Deputy Shierff Trainee": { id: "1414910715097251861", name: "• Deputy Sheriff Trainee" , emoji: ""},
    "Deputy Shierff":         { id: "1271893900344299692", name: "• Deputy Sheriff"         , emoji: ""},
    "Deputy Shierff II":      { id: "1252231983497744507", name: "• Deputy Sheriff II"      , emoji: "<:Deputy_Sherif_II:1414948897725354015>"},
    "Deputy Shierff FTO":     { id: "1343603998745432084", name: "• Deputy Sheriff FTO"     , emoji: "<:Deputy_Sherif_FTOremovebgpreview:1414948894575562753>"},
    //Superivision
    "Chief Sergeant":         { id: "1414973859374825612", name: "• Chief Sergeant"              , emoji: "<:Chief_Sergeant:1414974863839465482>"},
    "Sergeant":               { id: "1252231826680975500", name: "• Sergeant"              , emoji: "<:Sergeant:1414977273437749258>"},
    //Commandement
    "Lieutenant":             { id: "1252232160916668437", name: "• Lieutenant"            , emoji: "<:Lieutenant:1414948906160357516>"},
    "Captain":                { id: "1252232015948808244", name: "• Captain"               , emoji: "<:Captain:1414948892394520707>"},
    //Direction
    "Assistant Sheriff":      { id: "1414944268933533696", name: "• Assistant Sheriff"     , emoji: "<:Assistant_Sheriff:1414974722181038161>"},
    "Undersheriff":           { id: "1414944314903236740", name: "• Undersheriff"        , emoji: "<:Deputy_Sheriff:1414974727042105344> "},
    "Sheriff":                { id: "1414944355524808704", name: "• Sheriff"               , emoji: "<:Sheriff:1414974819878834299>"},
};

const ROLE_MAP = {
    "LSSD": "1259234502866108456",
    "LSPD": "1252274500968513687",
    "LSPD2":"1367955141570990252",
    "SAMR": "1354482500214456431",
    "DOJ": "1354881043349635193",
    "GOUV": "1260947297307463783",
    "WAZEL": "1360585391622586438",
    "CITIZEN": "1252266446050951378",
    "FED": "1261311031490248766",
    "CDT":"1342563289338744872",
    "PERM":"1375181279124783184",
    "HI":"1375181279124783184",
    "COM":"1342565895188254740"
}

const COMMANDER = {
    "Patrol Division": "439425425131962368",
    "Special Enforcement Bureau": "ID_USER_SEB",
    "Detective Division": "449432156595552257",
    "Division de protection Judiciaire": "ID_SER_JD",
    "Traffic Enforcement (Interim)": "794334752165330964",
    "Bureau Executif (PSD & Affaires Internes)": "449432156595552257",
    "Administrative and Training Division": "ID_USER_ATD",
};

const DIV_MAP = {
    "SEB":                            { id: "1344727484951822346", name: "Special Enforcement Bureau" },
    "DD":                              { id: "1272252982750347414", name: "Detective Division" },
    "DPJ":                             { id: "1254743492392124417", name: "Division de protection Judiciaire" },
    "TE":                             { id: "1254743617692635196", name: "Traffic Enforcement (Interim)" },
    "BE":                             { id: "1272253157577064478", name: "Bureau Executif (PSD & Affaires Internes)" },
    "ATD":                             { id: "1414951063433515140", name: "Administrative and Training Division" },
    "PAT": {id:"1259234502866108456", name: "Patrol Division"}
};

const PEX = {
  MANAGE: {
    openservice: "MANAGE_OPENSERVICE",
    infoshift: "MANAGE_SHIFT",
    promote: "MANAGE_PROMOTE",
    recruit: "MANAGE_RECRUIT",
    rename: "MANAGE_RENAME",
    send: "MANAGE_SEND",
    tabs: "MANAGE_TABS",
    tabsdiv: "MANAGE_TABS",
    div: "MANAGE_DIV",
    pex: "MANAGE_PEX",
    clear: "MANAGE_CLEAR",
    bypass: "MANAGE_BYPASS",
    role: "MANAGE_ROLE",
    ticket: "MANAGE_TICKET"
  },
  MODERAT: {
    mute: "MODERAT_MUTE",
    warn: "MODERAT_WARN",
    ban: "MODERAT_BAN",
    kick: "MODERAT_KICK",
    userinfo: "MODERAT_USERINFO"
  },
  USE: {
    help: "USE_HELP",
    shift: "USE_SHIFT",
    infoshift: "USE_SHIFT",
    info: "USE_INFO",
    createreport: "USE_CREATEREPORT"
  },
  "*": {
    shutdown: "*_SHUTDOWN",
    checklog: "*_FILES",
    cleardata: "*_FILES",
    viewdata: "*_FILES",
    null: "ADD_REMOVE_PEX",
    null :"*"
  }
};

const DESC_COMMAND = {
    "ban": "Bannit un membre du serveur. Arguments : `user` (utilisateur à bannir), `reason` (raison), `temp` (durée en jours, optionnel).",
    "kick": "Expulse un membre du serveur. Arguments : `user` (utilisateur à expulser), `reason` (raison).",
    "warn": "Ajoute un avertissement à un membre. Arguments : `user` (utilisateur), `mark` (motif). Sous-commandes : `info` (obtenir le nombre d'avertissements), `warn` (ajouter un avertissement).",
    "mute": "Rend un membre muet temporairement. Arguments : `user` (utilisateur), `reason` (raison), `temps` (durée).",
    "ticket": "Gère les tickets de support. Sous-commandes : `init`, `add` (ajouter un membre, avec `user`), `remove` (retirer un membre, avec `user`), `archive`, `close`, `lock`, `unlock`, `info`.",
    "shutdown": "Arrête le bot.",
    "userinfo": "Affiche des informations sur un utilisateur. Arguments : `user` (utilisateur).",
    "send": "Envoie un message privé à un utilisateur. Arguments : `auth` (autorisation), `user` (utilisateur), `obj` (objet), `msg` (message).",
    "clear": "Supprime des messages dans un salon.",
    "ping": "Vérifie la latence du bot.",
    "rename": "Renomme un salon. Arguments : `str` (nouveau nom).",
    "shift": "Démarre ou arrête un service.",
    "infoshift": "Obtenir les informations de l'intégralité des services de l'utilisateur. Arguments : `user`.",
    "promote": "Promouvoir un utilisateur à un grade supérieur. Arguments : `user` (utilisateur), `grade` (grade à attribuer, choisir parmi les grades disponibles).",
    "recruit": "Recruter un utilisateur. Arguments : `user` (utilisateur), `indicatif` (indicatif à attribuer au membre), `prénom & nom` (prénom et nom du membre).",
    "pex": "Permet d'ajouter des permissions à un membre. Arguments : `user` (utilisateur dont on veut ajouter des permissions), `add|remove|check` (ajouter, retirer ou vérifier les permissions du membre en question), `permission` (permission à ajouter ou retirer).",
    "openservice": "Permet d'envoyer un message demandant aux membres s'ils seront présent le soir.",
    "info": "Donne les informations primaire du Client du bot.",
    "music": "Permet de jouer de la musique.",
    "bypass": "Permet de bypass une commande (Ex. /bypass shift `user`)"
};


try {
    module.exports = { CORPS, RANKS, PEX, DESC_COMMAND, ROLE_MAP, DIV_MAP, COMMANDER}
    console.log("Les modules ", chalk.green('utils.js'), chalk.reset(" ont correctement été exporté."))
} catch(err) {
    console.error("[FATAL_ERROR] Les utils n'ont pas été exporté correctement. Le processus va s'arrêter., ", err)
    process.exit(0);
}