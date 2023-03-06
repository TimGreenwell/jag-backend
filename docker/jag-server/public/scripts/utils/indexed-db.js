/**
 * @fileOverview Indexed database storage utilities.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.09
 */

export default class IndexedDBUtils {

    static initStorage(id, version, storesConfig) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(id, version);

            request.addEventListener(`error`, (event) => {
                const error = event.target.error;
                reject(new Error(`Error while connecting to the database ${error}`));
            });

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`upgradeneeded`, (event) => {
                const db = event.target.result;
                // After extensive testing, it seems that success waits for all store creation to be completed
                storesConfig.forEach((storeConfig) => {
                    return IndexedDBUtils.createStore(db, storeConfig);
                });
            });
        });
    }

    static createStore(db, storeConfig) {
        if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name);
        }

        const store = db.createObjectStore(storeConfig.name, {keyPath: storeConfig.key});

        storeConfig.indexList.forEach(({name: index_name, property: index_property, options: index_options}) => {
            store.createIndex(index_name, index_property, index_options);
        });
    }

    static store(db, store, value, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, `readwrite`);
            const object_store = transaction.objectStore(store);
            let request;
            if (key) {
                //    request = object_store.put(value, key);
                request = object_store.put(value);
                // worked good as add(value) with rest
            } else {
                request = object_store.add(value);
            }

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`error`, (event) => {
                reject(new Error(`Error while storing key value pair in store ${store}\nKey: ${key}\nValue: ${value}\nError: ${event.target.error}`));
            });
        });
    }

    static get(db, store, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, `readonly`);
            const object_store = transaction.objectStore(store);
            const request = object_store.get(key);

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`error`, (event) => {
                reject(new Error(`Error while retrieving value from store ${store}\nKey: ${key}\nError: ${event.target.error}`));
            });
        });
    }

    // tlg
    static clear(db, store, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, `readwrite`);
            const object_store = transaction.objectStore(store);
            const request = object_store.clear();

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`error`, (event) => {
                reject(new Error(`Error while clearing store ${store}\nError: ${event.target.error}`));
            });
        });
    }


    // tlg
    static delete(db, store, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, `readwrite`);
            const object_store = transaction.objectStore(store);
            const request = object_store.delete(key);

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`error`, (event) => {
                reject(new Error(`Error while deleting key from store ${store}\nKey: ${key}\nError: ${event.target.error}`));
            });
        });
    }

    static getKey(db, store, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, `readonly`);
            const object_store = transaction.objectStore(store);
            const request = object_store.getKey(key);

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`error`, (event) => {
                reject(new Error(`Error while retrieving key from store ${store}\nKey: ${key}\nError: ${event.target.error}`));
            });
        });
    }

    static all(db, store, query, count) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, `readonly`);
            const object_store = transaction.objectStore(store);
            const request = object_store.getAll(query, count);

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`error`, (event) => {
                reject(new Error(`Error while retrieving objects for store ${store} : ${event.target.error}`));
            });
        });
    }

    static keys(db, store) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, `readonly`);
            const object_store = transaction.objectStore(store);
            const request = object_store.getAllKeys();

            request.addEventListener(`success`, (event) => {
                resolve(event.target.result);
            });

            request.addEventListener(`error`, (event) => {
                reject(new Error(`Error while retreiving keys for store ${store} : ${event.target.error}`));
            });
        });
    }

}

// static delete2(db, store, key) {  //  only keeping this around to see if i like this format better...
//     const request = db.transaction(store, `readwrite`).objectStore(store).delete(key);
//
//     request.onsuccess = () => {
//         console.log(`SUCCESS: ${request.result}`);
//     };
//
//     request.onerror = (err) => {
//         console.error(`FAILED: ${err}`);
//     };
// }


