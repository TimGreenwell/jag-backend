/**
 * @fileOverview IA table application.
 *
 * @author mvignati
 * @version 0.31
 */

'use strict';

import IATable from './views/ia-table.js';
import IAMenu from './views/ia-menu.js';
import IAAnalysisLibrary from './views/ia-analysis-library.js';
import IAProperties from './views/ia-properties.js';
import IAAgentLibrary from './views/ia-agent-library.js';
import IndexedDBStorage from './storages/indexed-db.js';
import RESTStorage from './storages/rest.js';
import StorageService from "./services/storage-service.js";
import SharedService from "./services/shared-service.js";
import ControllerIA from "./controllers/controllerIA.js";
import UserPrefs from "./utils/user-prefs.js";
import TimeView from "./views/at-timeview.js";


document.addEventListener(`DOMContentLoaded`, async () => {
    // Initializes local storage
    const idb_storage = new IndexedDBStorage(`joint-activity-graphs`, 1);
    await idb_storage.init();
    StorageService.addStorageInstance(`idb-service`, idb_storage);

    // Initializes a rest storage
    const rest_storage = new RESTStorage(`jag.baby`, 1, `https://jag.baby/jag/api/v1/`);
    await rest_storage.init();
    StorageService.addStorageInstance(`local-rest-service`, rest_storage);

    // storage choices

    StorageService.setPreferredStorage(UserPrefs.getDefaultStorageService());          // which storage used for reads
    StorageService.setStoragesSynced(false);                                           // write to all storages or just preferred
    SharedService.senderId = `jag-ia`;

    const controller = new ControllerIA();

    // Load DOM outer skeleton for Authoring Tool
    const body = document.querySelector(`body`);

    const allPanels = document.createElement(`div`);
    allPanels.setAttribute(`id`, `all-panels`);

    const mainPanels = document.createElement(`div`);
    mainPanels.setAttribute(`id`, `main-panels`);

    const leftPanel = document.createElement(`div`);
    leftPanel.setAttribute(`id`, `left-panel`);

    const centerPanel = document.createElement(`div`);
    centerPanel.setAttribute(`id`, `center-panel`);

    const centerGutter = document.createElement(`div`);
    centerGutter.setAttribute(`id`, `center-gutter`);

    const rightPanel = document.createElement(`div`);
    rightPanel.setAttribute(`id`, `right-panel`);

    const analysisLibrary = new IAAnalysisLibrary();
    const agentLibrary = new IAAgentLibrary();
    const iaMenu = new IAMenu();
    const iaTable = new IATable();
    const iaProperties = new IAProperties();
    const timeview = new TimeView();

    timeview.classList.toggle(`hidden`);
    centerGutter.classList.toggle(`hidden`);

    body.appendChild(allPanels);
    allPanels.appendChild(iaMenu);
    allPanels.appendChild(mainPanels);

    mainPanels.appendChild(leftPanel);
    mainPanels.appendChild(centerPanel);
    mainPanels.appendChild(rightPanel);

    leftPanel.appendChild(analysisLibrary);
    leftPanel.appendChild(agentLibrary);

    centerPanel.appendChild(iaTable);

    rightPanel.appendChild(iaProperties);


    controller.analysisLibrary = analysisLibrary;
    controller.iaTable = iaTable;
    controller.iaMenu = iaMenu;
    controller.iaProperties = iaProperties;
    controller.agentLibrary = agentLibrary;
    await controller.initialize();

    // Event: 'create-analysis' -
    iaTable.addEventListener(`create-analysis`, () => {
        console.log(`Obsolete?`);
    });


    function eventToggleTimeviewHandler() {
        centerGutter.classList.toggle(`hidden`);
        timeview.classList.toggle(`hidden`);
        if (!iaTable.style.height) {
            iaTable.style.height = `50%`;
        }
        const selectedNodes = iaTable.selectedNodes;   // < overlooking these nodes for now - find better renames
        timeview.refreshTimeview(selectedNodes[0]);
    }
    iaMenu.addEventListener(`event-toggle-timeview`, eventToggleTimeviewHandler);


    let isMouseDown = false;
    function mV(event) {
        if (isMouseDown) {
            const change = event.clientY - iaMenu.getBoundingClientRect().height - 35;
            iaTable.style.height = `${change}px`;
        } else {
            // eslint-disable-next-line no-use-before-define
            end();
        }
    }
    const end = (e) => {
        isMouseDown = false;
        document.body.removeEventListener(`mouseup`, end);
        document.body.removeEventListener(`mousemove`, mV);
        timeview.refreshTimeview();
    };
    function mD(event) {
        isMouseDown = true;
        document.body.addEventListener(`mousemove`, mV);
        document.body.addEventListener(`mouseup`, end);
    }
    centerGutter.addEventListener(`mousedown`, mD);



});
