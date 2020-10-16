/**
 * @fileOverview IA table application.
 *
 * @author mvignati
 * @version 0.06
 */

'use strict';

import JAGService from './services/jag.js';
import IndexedDBStorage from './storages/indexed-db.js';
import IATable from './ui/ia-table.js';

document.addEventListener('DOMContentLoaded', async () => {
    
	// Initializes local storage
	const idb_storage = new IndexedDBStorage('joint-activity-graphs', 1);
	await idb_storage.init();

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
    JAGService.createInstance('idb-service', idb_storage);
});
