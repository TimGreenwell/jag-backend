/**
 * @fileOverview Agent model.
 *
 * @version 0.01
 */

'use strict';


// noinspection JSUnusedGlobalSymbols
export default class Subscription extends EventTarget {

    constructor({name, lastReportTime = null, lastReportedData = null} = {}) {
        super();
        this._name = name;
        this._lastReportTime = lastReportTime;
        this._lastReportedData = lastReportedData;
    }


    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get lastReportTime() {
        return this._lastReportTime;
    }

    set lastReportTime(value) {
        this._lastReportTime = value;
    }

    get lastReportedData() {
        return this._lastReportedData;
    }

    set lastReportedData(value) {
        this._lastReportedData = value;
    }

    static fromJSON(json) {
        return new Subscription(json);
    }

    toJSON() {
        const json = {
            name: this._name,
            lastReportTime: this._lastReportTime,
            lastReportedData: this._lastReportedData
        };
        return json;
    }

}

