// // What is this.parentNode.    Used but not defined.
//
//
// /**
//  * @file Graphical node representation of a JAG.
//  *
//  * @author mvignati
//  * @copyright Copyright © 2019 IHMC, all rights reserved.
//  * @version 1.05
//  */
//
//
// //  This is the playground Jag LiveNode -
//
// import Activity from '../../models/activity.js';
//
// customElements.define(`jag-node`, class extends HTMLElement {
//
//     constructor(nodeModel) {
//         super();
//         this._translation = {
//             x: 0,
//             y: 0
//         };        // set_translation below === doesnt that make this useless.
//         this._outs = new Set();
//         this._in = null;
//         this._boundUpdateHandler = this._updateHandler.bind(this);
//         this._boundDrag = this._drag.bind(this);
//         this._boundMouseUp = this._mouseUp.bind(this);
//         this._boundNodeDrag = ((e) => {
//             e.stopPropagation();
//             this._drag(e);
//         });
//         this.SNAP_SIZE = 10.0;
//         this._initUI();
//         this.setTranslation(100, 100);       //  Looks like this sets the  translation values and sets the view style
//         this._initHandlers();
//         this._nodeModel = nodeModel;               // /  this is bad --- calling the complex set --- its confusing  - cost 1/2 day
//         //    this.isExpanded = isExpanded;
//         this.becomeVisible();
//         // ///////////////////////////////////////////////////////
//         if (this._nodeModel) {
//             this._nodeModel.removeEventListener(`update`, this._boundUpdateHandler);
//         }
//         this.id = nodeModel.id;
//         this._translation.x = (nodeModel.x) ? nodeModel.x : 0;
//         this._translation.y = (nodeModel.y) ? nodeModel.y : 0;
//         this.setAttribute(`urn`, nodeModel.activity.urn);
//         this.setAttribute(`project`, nodeModel.id);
//         this._nodeModel = nodeModel;
//         this._nodeModel.addEventListener(`update`, this._boundUpdateHandler);
//         this._applyName();
//         this._applyOperator();
//         this._applyExecution();
//     }
//
//     set nodeModel(nodeModel) {           // another complex set                                                         yuk
//         this._nodeModel = nodeModel;
//     }
//
//     get nodeModel() {
//         return this._nodeModel;
//     }
//
//     set isExpanded(isExpanded) {               // complex...leave it
//         this._nodeModel.isExpanded = isExpanded;
//
//         for (const edge of this._outs) {
//             const child = edge.getSubActivityNode();
//             edge.visible = isExpanded && this.visible;
//             child.visible = isExpanded && this.visible;
//         }
//
//         if (this._nodeModel.isExpanded) {
//             this._$expand.innerHTML = `<`;
//         } else {
//             this._$expand.innerHTML = `>`;
//         }
//
//         if (this._nodeModel.hasChildren() && this._visible) {
//             this._$expand.style.visibility = `visible`;
//         } else {
//             this._$expand.style.visibility = `hidden`;
//         }
//     }
//
//
//     get isExpanded() {
//         return this._nodeModel.isExpanded;
//     }
//
//     // complex set visible
//     set visible(visible) {                       // complex...leave it
//         this._visible = visible;
//
//         if (this._visible) {
//             this.becomeVisible();
//         } else {
//             this.becomeInvisible();
//         }
//     }
//
//
//     becomeVisible() {
//         this._visible = true;
//         for (const edge of this._outs) {
//             const child = edge.getSubActivityNode();
//             edge.visible = this._visible;
//             child.becomeVisible();
//         }
//         this.style.visibility = `visible`;
//         this.isExpanded = this.isExpanded;
//         this.dispatchEvent(new CustomEvent(`toggle-visible`, {detail: this._visible}));
//     }
//
//     becomeInvisible() {
//         this._visible = false;
//         for (const edge of this._outs) {
//             const child = edge.getSubActivityNode();
//             edge.visible = this._visible;
//             child.becomeInvisible();
//         }
//         this.style.visibility = `hidden`;
//         this._$expand.style.visibility = `hidden`;
//         this.dispatchEvent(new CustomEvent(`toggle-visible`, {detail: this._visible}));
//     }
//
//     get visible() {
//         return this._visible;
//     }
//
//
//     isAtomic() {
//         // If there are upstream nodes, check for atomicity.
//         if (this._in) {
//             return this._in.isAtomic();
//         }
//
//         // Else, this is not atomic.
//         return false;
//     }
//
//     addInEdge(edge) {
//         if (this._in == undefined) {
//             const [h_center_x, h_center_y] = this._computeNodeInputAttachment();
//             edge.setEnd(h_center_x, h_center_y);
//             this._in = edge;
//         } else {
//             throw new Error(`Cannot have multiple edges in to a node!`);
//         }
//     }
//
//     removeInEdge(edge) {
//         if (this._in == edge) {
//             this._in = undefined;
//         } else {
//             throw new Error(`Attempting to remove unknown in edge from node!`);
//         }
//     }
//
//     removeAllEdges() {
//         if (this._in) {
//             this._in.destroy();
//         }
//
//         this._outs.forEach((edge) => {
//             return edge.destroy();
//         });
//     }
//
//     addOnEdgeInitializedListener(listener) {
//         this._$connector.addEventListener(`mousedown`, (e) => {
//             listener(e, this);
//         });
//     }
//
//     addOnEdgeFinalizedListener(listener) {
//         this.addEventListener(`mouseup`, (e) => {
//             listener(e, this);
//         });
//     }
//
//     prepareOutEdge(edge) {
//         const [c_center_x, c_center_y] = this._computeNodeOutputAttachment();
//         edge.setOrigin(c_center_x, c_center_y);
//     }
//
//     completeOutEdge(edge, id = undefined) {
//         this._outs.add(edge);
//         this.isExpanded = this.isExpanded;
//
//         //    return this._nodeModel.activity.addChild(edge.getSubActivityNode().nodeModel.urn, id);              ////// sorry
//
//         // @todo - wondering if node and jag models need to be modded  < hate this
//     }  // returns the ID of the jag child (urn,id) -- for main to refer to subactivity
//
//     removeOutEdge(edge, id) {
//         this._outs.delete(edge);
//     }
//
//     removeChild(edge, id) {
//         if (edge.getSubActivityNode()) {
//             this._nodeModel.activity.removeChild({id,
//                 activity: edge.getSubActivityNode().activity});
//             this._outs.delete(edge);
//             edge.destroy();
//         }
//     }
//
//     getURN() {
//         return this._nodeModel.activity.urn;
//     }
//
//     getParent() {
//         if (this._in) {
//             return this._in.getLeadActivityNode();
//         }
//         return undefined;
//     }
//
//     getParentURN() {
//         if (this._in) {
//             return this._in.getParentURN();
//         }
//
//         return undefined;
//     }
//
//     getRoot() {
//         if (this._in) {
//             return this._in.getLeadActivityNode().getRoot();
//         }
//         return this;
//     }
//
//     refresh(alreadyRefreshed = new Set()) {
//         this.dispatchEvent(new CustomEvent(`refresh`, {
//             detail: {
//                 activity: this._nodeModel.activity,
//                 refreshed: alreadyRefreshed
//             }
//         }));
//     }
//
//     // getChildren() {
//     //     const all_children = new Set();
//     //
//     //     for (const out_edge of this._outs) {
//     //         all_children.add(out_edge.getSubActivityNode());
//     //     }
//     //
//     //     return all_children;
//     // }
//
//
//     getContextualName() {
//         return this._nodeModel.contextualName;
//     }
//
//
//     setChildName(id, name) {
//         this._nodeModel.activity.setChildName(id, name);
//     }
//
//     setChildDescription(id, description) {
//         this._nodeModel.activity.setChildDescription(id, description);
//     }
//
//
//     // @TODO Break this up into 2 functions: getNodeDescendantSet(node)  &  selectNodes(Set)
//     setSelected(is_selected, nodeDescendantSet = undefined) {
//         if (is_selected != this._is_selected) {
//             this._animationRefresh();
//         }
//
//         this._is_selected = is_selected;
//
//         if (is_selected) {
//             this.classList.add(`selected-node`);
//
//             if (nodeDescendantSet) {
//                 for (const out_edge of this._outs) {
//                     const sub_node = out_edge.getSubActivityNode();
//                     nodeDescendantSet.add(sub_node);
//                     nodeDescendantSet = sub_node.setSelected(true, nodeDescendantSet);
//                 }
//             }
//         } else {
//             this.classList.remove(`selected-node`);
//         }
//         return nodeDescendantSet;
//     }
//
//     getParentEdge() {
//         if (this._in !== undefined) {
//             return this._in;
//         }
//     }
//
//
//     getChildEdges() {
//         return this._outs;
//     }
//
//     getChildren() {
//         const all_children = new Set();
//
//         for (const out_edge of this._outs) {
//             all_children.add(out_edge.getSubActivityNode());
//         }
//
//         return all_children;
//     }
//
//     getTree(tree = new Set()) {
//         tree.add(this);
//
//         for (const out_edge of this._outs) {
//             out_edge.getSubActivityNode().getTree(tree);
//         }
//
//         return tree;
//     }
//
//     _initUI() {
//         this.setAttribute(`tabindex`, `-1`);
//
//         this._$header = document.createElement(`header`);
//         this._$header_name = document.createElement(`h1`);
//         this._$header_name.className = `node-name`;
//         this._$header.appendChild(this._$header_name);
//
//         this._$connector = document.createElement(`div`);
//         this._$connector.className = `connector`;
//
//         this._$expand = document.createElement(`div`);
//         this._$expand.className = `expand`;
//         this._$expand.innerHTML = `>`;
//
//         this._$concurrency = document.createElement(`div`);
//         this._$concurrency.className = `concurrency`;
//
//         this.appendChild(this._$header);
//         this.appendChild(this._$connector);
//         this.appendChild(this._$expand);
//         this.appendChild(this._$concurrency);
//     }
//
//     _drag(e) {
//         if (!this._is_moving) {
//             return;
//         }
//
//         const scaleFactor = this.offsetWidth / this.getBoundingClientRect().width;
//
//         this.translate(e.movementX * scaleFactor, e.movementY * scaleFactor, e.shiftKey ? true : undefined);
//     }
//
//     _mouseUp() {
//         this._is_moving = false;
//         this._$header.className = ``;
//         this._snap();
//         this.dispatchEvent(new CustomEvent(`drag`));
//         this.removeEventListener(`mousemove`, this._boundNodeDrag);
//         //    this.parentNode.removeEventListener('mousemove', this._boundDrag);                // tlg I took this out -- being annoying -- what is parentNode..never defined
//         this.dispatchEvent(new CustomEvent(`event-livenode-repositioned`, {
//             bubbles: true,
//             detail: {
//                 nodeModel: this._nodeModel,
//                 x: this._translation.x,
//                 y: this._translation.y
//             }
//         }));
//     }
//
//     _initHandlers() {
//         this._$header.addEventListener(`mousedown`, (e) => {
//             this._center_offset = {
//                 x: (this._$header.clientWidth / 2.0) - e.offsetX,
//                 y: (this._$header.clientHeight / 2.0) - e.offsetY
//             };
//
//             this._is_moving = true;
//             this._$header.className = `moving`;
//             this._$header.addEventListener(`mousemove`, this._boundNodeDrag);
//             this.parentNode.addEventListener(`mousemove`, this._boundDrag);
//             this._$header.addEventListener(`mouseup`, this._boundMouseUp);
//             this.parentNode.addEventListener(`mouseup`, this._boundMouseUp);
//         });
//
//         this._$header.addEventListener(`transitionend`, () => {
//             window.cancelAnimationFrame(this._animation_frame_id);
//         });
//
//         this._$expand.addEventListener(`click`, () => {
//             //    this._nodeModel.isExpanded = !this._nodeModel.isExpanded;
//             this.isExpanded = !this.isExpanded;
//             const updateNode = (this._nodeModel.isRoot()) ? this._nodeModel : this._nodeModel.parent;
//             this.dispatchEvent(new CustomEvent(`event-livenode-updated`, {
//                 bubbles: true,
//                 composed: true,
//                 detail: {nodeModel: updateNode}
//             }));
//         });
//     }
//
//     detachHandlers() {
//         this.parentNode.removeEventListener(`mouseup`, this._boundMouseUp);
//         this.parentNode.removeEventListener(`mousemove`, this._boundDrag);
//     }
//
//     syncViewToNodeModel(nodeModel) {
//         this._nodeModel = nodeModel;
//         this._translation.x = this._nodeModel.x;
//         this._translation.y = this._nodeModel.y;
//         this.syncViewToActivity(nodeModel.activity);
//     }
//
//     syncViewToActivity(activity) {
//         this._nodeModel.activity = activity;
//         this._applyName();
//         this._applyOperator();
//         this._applyExecution();
//     }
//
//     _updateHandler(e) {
//         const property = e.detail.property;
//
//         if (property === `operator`) {
//             this._applyOperator();
//         } else if (property === `execution`) {
//             this._applyExecution();
//         } else if (property === `name`) {
//             this._applyName();
//         } else if (property === `children-meta`) {
//             const meta_map = new Map();
//
//             e.detail.extra.children.forEach((child) => {
//                 meta_map.set(child.id, {
//                     name: child.contextualName,
//                     description: child.contextualDescription
//                 });
//             });
//
//             this._outs.forEach((child_edge) => {
//                 const child_meta = meta_map.get(child_edge.getChildId());
//
//                 if (child_meta.name) {
//                     child_edge.setChildName(child_meta.name);
//                 }
//                 if (child_meta.description) {
//                     child_edge.setChildDescription(child_meta.description);
//                 }
//             });
//         } else if (property === `children`) {
//             this.refresh();
//         }
//     }
//
//     _defineModel(e) {
//         this.activity = e.detail.activity;
//     }
//
//     translate(dx, dy, recursive = undefined) {
//         this.setTranslation(this._translation.x + dx, this._translation.y + dy);
//
//         if (this._outs != undefined && (recursive || (recursive == undefined && !this._nodeModel.isExpanded))) {
//             this._outs.forEach((edge) => {
//                 // edge._leadActivityNode.translate(dx, dy, recursive || !this._nodeModel.isExpanded);            // This caused the Shift Drag error
//                 edge._subActivityNode.translate(dx, dy, recursive || !this._nodeModel.isExpanded);
//             });
//         }
//     }
//
//     setTranslation(x, y) {
//         this._translation.x = x;
//         this._translation.y = y;
//         if (!this.parentNode) {
//             return;
//         }
//
//         const [left, top] = this.getPosition();
//
//         this.style.transform = `translate(${left}px,${top}px)`;
//
//         const [h_center_x, h_center_y] = this._computeNodeInputAttachment();
//
//         if (this._in != undefined) {
//             this._in.setEnd(h_center_x, h_center_y);
//         }
//
//         const [c_center_x, c_center_y] = this._computeNodeOutputAttachment();
//
//         if (this._outs != undefined) {
//             this._outs.forEach((edge) => {
//                 edge.setOrigin(c_center_x, c_center_y);
//             });
//         }
//
//         this.dispatchEvent(new CustomEvent(`change-position`, {
//             detail: {x,
//                 y}
//         }));
//     }
//
//     _applyName(override = undefined) {
//         this._$header_name.innerHTML = this.getContextualName();
//         this._snap();
//     }
//
//     _applyOperator() {
//         let op = ``;
//
//         const operator = Activity.OPERATOR;
//         for (const step in operator) {
//             if (operator[step].name === this._nodeModel.activity.operator) {
//                 op = operator[step].symbol;
//             }
//         }
//
//         this._$connector.innerHTML = op;
//         // @TODO: move this to styling;
//         if (op === ``) {
//             this._$connector.style.display = `none`;
//         } else {
//             this._$connector.style.display = `block`;
//         }
//
//         this._snap();
//     }
//
//     _applyExecution() {
//         this._$concurrency.style.display = `none`;
//         this._$concurrency.innerHTML = ``;
//
//         if (this._nodeModel.activity.connector.execution !== Activity.EXECUTION.SEQUENTIAL.name) {
//             return;
//         }
//
//         if (!this._nodeModel.activity.children || this._nodeModel.activity.children.length === 0) {
//             return;
//         }
//
//         for (const child of this._nodeModel.activity.children) {
//             if (!child.annotations || !child.annotations.has(`no-wait`) || child.annotations.get(`no-wait`) != true) {
//                 return;
//             }
//         }
//
//         // Sequential nodes whose children are annotated 'no-wait' display a concurrency icon.
//         this._$concurrency.style.display = `block`;
//         this._$concurrency.innerHTML = `&#xf0c0;`;
//     }
//
//     _animationRefresh() {
//         this._resetLocation();
//         this._animation_frame_id = window.requestAnimationFrame(this._animationRefresh.bind(this));
//     }
//
//     _resetLocation() {
//         this.setTranslation(this._translation.x, this._translation.y);
//     }
//
//     _snap() {
//         this._translation.z = Math.round(this._translation.x / this.SNAP_SIZE) * this.SNAP_SIZE;
//         this._translation.y = Math.round(this._translation.y / this.SNAP_SIZE) * this.SNAP_SIZE;
//         this._resetLocation();
//         // return [adj_x, adj_y];
//     }
//
//     getPosition() {
//         const x = Math.round(this._translation.x - (this.clientWidth / 2.0));
//         const y = Math.round(this._translation.y - (this.clientHeight / 2.0));
//
//         return [x, y];
//     }
//
//     _computeNodeInputAttachment() {
//         const x = this._translation.x - (this._$header.clientWidth / 2.0);
//         const y = this._translation.y;
//
//         return [x, y];
//     }
//
//     _computeNodeOutputAttachment() {
//         const x = this._translation.x + (this.clientWidth / 2.0);
//         const y = this._translation.y;
//
//         return [x, y];
//     }
//
// });
//
// export default customElements.get(`jag-node`);
//
