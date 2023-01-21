const ENVIRONMENT = document.location.origin;
const EXTERNAL_RESSOURCES = "https://rico91130.github.io/GTOverride/";

const FOLDER_STATUS = ["OK", "SENT", "PENDING", "HUBEE_RECEIVED", "HUBEE_NOTIFIED", "SI_RECEIVED", "IN_PROGRESS", "ADD_AWAITING", "REFUSED", "DONE", "CLOSED", "ARCHIVED", "CANCELLED", "SI_INTG_ERROR", "ERROR"];
const FOLDER_TIME_DIVISIONS = [];

const today = createNextFTD(new Date(), "TD_today", "Aujourd'hui", 0);
const yesterday = createNextFTD(today, "TD_yesterday", "Hier", -1);
const beforeYesterday = createNextFTD(yesterday, "TD_beforeYesterday", "Avant hier", -1);
const next7days = createNextFTD(beforeYesterday, "TD_next7days", "7 jours suivants", -7);
const next30days = createNextFTD(next7days, "TD_next30days", "30 jours suivants", -30);
const remainingDays = createNextFTD(next30days, "TD_remainingDays", "Encore avant");

FOLDER_TIME_DIVISIONS.push(today);
FOLDER_TIME_DIVISIONS.push(yesterday);
FOLDER_TIME_DIVISIONS.push(beforeYesterday);
FOLDER_TIME_DIVISIONS.push(next7days);
FOLDER_TIME_DIVISIONS.push(next30days);
FOLDER_TIME_DIVISIONS.push(remainingDays);

function createNextFTD(origin, id, label, days) {

    var newTD = {
        "id": id,
        "label": label,
        "singleDay": (days == -1 || days == 0)
    };

    /* Cas normal (hors date du jour) */
    if (days != 0) 
    {
        newTD.end =  origin.dStart.toISOString().split("T")[0];
        newTD.dEnd = origin.dStart;
    }
    
    /* Cas ou il s'agit d'une période bornée */
    if (days != null) 
    {
        const dNewTD = new Date();
        if (days == 0)
            dNewTD.setTime(origin.getTime() + days * 24 * 60 * 60 * 1000);
        else   
            dNewTD.setTime(origin.dStart.getTime() + days * 24 * 60 * 60 * 1000);
        
        newTD.start = dNewTD.toISOString().split("T")[0];
        newTD.dStart = dNewTD;
    }

    /* Mise à jour des libellés à afficher */
    if (newTD.start != null)
        newTD.showStart = newTD.start.split("-")[2] + "/" + newTD.start.split("-")[1];
    if (newTD.end != null && !newTD.singleDay) {
        const dNewTDShow = new Date();
        dNewTDShow.setTime(newTD.dEnd.getTime() - 24 * 60 * 60 * 1000)
        newTD.showEnd = dNewTDShow.toISOString().split("T")[0].split("-")[2] + "/" + dNewTDShow.toISOString().split("T")[0].split("-")[1];
    }

    return newTD;
}

const NOTIFICATIONS_STATUS = ["INIT", "OK", "PENDING", "ERROR", "DISABLED"];
const NOTIFICATIONS_TIME_DIVISIONS = [];

const YESTERDAY = new Date(); 
YESTERDAY.setTime(YESTERDAY.getTime() - 24*60*60*1000);
YESTERDAY.setHours(0);
YESTERDAY.setMinutes(0);
YESTERDAY.setSeconds(0);
YESTERDAY.setMilliseconds(0);

var debutH = new Date();
debutH.setMinutes(0);
debutH.setSeconds(0);
debutH.setMilliseconds(0);
debutH.setTime(debutH.getTime() + 60*60*1000);


var debutPlage = null;
var finPlage = null;

var timeOffset = 2;
for(var plage = 0; plage < 10; plage++)
{
    debutPlage = new Date();
    debutPlage.setTime(debutH.getTime() - (plage+1) * timeOffset * 60 * 60 * 1000);
    finPlage = new Date();
    finPlage.setTime(debutH.getTime() - (plage) * timeOffset * 60 * 60 * 1000 - 1);

    NOTIFICATIONS_TIME_DIVISIONS.push({
        "startH" : debutPlage,
        "endH" : finPlage,
        "label" : (debutPlage.getHours()+"").padStart(2,"0") + "h" + (debutPlage.getMinutes()+"").padStart(2,"0") + "-" + (finPlage.getHours()+"").padStart(2,"0") + "h" + (finPlage.getMinutes()+"").padStart(2,"0"),
        "id" : "NS_" + debutPlage.getHours() + "_" + finPlage.getHours()
    })

    finH = finPlage;
}

