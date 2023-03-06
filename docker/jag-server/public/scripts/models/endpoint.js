/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import {uuidV4} from "../utils/uuid.js";

export default class Endpoint {

    constructor({
                    id = uuidV4(),
        exchangeSourceUrn,
        direction,
        exchangeName,                 // activity parent
        exchangeType                 // name unique to parent/property
    } = {}) {
        this._id = id;
        this._exchangeSourceUrn = exchangeSourceUrn;
        this._direction = direction;
        this._exchangeName = exchangeName;
        this._exchangeType = exchangeType;
    }


    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get exchangeSourceUrn() {
        return this._exchangeSourceUrn;
    }

    set exchangeSourceUrn(value) {
        this._exchangeSourceUrn = value;
    }

    get direction() {
        return this._direction;
    }

    set direction(value) {
        this._direction = value;
    }

    get exchangeName() {
        return this._exchangeName;
    }

    set exchangeName(value) {
        this._exchangeName = value;
    }

    get exchangeType() {
        return this._exchangeType;
    }

    set exchangeType(value) {
        this._exchangeType = value;
    }

    equals(endpoint) {
        return ((this.exchangeSourceUrn === endpoint.exchangeSourceUrn) &&
            (this.direction === endpoint.direction) &&
            (this.exchangeName === endpoint.exchangeName))
    }


    toJSON() {
        const json = {
            id: this._id,
            exchangeSourceUrn: this._exchangeSourceUrn,
            direction: this._direction,
            exchangeName: this._exchangeName,
            exchangeType: this._exchangeType}
        return json;
    }

    static fromJSON(element) {
        const newEndpoint = new Endpoint(element);                // with new Endpoint(element) --> everything led with underscore (eg, _exchangeSourceUrn) - messed up a lot ----- WHY
        return newEndpoint;
    }

}
