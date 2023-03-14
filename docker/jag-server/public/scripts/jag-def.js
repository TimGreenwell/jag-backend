/**
 *
 */

import Definition from './views/def-definition.js';                       // AT - Center graphic view of liveNodes
import Menu from './views/def-menu.js';                             // AT - Top view of user actions (plus title/logo)
import ControllerDEF from "./controllers/controllerDEF.js";
import StorageService from './services/storage-service.js';         // Interface services with JAG in storage(s)
import IndexedDBStorage from './storages/indexed-db.js';            // Available storage option (IndexedDB)
import RESTStorage from './storages/rest.js';
import UserPrefs from "./utils/user-prefs.js";

document.addEventListener(`DOMContentLoaded`, async () => {
    // Args
    const QueryString = window.location.search;
    const urlParams = new URLSearchParams(QueryString);
    const startProjectId = urlParams.get(`project`);
    const startLiveNodeId = urlParams.get(`livenode`);


    // Initializes local storage
    const idb_storage = new IndexedDBStorage(`joint-activity-graphs`, 1);
    await idb_storage.init();
    StorageService.addStorageInstance(`idb-service`, idb_storage);

    // Initializes a rest storage
    const rest_storage = new RESTStorage(`jag.baby`, 1, `https://jag.baby/jag/api/v1/`);
    await rest_storage.init();
    StorageService.addStorageInstance(`local-rest-service`, rest_storage);

    // storage choices
    StorageService.setPreferredStorage(UserPrefs.getDefaultStorageService());
    StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
    StorageService.senderId = `jag-def`;

    const controller = new ControllerDEF(startProjectId, startLiveNodeId);

    // Load DOM outer skeleton for Authoring Tool
    const body = document.querySelector(`body`);
    const mainPanels = document.createElement(`div`);
    mainPanels.setAttribute(`id`, `main-panels`);
    const leftPanel = document.createElement(`div`);
    leftPanel.setAttribute(`id`, `left-panel`);
    const rightPanel = document.createElement(`div`);
    rightPanel.setAttribute(`id`, `right-panel`);
    const menu = new Menu();
    const definition = new Definition();


    body.appendChild(menu);
    mainPanels.appendChild(definition);
    body.appendChild(mainPanels);
    controller.menu = menu;
    controller.definition = definition;
    await controller.initialize();

    // ////////////////////////////////////////////////////////////////////
    // Event: 'refresh' (storage-sync-requested)(?)
    // playground.addEventListener('refresh', (e) => {
    //     library.refreshItem(e.detail.activity, e.detail.refreshed);
    // });
});
