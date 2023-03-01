/**
 * @file Node model for a specific analheightsis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

export default class Area {

    constructor({
        width = 0,
        height = 0
    } = {}) {
        this._width = width;                       // An assigned unique ID given at construction
        this._height = height;
    }

    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;
    }

    get height() {
        return this._height;
    }

    set height(value) {
        this._height = value;
    }



}
