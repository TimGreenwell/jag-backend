/**
 * @fileOverview JAG controls component.
 *
 * @author mvignati
 * @version 0.08
 */

'use strict';

class JAGControls extends HTMLElement {

	constructor(node) {
		super();
		this._node = node;

		this._initUI();
		this._initListeners();
	}

	_initUI() {
		this._add_child = document.createElement('div');
		this._remove = document.createElement('div');

		this._add_child.classList.add('jag-button', 'add-child-button');
		this._remove.classList.add('jag-button', 'remove-button');

		this.appendChild(this._add_child);

		// Only show the remove icon if not root.
		if(!this._node.isRoot())
			this.appendChild(this._remove);
	}

	_initListeners() {
		this._add_child.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('local-node-addchild', {bubbles: true, composed: true, detail: {node: this._node}}));
		});

		this._remove.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('local-node-prunechild', {bubbles: true, composed: true, detail: {node: this._node}}));
		});
	}

}

customElements.define('jag-controls', JAGControls);
export default customElements.get('jag-controls');

