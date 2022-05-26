/**
 * @fileOverview JAG view.
 *
 * @author mvignati
 * @version 2.47
 */

// These are the JAG Blocks found in the IA Table  (contains autocomplete)
// Could use a better name => iaJagCell?  1:1 based off atJagNodes


'use strict';

import StorageService from '../services/storage-service.js';
import AutoComplete from '../ui/auto-complete.js';
import JAGControls from '../ui/jag-controls.js';
import AnalysisCell from './analysis-cell.js';
import IaTable from "../ui/ia-table.js";
import InputValidator from "../utils/validation.js";
import JAG from "../models/jag.js";
import JAGATValidation from "../utils/validation.js";
import Controller from "../controllers/controller.js";

// A Cell based off (model/Node)
class JAGView extends AnalysisCell {

	constructor(nodeModel) {
		super();
		console.log("In jagcell constructor");
		console.log(nodeModel)
		this._nodeModel = nodeModel;

		this._elements = {
			urn: undefined,
			name: undefined,
			suggestions: undefined
		};

		this._createDocument();
	}

	get nodeModel() {
		return this._nodeModel;
	}
	set nodeModel(value) {
		this._nodeModel = value;
	}

	//////  Elements and Element Values
	get urn() {
		return this._elements.urn.innerText;
	}
	set urn(urn) {
		this._elements.urn.innerText = urn;
	}
	get urnElement() {
		return this._elements.urn;
	}
	get name() {
		return this._elements.name.innerText.trim();
	}
	set name(name) {
		this._elements.name.innerText = name;
	}
	get nameElement() {
		return this._elements.name;
	}
    //////  Element Properties
	set valid(valid) {
		this.classList.toggle('unsaved', !valid);
	}
	hide() {
		this.classList.add('hidden');
	}
	show() {
		this.classList.remove('hidden');
	}


// Sync view to existing model values.    -ok
	_sync() {
		this.urn = this.nodeModel.urn;                                   //   this = jagView
		this.name = this.nodeModel.name;
		console.log("syncing");
		this.classList.toggle('leaf', !this.nodeModel.hasChildren());
	}

	// Handlers
	_handleURNChange(e) {
		if (this.urn === this.nodeModel.urn)
			return;
		this._elements.suggestions.hide();
		Controller.updateURN(this.urn, this.nodeModel.urn);  // orig, new
	}

	_handleURNEdit(e) {
		switch(e.key) {
			case 'Enter':
				e.preventDefault();
				const selected = this._elements.suggestions.selected;
				if (selected !== undefined)
					this._elements.urn.innerText = selected
				this._elements.urn.blur();
				this._elements.suggestions.hide();
				break;
			case 'Escape':
				this._elements.urn.innerText = this.jag.urn;
				this._elements.urn.blur();
				break;
			case 'ArrowDown':
				e.preventDefault();
				this._elements.suggestions.select(1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				this._elements.suggestions.select(-1);
				break;
		}
	}

	_handleURNInput(e) {
		const $suggestions = this._elements.suggestions;
		$suggestions.filter(this._elements.urn.innerText);
	}


	// This runs when the Name field of the IATABLE Jag node area loses focus.
	async _handleNameChange() {
		if ((this.jag) && (this._elements.name.innerText !== this.jag.name)) {
			const newName = this._elements.name.innerText;
			this.jag.name = newName;
			if (JAGATValidation.isValidUrn(this._elements.urn.innerText)) {
				await Controller.saveJag(this.jag);
				// Maybe I should update a node object and pass that up to the controller.  More uniform?
			} else {
				// if url is empty or valid then url becomes mutation of the name:
                //	const dirtyUrl = IaTable.defaultUrn + this.jag.name;
				const dirtyUrn = this.nodeModel.default_urn + newName;
				const autoUrn = dirtyUrn.replace(' ', '-').replace(/[^0-9a-zA-Z:-]+/g, "").toLowerCase();
				this._elements.urn.innerText = autoUrn;
				// was commitNameChange(this)
				this.jag.urn = autoUrn;
				await Controller.saveJag(this.jag);
			}
		}
		this._elements.urn.innerText.focus();
		// Maybe I can wait on above statement until URN field blurs.
		// Currently, it updates on name change and again on url change.  No big deal though.
	}

	async _handleNameEdit(e) {
		switch(e.key) {
			case 'Enter':
				// Enter adds a new sibling
				// Shift+Enter adds a new child
				e.preventDefault();
				this._elements.name.blur();

				if(e.shiftKey)
					this.nodeModel.addChild(new NodeModel());   // shift to controller (Controller.addNewNode(nodeModel))
				if(e.ctrlKey) {
					if (this.nodeModel.parent !== undefined)
						this.nodeModel.parent.addChild(new NodeModel());  // shift to controller (Controller.addNewNode(nodeModel.parent))
					else
						console.log('Can\'t add siblings to root');
				}
				break;
			case 'Escape':
				this._elements.name.blur();
				break;
		}
	}

	// This updates as the user type in the names field of the IATABLE jag node area.
	// No idea what this is doing.  (But looks internal to view).
	_handleNameInput(e) {
			const name = e.target.innerText;
	}


	async deleteJagModel(deadJagModel) {
		this._jagModel = undefined;
		await StorageService.get(deadJagModel.urn, 'jag');


		await StorageService.delete(deadJagModel.urn, 'jag');
		this._urnInput.classList.toggle("edited", false);
		this._clearProperties();
	}

	async cloneJagModel(sourceJagModel, newURN) {
		const description = sourceJagModel.toJSON();
		description.urn = newURN;
		const newJagModel = JAG.fromJSON(description);
		// Update model references.
		this._node.model = newJagModel; //?
		this._jagModel = newJagModel;
		await StorageService.create(newJagModel, 'jag');
		// Remove unsaved box shadow on URN property input.
		this._urnInput.classList.toggle("edited", false);

		//  WHEN GOOD -->             this._jagModel.url = this._urnInput.value;
	}


	/**
	 * The two methods below came from the Node Model.  Wrong place for them.
	 * @param view
	 * @returns {Promise<void>}
	 */

	async commitNameChange(view) {
		if (this.linkStatus)
			await this.syncJAG(view, false);
		else
			this.jag.name = view.name;
		await StorageService.update(this,'node');
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
			JAGATValidation.validateURN(urn);
		} catch (e) {
			// 6 dispatchers here - Only Listener in views/Jag
			this.dispatchEvent(new CustomEvent('sync'));
			return;
		}

		//let jag = await JAGService.instance('idb-service').get(urn);
		let jag = await StorageService.get(urn,'jag');

		// If the model does not exists create one from the view values.
		// if the model does exists, reset to previous state unless replace is true.
		if (!jag) {
			jag = new JAG({
				urn: urn,
				name: name
			});

			//await JAGService.instance('idb-service').create(jag);
			await StorageService.create(jag,'jag');
		} else if (!replace) {
			// If the jag already exists we want to abort unless replace is set to true.
			//@TODO: notify the user why this is prevented and how to go about doing it (edit the urn manually).
			// Potentially we could ask the user if s/he wants to load the existing jag.
			// 6 dispatchers here - Only Listener in views/Jag
			this.dispatchEvent(new CustomEvent('sync'));
			return;
		}

		this._updateJAG(jag);
		const valid = true;//this.jag.hasValidURN;
		view.valid = valid;
		if(valid)
			this.link_status = false;
		// 2 dispatches here - 1 listener in views/Analysis
		this.dispatchEvent(new CustomEvent('layout'));
	}


