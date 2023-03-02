/**
 * @file Handles storage of joint-activity-graphs using a REST interface.
 *
 * @author mvignati
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.17
 */

import RESTUtils from '../utils/rest.js';
import SchemaManager from "./schemas.js";
import UserPrefs from "../utils/user-prefs.js";

export default class RESTStorage {

    constructor(name, version, endpoint) {
        this._name = name;
        this._version = version;
        this._endpoint = endpoint;
        this.__REST_PATHS = {
            all: `{urlHandle}`,
            get: `{urlHandle}/{id}`,
            has: `{urlHandle}/{id}`,
            create: `{urlHandle}`,
            update: `{urlHandle}`,
   //         update: `{urlHandle}/{id}`,
            delete: `{urlHandle}/{id}`,
            clear: `{urlHandle}`,
            help: ``
        };
        console.log(`{} - Rest Storage Service initialized at (${endpoint})`);
    }

    help() {
        let supportedRestPoints = null;
        for (const key of Object.keys(this.__REST_PATHS)) {
            supportedRestPoints = `${supportedRestPoints} /n`;
        }
        const returnString = `Using ${this._name} v.${this._version}  \n Supports: \n ${supportedRestPoints}`;
        return returnString;
    }

    async init() {
        // TODO: provide init functions

        // TODO: test connection to ensure availability?
        // TODO: implement handlers for identity requirements?
        // TODO: enforce secure connections or other requirements?
        // TODO: ensure API version is compatible with endpoint?
    }

    async all(schema) {
        const urlHandle = SchemaManager.getRest(schema);
        let path = this.__REST_PATHS.all.replace(`{urlHandle}`, urlHandle);
        if (UserPrefs.getSharedMode()) {
            path = `${path}?includeShared=true`
        }
        else {
            path = `${path}?includeShared=false`
        }
        const all = await RESTUtils.all(this._endpoint + path);
        return all;
    }

    async get(schema, id) {
        const urlHandle = SchemaManager.getRest(schema);
        const path = this.__REST_PATHS.get.replace(`{urlHandle}`, urlHandle).replace(`{id}`, id);
        const getById = await RESTUtils.get(this._endpoint + path);
        return getById;
    }

    async has(schema, id) {
        const urlHandle = SchemaManager.getRest(schema);
        const path = this.__REST_PATHS.has.replace(`{urlHandle}`, urlHandle).replace(`{id}`, id);
        const exists = await RESTUtils.has(this._endpoint + path);
        return exists;
    }

    async create(schema, id, jsonObj) {
        const urlHandle = SchemaManager.getRest(schema);
        const path = this.__REST_PATHS.create.replace(`{urlHandle}`, urlHandle);
        const reply = await RESTUtils.create(this._endpoint + path, JSON.stringify(jsonObj));
        return reply;
    }

    async update(schema, id, jsonObj) {
        const urlHandle = SchemaManager.getRest(schema);
        const path = this.__REST_PATHS.update.replace(`{urlHandle}`, urlHandle).replace(`{id}`, id);

        const reply = await RESTUtils.update(this._endpoint + path, JSON.stringify(jsonObj));
        return reply;
    }

    async delete(schema, id) {
        const urlHandle = SchemaManager.getRest(schema);
        const path = this.__REST_PATHS.delete.replace(`{urlHandle}`, urlHandle).replace(`{id}`, id);
        const reply = await RESTUtils.delete(this._endpoint + path);
        return reply;
    }

    async clear(schema) {
        const urlHandle = SchemaManager.getRest(schema);
        const path = this.__REST_PATHS.clear.replace(`{urlHandle}`, urlHandle);
        const reply = await RESTUtils.clear(this._endpoint + path);
        return reply;
    }

}
