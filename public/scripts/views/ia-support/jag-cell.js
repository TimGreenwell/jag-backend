/**
 * @fileOverview JAG view.
 *
 * @author mvignati
 * @version 2.47
 */

// These are the JAG Blocks found in the IA Table  (contains autocomplete)
// Could use a better name => iaJagCell?  1:1 based off atActivityNodes


'use strict';

import StorageService from '../../services/storage-service.js';
import AutoComplete from '../../ui/auto-complete.js';
import JagCellControls from './jag-cell-controls.js';
import AnalysisCell from './analysis-cell.js';
import JAG from "../../models/activity.js";
import Node from "../../models/node.js";
import Validator from "../../utils/validation.js";

// A Cell based off (model/Node)
class JagCell extends AnalysisCell {

    constructor(cellModel, parent) {
        super();
        this._cellModel = cellModel;
        this._parent = parent;

        this._htmlElements = {
            urnEntry: undefined,
            nameEntry: undefined,
            suggestions: undefined
        };
        this._initUI();
        this._initHandlers();
    }


    get cellModel() {
        return this._cellModel;
    }

    set cellModel(value) {
        this._cellModel = value;
    }

    // ////  Elements and Element Values
    get urnElementEntry() {
        return this._htmlElements.urnEntry.innerText;
    }

    set urnElementEntry(urn) {
        this._htmlElements.urnEntry.innerText = urn;
    }

    get urnElement() {
        return this._htmlElements.urnEntry;
    }

    get nameElementEntry() {
        return this._htmlElements.nameEntry.innerText.trim();
    }

    set nameElementEntry(name) {
        this._htmlElements.nameEntry.innerText = name;
    }

    get nameElement() {
        return this._htmlElements.nameEntry;
    }


    get parent() {
        return this._parent;
    }

    set parent(value) {
        this._parent = value;
    }

    // ////  classList Properties
    set valid(valid) {
        this.classList.toggle(`unsaved`, !valid);
    }

    hide() {
        this.classList.add(`hidden`);
    }

    show() {
        this.classList.remove(`hidden`);
    }

    _initHandlers() {
        // note: the icon controls in the JagCell are defined by JagCellControls

        this._htmlElements.nameEntry.addEventListener(`blur`, this._handleNameChange.bind(this));  // pass name and 'auto-urn' up to ControllerIA for Jag updating.
        this._htmlElements.nameEntry.addEventListener(`keypress`, this._handleNameEdit.bind(this)); // adds child or sibling depending on keypress
        this._htmlElements.nameEntry.addEventListener(`input`, this._handleNameInput.bind(this));  // no idea.. view thing.  needed?

        this._htmlElements.urnEntry.addEventListener(`blur`, this._handleURNChange.bind(this));  // pass urn change to ControllerIA.updateURN
        this._htmlElements.urnEntry.addEventListener(`keydown`, this._handleURNEdit.bind(this)); // poorly named -- handles the suggestions
        this._htmlElements.urnEntry.addEventListener(`input`, this._handleURNInput.bind(this));  // poorly named -- filters suggestions
    }


    // Handlers