	//  This should be shifted to the view --- doesn't belong in the model.


	async _createDocument() {
		this.nodeModel.addEventListener('sync', this._sync.bind(this));

		const $controls = new JAGControls(this.nodeModel);
		const $header = document.createElement('header');
		const $name = document.createElement('h1');
		const $urn = document.createElement('h2');
		const $suggestions = new AutoComplete();
		const $fold = document.createElement('div');


		console.log("jag-cell --- create-document")
		console.log(this.nodeModel);
		this.classList.toggle('leaf', !this.nodeModel.hasChildren());  // Am I a leaf?

		$name.addEventListener('blur', this._handleNameChange.bind(this));  // pass name and auto-urn up to Controller for Jag updating.
		$name.addEventListener('keydown', this._handleNameEdit.bind(this)); // poorly named -- adds child or sibling depending on keypress
		$name.addEventListener('input', this._handleNameInput.bind(this));  // no idea.. view thing.  needed?
		$name.setAttribute('contenteditable', '');
		$name.setAttribute('spellcheck', 'false');
		$name.innerText = this.nodeModel.name;

		$urn.addEventListener('blur', this._handleURNChange.bind(this));  // pass urn change to Controller.updateURN
		$urn.addEventListener('keydown', this._handleURNEdit.bind(this)); // handles the suggestions
		$urn.addEventListener('input', this._handleURNInput.bind(this));  // filters suggestions
		$urn.setAttribute('contenteditable', '');
		$urn.setAttribute('spellcheck', 'false');
		$urn.setAttribute('tabindex', '-1');

		if(this._nodeModel.jag !== undefined)// && this._nodeModel.jag.hasValidURN)
			$urn.innerText = this.nodeModel.urn;
		else
			this.classList.add('unsaved');

		$fold.addEventListener('click', () => this.nodeModel.toggleCollapse());
		$fold.classList.add('fold-button');

		$header.appendChild($name);
		$header.appendChild($controls);

		this.appendChild($header);
		this.appendChild($urn);
		this.appendChild($suggestions);
		this.appendChild($fold);

		this._elements.urn = $urn;
		this._elements.name = $name;
		this._elements.suggestions = $suggestions;

		//    tg - Both functions are equivalent but neither seem to be of any use.  this._elements is set to auto-complete.
		//    tg - possibly the '.suggestions.suggestions' is a mistake.
		await StorageService.all('jag').then(jags => this._elements.suggestions.suggestions = jags.map(jag => jag.urn));
       //	allJagModels.forEach(() => this._elements.suggestions.suggestions = allJagModels.map(jagModel => jagModel.urn));
	}



}

customElements.define('ia-jag', JAGView);
export default customElements.get('ia-jag');

