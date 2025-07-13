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
    "Trooper":                 { id: "1271893900344299692", name: "• Trooper"               , emoji: ""},
    "Trooper First Class":     { id: "1252231983497744507", name: "• Trooper First Class"   , emoji: ""},
    "Trooper Second Class":    { id: "1343603998745432084", name: "• Trooper Second Class"  , emoji: ""},
    "Trooper Third Class":     { id: "1362847237381820856", name: "• Trooper Third Class"   , emoji: ""},
    "Senior Trooper":          { id: "1377990051450982550", name: "• Senior Trooper"        , emoji: ""},
    "Master Trooper":          { id: "1367197569234636841", name: "• Master Trooper"        , emoji: ""},
    "Corporal":                { id: "1367197630311960776", name: "• Corporal"              , emoji: "<:Corporal:1378034458623479898>"},
    //Superivision
    "Sergeant":                { id: "1252231826680975500", name: "• Sergeant"              , emoji: "<:Sergeant:1378034456962797628>"},
    "Sergeant First Class":    { id: "1367187949317263380", name: "• Sergeant First Class"  , emoji: "<:Sergeant_First_Class:1378034455217967124>"},
    //Commandement
    "Lieutenant":              { id: "1252232160916668437", name: "• Lieutenant"            , emoji: "<:Lieutenant:1378034452768489612>"},
    "Captain":                 { id: "1252232015948808244", name: "• Captain"               , emoji: "<:Captain:1378034444304384081> "},
    //Direction
    "Major":                   { id: "1362833262778781887", name: "• Major"                 , emoji: "<:Major:1367251913871200316> "},
    "Lieutenant-Colonel":      { id: "1252232933339562027", name: "• Lt-Colonel"            , emoji: "<:Lieutenant_Colonel:1367251920145744004> "},
    "Colonel":                 { id: "1252231549752053824", name: "• Colonel"               , emoji: "<:Colonel:1379532019414859918>"},
};

const ROLE_MAP = {
    "FHP": "1259234502866108456",
    "MDPD": "1252274500968513687",
    "MPD":"1367955141570990252",
    "SAMR": "1354482500214456431",
    "DOJ": "1354881043349635193",
    "GOUV": "1260947297307463783",
    "WAZEL": "1360585391622586438",
    "CITIZEN": "1252266446050951378",
    "FED": "1261311031490248766",
    "CDT":"1342563289338744872",
    "PERM":"1375181279124783184"
}

const COMMANDER = {
    "Patrol Operation": "248739383908368385",
    "Commercial Vehicule Enforcement": "729389796270800948",
    "Criminal Interdiction Unit": "794334752165330964",
    "Bureau of Criminal Investigation & Intelligence": "449432156595552257",
    "Special Response Team": "ID_USER_SRT",
    "Protection Operations Sections": "439425425131962368",
    "Internals Affairs Office": "439425425131962368"
};

const DIV_MAP = {
    "Patrol Operation":                 { id: "1344727484951822346", name: "Patrol Operation" },
    "C.V.Enforcement":                 { id: "1272252982750347414", name: "Commercial Vehicule Enforcement" },
    "Criminal Interdiction Unit":      { id: "1254743492392124417", name: "Criminal Interdiction Unit" },
    "Criminal Invest. and Intel.":     { id: "1254743617692635196", name: "Bureau of Criminal Investigation & Intelligence" },
    "Special Response Team":           { id: "1284909028568334336", name: "Special Response Team" },
    "Protective Operations Section":   { id: "1367185450602729575", name: "Protection Operations Sections" },
    "Internal Affairs Office":         { id: "1272253157577064478", name: "Internals Affairs Office" },
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
    viewdata: "*_FILES"
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