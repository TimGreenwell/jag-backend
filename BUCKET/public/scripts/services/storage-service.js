/**
 * @file JAG Model services
 *
 * @author IHMC-tg
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.02
 *
 * Storage Service provides an abstracted persistent storage/comms handler.
 * Extends Sharable&Observable (SharedObservable) to provide notification to local
 * and (cross-tab) subscribers of storage updates (action/schema-level)
 *
 * Functionality includes: has, get, clear, create, update, delete, replace, clone
 * @TODO More testing needed on replace/clone  (key-field based)
 * @TODO More try/catch and return values
 * @TODO _storagesSynced (not implemented - need additional storages for testing)
 *
 */

import SharedObservable from "../utils/observable.js";
import SchemaManager from '../storages/schemas.js';

export default class StorageService extends SharedObservable {

    static {
        this._storageInstancesMap = new Map(); // map  {service name -> service instance}
        this._preferredStorage = null;         // service instance for all reads
        this._storagesSynced = false;          // write to (all storages) or just (preferredStorage)
        this._schema = null;              // specific schema within Storage
    }

    /**
     * Retrieves a storage instance of the service if it exists.
     */
    static getStorageInstance(id) {
        if (!this._storageInstancesMap.has(id)) {
            throw new Error(`No service instance '${id}'.`);
        }
        return this._storageInstancesMap.get(id);
    }

    /**
     * Register a new storage instance .
     */
    static addStorageInstance(id, instance) {
        if ((typeof this._storageInstancesMap !== `undefined`) && (this._storageInstancesMap.has(id))) {
            throw new Error(`There already exists a service instance named ${id}.`);
        }
        this._storageInstancesMap.set(id, instance);
        if (typeof this._preferredStorage === `undefined`) {
            this._preferredStorage = id;
        }
    }

    /**
     * Boolean return.  In general, if storages are synced, all write and delete types will be sent to
     * every storage registered.  Else, just to the preferredService.
     */
    static areStoragesSynced() {
        return this._storagesSynced;
    }

    /**
     * In general, if storages are synced, all write and delete types will be sent to
     * every storage registered.  Else, just to the preferredService.
     * @TODO Not used - waiting on multiple storages instances for testing.
     * @TODO Is this capability desired?
     */
    static setStoragesSynced(syncStorages) {
        this._storagesSynced = syncStorages;
    }

    /**
     * preferredStorage determines which of the registered storage instance will be used for reads.
     */
    static getPreferredStorage() {
        return this._preferredStorage;
    }

    /**
     * preferredStorage determines which of the registered storage instance will be used for reads.
     */
    static setPreferredStorage(preferredStorage) {
        this._preferredStorage = preferredStorage;
        console.log(`{} - StorageService's preferred storage set to: ${preferredStorage}`);
    }

    /**
     * Schema is a user provided text signaling the handling of the incoming object.
     * See schema.js - determines 'store name', 'key field' and deserialization method.
     */
    getSchema() {
        return this._schema;
    }

    /**
     * setSchema may be used in place of providing a schema with each call. Not recommended.. but
     * may be necessary during event initiated storage requests.
     */
    static setSchema(schema) {
        this._schema = schema;
    }

    /**
     * Retrieves all existing records from the schema defining store.
     * @TODO: Should add filtering options.
     * @TODO  Might consider limiting options.
     * @param {string} schema
     * No notification made. (Not a storage change)
     */


    static async all(schema = this._schema) {
        console.log(`{<>} StorageService - all (${schema})`);
        const descriptions = await this._storageInstancesMap.get(this._preferredStorage).all(schema);
        const promisedModels = descriptions.map(async (description) => {
            const newModel = await SchemaManager.deserialize(schema, description);
            return newModel;
        });
        const newModels = await Promise.all(promisedModels);
        return newModels;
    }

    /**
     * Retrieves the record for the schema-defined id.
     * No notification made. (Not a storage change)
     * @param {string} id
     * @param {string} schema
     */
    static async get(id, schema = this._schema) {
        console.log(`{<>} StorageService - get (${schema})  ${id}`);
        const description = await this._storageInstancesMap.get(this._preferredStorage).get(schema, id);
        const model = await SchemaManager.deserialize(schema, description);
        return model;
    }

