var GTOverride = null;

/* Dans le cas d'un chargement hors bookmark */
if (typeof helper === "undefined" && typeof queuedFetch === "undefined") {
    const __delay = ms => new Promise(res => setTimeout(res, ms));

    function _loadScript(e, t) {
        var i = document.createElement("script");
        i.type = "text/javascript";
        i.onload = function () { t() };
        i.src = e; document.getElementsByTagName("head")[0].appendChild(i)
    };
    _loadScript(
        "https://rico91130.github.io/Tools/Helper.js?" + (new Date()).getTime(),
        function () {
            helper.loadScripts("Tools/QueuedFetch.js").then(
                setTimeout(function () {
                    GTOverride = new _GTOverride();
                }, 1000)
            );
        });
}

function _GTOverride() {

    /* Lire la configuration */
    function readConfig(context, _key, useTemplateValue, defaultValue) {
        useTemplateValue = useTemplateValue ?? true;

        var keys = _key.split(".");
        var value = defaultValue;
        var read = false;

        if (configCheckNested(CONFIG, ["demarches", context].concat(keys))) {
            value = eval("CONFIG." + ["demarches", context].concat(keys).join("."));
            read = true;
        }

        if (!read) {
            /*
            * Dans certains context, on ne doit pas passer par ce code,
            * car l'utilisation du modèle par défaut ne concerne que le contexte des démarches
            */
            if (!["GLOBAL", "templates"].includes(context) && useTemplateValue) {
                var defaultTemplate = "DEFAULT";

                /* On regarde si il existe un template à utiliser (autrement, utilisation de DEFAULT) */
                if (configCheckNested(CONFIG, ["demarches", context, "defaultTemplate"]))
                    defaultTemplate = CONFIG.demarches[context].defaultTemplate;

                if (configCheckNested(CONFIG, ["templates", defaultTemplate].concat(keys)))
                    value = eval("CONFIG." + ["templates", defaultTemplate].concat(keys).join("."));

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

    function createNextFTD(origin, id, label, days) {

        var newTD = {
            "id": id,
            "label": label,
            "singleDay": (days == -1 || days == 0)
        };

        /* Cas normal (hors date du jour) */
        if (days != 0) {
            newTD.end = helper.JSDate2GTDate(origin.dStart);
            newTD.dEnd = origin.dStart;
        }

        /* Cas ou il s'agit d'une période bornée */
        if (days != null) {
            const dNewTD = new Date();
            if (days == 0)
                dNewTD.setTime(origin.getTime() + days * 24 * 60 * 60 * 1000);
            else
                dNewTD.setTime(origin.dStart.getTime() + days * 24 * 60 * 60 * 1000);

            newTD.start = helper.JSDate2GTDate(dNewTD);
            newTD.dStart = dNewTD;
        }

        /* Mise à jour des libellés à afficher */
        if (newTD.start != null)
            newTD.showStart = newTD.start.split("-")[2] + "/" + newTD.start.split("-")[1];
        if (newTD.end != null && !newTD.singleDay) {
            const dNewTDShow = new Date();
            dNewTDShow.setTime(newTD.dEnd.getTime() - 24 * 60 * 60 * 1000)
            newTD.showEnd = helper.JSDate2GTDate(dNewTDShow).split("-")[2] + "/" + helper.JSDate2GTDate(dNewTDShow).split("-")[1];
        }

        return newTD;
    }

    var CONFIG = {}

    const ENVIRONMENT = document.location.origin;
    const EXTERNAL_RESSOURCES = "https://rico91130.github.io/GTOverride/";
    const QUERY_GETFOLDERS = ENVIRONMENT + "/gtconsole/folders?id=&startDate=&endDate=&startTime=&endTime=&code=%%DEMARCHE%%&status=%%STATUS%%&siret=&guichet=&caseStatus=&notificationStatus=%%NOTIFICATIONSTATUS%%&lastUpdateStartDate=%%STARTDATE%%&lastUpdateEndDate=%%ENDDATE%%&page=%%PAGE%%&pageSize=%%PAGESIZE%%";
    const QUERY_GETSENDINGS = ENVIRONMENT + "/gtconsole/folders/%%FOLDERID%%/sendings";
    const QUERY_GETNOTIFICATIONS = ENVIRONMENT + "/gtconsole/sendings/%%SENDINGID%%/notifications";

    const FOLDER_STATUS = ["OK", "SENT", "PENDING", "HUBEE_RECEIVED", "HUBEE_NOTIFIED", "SI_RECEIVED", "IN_PROGRESS", "ADD_AWAITING", "REFUSED", "DONE", "CLOSED", "ARCHIVED", "CANCELLED", "SI_INTG_ERROR", "ERROR"];
    const FOLDER_TIME_DIVISIONS = [];

    const today = createNextFTD(new Date(), "TD_today", "Aujourd'hui", 0);
    const yesterday = createNextFTD(today, "TD_yesterday", "Hier", -1);
    const beforeYesterday = createNextFTD(yesterday, "TD_beforeYesterday", "Avant hier", -1);
    const next7days = createNextFTD(beforeYesterday, "TD_next7days", "7 jours précédents", -7);
    const next30days = createNextFTD(next7days, "TD_next30days", "30 jours précédents", -30);
    const remainingDays = createNextFTD(next30days, "TD_remainingDays", "Encore avant");

    FOLDER_TIME_DIVISIONS.push(today);
    FOLDER_TIME_DIVISIONS.push(yesterday);
    FOLDER_TIME_DIVISIONS.push(beforeYesterday);
    FOLDER_TIME_DIVISIONS.push(next7days);
    FOLDER_TIME_DIVISIONS.push(next30days);
    FOLDER_TIME_DIVISIONS.push(remainingDays);

    const NOTIFICATIONS_STATUS = ["INIT", "OK", "PENDING", "ERROR", "DISABLED"];
    const NOTIFICATIONS_TIME_DIVISIONS = [];

    const YESTERDAY = new Date();
    YESTERDAY.setTime(YESTERDAY.getTime() - 24 * 60 * 60 * 1000);
    YESTERDAY.setHours(0);
    YESTERDAY.setMinutes(0);
    YESTERDAY.setSeconds(0);
    YESTERDAY.setMilliseconds(0);

    var debutH = new Date();
    debutH.setMinutes(0);
    debutH.setSeconds(0);
    debutH.setMilliseconds(0);
    debutH.setTime(debutH.getTime() + 60 * 60 * 1000);

    var debutPlage = null;
    var finPlage = null;

    var timeOffset = 2;
    for (var plage = 0; plage < 10; plage++) {
        debutPlage = new Date();
        debutPlage.setTime(debutH.getTime() - (plage + 1) * timeOffset * 60 * 60 * 1000);
        finPlage = new Date();
        finPlage.setTime(debutH.getTime() - (plage) * timeOffset * 60 * 60 * 1000 - 1);

        NOTIFICATIONS_TIME_DIVISIONS.push({
            "startH": debutPlage,
            "endH": finPlage,
            "label": debutPlage.getDate().toString().padStart(2, "0") + "/" +
                (debutPlage.getMonth() + 1).toString().padStart(2, "0") + " " +
                debutPlage.getHours().toString().padStart(2, "0") + "h" +
                debutPlage.getMinutes().toString().padStart(2, "0") + " - " +
                (finPlage.getDate() != debutPlage.getDate() ? (finPlage.getDate().toString().padStart(2, "0") + "/" + (finPlage.getMonth() + 1).toString().padStart(2, "0") + " ") : "") +
                finPlage.getHours().toString().padStart(2, "0") + "h" +
                finPlage.getMinutes().toString().padStart(2, "0"),
            "id": "NS_" + debutPlage.getHours() + "_" + finPlage.getHours()
        })

        finH = finPlage;
    }

    /* Cas particulier de la TIME DIVISION fourre tout */
    finPlage.setTime(debutPlage.getTime() - 1);
    debutPlage = YESTERDAY
    NOTIFICATIONS_TIME_DIVISIONS.push({
        "startH": YESTERDAY,
        "endH": finPlage,
        "label": debutPlage.getDate().toString().padStart(2, "0") + "/" +
            (debutPlage.getMonth() + 1).toString().padStart(2, "0") + " " +
            debutPlage.getHours().toString().padStart(2, "0") + "h" +
            debutPlage.getMinutes().toString().padStart(2, "0") + " - " +
            (finPlage.getDate() != debutPlage.getDate() ? (finPlage.getDate().toString().padStart(2, "0") + "/" + (finPlage.getMonth() + 1).toString().padStart(2, "0") + " ") : "") +
            finPlage.getHours().toString().padStart(2, "0") + "h" +
            finPlage.getMinutes().toString().padStart(2, "0"),
        "id": "NS_Before"
    });
    NOTIFICATIONS_TIME_DIVISIONS.reverse();

    const NOTIFICATIONS_DATAS = {

        "exists": function (demarche, statut, time) {

            if (demarche != null && statut != null && time != null)
                return NOTIFICATIONS_DATAS.hasOwnProperty(demarche) &&
                    NOTIFICATIONS_DATAS[demarche].hasOwnProperty(statut) &&
                    NOTIFICATIONS_DATAS[demarche][statut].hasOwnProperty(time);

            if (demarche != null && statut != null)
                return NOTIFICATIONS_DATAS.hasOwnProperty(demarche) &&
                    NOTIFICATIONS_DATAS[demarche].hasOwnProperty(statut) &&
                    Object.keys(NOTIFICATIONS_DATAS[demarche][statut]).length > 0;

            if (demarche != null)
                return NOTIFICATIONS_DATAS.hasOwnProperty(demarche);
        },

        "getOrCreate": function (demarche, statut, time) {

            if (!this.exists(demarche))
                this[demarche] = {};

            if (statut != null && !this.exists(demarche, statut))
                this[demarche][statut] = {};

            if (statut != null && time != "null" && !this.exists(demarche, statut, time))
                this[demarche][statut][time] = [];

            if (time != null)
                return this[demarche][statut][time];

            if (statut != null)
                return this[demarche][statut];

            if (demarche != null)
                return this[demarche];
        },

        "concat": function (demarche, statut) {
            if (!this.exists(demarche, statut))
                return [];

            var notifications = [];
            Object.keys(this[demarche]).filter(_statut => statut == _statut || statut == null).forEach(NS => {
                Object.keys(this[demarche][NS]).forEach(TD => {
                    notifications = notifications.concat(this[demarche][NS][TD]);
                });
            });

            return notifications.sort((a, b) => { return helper.GTDate2JSDate(b.creationDate) - helper.GTDate2JSDate(a.creationDate) });
        }
    };

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
            else {
                /* On contrôle que les status à superviser pour la démarche existe */
                _FOLDER_STATUS = _FOLDER_STATUS.filter(function (el) { return FOLDER_STATUS.includes(el) });
            }

            /* Nom du template utilisée */
            var template = readConfig(demarche, "defaultTemplate", false, "DEFAULT");
            template = CONFIG.templates[template].templateName;

            /* On check si c'est un template modifié */
            var customizedTemplate = (readConfig(demarche, "status", false) != null) ||
                (readConfig(demarche, "highlights", false) != null) ||
                (readConfig(demarche, "notifications", false) != null);

            if (template != "DEFAULT TEMPLATE" && customizedTemplate)
                template += " (edité)";

            /* Est-ce un agrégat de démarches */
            var agregat = (readConfig(demarche, "GTName", false, "").indexOf(",") != -1);

            document.body.innerHTML += `
                <div class='menuBar'>
                    <span class='demarcheName ` + demarche + `'>` + readConfig(demarche, "displayName", false, demarche) + `</span>
                    <span class='templateName'>` + template + `</span>` + (agregat ? `<span class='templateName'>Agrégat : ` + readConfig(demarche, "GTName") : ``) + `</span>
                </div>
                <div class='menuBar'>
                    <span class='subTitle'>1 - Status des folders par date de mise à jour</span>
                    <span onclick='GTOverride.loadMatrixData(this)' data-demarche='` + demarche + `' data-reload='*' class='reloadIcon button interact'></span>
                    <span onclick='GTOverride.downloadMatrix(this)' data-demarche='` + demarche + `' data-copy='*' class='copyIcon button interact'></span>
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
                        <span onclick='GTOverride.loadMatrixData(this)' data-demarche='` + demarche + `' data-reload='` + td.id + `' class='reloadIcon interact'></span><br/><small>`;

                if (td.start != null && td.singleDay)
                    html += td.showStart;
                else if (td.start != null && td.end != null)
                    html += td.showStart + "-" + td.showEnd;
                else if (td.start != null && td.end == null)
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

                    html += "<td onclick='GTOverride.downloadDetails(this)' data-tdid='" + td.id + "' data-status='" + s + "' data-demarche='" + demarche + "' class='" + s + " " + td.id + " interact" + (highlight ? " highlight" : "") + "'>?</td>";
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
            else {
                folderStatusToUse = folderStatusToUse.filter(function (el) { return FOLDER_STATUS.includes(el) });
            }

            var notificationsSize = Math.min(CONFIG.GLOBAL.GTpageSizeLimit, readConfig(demarche, "notifications.sampleSize", true, CONFIG.GLOBAL.notificationsSize));

            document.body.innerHTML += `
                <div class='menuBar'>
                    <span class='subTitle'>2 - Notifications en anomalie, créees entre hier et aujourd'hui</span>
                    <span onclick='GTOverride.loadNotificationsData(this)' data-demarche='` + demarche + `' class='reloadIcon button interact'></span><br/>
                    <span class='subTitle small'>⚠️ Notifications en anomalie liées au changement de statut du dossier : ` + folderStatusToUse.join(", ") + `</span>
                    <span class='subTitle small'>⚠️ Pour les dossiers mis à jour : entre hier et aujourd'hui</span>
                    <span class='subTitle small'>⚠️ Limité aux notifications des ` + notificationsSize + ` derniers dossiers correspondants</span>
                </div>`;

            html = `<table class='fl-table demarche ` + demarche + ` notifications'>
                <thead><tr class='header'><th></th>`;
            NOTIFICATIONS_TIME_DIVISIONS.forEach(TD => {
                html += "<th class='" + TD.id + "'>" + TD.label + "</th>";
            });
            html += "</thead>";

            html += "<tbody>";
            NOTIFICATIONS_STATUS.filter(NS => CONFIG.GLOBAL.notificationStatusToMonitor.includes(NS)).forEach(NS => {

                html += "<tr class='header'><td data-demarche='" + demarche + "' data-status='" + NS + "' onclick='GTOverride.downloadNotificationsDetails(this)' class='interact'>" + NS + "</td>";

                NOTIFICATIONS_TIME_DIVISIONS.forEach(TD => {
                    html += "<td class='" + TD.id + " " + NS + (NS == "ERROR" ? " highlight" : "") + "'>?</td>";
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

    function downloadNotificationsDetails(d) {
        if (d.classList.contains("disable"))
            return;

        var demarche = d.getAttribute("data-demarche");
        var NS = d.getAttribute("data-status");

        /* On vérifie qu'il y a bien des données de notification pour la démarche en question */
        if (!NOTIFICATIONS_DATAS.exists(demarche, NS))
            return;

        var notificationsList = NOTIFICATIONS_DATAS.concat(demarche, NS);

        var notificationsCSV = [];
        var notificationsCSVLine = [];

        /*
         * On parse les notifications pour récupérer les colonnes à exporter
         * Avant : on génère les header
         * Pendant : recherche des colonnes et éventuel post processing
         */
        CONFIG.GLOBAL.notificationExportData.forEach(header => {
            notificationsCSVLine.push(header.alias ?? header.key);
        });
        notificationsCSV.push(notificationsCSVLine.join(";"));

        notificationsList.forEach(notification => {
            notificationsCSVLine = [];
            CONFIG.GLOBAL.notificationExportData.forEach(header => {
                var data = notification.hasOwnProperty(header.key) ? notification[header.key] : "";
                if (header.hasOwnProperty("value")) {
                    data = eval(header.value.replace("%", "data"));
                }
                data = ("" + data).replaceAll(";", ",").replaceAll("\r", "").replaceAll("\n", "");
                notificationsCSVLine.push(data);
            });
            notificationsCSV.push(notificationsCSVLine.join(";"));
        });

        helper.downloadObjectAsCSV(notificationsCSV.join("\r\n"), "notifications");
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

        var detailsBatchSizeBatchSize = Math.min(CONFIG.GLOBAL.GTpageSizeLimit, CONFIG.GLOBAL.detailsBatchSize);
        var nbPages = Math.ceil(nbErrors / detailsBatchSizeBatchSize);

        var queries = [];
        for (var page = 0; page <= nbPages - 1; page++) {
            queries.push({
                "url": helper.buildQuery(QUERY_GETFOLDERS, {
                    "DEMARCHE": readConfig(demarche, "GTName", false, demarche),
                    "STATUS": FS,
                    "STARTDATE": TD.start ?? "",
                    "ENDDATE": TD.end ?? "", /* quand il n'y a pas de date de fin pour la TD "aujourd'hui" */
                    "PAGE": page,
                    "PAGESIZE": detailsBatchSizeBatchSize
                }),
                "demarche": demarche,
                "FS": FS,
                "TDID": TD
            });
        }

        queuedFetch.addRequest(queries, getDetailsComplete);
    }

    function getDetailsComplete(queries) {

        var folders = [];
        queries.forEach(q => folders = folders.concat(q.response.content));

        var foldersCSV = [];

        folders.forEach(folder => {
            foldersCSV.push(folder.id + ";" + folder.creationDate.replaceAll("-", "/") + ";" + folder.lastStatusUpdate.replaceAll("-", "/") + ";" + folder.codeDemarche + ";" + folder.idDemarche + ";" + folder.status);
        });

        dateGeneration = new Date();
        dateGenerationFormat = dateGeneration.getFullYear() + (dateGeneration.getMonth() + "").padStart(2, "0") + (dateGeneration.getDate() + "").padStart(2, "0");

        helper.downloadObjectAsCSV(foldersCSV.join("\r\n"), dateGenerationFormat + "_extractFolders.csv");
    }

    function downloadMatrix(d) {
        var demarche = d.getAttribute("data-demarche");
        var copyType = d.getAttribute("data-copy");

        var csv = [];
        var CSVline = [];
        document.querySelectorAll("table." + demarche + ".folders thead tr th").forEach(node => {
            CSVline.push(node.innerText);
        });
        csv.push(CSVline.join(";"));

        document.querySelectorAll("table." + demarche + ".folders tbody tr").forEach(TR => {
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
        dateGenerationFormat = dateGeneration.getFullYear() + ((dateGeneration.getMonth() + 1) + "").padStart(2, "0") + (dateGeneration.getDate() + "").padStart(2, "0");

        helper.downloadObjectAsCSV(csvData, "demarche_" + demarche + "_" + dateGenerationFormat + ".csv");
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
        else {
            /* On contrôle que les status à superviser pour la démarche existe */
            _FOLDER_STATUS = _FOLDER_STATUS.filter(function (el) { return FOLDER_STATUS.includes(el) });
        }

        FOLDER_TIME_DIVISIONS.filter(TD => (CONFIG.GLOBAL.disableComputeForTimeDivision.filter(x => x == TD.id).length == 0) &&
            (TD.id == reloadType || reloadType == "*"))
            .forEach(TD => {
                _FOLDER_STATUS.forEach(FS => {
                    document.querySelector("table." + demarche + ".folders td." + FS + "." + TD.id).innerText = "\u231B";
                    document.querySelector("table." + demarche + ".folders td." + FS + "." + TD.id).classList.remove("alert");
                    var query = {
                        "url": helper.buildQuery(QUERY_GETFOLDERS, {
                            "DEMARCHE": readConfig(demarche, "GTName", false, demarche),
                            "STATUS": FS,
                            "STARTDATE": TD.start ?? "",
                            "ENDDATE": TD.end ?? ""
                        }),
                        "demarche": demarche,
                        "FS": FS,
                        "TD": TD
                    };
                    queuedFetch.addRequest(query, getMatrixDataComplete);
                });
            });
    }

    function getMatrixDataComplete(queries) {
        var item = queries[0];

        document.querySelector("table." + item.query.demarche + ".folders td." + item.query.FS + "." + item.query.TD.id).innerText = item.response.totalElements;

        /* highlight */
        if (item.response.totalElements > 0) {
            var h = readConfig(item.query.demarche, "highlights." + item.query.FS);
            if (h != null && h.length > 0) {
                if (h[0] == "*" || h.includes(item.query.TD.id))
                    document.querySelector("table." + item.query.demarche + ".folders td." + item.query.FS + "." + item.query.TD.id).classList.add("alert");
            }
        }

    }

    function loadNotificationsData(d) {
        if (d.classList.contains("disable"))
            return;

        var demarche = d.getAttribute("data-demarche");

        /* Réinitalisation des données de notifications pour la démarche */
        NOTIFICATIONS_DATAS[demarche] = {};

        /* Nettoyage du tableau */
        document.querySelectorAll("table." + demarche + ".notifications tbody tr").forEach(TR => {
            TR.querySelectorAll(":scope > td:not(:first-child)").forEach(TD => {
                TD.innerText = "";
            });
        });
        document.querySelectorAll("table." + demarche + ".notifications tbody tr td.alert").forEach(TD => TD.classList.remove("alert"));

        var notificationsSize = Math.min(CONFIG.GLOBAL.GTpageSizeLimit, readConfig(demarche, "notifications.sampleSize", true, CONFIG.GLOBAL.notificationsSize));
        var notificationStatusToMonitor = NOTIFICATIONS_STATUS.filter(NS => CONFIG.GLOBAL.notificationStatusToMonitor.includes(NS));

        var query = {
            "url": helper.buildQuery(QUERY_GETFOLDERS, {
                "DEMARCHE": readConfig(demarche, "GTName", false, demarche),
                "STARTDATE": helper.JSDate2GTDate(YESTERDAY),
                "PAGE": 0,
                "PAGESIZE": notificationsSize,
                "NOTIFICATIONSTATUS": notificationStatusToMonitor.join(",")
            }),
            "demarche": demarche
        }

        CustomProgressbarManager_onDemand.setProgression(0, 100).setTitle("Récupération de la liste des dossiers. Cela peut prendre du temps...").show();

        Progressbar.setManager(CustomProgressbarManager_onDemand);

        queuedFetch.addRequest(query, getFoldersListComplete);
    }

    function getFoldersListComplete(items) {
        var getSendingsQueries = [];

        items[0].response.content.map(x => getSendingsQueries.push({
            "url": helper.buildQuery(QUERY_GETSENDINGS, { "FOLDERID": x.id }),
            "demarche": items[0].query.demarche
        }));

        if (getSendingsQueries.length > 0) {
            CustomProgressbarManager_onDemand.setProgression(0, getSendingsQueries.length).setTitle("Récupération des sendings (0/" + getSendingsQueries.length + ") ...");
            queuedFetch.addRequest(getSendingsQueries, getSendingsDataComplete, getSendingsDataPartial);
        }
        else {
            getNotificationsDataComplete(null);
        }
    }

    function getSendingsDataPartial(item) {
        var progression = CustomProgressbarManager_onDemand.getProgression();
        CustomProgressbarManager_onDemand.setProgression(progression.current + 1, progression.target).setTitle("Récupération des sendings (" + (progression.current + 1) + "/" + progression.target + ") ...");
    }

    function getSendingsDataComplete(items) {

        var getNotificationsQueries = [];

        items.forEach(item => getNotificationsQueries.push({
            "url": helper.buildQuery(QUERY_GETNOTIFICATIONS, { "SENDINGID": item.response[0].id }),
            "demarche": items[0].query.demarche
        }));

        CustomProgressbarManager_onDemand.setProgression(0, getNotificationsQueries.length).setTitle("Récupération des notifications (0/" + getNotificationsQueries.length + ") ...");

        queuedFetch.addRequest(getNotificationsQueries, getNotificationsDataComplete, getNotificationsDataPartial);
    }

    function getNotificationsDataPartial(item) {

        var folderStatusToUse = readConfig(item.query.demarche, "notifications.folderStatusToUse", true, ["*"]);
        if (folderStatusToUse.length == 1 && folderStatusToUse[0] == "*")
            folderStatusToUse = FOLDER_STATUS;
        else {
            folderStatusToUse = folderStatusToUse.filter(function (el) { return FOLDER_STATUS.includes(el) });
        }

        item.response.forEach(notification => {

            /*
             * Puisque toutes les status de notification sont remontés pour le sending : 
             * 1) on retire les status de notifications non monitoré
             * 2) on retire aussi les status de folder non monitoré
             */
            if (CONFIG.GLOBAL.notificationStatusToMonitor.includes(notification.status) &&
                folderStatusToUse.includes(notification.caseNewStatus)) {
                var dateCreationNotification = helper.GTDate2JSDate(notification.creationDate);

                /* On ne prend que les notifications dont la date de création est dans le périmètre du tableau */
                var TD = NOTIFICATIONS_TIME_DIVISIONS.filter(TD => TD.startH <= dateCreationNotification && TD.endH >= dateCreationNotification);

                if (TD.length == 1) {

                    TD = TD[0];

                    var htmlo = document.querySelector("table." + item.query.demarche + ".notifications td." + notification.status + "." + TD.id);

                    if (htmlo != null) {
                        NOTIFICATIONS_DATAS.getOrCreate(item.query.demarche, notification.status, TD.id).push(notification);

                        var num = 0;
                        if (!isNaN(htmlo.innerText) && htmlo.innerText != "")
                            num = parseInt(htmlo.innerText);

                        htmlo.innerText = ++num;

                        if (num > 0 && htmlo.classList.contains("highlight")) {
                            htmlo.classList.add("alert");
                        }

                    }
                }
            }
        });

        var progression = CustomProgressbarManager_onDemand.getProgression();
        CustomProgressbarManager_onDemand.setProgression(progression.current + 1, progression.target).setTitle("Récupération des notifications (" + (progression.current + 1) + "/" + progression.target + ") ...");
    }

    function getNotificationsDataComplete(items) {

        /* On effectue un contrôle sur items car si il n'y a pas de folders alors on appel cette fonction sans items */
        if (Array.isArray(items)) {
            var demarche = items[0].query.demarche;

            document.querySelectorAll("table." + demarche + ".notifications tbody tr td:first-child").forEach(TD => {
                var status = TD.getAttribute("data-status");

                if (NOTIFICATIONS_DATAS.exists(demarche, status))
                    TD.classList.add("copyIcon");
                else
                    TD.classList.remove("copyIcon");
            });
        }

        CustomProgressbarManager_onDemand.hide();
        Progressbar.setManager(CustomProgressbarManager_queuedFetch);
    }

    const Progressbar = (function () {

        var _manager = null;

        var _isDisplayed = false;

        var _lastProgression = null;

        setInterval(function () {

            if (_manager == null)
                return;

            _manager.tick();

            var requestDisplay = _manager.isRequestingDisplay();

            if (requestDisplay) {
                var progression = _manager.getProgression();

                if (_lastProgression == null || _lastProgression.current != progression.current || _lastProgression.target != progression.target || _lastProgression.title != progression.title) {
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


        function setManager(m) {
            if (typeof m.getProgression === "function" && typeof m.isRequestingDisplay === "function" && typeof m.tick === "function")
                _manager = m;
            else {
                throw new Error('Custom Progress bar cannot set the manager');
            }
        }

        return {
            setManager: setManager
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

        function setProgression(cur, tar) {
            _current = cur;
            _target = tar;
            return this;
        }

        function tick() {
        }

        function isRequestingDisplay() {
            return _display;
        }

        function getProgression() {
            return { "current": _current, "target": _target, "title": _title };
        }

        return {
            show: show,
            hide: hide,
            setTitle: setTitle,
            setProgression: setProgression,

            /* Contrat d'interface avec progress bar */
            getProgression: getProgression,
            isRequestingDisplay: isRequestingDisplay,
            tick: tick
        };

    })();

    const CustomProgressbarManager_queuedFetch = (function () {

        var _isRequestingDisplay = false;

        var _initialQueueLength = 0;

        var _queueSize = 0;
        var _activeConnection = 0;

        function tick() {
            _queueSize = queuedFetch.getQueueSize();
            _activeConnection = queuedFetch.getActiveConnection();

            if (_queueSize > 0 || _activeConnection > 0) {
                if (!_isRequestingDisplay)
                    _initialQueueLength = _queueSize;
                else
                    _initialQueueLength = Math.max(_initialQueueLength, _queueSize);

                _isRequestingDisplay = true;
            }
            else {
                _initialQueueLength = 0;
                _isRequestingDisplay = false;
            }
        }

        function isRequestingDisplay() {
            return _isRequestingDisplay;
        }

        function getProgression() {
            return { "current": _initialQueueLength - _queueSize, "target": _initialQueueLength, "title": "Je discute avec GT..." };
        }

        return {

            /* Contrat d'interface avec progress bar */
            getProgression: getProgression,
            isRequestingDisplay: isRequestingDisplay,
            tick: tick
        };

    })();

    var initialized = false;
    function initialize() {

        /* On initialise qu'une fois */
        if (initialized)
            return;
        initialized = true;

        /* Ajout des feuilles de styles */
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = EXTERNAL_RESSOURCES + "/supervision.css?" + ((new Date()).getTime());
        link.media = 'all';
        head.appendChild(link);

        /* Ajout de la progressbar */
        document.body.innerHTML = `<div id='waitingMessage' class='interact'>
            <span>Patientez svp... les actions sont désactivées pour le moment.</span>
            <div class="progressbar"><span class="progress"></span><div class="counter">0%</div></div>
            <span class='title'></span>
        </div>`;

        /* On map la popin d'attente à la file d'appel Ajax */
        Progressbar.setManager(CustomProgressbarManager_queuedFetch);

        /* Chargement du fichier de configuration de base */
        queuedFetch.addRequest({ "url": EXTERNAL_RESSOURCES + "configuration.json?" + (new Date().getTime()) }, init_getBaseConfigurationComplete);
    }

    function init_getBaseConfigurationComplete(items) {
        CONFIG = items[0].response;

        /*
         * On repasse sur la configuration
         */

        /* Notification : uniformisation des types pour l'export */
        CONFIG.GLOBAL.notificationExportData.forEach((column, index) => {
            if (typeof column === 'string' || column instanceof String) {
                CONFIG.GLOBAL.notificationExportData[index] = { "key": column };
            }
        });

        /*
         * On charge les templates
         */
        var queries = [];
        CONFIG.GLOBAL.loadTemplatesConfiguration.forEach(templateId => {
            queries.push({
                "url": EXTERNAL_RESSOURCES + "/configuration.template." + templateId + ".json?" + (new Date().getTime()),
                "templateId": templateId
            });
        });
        queuedFetch.addRequest(queries, init_getTemplatesConfigurationComplete);
    }

    function init_getTemplatesConfigurationComplete(items) {
        if (!CONFIG.hasOwnProperty("templates"))
            CONFIG.templates = {};

        items.forEach(item => {
            if (item.response.hasOwnProperty(item.query.templateId))
                CONFIG.templates[item.query.templateId] = item.response[item.query.templateId];
            else
                throw new Error("Unable to get templateId : '" + item.query.templateId + "' from " + item.query.url);
        });

        /*
         * On charge les fichiers de définition des démarches
         */
        var queries = [];
        CONFIG.GLOBAL.loadDemarchesConfiguration.forEach(demarcheFile => {
            queries.push({
                "url": EXTERNAL_RESSOURCES + "/configuration.demarches." + demarcheFile + ".json?" + (new Date().getTime())
            });
        });
        queuedFetch.addRequest(queries, init_getDemarchesConfigurationComplete);
    }

    function init_getDemarchesConfigurationComplete(items) {
        if (!CONFIG.hasOwnProperty("demarches"))
            CONFIG.demarches = {};

        items.forEach(item => {
            Object.keys(item.response).forEach(key => {
                if (CONFIG.demarches.hasOwnProperty(key))
                    throw new Error("Demarche '" + key + "' already exists. Unable to add definition from " + item.query.url);

                CONFIG.demarches[key] = item.response[key];
            });
        });

        /* Construction du menu */
        var menuHTML = `
        <nav class='interact'>
            <menu>
                <menuitem id="perimetreList">
                    <a>Périmètres</a>
                    <menu>`;

        CONFIG.GLOBAL.perimeters.forEach((p, i) => {
            menuHTML += "<menuitem><a onclick='GTOverride.loadPerimeter(" + i + ")'>" + p.name + "</a></menuitem>";
        });

        menuHTML += `</menu>
                </menuitem>
            </menu>
        </nav>`;

        document.body.innerHTML += menuHTML;
    }


    function loadPerimeter(index) {
        while (document.body.children.length > 2)
            document.body.children[2].remove();

        displayPerimeter.apply(null, CONFIG.GLOBAL.perimeters[index].demarches);

    }

    /* Si exécuté en direct (autrement initialize() est appelé par le bookmark) */
    initialize();

    return {
        loadPerimeter: loadPerimeter,
        loadMatrixData : loadMatrixData,
        downloadDetails : downloadDetails,
        downloadMatrix : downloadMatrix,
        loadNotificationsData : loadNotificationsData,
        downloadNotificationsDetails : downloadNotificationsDetails
    }
}