/* Cas particulier de la TIME DIVISION fourre tout */
var _date = new Date();
_date.setTime(debutPlage.getTime() - 1);
NOTIFICATIONS_TIME_DIVISIONS.push({
    "startH" : YESTERDAY,
    "endH" : _date,
    "label" : "avant",
    "id" : "NS_Before"
});
NOTIFICATIONS_TIME_DIVISIONS.reverse();

const NOTIFICATIONS_DATAS = {};

const QUERY_GETFOLDERS = ENVIRONMENT + "/gtconsole/folders?id=&startDate=&endDate=&startTime=&endTime=&code=%%DEMARCHE%%&status=%%STATUS%%&siret=&guichet=&caseStatus=&notificationStatus=%%NOTIFICATIONSTATUS%%&lastUpdateStartDate=%%STARTDATE%%&lastUpdateEndDate=%%ENDDATE%%&page=%%PAGE%%&pageSize=%%PAGESIZE%%";
const QUERY_GETSENDINGS = ENVIRONMENT + "/gtconsole/folders/%%FOLDERID%%/sendings";
const QUERY_GETNOTIFICATIONS = ENVIRONMENT + "/gtconsole/sendings/%%SENDINGID%%/notifications";

const CONFIG = {
    "GLOBAL": {
        "DEFAULT_MODEL": {
            "status": ["*"],
            "highlights": {
                "ERROR": ["*"],
                "SI_INTG_ERROR": ["*"],
                "PENDING": ["TD_yesterday", "TD_beforeYesterday", "TD_next7days", "TD_next30days", "TD_remainingDays"],
                "HUBEE_RECEIVED": ["TD_yesterday", "TD_beforeYesterday", "TD_next7days", "TD_next30days", "TD_remainingDays"],
                "HUBEE_NOTIFIED": ["TD_beforeYesterday", "TD_next7days", "TD_next30days", "TD_remainingDays"],
                "SI_RECEIVED": ["TD_next7days", "TD_next30days", "TD_remainingDays"],
                "IN_PROGRESS": ["TD_next30days", "TD_remainingDays"]
            },
            "notifications" : {
                "monitorNotifications" : false,
                "folderStatusToUse" : ["ERROR", "SI_INTG_ERROR", "DONE", "REFUSED", "ADD_AWAITING"]
            }
        },
        "GTpageSizeLimit" : 1000,
        "notificationStatusToMonitor" : ["ERROR", "PENDING"],
        "detailsBatchSize": 1000,
        "notificationsSize" : 1000,
        "disableComputeForTimeDivision": ["TD_next30days", "TD_remainingDays"],
        "perimeters": [ { "name": "Démarches Eric", "demarches": ["DICPE", "EICPE", "DAENV", "DIOTA", "FCB", "arnaqueInternet"] },
                        { "name": "Démarches Vanessa", "demarches": ["MD", "CR", "OperationTranquilliteVacances", "pub-changement-nom", "EtatCivil", "depotDossierPACS", "recensementCitoyen", "HebergementTourisme"] }]
    },
    "CR" : {
        "notifications" : {
            "monitorNotifications" : true,
            "folderStatusToUse" : ["IN_PROGRESS", "ERROR", "SI_INTG_ERROR", "DONE", "REFUSED"]
        }
    },
    "MD" : {
        "notifications" : {
            "monitorNotifications" : true,
            "folderStatusToUse" : ["IN_PROGRESS", "ERROR", "SI_INTG_ERROR", "DONE", "REFUSED"]
        }
    },
    "DICPE": {
        "status": ["PENDING", "SENT", "CANCELLED", "ERROR"]
    },
    "EICPE": {
        "status": ["PENDING", "SENT", "CANCELLED", "ERROR"]
    },
    "DAENV": {
        "status": ["PENDING", "SENT", "CANCELLED", "ERROR"]
    },
    "DIOTA": {
        "status": ["PENDING", "SENT", "CANCELLED", "ERROR"]
    },
    "arnaqueInternet": {
        "alias": "Arnaque Internet",
        "notifications" : {
            "monitorNotifications" : true,
            "folderStatusToUse" : ["ERROR", "DONE", "REFUSED", "ADD_AWAITING"]
        }
    },
    "FCB": {
        "notifications" : {
            "monitorNotifications" : true,
            "folderStatusToUse" : ["ERROR", "DONE", "REFUSED"]
        }
    }
}

