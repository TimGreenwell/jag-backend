/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import { UUIDv4 }  from '../utils/uuid.js';
import Validation from '../utils/validation.js';
import UserPrefs from "../utils/user-prefs.js";
import JagModel from "../models/jag.js"


// node (with view/jag)  = at's jag-node       -- both syn with JAG model
export default class Cell extends EventTarget {

	constructor({
					id = UUIDv4(),
					jag,
					urn,
		childId,
					parentUrn,
					rootUrn,
					children = []
				} = {}) {
		super();
		this._id = id;               // An assigned unique ID given at construction
		this._urn = urn;
		this._jag = jag;             // convenience
		this._childId = childId;               // child seperator (ex.  2nd child with urn 'goto')
		this._parentUrn = parentUrn;
		this._rootUrn = rootUrn;     // convenience
		this._children = children;
		this._leafCount = 1;
		this._treeDepth = 0;
		this._collapsed = false;
	}

	get id() {
		return this._id;
	}
	set id(value) {
		this._id = value;
	}
	get jag() {            // Convenience -- jag matching urn
		return this._jag;
	}
	set jag(value) {
		this._jag = value;
	}
    get children() {
		return this._children;
	}
	set children(childrenArray){
		this._children = childrenArray
	}

	get urn() {
		return this._urn;
	}

	set urn(value) {
		this._urn = value;
	}

	get parentUrn() {
		return this._parentUrn;
	}

	set parentUrn(value) {
		this._parentUrn = value;
	}

	get rootUrn() {
		return this._rootUrn;
	}

	set rootUrn(value) {
		this._rootUrn = value;
	}


	get leafCount() {
		return this._leafCount;
	}

	set leafCount(value) {
		this._leafCount = value;
	}

	get treeDepth() {
		return this._treeDepth;
	}

	set treeDepth(value) {
		this._treeDepth = value;
	}

	get collapsed() {
		return this._collapsed;
	}

	set collapsed(value) {
		this._collapsed = value;
	}

///////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////// Supporting Functions  ////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////


	activitiesInProject(urn){    // return array of nodes matching urn
		let matchStack = [];
		let workStack = [];

		workStack.push(this);
		while (workStack.length > 0 ){
			let nodeModel = workStack.pop();
			if (nodeModel._urn == urn) {
				matchStack.push(nodeModel);
			}
			nodeModel.jag.children.forEach(kid => {workStack.push(kid)})
		}
      return matchStack;
	}

	isActivityInProject(urn) {
		return (this.activitiesInProject(urn).length > 0)
	}

	incrementDepth(depthCount){
		if (depthCount > this._treeDepth) {
			this._treeDepth = depthCount;
			if (this.parent){
				this.parent.incrementDepth(depthCount + 1);
			}
		}
	}
	incrementLeafCount() {
		this._leafCount = this._leafCount + 1;
		if (this.parent){
			this.parent.incrementLeafCount();
		}
	}

	// parentize(currentNode = this.getAncestor()){
	// 	if (currentNode.hasChildren()){
	// 		for (let child of this.children) {
	// 			child.parent = currentNode;
	// 			this.parentize(child);
	// 		}
	// 	}
	// }

	hasChildren() {
		return (this.children.length !== 0);
	}

	getChildById(id) {
		if (id == this.id) {
			return this
		} else {
			this.children.forEach(child => {
				child.getChildById(id)
			})

		}}


	addChild(node){                              // moved to controller
		if (this.canHaveChildren) {
			const child = new Cell();
			this._children.push(node);
			node.parent = this;
			this.incrementDepth(1);
			if (this.childCount>1){
				this.incrementLeafCount();
			}
		} else {
			alert("Node must first be assigned a valid URN")
		}
	}
	removeChild(child){
		let filtered = this.children.filter(entry => {
			console.log("--");

			console.log(child)
			console.log(entry)
			if (entry.id != child.id) {
				return entry
			}})
		this.children = filtered;
	}

	removeChildById(id){
		this.children.forEach(child => {
			if (child.id == id) {
				this.removeChild(child);
			}
		})
	}
	getLastChild(){
		return this._children[this.children.length - 1]
	}
	get canHaveChildren() {  // already pushed to jag model
		return ((this.jag !== undefined) && (Validation.isValidUrn(this.jag._urn)));
	}
	get childCount() {
		return this._children.length;
	}

	toggleCollapse() {
		this.collapsed = !this.collapsed;
		// 2 dispatches here - 1 listener in views/Analysis
		this.dispatchEvent(new CustomEvent('layout'));
	}

	isRoot() {
		return this._parent === undefined;
	}         // is determined by lack of parent.

    getAncestor() {
		let topAncestor = this;
		while(!topAncestor.isRoot()) {
			topAncestor = topAncestor.parent
		}
		return topAncestor;
		}



	toJSON() {
		const json = {
			id: this._id,
			urn: this._urn,
			jag: this._jag,
			childId: this._childId,
            parentUrn: this._parentUrn,
			rootUrn: this._rootUrn,
			children: this._children
		};
		let childStack = [];
		for (let child of this._children) {
			childStack.push(child.toJSON())
		}
		json.children = childStack
		return json;
	}

	static async fromJSON(json) {
		const cell = new Cell(json);
		return cell;
	}

}


