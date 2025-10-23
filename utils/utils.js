const chalk = require("chalk");
const fs = require('fs')
const commander = require('../config/commander.json')


const CORPS = {
    "EXECUTIVE_BODY":       { id: "1342563267910045749" },
    "SUPERVISION_BODY":     { id: "1342563302043025408" },
    "COMMANDEMENT_BODY":    { id: "1342563289338744872" },
    "DIRECTION_BODY":       { id:"1342565895188254740" }
};

const RANKS = {
    //Application
    "Trainee":                { id: "1414910715097251861", name: "• Trainee" , emoji: ""},
    "Trooper":                { id: "1271893900344299692", name: "• Trooper"         , emoji: ""},
    "Trooper II":             { id: "1252231983497744507", name: "• Trooper II"      , emoji: "<:Trooper_II:1422682143657558016>"},
    "Master Trooper":         { id: "1343603998745432084", name: "• Master Trooper"  , emoji: "<:Master_Trooper:1422682137047466197>"},
    //Superivision
    "Sergeant":               { id: "1252231826680975500", name: "• Sergeant"                    , emoji: "<:Sergeant:1422682140419817533>"},
    "Chief Sergeant":         { id: "1414973859374825612", name: "• Chief Sergeant"              , emoji: "<:Chief_Sergeant:1422682907251576893>"},
    //Commandement
    "Lieutenant":             { id: "1252232160916668437", name: "• Lieutenant"            , emoji: "<:Lieutenant:1422682925001867365>"},
    "Captain":                { id: "1252232015948808244", name: "• Captain"               , emoji: "<:Captain:1422682904554897559>"},
    //Direction
    "Deputy Commissioner":    { id: "1414944268933533696", name: "• Deputy Commissioner"     , emoji: "<:Deputy_Commissioner:1422682660643536926>"},
    "Assstant Commissioner":  { id: "1414944314903236740", name: "• Assistant Commissioner"        , emoji: "<:Assistant_Commissioner:1422682902063222804>"},
    "Commissioner":           { id: "1414944355524808704", name: "• Commissioner"               , emoji: "<:Commissioner:1422682656088522832>"},
};



const ROLE_MAP = {
    "San Andreas State Police": "1259234502866108456",
    "United States Marshall Service": "1252274500968513687",
    "Departement of Justice": "1354881043349635193",
    "Gouvernement": "1260947297307463783",
    "Wazel News": "1360585391622586438",
    "Citoyens": "1252266446050951378",
    "Corps de Commandement":"1342563289338744872",
    "Hautes Instances Communautaires":"1375181279124783184",
    "Commission":"1342565895188254740"
}

const COMMANDER = {
    "Patrol Division": commander["Patrol Division"],
    "Special Enforcement Bureau": commander["Special Enforcement Bureau"],
    "Detective Division": commander["Detective Division"],
    "Division de protection Judiciaire": commander["Division de protection Judiciaire"],
    "Park Ranger": commander["Park Ranger"],
    "Traffic Enforcement Bureau": commander["Traffic Enforcement Bureau"],
    "Bureau Executif (PSD & Affaires Internes)": commander["Bureau Executif (PSD & Affaires Internes)"],
    "Administrative and Training Division": commander["Administrative and Training Division"],
};

const DIV_MAP = {
    "Special Enforcement Bureau":                            { id: "1344727484951822346", name: "Special Enforcement Bureau" },
    "Detective Division":                              { id: "1254743492392124417", name: "Detective Division" },
    "Division de protection Judiciaire":                             { id: "1254743617692635196", name: "Division de protection Judiciaire" },
    "Traffic Enforcement Bureau (Interim)":                             { id: "1272252982750347414", name: "Traffic Enforcement Bureau (Interim)" },
    "Bureau Executif (PSD & Affaires Internes)":                             { id: "1272253157577064478", name: "Bureau Executif (PSD & Affaires Internes)" },
    "Administrative and Training Division":                             { id: "1414951063433515140", name: "Administrative and Training Division" },
    "Patrol Division": {id:"1259234502866108456", name: "Patrol Division"},
    "Park Ranger": {id: "", name: "Park Ranger"}
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
    "commander": "Gère les différents leads des unités. Sous-commandes : `view` (affiche les commanders) et `set` (définit un nouveau commander avec `user` et `division`).",
    "play": "Recherche et joue une musique depuis YouTube. Argument : `query` (titre ou lien YouTube).",
    "rules": "Affiche les règles du serveur.",
    "createreport": "Crée un rapport. Argument : `name` (nom du rapport).",
    "div": "Gère les divisions d'un utilisateur. Arguments : `user` (utilisateur), `action` (`add` ou `remove`), `div` (nom de la division).",
    "role": "Gère les rôles d'un utilisateur. Arguments : `user` (utilisateur), `action` (`add` ou `remove`), `role` (nom du rôle).",
    "info": "Affiche des informations générales sur le bot.",
    "pex": "Gère les permissions personnalisées. Arguments : `user`, `action` (`add`, `remove`, `check`), `type` (catégorie de permission), `permission` (nom précis, optionnel).",
    "recruit": "Recrute un utilisateur. Arguments : `user`, `indicatif` (numéro), `nickname` (prénom et nom).",
    "help": "Affiche la liste des commandes ou l’aide d’une commande spécifique. Argument optionnel : `commandes`.",
    "ban": "Bannit un membre. Arguments : `user`, `reason` (raison), `temp` (durée en jours, optionnel).",
    "ticket": "Gère les tickets de support. Sous-commandes : `init`, `add`, `remove`, `archive`, `close`, `lock`, `unlock`, `info`, `rename`.",
    "shutdown": "Arrête le bot.",
    "userinfo": "Affiche les informations d’un utilisateur. Argument optionnel : `user`.",
    "send": "Envoie un message privé à un utilisateur. Arguments : `auth` (booléen), `user`, `obj` (objet), `msg` (contenu du message).",
    "clear": "Supprime des messages. Argument : `amount` (nombre de messages à supprimer).",
    "kick": "Expulse un utilisateur. Arguments : `user`, `reason` (optionnel).",
    "warn": "Ajoute un avertissement à un utilisateur. Arguments : `user`, `mark` (motif).",
    "mute": "Rend un utilisateur muet temporairement. Arguments : `user`, `reason`, `temps` (durée).",
    "rename": "Renomme un salon. Argument : `str` (nouveau nom).",
    "shift": "Démarre ou arrête un service. Arguments : `type` (Normal, Slicktop, Unmarked, Admin), `veh` (véhicule).",
    "promote": "Promouv un utilisateur à un grade supérieur. Arguments : `user`, `grade`.",
    "infoshift": "Affiche les informations des shifts d’un utilisateur. Argument optionnel : `utilisateur`.",
    "openservice": "Crée un message demandant la présence des membres pour le service du soir."
};



try {
    module.exports = { CORPS, RANKS, PEX, DESC_COMMAND, ROLE_MAP, DIV_MAP, COMMANDER}
    console.log("Les modules ", chalk.green('utils.js'), chalk.reset(" ont correctement été exporté."))
} catch(err) {
    console.error("[FATAL_ERROR] Les utils n'ont pas été exporté correctement. Le processus va s'arrêter., ", err)
    process.exit(0);
}