function readConfig(context, _key, useGlobal, useDefault)
{
    if (useGlobal == null)
        useGlobal = true;

    var keys = _key.split(".");
    
    var value = null;
    var read = false;
    
    if (configCheckNested(CONFIG, [context].concat(keys))) {
        value = eval("CONFIG." +  [context].concat(keys).join("."));
        read = true;
    } 
 
    if (!read)
    {
        /*
         * Dans le cas d'un contexte "GLOBAL", on ne doit pas passé par ce code,
         * car l'utilisation du modèle par défaut ne concerne que le contexte des démarches
         */
        if (context != "GLOBAL" && useGlobal && configCheckNested(CONFIG, ["GLOBAL", "DEFAULT_MODEL"].concat(keys)))
        {
            value = eval("CONFIG." +  ["GLOBAL", "DEFAULT_MODEL"].concat(keys).join("."));
        }
        else
        {
            value = useDefault;
        }  
    }

    return value;
}

function configCheckNested(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (!obj || !obj.hasOwnProperty(keys[i])) {
        return false;
      }
      obj = obj[keys[i]];
    }
    return true;
}

function displayPerimeter() {

    for (const demarche of arguments) {

        /*
         * Construction du tableau des folders
         */

        /* Récupération de la liste des status à superviser */
        var _FOLDER_STATUS = readConfig(demarche, "status", true, ["*"]);
        if (_FOLDER_STATUS.length == 1 && _FOLDER_STATUS[0] == "*")
            /* Status à superviser pour la démarche sont tous les statuts  */
            _FOLDER_STATUS = FOLDER_STATUS;
        else
        {
            /* On contrôle que les status à superviser pour la démarche existe */
            _FOLDER_STATUS = _FOLDER_STATUS.filter( function( el ) { return FOLDER_STATUS.includes(el) });
        }

        document.body.innerHTML += `
            <div class='menuBar'>
                <span class='demarcheName ` + demarche + `'>` + readConfig(demarche, "alias", false, demarche) + `</span>
            </div>
            <div class='menuBar'>
                <span class='subTitle'>1 - Status des folders par date de mise à jour</span>
                <span onclick='loadMatrixData(this)' data-demarche='` + demarche + `' data-reload='*' class='reloadIcon button interact'></span>
                <span onclick='downloadMatrix(this)' data-demarche='` + demarche + `' data-copy='*' class='copyIcon button interact'></span>
            </div>`;

        var html = `<table class='fl-table demarche ` + demarche + ` folders'>`;
        html += "<thead><tr class='header'><th></th>";
        _FOLDER_STATUS.forEach(s => {
            html += "<th class='" + s + "'>" + s + "</th>";
        });
        html += "</thead>";

        html += "<tbody>";
        FOLDER_TIME_DIVISIONS.forEach(td => {

            html += `<tr class='header'>
                <td>
                    ` + td.label + `
                    <span onclick='loadMatrixData(this)' data-demarche='` + demarche + `' data-reload='` + td.id + `' class='reloadIcon interact'></span><br/><small>`;

            if (td.start != null && td.singleDay)
                html += td.showStart;
            else if (td.start != null && td.end != null)
                html += td.showStart + "-" + td.showEnd;
            else if (td.start != null && td.end ==null)
                html += "> " + td.showStart;
            else if (td.start == null && td.end != null)
                html += "≤ " + td.showEnd;
            else
                html += "?"
            html += "</small></td>";

            _FOLDER_STATUS.forEach(s => {

                var h = readConfig(demarche, "highlights." + s);

                var highlight = false;
                if (h != null && h.length > 0)
                    highlight = (h[0] == "*" || h.includes(td.id));

                html += "<td onclick='downloadDetails(this)' data-tdid='" + td.id + "' data-status='" + s + "' data-demarche='" + demarche + "' class='" + s + " " + td.id + " interact" + (highlight ? " highlight" : "") + "'>?</td>";
            });
            html += "</tr>";
        })
        html += "</tbody>";

        html += "</table>";
        var container = document.createElement("div");
        container.classList.add("table-wrapper");
        container.innerHTML = html;

        document.body.appendChild(container);

        /*
         * Construction du tableau des notifications
         */
        var monitorNotifications = readConfig(demarche, "notifications.monitorNotifications", true, false);
        if (!monitorNotifications)
            continue;

        var folderStatusToUse = readConfig(demarche, "notifications.folderStatusToUse", true, ["*"]);
        if (folderStatusToUse.length == 1 && folderStatusToUse[0] == "*")
            folderStatusToUse = FOLDER_STATUS;
        else
        {
            folderStatusToUse = folderStatusToUse.filter( function( el ) { return FOLDER_STATUS.includes(el) });
        }

        document.body.innerHTML += `
            <div class='menuBar'>
                <span class='subTitle'>2 - Notifications en anomalie, créees entre hier et aujourd'hui</span>
                <span onclick='loadNotificationsData(this)' data-demarche='` + demarche + `' class='reloadIcon button interact'></span><br/>
                <span class='subTitle small'>⚠️ Statuts dossiers pris en compte : ` + folderStatusToUse.join(", ") + `</span>
                <span class='subTitle small'>⚠️ Pour les dossiers mis à jour : entre hier et aujourd'hui</span>
                <span class='subTitle small'>⚠️ Limité aux notifications des ` + CONFIG.GLOBAL.notificationsSize + ` premiers dossiers retournés au maximum</span>
            </div>`;

        html = `<table class='fl-table demarche ` + demarche + ` notifications'>
            <thead><tr class='header'><th></th>`;
            NOTIFICATIONS_TIME_DIVISIONS.forEach(TD => {
                html += "<th class='" + TD.id + "'>" + TD.label + "</th>";
            });
            html += "</thead>";
    
            html += "<tbody>";
            NOTIFICATIONS_STATUS.filter(NS => CONFIG.GLOBAL.notificationStatusToMonitor.includes(NS)).forEach(NS => {
    
                html += "<tr class='header'><td>" + NS + "</td>";
    
                NOTIFICATIONS_TIME_DIVISIONS.forEach(TD => {
                    html += "<td class='" + TD.id + " " + NS + (NS=="ERROR" ? " highlight" : "") + "'>?</td>";
                });
                html += "</tr>";
            })
            html += "</tbody>";
    
            html += "</table>";
            container = document.createElement("div");
            container.classList.add("table-wrapper");
            container.innerHTML = html;
    
            document.body.appendChild(container);

    }
}

