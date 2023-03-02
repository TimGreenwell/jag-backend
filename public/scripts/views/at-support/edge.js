// /**
//  * @file Graphical edge representation of a JAG.
//  *
//  * @author mvignati
//  * @copyright Copyright © 2019 IHMC, all rights reserved.
//  * @version 0.87
//  */
//
// import Activity from '../../models/activity.js';
//
// const XMLNS = `http://www.w3.org/2000/svg`;
//
// export default class Edge extends EventTarget {
//
//     constructor(edgeContainerElement) {
//         super();
//         this.init(edgeContainerElement);
//         this.visible = true;
//         this._atomic = false;
//     }
//
//     init(edgeContainerElement) {
//         this._group = document.createElementNS(XMLNS, `g`);
//
//         this._origin = {
//             x: 0,
//             y: 0
//         };
//         this._end = {
//             x: 0,
//             y: 0
//         };
//         this._leadActivityNode = undefined;
//         this._subActivityNode = undefined;
//
//         this._edge_el = document.createElementNS(XMLNS, `path`);
//         this._edge_el.setAttributeNS(null, `stroke`, `gray`);
//         this._edge_el.setAttributeNS(null, `fill`, `transparent`);
//
//         this._text_el = document.createElementNS(XMLNS, `text`);
//         this._text_el.setAttribute(`class`, `sequential-label`);
//
//         this._anno_el = document.createElementNS(XMLNS, `text`);
//         this._anno_el.setAttribute(`class`, `annotation-label`);
//         this._anno_el.innerHTML = `@`;
//         this._anno_el.style.visibility = `hidden`;
//         this._anno_visibility = `hidden`;
//
//         this._list_el = document.createElementNS(XMLNS, `text`);
//         this._list_el.setAttribute(`class`, `annotations-list`);
//         this._list_el.style.visibility = `hidden`;
//
//         this._part_el = document.createElementNS(XMLNS, `text`);
//         this._part_el.setAttribute(`class`, `participation-label`);
//
//         this._group.appendChild(this._edge_el);
//         this._group.appendChild(this._text_el);
//         this._group.appendChild(this._anno_el);
//         this._group.appendChild(this._list_el);
//         this._group.appendChild(this._part_el);
//
//         this._edgeContainerElement = edgeContainerElement;
//         edgeContainerElement.appendChild(this._group);
//
//         this._childId = undefined;
//
//         edgeContainerElement.addEventListener(`click`, this._handleSelection.bind(this));
//         edgeContainerElement.addEventListener(`mousemove`, this._handleHover.bind(this));
//     }
//
//     getLeadActivityNode() {
//         return this._leadActivityNode;
//     }
//
//     setLeadActivityNode(node) {
//         this._leadActivityNode = node;
//         this._leadActivityNode.prepareOutEdge(this); // Note: this only computes and sets graphical edge stroke origin; no change to activity
//
//         // If the parent is atomic, this will make the edge already styled for atomicity on drag.
//         this._updateStroke(this._leadActivityNode.isAtomic());
//     }
//
//     getSubActivityNode() {
//         return this._subActivityNode;
//     }
//
//     setSubActivityNode(subActivityNode) {
//         this._subActivityNode = subActivityNode;
//         this._subActivityNode.addInEdge(this);
//         const origin_nodeModel = this._leadActivityNode.nodeModel;  // maybe +.activity
//
//         origin_nodeModel.addEventListener(`update`, this._updateHandler.bind(this));
//
//         // this._childId = this._leadActivityNode.completeOutEdge(this, this._childId); // Note: this does multiple things:  @TODO Fix this
//         this._leadActivityNode.completeOutEdge(this, this._childId);  // now it does very little
//
//         // Not sure of the point of the second (id) parameter
//         // @TODO First thing - remove child adding inside the abouve completeOutEdge
//         // - Adds edge to graphical node's 'outs'
//         // - Invokes _leadActivityNode#addChild(_subActivityNode), which:
//         //   - Adds _subActivityNode activity to _leadActivityNode activity's children
//         //   - Sets _subActivityNode activity's parent to _leadActivityNode activity
//         //   - Dispatches update event
//
//         this._updateOrder(origin_nodeModel.activity.children, origin_nodeModel.activity.connector.execution);
//         this._updateStrokeDash(origin_nodeModel.activity.operator);
//
//
//         // @TODO TLG - DO NOT DELETE THIS COMMENT OR THE BLOCK BELOW.  THIS MAY HAVE BEEN PREMATURLY BLOCKED OFF>
//         // const child = origin_nodeModel.activity.children.reduce((prev, curr) => {
//         //     if (curr.id === this._childId) {
//         //         return curr;
//         //     }
//         //
//         //     return prev;
//         // });
//         //
//         // this._updateAnnotations(this._childId, child.annotations, child.iterable);
//         //
//         // // Update all child edges of the end node with upstream atomicity.
//         // // Note: this does not use this#updateStroke since this edge may not be
//         // //       atomic, but is annotated atomic, and so its children should be.
//         // for (const child_edge of this._subActivityNode.getChildEdges()) {
//         //     child_edge.updateStroke(this._subActivityNode.isAtomic());
//         // }
//     }
//
//     setOrigin(x, y) {
//         this._origin.x = x;
//         this._origin.y = y;
//         this._applyPath();
//     }
//
//     setEnd(x, y) {
//         this._end.x = x;
//         this._end.y = y;
//         this._applyPath();
//     }
//
//     getChildId() {
//         return this._childId;
//     }
//
//     setChildId(id) {
//         this._childId = id;
//     }
//
//     getChildName() {
//         return this._childName;
//     }
//
//     setChildName(name) {
//         this._childName = name;
//         this._leadActivityNode.setChildName(name, this._childId);                  // /////////// I swapped these
//     }
//
//     getChildDescription() {
//         return this._childDescription;
//     }
//
//     setChildDescription(description) {
//         this._childDescription = description;
//         this._leadActivityNode.setChildDescription(this._childId, description);
//     }
//
//     set visible(visible) {
//         this._visible = visible;
//
//         if (visible) {
//             this._edge_el.style.visibility = `visible`;
//             this._part_el.style.visibility = (this._leadActivityNode && this._leadActivityNode.isAtomic()) ? `hidden` : `visible`;
//             this._text_el.style.visibility = `visible`;
//             this._anno_el.style.visibility = this._anno_visibility;
//         } else {
//             this._edge_el.style.visibility = `hidden`;
//             this._part_el.style.visibility = `hidden`;
//             this._text_el.style.visibility = `hidden`;
//             this._anno_el.style.visibility = `hidden`;
//         }
//     }
//
//     getParentURN() {
//         return this._leadActivityNode.getURN();
//     }
//
//
//     setGreyedOut(is_greyed_out) {
//         this._is_greyed_out = is_greyed_out;
//
//         if (is_greyed_out) {
//             this._group.setAttribute(`class`, `greyed-out-node`);
//         } else {
//             this._group.setAttribute(`class`, ``);
//         }
//     }
//
//     setSelected(is_selected) {
//         this._is_selected = is_selected;
//
//         if (is_selected) {
//             this._group.setAttribute(`class`, `selected-node`);
//         } else {
//             this._group.setAttribute(`class`, ``);
//         }
//     }
//
//     // ///////////////////////////////////////////
//     // /////////  Handlers  //////////////////////
//     // ///////////////////////////////////////////
//
//
//     _updateHandler(e) {
//         const property = e.detail.property;
//         const data = e.detail.extra;
//
//         if (property === `children`) {
//             this._updateOrder(data.children, data.execution);
//         } else if (property === `execution`) {
//             this._updateOrder(data.children, data.execution);
//         } else if (property === `operator`) {
//             this._updateStrokeDash(data.operator);
//         } else if (property === `annotations`) {
//             this._updateAnnotations(data.id, data.annotations, data.iterable);
//         }
//
//         // Since the atomic annotation may have been modified, or a change in
//         // the inheritance tree has occurred, check to update the stroke.
//         this.updateStroke(this._leadActivityNode.isAtomic());
//     }
//
//     _handleHover(e) {
//         if (this._visible && this._containsPoint(e.clientX, e.clientY)) {
//             this._list_el.style.visibility = `visible`;
//         } else {
//             this._list_el.style.visibility = `hidden`;
//         }
//     }
//
//     _handleSelection(e) {
//         if (this._visible && this._containsPoint(e.clientX, e.clientY)) {
//             this._edge_el.setAttributeNS(null, `stroke`, `red`);
//             this.dispatchEvent(new CustomEvent(`selection`, {detail: {selected: true}}));
//         } else if (!e.shiftKey) {
//             this._updateStroke(this._leadActivityNode.isAtomic());
//             this.dispatchEvent(new CustomEvent(`selection`, {detail: {selected: false}}));
//         }
//     }
//
//
//     // ///////////////////////////////////////////
//     // /////////  Support  //////////////////////
//     // ///////////////////////////////////////////
//
//     _updateParticipation(type) {
//         let icon = ``;
//
//         if (type === `atomic`) {
//             icon = `&#xf406;`;
//         } else if (type === `conjunctive`) {
//             icon = `&#xf4ce;`;
//         } else if (type === `additive`) {
//             icon = `&#xf0c0;`;
//         }
//
//         this._part_el.innerHTML = icon;
//     }
//
//     _clearAnnotations() {
//         while (this._list_el.firstChild) {
//             this._list_el.removeChild(this._list_el.firstChild);
//         }
//     }
//
//     _createAnnotation(key, value) {
//         const _tspan_key = document.createElementNS(XMLNS, `tspan`);
//         _tspan_key.setAttribute(`class`, `annotation-key`);
//         _tspan_key.setAttributeNS(null, `x`, this._list_el.getAttributeNS(null, `x`));
//         _tspan_key.setAttributeNS(null, `dy`, `1.1em`);
//         _tspan_key.innerHTML = `${key}`;
//         this._list_el.appendChild(_tspan_key);
//
//         const value_text = value === Object(value) ? JSON.stringify(value) : value.toString();
//
//         const _tspan_value = document.createElementNS(XMLNS, `tspan`);
//         _tspan_value.setAttribute(`class`, `annotation-value`);
//         _tspan_value.setAttributeNS(null, `dx`, _tspan_key.clientWidth);
//         _tspan_value.setAttributeNS(null, `dy`, 0);
//         _tspan_value.innerHTML = `: ${value_text}`;
//         this._list_el.appendChild(_tspan_value);
//     }
//
//     _updateAnnotations(id, annotations, iterable) {
//         if (this._childId === id) {
//             this._clearAnnotations();
//
//             if (iterable) {
//                 this._createAnnotation(`iterable`, true);
//                 this._anno_visibility = `visible`;
//                 this._anno_el.style.visibility = `visible`;
//             }
//
//             // Assume every edge is an additive task.
//             this._atomic = false;
//             this._updateParticipation(`additive`);
//
//             if (annotations != undefined && annotations.size > 0) {
//                 if (!iterable) {
//                     this._anno_visibility = `visible`;
//                     this._anno_el.style.visibility = this._visible ? `visible` : `hidden`;
//                 }
//
//                 for (const annotation of annotations.keys()) {
//                     const value = annotations.get(annotation);
//                     this._createAnnotation(annotation, value);
//                 }
//
//                 // Now apply any participation annotations.
//                 if (annotations.has(`atomic`) && annotations.get(`atomic`) === true) {
//                     this._atomic = true;
//                     this._updateParticipation(`atomic`);
//                 } else if (annotations.has(`conjunctive`) && annotations.get(`conjunctive`) === true) {
//                     this._updateParticipation(`conjunctive`);
//                 }
//             } else if (!iterable) {
//                 this._anno_visibility = `hidden`;
//                 this._anno_el.style.visibility = `hidden`;
//             }
//         }
//     }
//
//     updateStroke(atomic) {
//         // The atomic notation for a higher-level node may have changed to false, but
//         // this node's parent may be atomic, so accept the most immediate value.
//         const toggle = atomic || this._leadActivityNode.isAtomic();
//
//         // Update ONLY this edge's stroke.
//         this._updateStroke(toggle);
//
//         // If this edge is atomic, hide participation, else display it.
//         this._part_el.style.visibility = !toggle && this._visible ? `visible` : `hidden`;
//
//         // Recursively update for all children in this tree.
//         for (const child_edge of this._subActivityNode.getChildEdges()) {
//             child_edge.updateStroke(atomic);
//         }
//     }
//
//     _updateStroke(atomic) {
//         // Atomic edges are slightly thicker and green.
//         if (atomic) {
//             this._edge_el.setAttributeNS(null, `stroke-width`, `2`);
//             this._edge_el.setAttributeNS(null, `stroke`, `green`);
//             // Normal edges are the default thickness and gray.
//         } else {
//             this._edge_el.removeAttributeNS(null, `stroke-width`);
//             this._edge_el.setAttributeNS(null, `stroke`, `gray`);
//         }
//     }
//
//     _updateStrokeDash(operator) {
//         // OR edges are dashed.
//         if (operator === Activity.OPERATOR.OR.name) {
//             this._edge_el.setAttributeNS(null, `stroke-dasharray`, `4`);
//             // AND edges are solid.
//         } else {
//             this._edge_el.removeAttributeNS(null, `stroke-dasharray`);
//         }
//     }
//
//     _containsPoint(x, y) {
//         const rect = this._group.getBoundingClientRect();
//
//         return (x > rect.left && x < rect.right) &&
//             (y > rect.top && y < rect.bottom);
//     }
//
//     isAtomic() {
//         // If this is directly annotated atomic, it is atomic.
//         if (this._atomic) {
//             return true;
//         }
//
//         // Otherwise, check if upstream is atomic.
//         return this._leadActivityNode.isAtomic();
//     }
//
//     destroy() {
//         this._edgeContainerElement.removeChild(this._group);
//         this._edgeContainerElement.removeEventListener(`click`, this._handleSelection.bind(this));
//
//         if (this._leadActivityNode != undefined) {
//             this._leadActivityNode.nodeModel.activity.removeEventListener(`update`, this._updateHandler.bind(this));
//             this._leadActivityNode.removeOutEdge(this, this._childId);
//         }
//
//         if (this._subActivityNode != undefined) {
//             this._subActivityNode.removeInEdge(this);
//         }
//     }
//
//     _applyPath() {
//         const ox = Math.round(this._origin.x) + 0.5;
//         const oy = Math.round(this._origin.y) + 0.5;
//         const ex = Math.round(this._end.x) + 0.5;
//         const ey = Math.round(this._end.y) + 0.5;
//         const delta_x = (ex - ox) / 2.0;
//         const x1 = ox + delta_x;
//         const y1 = oy;
//         const x2 = ex - delta_x;
//         const y2 = ey;
//         const mx = (ox + ex) / 2.0;
//         const my = (oy + ey) / 2.0;
//
//         this._data = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
//
//         this._edge_el.setAttributeNS(null, `d`, this._data);
//         this._text_el.setAttributeNS(null, `x`, mx - 5);
//         this._text_el.setAttributeNS(null, `y`, my - 5);
//         this._anno_el.setAttributeNS(null, `x`, mx + 5);
//         this._anno_el.setAttributeNS(null, `y`, my + 5);
//         this._list_el.setAttributeNS(null, `x`, mx + 20);
//         this._list_el.setAttributeNS(null, `y`, my - 8);
//         this._part_el.setAttributeNS(null, `x`, ex - 25);
//         this._part_el.setAttributeNS(null, `y`, ey + 5);
//
//         for (const key in this._list_el.children) {
//             if (key % 2 === 0) {
//                 this._list_el.children[key].setAttributeNS(null, `x`, mx + 20);
//             }
//         }
//     }
//
//     _updateOrder(children, execution) {
//         let order = 0;
//
//         if (execution === Activity.EXECUTION.SEQUENTIAL.name) {
//             const ordered = children.map((child) => {
//                 return child.id;
//             });
//             order = ordered.indexOf(this._childId) + 1;
//         }
//
//         this._text_el.innerHTML = order === 0 ? `` : order;
//     }
//
//
// }
