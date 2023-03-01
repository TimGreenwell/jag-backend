/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';
export default class Route  {

    constructor({
        nodes,
        shiftedNodes,
        // earliestPossibleX?
        maxHeight
    } = {}) {
        this._nodes = nodes;
        this._shiftedNodes = shiftedNodes;
        this._maxHeight = maxHeight;
    }


    get nodes() {
        return this._nodes;
    }

    set nodes(value) {
        this._nodes = value;
    }

    get shiftedNodes() {
        return this._shiftedNodes;
    }

    set shiftedNodes(value) {
        this._shiftedNodes = value;
    }

    get maxHeight() {
        return this._maxHeight;
    }

    set maxHeight(value) {
        this._maxHeight = value;
    }
}
