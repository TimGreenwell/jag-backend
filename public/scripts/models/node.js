/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

// These are the

'use strict';

import { UUIDv4 }  from '../utils/uuid.js';
import JAG from './jag.js';
import StorageService from '../services/storage-service.js';
import JAGATValidation from '../utils/validation.js';

// node (with view/jag)  = at's jag-node       -- both syn with JAG model
export default class Node extends EventTarget {

	constructor({ id = UUIDv4(), jag, color, link_status = true, collapsed = false, is_root = false } = {}) {
		super();
		this._id = id;                       // An assigned unique ID given at construction
		this._jag = jag;                     // The Jag Model representing this node

		this._children = new Array();            // Links to actual children [objects]
		this._parent = undefined;            // Link to parent object

		this._link_status = link_status;     // dont know what this is.
		this._color = color;                 // Derived color
		this._collapsed = collapsed;         // Collapsed (table) or folded in (graph)

		this._breadth = 1;                   // Analysis dependent condition
		this._height = 0;
		this._leafCount = 1;
		this._treeDepth = 0;

	}

	get id() {
		return this._id;
	}
	set id(value) {
		this._id = value;
	}
	get jag() {
		return this._jag;
	}
	set jag(value) {
		this._jag = value;
	}
	hasChildren() {
		return (this.children.length !== 0);
	}
	get children() {
		return this._children;
	}
	set children(value) {
		this._children = value;
	}
	addChild(node){                              // moved to controller
		if (this.canHaveChildren) {
			const child = new Node();
			this._children.push(node);
			node.parent = this;
			this.incrementDepth(1);
			if (this.numOfChildren>1){
				this.incrementLeafCount();
			}
		} else {
			alert("Node must first be assigned a valid URN")
		}
	}
	getLastChild(){
		return this._children[this.children.length - 1]
	}
	get canHaveChildren() {
		return ((this.jag !== undefined) && (JAGATValidation.isValidUrn(this.jag.urn)));
	}

	get numOfChildren() {
		return (this._children.length);
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

	get parent() {
		return this._parent;
	}
	set parent(parent) {
		this._parent = parent;
	}

	get linkStatus() {
		return this._link_status;
	}
	set linkStatus(value) {
		this._link_status = value;
	}

	get color() {
		return this._color;
	}
	set color(value) {
		this._color = value;
	}

	get collapsed() {
		return this._collapsed;
	}
	set collapsed(collapsed) {
		this._collapsed = collapsed;
	}
	toggleCollapse() {
		this.collapsed = !this.collapsed;
		// 2 dispatches here - 1 listener in views/Analysis
		this.dispatchEvent(new CustomEvent('layout'));
	}

	get breadth() {
		return this._breadth;
	}
	set breadth(value) {
		this._breadth = value;
	}
	get height() {
		return this._height;
	}
	set height(value) {
		this._height = value;
	}


	get treeDepth() {
		return this._treeDepth;
	}

	get leafCount() {
		return this._leafCount;
	}

	get name() {
		return (this.jag === undefined) ? Node.DEFAULT_JAG_NAME : this.jag.name;
	}
	get urn() {
		return (this.jag === undefined) ? Node.default_urn : this.jag.urn;
	}


	isRoot() {
		return this.parent === undefined;
	}         // is determined by lack of parent.


	// Number of children for a particular node.
	get childCount() {
		return this._children.length;
	}




// //@TODO: This function is doing two things - assigning breadth(numOfLeaves) and height(treeDepth)
	// Also being called on every node during each display/redisply.
	// Suggest separate function for each functionality
	// Suggest done once on entire tree after change instead of on each node during each redisplay.
	// Or maybe better to adjust on init and after each structural change

	update() {
		this._breadth = 1;
		this._height = 0;

		if(this._children.length !== 0 && !this._collapsed)
		{
			this._breadth = 0;
			let max_height = 0;

			for(let child of this._children) {
				child.update();
				this._breadth += child.breadth;
				max_height = Math.max(max_height, child.height);
			}

			this._height = max_height + 1;
		}
	}

	toJSON() {
		const json = {
			id: this._id,
			jag: this.urn,
			color: this._color,
			link_status: this._link_status,
			collapsed: this._collapsed
		};
		json.children = this._children.map(child => child.id);
		return json;
	}

	static async fromJSON(json) {
		// Replaces the id with the actual jag model.
		//const jag = await JAGService.instance('idb-service').get(json.jag);

		const jag = await StorageService.get(json.jag,'jag');
		if (jag instanceof JAG) {
			json.jag = jag;
		}
		else {
			json.jag = undefined;
		}
		//json.jag = (jag != null) ? jag : undefined;

		const node = new Node(json);

		// // @TODO: Can we lazy load these ?
		// const promisedChildren = json.children.map(async child_node_id => {
		// 	const child = await StorageService.get(child_node_id,'jag');
		// 	return child;
		// });
		//
		// const children = await Promise.all(promisedChildren);
		// children.forEach(child => {
		// 	if(child === undefined)
		// 		child = new Node();
		// 	node.addChild(child);
		// });

		return node;
	}



}

Node.DEFAULT_JAG_NAME = 'Activity';
Node.default_urn = 'us:ihmc:';