function downloadDetails(d) {
    if (d.classList.contains("disable"))
        return;

    var demarche = d.getAttribute("data-demarche");
    var FS = d.getAttribute("data-status");
    var TDID = d.getAttribute("data-tdid");
    var TD = FOLDER_TIME_DIVISIONS.filter(i => i.id == TDID)[0];

    if (!d.classList.contains("alert"))
        return;
    
    if (isNaN(d.innerText))
        return;
    
    var nbErrors = parseInt(d.innerText);
    GTpageSizeLimit
    var detailsBatchSizeBatchSize = Math.min(CONFIG.GLOBAL.GTpageSizeLimit, CONFIG.GLOBAL.detailsBatchSize);
    var nbPages = Math.ceil(nbErrors/detailsBatchSizeBatchSize);

    var queries = [];
    for(var page = 0; page <= nbPages - 1; page++)
    {
        queries.push({
            "url" : QUERY_GETFOLDERS.replace("%%DEMARCHE%%", demarche).replace("%%STATUS%%", FS).replace("%%STARTDATE%%", TD.start).replace("%%ENDDATE%%", TD.end).replace("%%PAGE%%",page).replace("%%PAGESIZE%%", detailsBatchSizeBatchSize).replace("%%NOTIFICATIONSTATUS%%",""),
            "demarche" : demarche,
            "FS" : FS,
            "TDID" : TD
        });
    }
    queuedFetch.addRequest(queries, getDetailsComplete);
}

function getDetailsComplete(queries) {
    console.log(queries);
    var folders = [];
    queries.forEach(q => folders = folders.concat(q.response.content));

    var foldersCSV = [];

    folders.forEach(folder => {
        foldersCSV.push(folder.id + ";" + folder.creationDate.replaceAll("-", "/") + ";" + folder.lastStatusUpdate.replaceAll("-", "/") + ";" + folder.codeDemarche + ";" + folder.idDemarche + ";" + folder.status);
    });

    dateGeneration = new Date();
    dateGenerationFormat = dateGeneration.getFullYear() + (dateGeneration.getMonth() + "").padStart(2, "0") + (dateGeneration.getDate() + "").padStart(2, "0");

    downloadObjectAsCSV(foldersCSV.join("\r\n"), dateGenerationFormat + "_extractFolders.csv");
}

