/**
 * @file Handles storage of joint-activity-graphs using indexed db.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.29
 */

import IndexedDBUtils from '../utils/indexed-db.js';
import SchemaManager from './schemas.js';

export default class IndexedDBStorage {

    constructor(name, version) {
        this._name = name;
        this._version = version;
        this._db = undefined;
        console.log(`{} - IndexedDB Storage initialized`);
    }

    async init() {
        this._db = await IndexedDBUtils.initStorage(
            this._name,
            this._version,
            SchemaManager.all()
        );
    }

    async all(schema) {
        const storeName = SchemaManager.get(schema).name;
        const cursor = await IndexedDBUtils.all(this._db, SchemaManager.get(schema).name);
        return cursor;
    }

    async get(schema, keyValue) {
        const storeName = SchemaManager.get(schema).name;
        const description = await IndexedDBUtils.get(this._db, storeName, keyValue);

        return description;
    }

    async has(schema, keyValue) {
        const storeName = SchemaManager.get(schema).name;
        const result = await IndexedDBUtils.getKey(this._db, storeName, keyValue);
        return result !== undefined;
    }

    async create(schema, keyValue, description) {
        const storeName = SchemaManager.get(schema).name;
        return await IndexedDBUtils.store(this._db, storeName, description, keyValue);
    }

    async clear(schema) {
        const storeName = SchemaManager.get(schema).name;
        return await IndexedDBUtils.clear(this._db, storeName);
    }

    async update(schema, keyValue, description) {
        const storeName = SchemaManager.get(schema).name;
        return await IndexedDBUtils.store(this._db, storeName, description, keyValue);
    }

    async delete(schema, keyValue) {
        const storeName = SchemaManager.get(schema).name;
        return await IndexedDBUtils.delete(this._db, storeName, keyValue);
        // return await IndexedDBUtils.delete2(this._db, storeName, keyValue);
    }

}