    _handleNameChange(event) {
        // This runs when the Name field of the IATABLE Jag node area loses focus - blurs
        if (this.nameElementEntry !== this.cellModel.activity.name) {
            this.nameElementEntry = this.nameElementEntry.split(`:`).slice(-1);

            this.cellModel.activity.name = this.nameElementEntry;
            if (Validator.isValidUrn(this.cellModel.activity.urn)) {
                this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                    bubbles: true,
                    composed: true,
                    detail: {activity: this._cellModel.activity}
                }));  // tlg changed from node to cellModel  - looks bad
            } else {
                this._cellModel.activity.urn = this.urnElementEntry;
                this.dispatchEvent(new CustomEvent(`event-activity-created`, {
                    bubbles: true,
                    composed: true,
                    detail: {activityConstruct: this._cellModel.activity}
                }));
                const parentActivity = this._cellModel.parent.activity;// ## Need to find the parent a different way.  Saying" this guy has a new kid"
                const id = parentActivity.addChild(this.urnElementEntry);                    // <-- thinking we dont need ids in the jag child list.. does not seem used

                this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                    bubbles: true,
                    composed: true,
                    detail: {activity: parentActivity}
                }));
                // this._htmlElements.urnEntry.focus();   // @TODO -- started getting an error on this.. distraction.
            }
        }
    }

    _handleNameEdit(e) {
        switch (e.key) {
        case `Enter`:
            // Enter adds a new sibling
            // Shift+Enter adds a new child
            e.preventDefault();
            this._htmlElements.nameEntry.blur();

            if (e.shiftKey) {
                this.nodeModel.addChild(new Node());
            }   // shift to controller (ControllerIA.addNewNode(cellModel))
            if (e.ctrlKey) {
                if (this.nodeModel.parent === undefined) {
                    console.log(`Can not add siblings to root`);
                } else {
                    this.nodeModel.parent.addChild(new Node());
                    // shift to controller (ControllerIA.addNewNode(cellModel.parent))
                }
            }
            break;
        case `Escape`:
            this._htmlElements.nameEntry.blur();
            break;
        default:
            console.log(`The key: ${e.key} is not handled`);
        }
        const validCharacters = new RegExp(`[A-Za-z0-9-:]`, `u`);
        if ((!Validator.isValidUrn(this.cellModel.activity.urn)) && (e.key.length === 1) && (validCharacters.test(e.key))) {
            this.urnElementEntry = this.urnElementEntry + e.key.toLowerCase();
        }
    }

    _handleNameInput(e) {
        // This updates as the user type in the names field of the IATABLE jag node area.
        // No idea what this is doing.  (But looks internal to view).
        const name = e.target.innerText;
    }


    _handleURNChange(e) {
        if (this.urnElementEntry !== this.cellModel.activity.urn) {           // if urn was changed
            if (Validator.isValidUrn(this.urnElementEntry)) {        // && entered urn is valid...
                this._htmlElements.suggestions.hide();
                // Is the current URN valid?  (A rename involves more than the initial create)
                if (Validator.isValidUrn(this.cellModel.activity.urn)) {
                    this.dispatchEvent(new CustomEvent(`event-urn-changed`, {
                        bubbles: true,
                        composed: true,
                        detail: {
                            originalUrn: this.cellModel.activity.urn,
                            newUrn: this.urnElementEntry
                        }
                    }));
                    // ControllerIA.updateURN(this.urn, this.cellModel.activity.urn);  // orig, new
                } else {
                    const activityConstruct = {
                        urn: this.urnElementEntry,
                        name: this.nameElementEntry
                    };
                    this.dispatchEvent(new CustomEvent(`event-activity-created`, {
                        bubbles: true,
                        composed: true,
                        detail: {activityConstruct}
                    }));
                    const parentActivity = this.nodeModel.parent.activity;
                    const id = parentActivity.addChild(this.urnElementEntry);                    // <-- thinking we dont need ids in the jag child list.. does not seem used
                    this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                        bubbles: true,
                        composed: true,
                        detail: {activity: parentActivity}
                    }));
                }
            }
            // this.activity.urn = this.urnElementEntry
        }
    }

    _handleURNEdit(e) {
        const selected = this._htmlElements.suggestions.selected;
        switch (e.key) {
        case `Enter`:
            e.preventDefault();
            if (selected !== undefined) {
                this.urnElementEntry = selected;
            }
            this._htmlElements.urnEntry.blur();
            this._htmlElements.suggestions.hide();
            break;
        case `Escape`:
            this.urnElementEntry = this.cellModel.activity.urn;
            this._htmlElements.urnEntry.blur();
            break;
        case `ArrowDown`:
            e.preventDefault();
            this._htmlElements.suggestions.select(1);
            break;
        case `ArrowUp`:
            e.preventDefault();
            this._htmlElements.suggestions.select(-1);
            break;
        default:
            console.log(`The key: ${e.key} is not handled`);
        }
        const validCharacters = new RegExp(`^[A-Za-z0-9\-\:]+`, `u`);
        if ((this.cellModel.activity.name === ``) && (e.key.match(validCharacters))) {
            this.nameElementEntry = (this.nameElementEntry + e.key).split(`:`).slice(-1);
        }
    }


    _handleURNInput(e) {
        const $suggestions = this._htmlElements.suggestions;
        $suggestions.filter(this.urnElementEntry);
    }


    async deleteActivity(deadActivity) {
        this._cellModel = undefined;
        await StorageService.get(deadActivity.urn, `activity`);


        await StorageService.delete(deadActivity.urn, `activity`);
        this._urnInput.classList.toggle(`edited`, false);
        this._clearProperties();
    }

    async cloneActivity(sourceActivity, newURN) {
        const description = sourceActivity.toJSON();
        description.urn = newURN;
        const newActivity = JAG.fromJSON(description);
        // Update model references.
        this._node.model = newActivity; // ?
        this._cellModel = newActivity;
        await StorageService.create(newActivity, `activity`);
        // Remove unsaved box shadow on URN property input.
        this._urnInput.classList.toggle(`edited`, false);

        //  WHEN GOOD -->             this._cellModel.url = this._urnInput.value;
    }


    /**
     * The two methods below came from the Node Model.  Wrong place for them.
     * @param view
     * @returns {Promise<void>}
     */

    async commitNameChange(view) {
        if (this.linkStatus) {
            await this.syncJAG(view, false);
        } else {
            this.activity.name = view.name;
        }
        await StorageService.update(this, `node`);
    }

    /**
     * Synchronizes the display values with the underlying jag model.
     * Actions could be, load a new jag model, create a new jag model or change the name of the current jag.
     * tlg - if nodes are instances of a jag, why should their change affect the jag itself?
     */
    async syncJAG(view, replace = true) {
        const urn = view.urn;
        const name = view.name;

        // If the urn is not valid just notify and revert to previous state
        // @TODO: Implement the notification.
        try {
            Validator.validateURN(urn);
        } catch (e) {
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent(`sync`));
            return;
        }

        // let jag = await JAGService.instance('idb-service').get(urn);
        let jag = await StorageService.get(urn, `activity`);

        // If the model does not exists create one from the view values.
        // if the model does exists, reset to previous state unless replace is true.
        if (!jag) {
            jag = new JAG({
                urn,
                name
            });

            // await JAGService.instance('idb-service').create(jag);
            await StorageService.create(jag, `activity`);
        } else if (!replace) {
            // If the jag already exists we want to abort unless replace is set to true.
            // @TODO: notify the user why this is prevented and how to go about doing it (edit the urn manually).
            // Potentially we could ask the user if s/he wants to load the existing jag.
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent(`sync`));
            return;
        }

        this._updateJAG(jag);
        const valid = true;// this.activity.hasValidURN;
        view.valid = valid;
        // 2 dispatches here - 1 listener in views/Analysis
        this.dispatchEvent(new CustomEvent(`layout`));
    }


    async _initUI() {
        this.cellModel.addEventListener(`sync`, this._syncViewToModel.bind(this));
        // @TODO should view listen to model (new way) or controller (older way)

        const $controls = new JagCellControls(this.cellModel);
        const $header = document.createElement(`header`);
        const $nameEntry = document.createElement(`h1`);
        const $urnEntry = document.createElement(`h2`);
        const $suggestions = new AutoComplete();
        const $fold = document.createElement(`div`);

        this.classList.toggle(`leaf`, !this.cellModel.hasChildren());  // Am I a leaf?


        $nameEntry.setAttribute(`contenteditable`, ``);
        $nameEntry.setAttribute(`spellcheck`, `false`);
        $nameEntry.classList.add(`nodename`);
        $nameEntry.setAttribute(`placeholder`, `Activity`);


        $urnEntry.setAttribute(`contenteditable`, ``);
        $urnEntry.setAttribute(`spellcheck`, `false`);
        $urnEntry.setAttribute(`tabindex`, `-1`);

        if (this._cellModel === undefined) { // && this._cellModel.hasValidURN) {
            this.classList.add(`unsaved`);
        } else {
            $urnEntry.innerText = this.cellModel.activity.urn;
            $nameEntry.innerText = this.cellModel.activity.name;
        }

        $fold.addEventListener(`click`, () => {
            this.dispatchEvent(new CustomEvent(`event-collapse-toggled`, {
                bubbles: true,
                composed: true,
                detail: {node: this._cellModel}
            }));
        });
        $fold.classList.add(`fold-button`);

        // $nameEntry.appendChild($nameEntryInput)
        // $urnEntry.appendChild($urnEntryInput)
        $header.appendChild($nameEntry);
        $header.appendChild($controls);
        this.appendChild($header);
        this.appendChild($urnEntry);
        this.appendChild($suggestions);
        this.appendChild($fold);

        this._htmlElements.urnEntry = $urnEntry;
        this._htmlElements.nameEntry = $nameEntry;
        this._htmlElements.suggestions = $suggestions;

        //    tg - Both functions are equivalent but neither seem to be of any use.  this._htmlElements is set to auto-complete.
        //    tg - possibly the '.suggestions.suggestions' is a mistake.
        await StorageService.all(`activity`).then((jags) => {
            this._htmlElements.suggestions.suggestions = jags.map((jag) => {
                return jag.urn;
            });
            return this._htmlElements.suggestions.suggestions;
        });
        //   allActivitys.forEach(() => this._htmlElements.suggestions.suggestions = allActivitys.map(cellModel => cellModel.activity.urn));
    }


    updateSuggestions(cellModelList) {
        // cellModelList.forEach(() => this._htmlElements.suggestions.suggestions = cellModelList.map(cellModel => cellModel.activity.urn));
        this._htmlElements.suggestions.suggestions = cellModelList.map((cellModel) => {
            return cellModel.activity.urn;
        });
    }

    // Sync view to existing model values.  --- Triggered on 'sync' event which is linked to cellModel.
    _syncViewToModel() {
        console.log(`SYNC HAS BEEN ACTIVATED.................................(surgical treatment of jag/model change)........................   (thought it was disabled) ..........`);
        this.urnElementEntry = this.cellModel.activity.urn;
        this.nameElementEntry = this.cellModel.activity.name;
        this.classList.toggle(`leaf`, !this.cellModel.hasChildren());
    }


}

customElements.define(`ia-jag`, JagCell);
export default customElements.get(`ia-jag`);