function downloadMatrix(d) {
    var demarche = d.getAttribute("data-demarche");
    var copyType = d.getAttribute("data-copy");

    var csv = [];
    var CSVline = [];
    document.querySelectorAll("table."+ demarche + ".folders thead tr th").forEach(node => {
        CSVline.push(node.innerText);
    });
    csv.push(CSVline.join(";"));

    document.querySelectorAll("table."+ demarche + ".folders tbody tr").forEach(TR => {
        CSVline = [];
        TR.querySelectorAll(":scope > td").forEach(TD => {
           var small = TD.querySelector(":scope > small");
           if (small != null)
               CSVline.push(small.innerText);
           else
               CSVline.push(TD.innerText);
        });
        csv.push(CSVline.join(";"));
    });

    var csvData = csv.join("\r\n");

    var dateGeneration = new Date();
    dateGenerationFormat = dateGeneration.getFullYear() + ((dateGeneration.getMonth()+1) + "").padStart(2, "0") + (dateGeneration.getDate() + "").padStart(2, "0");

    downloadObjectAsCSV(csvData, "demarche_" + demarche + "_" + dateGenerationFormat + ".csv");
}

async function loadMatrixData(d) {

    if (d.classList.contains("disable"))
        return;
    
    var demarche = d.getAttribute("data-demarche");
    var reloadType = d.getAttribute("data-reload");

    /* Récupération de la liste des status à superviser */
    var _FOLDER_STATUS = readConfig(demarche, "status", true, ["*"]);
    if (_FOLDER_STATUS.length == 1 && _FOLDER_STATUS[0] == "*")
        /* Status à superviser pour la démarche sont tous les statuts  */
        _FOLDER_STATUS = FOLDER_STATUS;
    else
    {
        /* On contrôle que les status à superviser pour la démarche existe */
        _FOLDER_STATUS = _FOLDER_STATUS.filter( function( el ) { return FOLDER_STATUS.includes(el) });
    }
        
    FOLDER_TIME_DIVISIONS.filter(TD => (CONFIG.GLOBAL.disableComputeForTimeDivision.filter(x => x == TD.id).length == 0) &&
                                (TD.id == reloadType || reloadType == "*"))
        .forEach(TD => {
            _FOLDER_STATUS.forEach(FS => {
                document.querySelector("table." + demarche + ".folders td." + FS + "." + TD.id).innerText = "\u231B";
                document.querySelector("table." + demarche + ".folders td." + FS + "." + TD.id).classList.remove("alert");
                var query = {
                    "url" : QUERY_GETFOLDERS.replace("%%DEMARCHE%%", demarche).replace("%%STATUS%%", FS).replace("%%STARTDATE%%", TD.start ?? "").replace("%%ENDDATE%%", TD.end ?? "").replace("%%PAGE%%","").replace("%%PAGESIZE%%","").replace("%%NOTIFICATIONSTATUS%%",""),
                    "demarche" : demarche,
                    "FS" : FS,
                    "TD" : TD
            };
            queuedFetch.addRequest(query, getMatrixDataComplete);
        });
    });
}

function getMatrixDataComplete(queries)
{
    var item = queries[0];

    document.querySelector("table." + item.query.demarche + ".folders td." + item.query.FS + "." + item.query.TD.id).innerText = item.response.totalElements;

    /* highlight */
    if (item.response.totalElements > 0) 
    {
        var h = readConfig(item.query.demarche, "highlights." + item.query.FS);
        if (h != null && h.length > 0)
        {
            if (h[0] == "*" || h.includes(item.query.TD.id))
                document.querySelector("table." + item.query.demarche + ".folders td." + item.query.FS + "." + item.query.TD.id).classList.add("alert");
        }
    }
    
}

