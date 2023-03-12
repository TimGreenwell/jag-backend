/**
 * @file LiveNode model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

export default class Point {

    constructor({
        x = 0,
        y = 0
    } = {}) {
        this._x = x;                       // An assigned unique ID given at construction
        this._y = y;
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
    }

}
