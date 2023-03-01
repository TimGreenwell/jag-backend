/**
 * @fileOverview Auto complete ui.
 * Shows suggestions for the specified input based on specified source data.
 *
 * @author mvignati
 * @version 0.15
 */

'use strict';

class AutoComplete extends HTMLElement {

    constructor() {
        super();

        this._suggestions = undefined;
        this._filtered_suggestions = [];

        this._selected_index = 0;
    }

    get selected() {
        return this._filtered_suggestions[this._selected_index];
    }

    set suggestions(suggestions) {
        this._suggestions = suggestions;
    }

    filter(value) {
        this._filtered_suggestions = this._suggestions.filter((suggestion) => {
            return suggestion.indexOf(value) === 0;
        });

        this.render();
    }

    hide() {
        this.classList.remove(`visible`);
    }

    render() {
        // Hide first to minimize repaints
        this.classList.remove(`visible`);
        this._selected_index = 0;

        // Removes all existing childs
        while (this.hasChildNodes()) {
            this.removeChild(this.lastChild);
        }

        if (this._filtered_suggestions.length <= 0) {
            return;
        }

        const $suggestions = document.createDocumentFragment();

        this._filtered_suggestions.forEach((suggestion, idx) => {
            const $suggestion = document.createElement(`div`);
            $suggestion.innerText = suggestion;
            $suggestion.addEventListener(`mouseenter`, this._handleMouseEnter.bind(this, idx));
            $suggestions.appendChild($suggestion);
            if (idx === this._selected_index) {
                $suggestion.classList.add(`selected`);
            }
        });

        this.appendChild($suggestions);
        this.classList.add(`visible`);
    }

    select(direction) {
        if (this._selected_index >= 0) {
            this.children[this._selected_index].classList.remove(`selected`);
        }

        this._selected_index = (this._selected_index + this.children.length + direction) % this.children.length;

        this.children[this._selected_index].classList.add(`selected`);
    }

    _handleMouseEnter(idx, event) {
        if (this._selected_index >= 0) {
            this.children[this._selected_index].classList.remove(`selected`);
        }

        this._selected_index = idx;

        this.children[this._selected_index].classList.add(`selected`);
    }

}


customElements.define(`auto-complete`, AutoComplete);
export default customElements.get(`auto-complete`);