function loadNotificationsData(d)
{
    if (d.classList.contains("disable"))
    return;

    var demarche = d.getAttribute("data-demarche");

    /* Réinitalisation des données de notifications pour la démarche */
    NOTIFICATIONS_DATAS[demarche] = {};

    /* Nettoyage du tableau */
    document.querySelectorAll("table."+ demarche + ".notifications tbody tr").forEach(TR => {
        TR.querySelectorAll(":scope > td:not(:first-child)").forEach(TD => {
            TD.innerText = "";
        });
    });
    document.querySelectorAll("table."+ demarche + ".notifications tbody tr td.alert").forEach(TD => TD.classList.remove("alert"));

    var notificationsSize = Math.min(CONFIG.GLOBAL.GTpageSizeLimit, CONFIG.GLOBAL.notificationsSize);
    var notificationStatusToMonitor = NOTIFICATIONS_STATUS.filter(NS => CONFIG.GLOBAL.notificationStatusToMonitor.includes(NS));
    var folderStatusForNotificationsMonitoring;

    var folderStatusToUse = readConfig(demarche, "notifications.folderStatusToUse", true, ["*"]);
    if (folderStatusToUse.length == 1 && folderStatusToUse[0] == "*")
        folderStatusToUse = FOLDER_STATUS;
    else
    {
        folderStatusToUse = folderStatusToUse.filter( function( el ) { return FOLDER_STATUS.includes(el) });
    }

    var query = {
        "url" : QUERY_GETFOLDERS.replace("%%DEMARCHE%%", demarche).replace("%%STATUS%%", folderStatusToUse.join(",")).replace("%%STARTDATE%%", YESTERDAY.toISOString().split("T")[0]).replace("%%ENDDATE%%", "").replace("%%PAGE%%", 0).replace("%%PAGESIZE%%", notificationsSize).replace("%%NOTIFICATIONSTATUS%%",notificationStatusToMonitor.join(",")),
        "demarche" : demarche
    }

    CustomProgressbarManager_onDemand.setProgression(0,100).setTitle("Récupération de la liste des dossiers. Cela peut prendre du temps...").show();

    Progressbar.setManager(CustomProgressbarManager_onDemand);

    queuedFetch.addRequest(query, getFoldersListComplete);
}

function getFoldersListComplete(items)
{
    var getSendingsQueries = [];

    items[0].response.content.map(x => getSendingsQueries.push({
        "url" : QUERY_GETSENDINGS.replace("%%FOLDERID%%", x.id),
        "demarche" : items[0].query.demarche
    }));

    if (getSendingsQueries.length > 0) {
        CustomProgressbarManager_onDemand.setProgression(0,getSendingsQueries.length).setTitle("Récupération des sendings (0/" + getSendingsQueries.length + ") ...");
        queuedFetch.addRequest(getSendingsQueries, getSendingsDataComplete, getSendingsDataPartial);
    }
    else
    {
        getNotificationsDataComplete(null);
    }
}

function getSendingsDataPartial(item)
{
    var progression = CustomProgressbarManager_onDemand.getProgression();
    CustomProgressbarManager_onDemand.setProgression(progression.current + 1, progression.target).setTitle("Récupération des sendings (" + (progression.current + 1) + "/" + progression.target + ") ...");
}

function getSendingsDataComplete(items)
{

    var getNotificationsQueries = [];

    items.forEach(item => getNotificationsQueries.push({
        "url" : QUERY_GETNOTIFICATIONS.replace("%%SENDINGID%%", item.response[0].id),
        "demarche" : items[0].query.demarche
    }));

    CustomProgressbarManager_onDemand.setProgression(0, getNotificationsQueries.length).setTitle("Récupération des notifications (0/" + getNotificationsQueries.length + ") ...");

    queuedFetch.addRequest(getNotificationsQueries, getNotificationsDataComplete, getNotificationsDataPartial);
}



