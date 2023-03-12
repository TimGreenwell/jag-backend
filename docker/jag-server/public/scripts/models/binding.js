/**
 * @file LiveNode model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import Endpoint from "./endpoint.js";
import {uuidV4} from '../utils/uuid.js';

export default class Binding {

    constructor({
        id = uuidV4(),
        from = null,  // endpoint
        to = null     // endpoint
    } = {}) {
        this._id = id;
        this._from = from;
        this._to = to;
    }


    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get from() {
        return this._from;
    }

    set from(endpoint) {
        this._from = endpoint;
    }

    get to() {
        return this._to;
    }

    set to(value) {
        this._to = value;
    }


    sameFromEndpoint(endpoint) {
        return this.from.equals(endpoint);
    }

    sameToEndpoint(endpoint) {
        return this.to.equals(endpoint);
    }

    toJSON() {
        const json = {id: this._id,
            from: this.from.toJSON(),
            to: this.to.toJSON()};
        return json;
    }

    static fromJSON(element) {
        const returnValue = new Binding();
        returnValue.from = Endpoint.fromJSON(element.from);
        returnValue.to = Endpoint.fromJSON(element.to);
        return returnValue;
    }


}
