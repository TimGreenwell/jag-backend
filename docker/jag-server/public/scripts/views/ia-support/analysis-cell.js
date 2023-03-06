/**
 * @fileOverview AnalysisModel cell component.
 *
 * @author mvignati
 * @version 0.22
 */

'use strict';

export default class AnalysisCell extends HTMLElement {

    constructor(context_menu) {
        super();
        this._context_menu = context_menu;

        this.classList.add(AnalysisCell.CLASS_NAME);
        if (this._context_menu !== undefined) {
            this.addEventListener(`contextmenu`, this._showContextMenu.bind(this));
        }
    }

    addContextMenuListener(type, listener) {
        this._context_menu.addEventListener(type, listener, {once: true});
    }

    _showContextMenu(event) {
        event.preventDefault();
        this._context_menu.style.top = `${event.clientY}px`;
        this._context_menu.style.left = `${event.clientX}px`;
        this.appendChild(this._context_menu);
    }

}

AnalysisCell.CLASS_NAME = `ia-cell`;