function getNotificationsDataPartial(item)
{
    item.response.forEach(notification => {

        if (CONFIG.GLOBAL.notificationStatusToMonitor.includes(notification.status))
        { 
 
            var dateCreationNotification = helper.GTDate2JSDate(notification.creationDate);

            /* On ne prend que les notifications dont la date de création est dans le périmètre du tableau */
            var TD = NOTIFICATIONS_TIME_DIVISIONS.filter(TD => TD.startH <= dateCreationNotification && TD.endH >= dateCreationNotification);

            if (TD.length == 1) {

                TD = TD[0];

                if (!NOTIFICATIONS_DATAS[item.query.demarche].hasOwnProperty(notification.status))
                    NOTIFICATIONS_DATAS[item.query.demarche][notification.status] = {};
                if (!NOTIFICATIONS_DATAS[item.query.demarche][notification.status].hasOwnProperty(TD.id))
                    NOTIFICATIONS_DATAS[item.query.demarche][notification.status][TD.id] = [];

                NOTIFICATIONS_DATAS[item.query.demarche][notification.status][TD.id].push(notification);
                var htmlo = document.querySelector("table."+ item.query.demarche + ".notifications td." + notification.status + "." + TD.id);

                if (htmlo != null)
                {
                    var num = 0;
                    if (!isNaN(htmlo.innerText) && htmlo.innerText != "")
                        num = parseInt(htmlo.innerText);
                    
                    htmlo.innerText = ++num;

                    if (num > 0 && htmlo.classList.contains("highlight"))
                        htmlo.classList.add("alert");
                }
            }
        }
    });

    var progression = CustomProgressbarManager_onDemand.getProgression();
    CustomProgressbarManager_onDemand.setProgression(progression.current + 1, progression.target).setTitle("Récupération des notifications (" + (progression.current + 1) + "/" + progression.target + ") ...");
}

function getNotificationsDataComplete(items) {
    CustomProgressbarManager_onDemand.hide();
    Progressbar.setManager(CustomProgressbarManager_queuedFetch);
}

const helper = (function () {
    function GTDate2JSDate(GTDate) {
        var [dateValues, timeValues] = GTDate.split(' ');
        var [day, month, year] = dateValues.split('-');
        var [hours, minutes, seconds] = timeValues.split(':');
        return new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
    }
    return {
        GTDate2JSDate: GTDate2JSDate
    }
    
})()

var queuedFetch = (function () {

    var f = checkQueue.bind(this);

    setInterval(f, 100);

    const MAX_PARALLEL_CALL = 3;
    const MAX_CALL_PER_SECOND = 3;

    var seconds = {};
    var queue = [];
    var activeCall = 0;

    function queueSize() {
        return queue.length;
    }

    function activeConnection() {
        return activeCall;
    }

    function queueRequest(os, f1, f2) {

        if (!Array.isArray(os)) {
            os = [os];
        }

        /* Création d'un contexte d'exécution multirequêtes autoréférencé */
        var context = {"queries" : [], "callbackFunctionOnComplete" : f1, "callbackFunctionOnResponse" : f2};

        os.forEach(o => context.queries.push({"query" : o, "retries" : 0, "done" : false, "result" : null}));
        context.queries.forEach(q => {
                q.context = context;
            });

        /* Ajout des requetes */
        context.queries.forEach(q => queue.push(q));
    }


    function onPromiseCompleteOrFailure() {
        activeCall--;
    }

    function checkQueue() {

        secondToCheck = Math.floor(Date.now() / 1000);
        if (seconds[secondToCheck] === undefined)
            seconds[secondToCheck] = 0;

        if (queue.length && activeCall <= MAX_PARALLEL_CALL && seconds[secondToCheck] <= MAX_CALL_PER_SECOND) {

            seconds[secondToCheck]++;

            let item = queue.shift();
            if (!item) {
                return;
            }
 
            activeCall++;

            fetch(item.query.url)
                .then(res => res.json())
                .then(response => {
                    onPromiseCompleteOrFailure();

                    item.response = response;
                    item.done = true;

                    try {
                        if (item.context.callbackFunctionOnResponse != null)
                            item.context.callbackFunctionOnResponse(item);

                        if (item.context.callbackFunctionOnComplete && item.context.queries.filter(q => q.done).length == item.context.queries.length) {
                            item.context.callbackFunctionOnComplete(item.context.queries);
                        }
                    } catch(error) {
                        console.error('queuedFetch post-processing error for ' + item.query.url, error);
                    }

                })
                .catch(error => {
                    onPromiseCompleteOrFailure();
                    console.error('queuedFetch pre-processing error for ' + item.query.url, error);
                    if (++item.retries <= 3)
                        queue.push(item);
                })
        }
    }

    return {
        getQueueSize: queueSize,
        addRequest: queueRequest,
        getActiveConnection: activeConnection
    }
    
})()

