/**
 * @fileOverview JAG controls component.
 *
 * @author mvignati
 * @version 0.08
 */

'use strict';

class JagCellControls extends HTMLElement {

    constructor(cell) {
        super();
        this._cell = cell;

        this._initUI();
        this._initListeners();
    }

    _initUI() {
        this._addButton = document.createElement(`div`);
        this._removeButton = document.createElement(`div`);

        this._addButton.classList.add(`jag-button`, `add-child-button`);
        this._removeButton.classList.add(`jag-button`, `remove-button`);


        this.appendChild(this._addButton);

        // Only show the remove icon if not root.
        if (!this._cell.isRoot()) {
            this.appendChild(this._removeButton);
        }
    }

    _initListeners() {
        this._addButton.addEventListener(`click`, () => {
            this.dispatchEvent(new CustomEvent(
                `event-cell-addchild`,
                {
                    bubbles: true,
                    composed: true,
                    detail: {cell: this._cell}
                }
            ));
        });

        this._removeButton.addEventListener(`click`, () => {
            console.log(this._cell)
            if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                // const parentActivity = destinationNode.parent.activity;
                const parentActivity = this._cell.parent.activity;
                parentActivity.bindings = parentActivity.bindings.filter((binding) => {
                    return ((binding.to.exchangeSourceUrn !== this._cell.activity.urn) && (binding.from.exchangeSourceUrn !== this._cell.activity.urn));
                });
                const childActivityChildId = this._cell.childId;
                const remainingChildren = parentActivity._children.filter((child) => {
                    return child.id !== childActivityChildId;
                });
                parentActivity.children = remainingChildren;
                this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                    bubbles: true,
                    composed: true,
                    detail: {activity: parentActivity}
                }));
                // this.dispatchEvent(new CustomEvent(`event-promote-project`, {
                //     detail: {node: this._cell}
                // }));

                // this._selectedNodesMap.delete(selectedNodeModel.id);
                // this.unselectEverything();
                this.dispatchEvent(new CustomEvent(`event-playground-clicked`));
            }

               // this.dispatchEvent(new CustomEvent('event-cell-prunechild',
            //     { bubbles: true,
            //     composed: true,
            //     detail: {cell: this._cell}}));
        });
    }

}

customElements.define(`jag-controls`, JagCellControls);
export default customElements.get(`jag-controls`);