    /**
     * Check for existence of the schema-defined id.
     * No notification made. (Not a storage change)
     * @param {string} id
     * @param {string} schema
     */
    static async has(id, schema = this._schema) {
        await this._storageInstancesMap.get(this._preferredStorage).has(schema, id);
    }

    /**
     * Clear all records in the schema-defined store.
     * @TODO Tested but not used.
     * Notification (null,null)  @TODO Anything useful to return?
     * @param {string} schema
     */
    static async clear(schema = this._schema) {
        console.log(`{<>} StorageService - clear (${schema})`);
        await this._storageInstancesMap.get(this._preferredStorage).clear(schema);
        this.confirmStorageChange({
            topic: `command-${schema}-cleared`,
            schema,
            id: null,
            description: null
        });
    }

    /**
     * Add a new record. The schema determines the key and store.
     * The _preferredStorage determines the location if _storagesSynced=false (default)
     * Notification (object created, id of object created)
     * @param {string} schema
     */
    static async create(createdModel, schema = this._schema) {
        const createdId = SchemaManager.getKeyValue(schema, createdModel);   // this is not needed - just the log
        console.log(`{<>} StorageService - CREATE   (${schema}) ${createdId}`);
        // @TODO if sync - update all storages (not implemented - need additional storages for testing)
        const jsonObj = createdModel.toJSON();

        await this._storageInstancesMap.get(this._preferredStorage).create(schema, createdId, jsonObj);
        this.confirmStorageChange({
            topic: `command-${schema}-created`,
            schema,
            id: createdId,
            description: jsonObj
        });
    }

    /**
     * Updates an existing record.
     * Notification (object updated, id of object updated)
     * @param {string} schema
     */
    static async update(updatedModel, schema = this._schema) {
        const updatedId = SchemaManager.getKeyValue(schema, updatedModel);
        console.log(`{<>} StorageService - UPDATE   (${schema}) ${updatedId}`);
        const jsonObj = updatedModel.toJSON();
        await this._storageInstancesMap.get(this._preferredStorage).update(schema, updatedId, jsonObj);
        this.confirmStorageChange({
            topic: `command-${schema}-updated`,
            schema,
            id: updatedId,
            description: jsonObj
        });
    }

    /**
     * Removes the record from the schema-defined store.
     * Notification (null, id of object deleted)
     * @param {string} schema
     */
    static async delete(deletedId, schema = this._schema) {
        console.log(`{<>} StorageService - DELETE}   (${schema}) ${deletedId}`);
        const result = await this._storageInstancesMap.get(this._preferredStorage).delete(schema, deletedId);
        this.confirmStorageChange({
            topic: `command-${schema}-deleted`,
            schema,
            id: deletedId,
            description: null
        });
    }


    /**
     * Replace the key-field.  All other properties remain unchanged. ( Copy - Delete )
     * Notification (object created, id of object replace)
     * @param {string} origId
     * @param {string} newId
     * @param {string} schema
     */
    static async replace(origId, newId, schema = this._schema) {
        console.log(`{<>} StorageService - REPLACED   (${schema}) ${origId} with ${newId}`);
        const description = await this._storageInstancesMap.get(this._preferredStorage).get(schema, origId);   // will this be json or json obj?
        const keyField = await SchemaManager.getKey(schema);
        description[keyField] = newId;
        const result = await this._storageInstancesMap.get(this._preferredStorage).delete(schema, origId);
        await this._storageInstancesMap.get(this._preferredStorage).create(schema, newId, description);
        this.confirmStorageChange({
            topic: `command-${schema}-replaced`,
            schema,
            id: origId,
            description
        });
    }

    /**
     * Copy the record with origId and give it id=cloneId.  All other properties remain unchanged.  ( Copy )
     * Notification (object created, id of object created)
     */
    static async clone(origId, cloneId, schema = this._schema) {
        console.log(`{<>} StorageService - CLONED   (${schema}) ${origId} with ${cloneId}`);
        const description = await this._storageInstancesMap.get(this._preferredStorage).get(schema, origId);
        const index = SchemaManager.getKeyValue(schema, description);
        description[index] = cloneId;
        await this._storageInstancesMap.get(this._preferredStorage).create(schema, SchemaManager.getKeyValue(schema, description), description);
        this.confirmStorageChange({
            topic: `$command-${schema}-cloned`,
            schema,
            id: cloneId,
            description
        });
    }

}