function downloadObjectAsCSV(exportObj, exportName) {
    var dataStr = "data:text/csv;charset=utf-8,\ufeff" + encodeURIComponent(exportObj);
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

const Progressbar = (function () {

    var _manager = null;

    var _isDisplayed = false;

    var _lastProgression = null;

    setInterval(function () {

        _manager.tick();

        var requestDisplay = _manager.isRequestingDisplay();
        
        if (requestDisplay) {
            var progression = _manager.getProgression();

            if (_lastProgression == null || _lastProgression.current != progression.current || _lastProgression.target != progression.target || _lastProgression.title != progression.title)
            {
                percent = Math.floor(100 * progression.current / progression.target);

                document.querySelector(".counter").innerText = percent + "%";
                document.querySelector("span.progress").style["width"] = percent + "%";
                document.querySelector("#waitingMessage .title").innerText = progression.title;

                _lastProgression = progression;
            }
        }

        if (requestDisplay && !_isDisplayed) {
            _isDisplayed = true;
            document.querySelectorAll(".interact:not(.disable)").forEach(i => i.classList.add("disable"));
        }
        else if (!requestDisplay && _isDisplayed) {
            _isDisplayed = false;
            document.querySelectorAll(".interact.disable").forEach(i => i.classList.remove("disable"));
        }
    }, 100);


    function setManager(m)
    {
        _manager = m;
    }

    return {
        setManager : setManager
    };

})();

const CustomProgressbarManager_onDemand = (function () {

    var _current = 0;
    var _target = 0;
    var _title = "...";

    var _display = false;

    function show() {
        _display = true;
        return this;
    }

    function hide() {
        _display = false;
        return this;
    }

    function setTitle(title) {
        _title = title;
        return this;
    }

    function setProgression(cur, tar)
    {
        _current = cur;
        _target = tar;
        return this;
    }

    function tick()
    {
    }

    function isRequestingDisplay() {
        return _display;
    }

    function getProgression() {
        return {"current" : _current, "target" : _target, "title" : _title};
    }

    return {
        show : show,
        hide : hide,
        setTitle : setTitle,
        setProgression : setProgression,

        /* Contrat d'interface avec progress bar */
        getProgression : getProgression,
        isRequestingDisplay : isRequestingDisplay,
        tick : tick
    };

})();

const CustomProgressbarManager_queuedFetch = (function () {

    var _isRequestingDisplay = false;

    var _initialQueueLength = 0;
    
    var _queueSize = 0;
    var _activeConnection = 0;

    function tick()
    {
        _queueSize = queuedFetch.getQueueSize();
        _activeConnection = queuedFetch.getActiveConnection();
        
        if (_queueSize > 0 || _activeConnection > 0)
        {
            if (!_isRequestingDisplay)
                _initialQueueLength = _queueSize;
            else
                _initialQueueLength = Math.max(_initialQueueLength, _queueSize);
                
            _isRequestingDisplay = true;
        }
        else
        {
            _initialQueueLength = 0;
            _isRequestingDisplay = false;
        }
    }

    function isRequestingDisplay() {
        return _isRequestingDisplay;
    }

    function getProgression() {
        return {"current" : _initialQueueLength - _queueSize, "target" : _initialQueueLength, "title" : "Je discute avec GT..."};
    }

    return {
        
        /* Contrat d'interface avec progress bar */
        getProgression : getProgression,
        isRequestingDisplay : isRequestingDisplay,
        tick : tick
    };

})();

function initialize() {

    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = EXTERNAL_RESSOURCES + "/supervision.css";
    link.media = 'all';
    head.appendChild(link);

    Progressbar.setManager(CustomProgressbarManager_queuedFetch);

    /* Construction du menu */
    var menuHTML = `<div id='waitingMessage' class='interact'>
        <span>Patientez svp... les actions sont désactivées pour le moment.</span>
        <div class="progressbar"><span class="progress"></span><div class="counter">0%</div></div>
        <span class='title'></span>
    </div>
    <nav class='interact'>
        <menu>
            <menuitem id="perimetreList">
                <a>Périmètres</a>
                <menu>`;
    
    CONFIG.GLOBAL.perimeters.forEach((p,i) => {
        menuHTML += "<menuitem><a onclick='loadPerimeter(" + i + ")'>" + p.name + "</a></menuitem>";
    });

    menuHTML += `</menu>
            </menuitem>
        </menu>
    </nav>`;

    document.body.innerHTML = menuHTML;
}

function loadPerimeter(index)
{
    while(document.body.children.length > 2)
        document.body.children[2].remove();

    displayPerimeter.apply(null, CONFIG.GLOBAL.perimeters[index].demarches);
    
}

initialize();
//buildMatrix("DICPE", "DAENV", "arnaqueInternet");
