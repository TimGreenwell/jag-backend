/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

export default class Node extends EventTarget {

    constructor({
        id,
        label,
        topLeftX = 0,
        topLeftY = 0,
        height = 0,
        width = 0
    } = {}) {
        super();
        this._id = id;                       // An assigned unique ID given at construction
        this._label = label;
        this._topLeftX = topLeftX;
        this._topLeftY = topLeftY;
        this._height = height;
        this._width = width;
        this._zoomStep = 0;
        this._selected = false;
        this._totalLeafHeight = 0;  // The visual height of the dependent leaves (if stacked on each other)
        this._apparentHeight = 0;
        this._routeMembershipCount = 0;    // num of sibling routes to which this activity belongs
        this._maxDepth = 0; // The furthest down the dependency chain this child is found.
        this._earliestPossibleX = 0;
    }


    get earliestPossibleX() {
        return this._earliestPossibleX;
    }

    set earliestPossibleX(value) {
        this._earliestPossibleX = value;
    }

    get apparentHeight() {
        return this._apparentHeight;
    }

    set apparentHeight(value) {
        this._apparentHeight = value;
    }

    get routeMembershipCount() {
        return this._routeMembershipCount;
    }

    set routeMembershipCount(value) {
        this._routeMembershipCount = value;
    }

    get maxDepth() {
        return this._maxDepth;
    }

    set maxDepth(value) {
        this._maxDepth = value;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get label() {
        return this._label;
    }

    set label(value) {
        this._label = value;
    }

    get topLeftX() {
        return this._topLeftX;
    }

    set topLeftX(value) {
        this._topLeftX = Math.round(value);
    }

    get topLeftY() {
        return this._topLeftY;
    }

    set topLeftY(value) {
        this._topLeftY = Math.round(value);
    }

    get height() {
        return this._height;
    }

    set height(value) {
        this._height = Math.round(value);
    }

    get width() {
        return this._width;
    }

    set width(value) {
        this._width = Math.round(value);
    }

    get zoomStep() {
        return this._zoomStep;
    }

    set zoomStep(value) {
        this._zoomStep = value;
    }


    get selected() {
        return this._selected;
    }

    set selected(value) {
        this._selected = value;
    }


    get totalLeafHeight() {
        return this._totalLeafHeight;
    }

    set totalLeafHeight(value) {
        this._totalLeafHeight = value;
    }
}
