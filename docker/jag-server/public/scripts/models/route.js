/**
 * @file LiveNode model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';
export default class Route  {

    constructor({
        liveNodes,
        shiftedLiveNodes,
        // earliestPossibleX?
        maxHeight
    } = {}) {
        this._liveNodes = liveNodes;
        this._shiftedLiveNodes = shiftedLiveNodes;
        this._maxHeight = maxHeight;
    }


    get liveNodes() {
        return this._liveNodes;
    }

    set liveNodes(value) {
        this._liveNodes = value;
    }

    get shiftedLiveNodes() {
        return this._shiftedLiveNodes;
    }

    set shiftedLiveNodes(value) {
        this._shiftedLiveNodes = value;
    }

    get maxHeight() {
        return this._maxHeight;
    }

    set maxHeight(value) {
        this._maxHeight = value;
    }
}
