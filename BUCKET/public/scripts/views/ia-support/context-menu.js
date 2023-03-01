/**
 * @fileOverview Generic context menu.
 *
 * @author mvignati
 * @version 0.28
 */

'use strict';

class ContextMenu extends HTMLElement {

    addEntry(label, properties, style) {
        const entry = document.createElement(`div`);

        entry.innerText = label;
        entry.addEventListener(`mouseup`, this._fireSelection.bind(this));


        // Propagates the enumerable properties
        for (const property in properties) {
            entry[property] = properties[property];
        }

        // Propagates symbols
        for (const symbol of Object.getOwnPropertySymbols(properties)) {
            entry[symbol] = properties[symbol];
        }

        for (const property in style) {
            entry.style.setProperty(property, style[property]);
        }

        this.appendChild(entry);
    }

    _fireSelection(event) {
        this.parentNode.removeChild(this);
        this.dispatchEvent(new CustomEvent(ContextMenu.SELECT_EVENT, {detail: event.target}));
    }

}

ContextMenu.SELECT_EVENT = `context-menu-selection`;

customElements.define(`ia-context-menu`, ContextMenu);
export default customElements.get(`ia-context-menu`);
