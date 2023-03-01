/**
 * @file Observable object that notifies subscribers.
 *
 * @author mvignati
 * @copyright Copyright © 2018 IHMC, all rights reserved.
 * @version 0.10
 *
 */

'use strict';

import SharedService from "../services/shared-service.js";
import SchemaManager from "../storages/schemas.js";

export default class SharedObservable extends SharedService {

    static {
        this._subscribers = new Map();
        this.sharedWorker = new SharedWorker(`scripts/services/shared-worker.js`);
        this.sharedWorker.port.onmessage = this.handleReceiveMessage.bind(this);
    }

    /**
     * Interested listeners register an activity-type (topic) and
     * a subscriber-bound callback (subscriber)
     */
    static subscribe(topic, subscriber) {
        if (!this._subscribers.has(topic)) {
            this._subscribers.set(topic, new Set());
        }
        this._subscribers.get(topic).add(subscriber);
    }

    /**
     * Listener to remove itself from further notifications
     * @TODO unused, untested
     */
    static unsubscribe(topic, subscriber) {
        this._subscribers.get(topic).delete(subscriber);
    }


    /**
     * Remote action received from SharedWorker. Any included object-descriptions will
     * be deserialized here before further propagation.
     */
    static async handleReceiveMessage(message) {
        // console.log(`{@} Message received from web worker -- posting to all subscribers`);
        // console.log(`{@} (${message.data.id}) / (${message.data.topic})\n`);
        const schema = message.data.schema;
        const topic = message.data.topic;
        const description = message.data.description;
        const id = message.data.id;
        let dataModel = null;
        // let descriptorObj = JSON.parse(description);                 // only for rest :(
        if (description) {
            dataModel = await SchemaManager.deserialize(schema, description);
        }
        this.notifySubscribers(topic, dataModel, id);
    }

    /**
     * Final distribution of processed remote/local event messages
     * Callback functions were provided at initial subscription.js.
     */
    static notifySubscribers(topic, dataModel, id) {
        console.log(`\n {COMMAND OUT} (${topic}) : (${id})`);
        if (this._subscribers.has(topic)) {
            this._subscribers.get(topic).forEach(async (callBack) => {
                if (dataModel == null) {
                    await callBack(id);
                } else if (id == null) {
                    await callBack(dataModel);
                } else {
                    await callBack(dataModel, id);
                }
            });
        } else {
            console.log(`{No subscribers to : ${topic}`);
        }
    }

    /**
     * Local action to be propagated across SharedWorker for remote listeners.
     */
    static confirmStorageChange({topic, schema, id, description}) {
        console.log(` {SHARING>} - (${id}/${topic})`);
        this.sharedWorker.port.postMessage({
            topic,
            schema,
            id,
            description
        });
    }

}

