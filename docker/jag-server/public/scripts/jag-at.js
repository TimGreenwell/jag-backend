/**
 * @file Joint Activity Graph - Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.57
 *
 *
 */

import Playground from './views/at-playground.js';                     // AT - Center graphic view of JAG Nodes // ?? - seems unused currently
import TimeView from "./views/at-timeview.js";
import Library from './views/at-activity-library.js';                     // AT - Left view of available Activities
import ProjectLibrary from './views/at-node-library.js';         // AT - Left view(2) of current JAGs
import Menu from './views/at-menu.js';                           // AT - Top view of user actions (plus title/logo)
import Properties from './views/at-properties.js';               // AT - Right view of JAG LiveNode data entry fields
import StorageService from './services/storage-service.js';   // Interface services with JAG in storage(s)
import IndexedDBStorage from './storages/indexed-db.js';      // Available storage option (IndexedDB)
import RESTStorage from './storages/rest.js';                 // Available storage option (tested with Postgres)
import ControllerAT from "./controllers/controllerAT.js";
import UserPrefs from "./utils/user-prefs.js";     // Controller - injection point


// import IDE from './ide.js';                                   // ?? - seems unused currently
// import GraphService from './services/graph-service.js';       // ?? - seems unused currently

document.addEventListener(`DOMContentLoaded`, async () => {

    StorageService.setPreferredStorage(UserPrefs.getDefaultStorageService());
    StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
    StorageService.senderId = `jag-at`;                         // Cross-tab identifier
    console.log(`--------->`);
    console.log(StorageService.getPreferredStorage());
    if ((StorageService.getPreferredStorage() === `local-rest-service`) || (StorageService.areStoragesSynced())) {
        // Initializes a rest storage
        console.log(`Initializes a rest storage`);
        const rest_storage = new RESTStorage(`teamworks`, 1, `https://jag.baby/jag/api/v1/`);
        await rest_storage.init();
        StorageService.addStorageInstance(`local-rest-service`, rest_storage);
    }

    if ((StorageService.getPreferredStorage() === `idb-service`) || (StorageService.areStoragesSynced())) {
        // Initializes local storage
        console.log(`Initializes local storage`);
        const idb_storage = new IndexedDBStorage(`joint-activity-graphs`, 1);
        await idb_storage.init();
        StorageService.addStorageInstance(`idb-service`, idb_storage);
    }

    const controller = new ControllerAT();

    // @TODO - I need to better understand these two
    // const ide = new IDE();
    // const graph_service = new GraphService();

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

    const library = new Library();
    const projectLibrary = new ProjectLibrary();
    const menu = new Menu();
    const playground = new Playground();
    const properties = new Properties();
    const timeview = new TimeView();

    timeview.classList.toggle(`hidden`);
    centerGutter.classList.toggle(`hidden`);

    body.appendChild(allPanels);
    allPanels.appendChild(menu);
    allPanels.appendChild(mainPanels);

    mainPanels.appendChild(leftPanel);
    mainPanels.appendChild(centerPanel);
    mainPanels.appendChild(rightPanel);

    leftPanel.appendChild(projectLibrary);
    leftPanel.appendChild(library);

    centerPanel.appendChild(playground);
    centerPanel.appendChild(centerGutter);
    centerPanel.appendChild(timeview);

    rightPanel.appendChild(properties);

    controller.menu = menu;
    controller.activityLibrary = library;
    controller.projectLibrary = projectLibrary;
    controller.playground = playground;
    controller.timeview = timeview;
    controller.properties = properties;
    await controller.initialize();

    function eventToggleTimeviewHandler() {
        centerGutter.classList.toggle(`hidden`);
        timeview.classList.toggle(`hidden`);
        if (!playground.style.height) {
            playground.style.height = `50%`;
        }
        const selectedNodes = playground.selectedNodes;
        timeview.refreshTimeview(selectedNodes[0]);
    }
    menu.addEventListener(`event-toggle-timeview`, eventToggleTimeviewHandler);


    let isMouseDown = false;
    function mV(event) {
        if (isMouseDown) {
            const change = event.clientY - menu.getBoundingClientRect().height - 35;
            playground.style.height = `${change}px`;
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
