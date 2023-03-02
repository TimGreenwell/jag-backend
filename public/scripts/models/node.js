/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import {uuidV4} from '../utils/uuid.js';
import Validation from '../utils/validation.js';

// noinspection JSUnusedGlobalSymbols
export default class Node extends EventTarget {

    constructor({
        id = uuidV4(),
        urn,
        childId,
        parentId,
        projectId = id,
        isExpanded = Boolean(true),
        isLocked = Boolean(false),
        contextualName = ``,
        contextualDescription = ``,
        x = 0,        // this.unselectEverything();
        // this._selectedNodesMap.set(projectNodeModel.id, projectNodeModel);
        y = 0,
        subscriptions = [],        // still unknown implementation (hopefully observer)
        returnValue = null,
        returnState = null,
        testReturnValue = null,
        testReturnState = null,
        children = [],
        contextualExpectedDuration,
        contextualTimeAllowance
    } = {}) {
        super();
        this._id = id;                       // An assigned unique ID given at construction
        this._urn = urn;
        this._childId = childId;                       // child differentiating id
        this._parentId = parentId;
        this._projectId = projectId;
        this._isExpanded = isExpanded;         // Expanded (table) or folded in (graph)
        this._isLocked = isLocked;
        this._contextualName = contextualName;
        this._contextualDescription = contextualDescription;
        this._x = x;
        this._y = y;
        this._subscriptions = subscriptions;    // Array<Subscription>
        this._returnValue = returnValue;
        this._returnState = returnState;
        this._testReturnValue = testReturnValue;
        this._testReturnState = testReturnState;
        this._children = children;            // Links to actual children [objects]
        this._contextualExpectedDuration = contextualExpectedDuration;
        this._contextualTimeAllowance = contextualTimeAllowance;
        // Derived
        this._parent = null;
        this._activity = undefined;
        this._leafCount = 1;
        this._treeDepth = 0;
        // derived
        this._requiresOutputFrom = [];
        this._providesOutputTo = [];
        this._dependencySlot = 0;
    }

    becomeConsumerOf(node) {
        if (!(node.providesOutputTo.includes(this))) {
            node.providesOutputTo.push(this);
        }
        if (!(this._requiresOutputFrom.includes(node))) {
            this._requiresOutputFrom.push(node);
            if (this._dependencySlot < (node.dependencySlot + 1)) {
                this.adjustDependencySlot(node.dependencySlot + 1);
            }
        }
    }

    adjustDependencySlot(n) {
        this.dependencySlot = n;
        const workStack = [...this.providesOutputTo];
        while (workStack.length > 0) {
            const childNode = workStack.pop();
            childNode.adjustDependencySlot(n + 1);
        }
    }


    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get urn() {
        return this._urn;
    }

    set urn(value) {
        this._urn = value;
    }

    get childId() {
        return this._childId;
    }

    set childId(value) {
        this._childId = value;
    }

    get parentId() {
        return this._parentId;
    }

    set parentId(value) {
        this._parentId = value;
    }

    get activity() {
        return this._activity;
    }

    set activity(value) {
        this._activity = value;
    }

    get projectId() {
        return this._projectId;
    }

    set projectId(value) {
        this._projectId = value;
    }

    get children() {
        return this._children;
    }

    set children(value) {
        this._children = value;
    }

    get contextualExpectedDuration() {
        if (!Validation.isNumeric(this._contextualExpectedDuration) && (this.activity)) {
            this.contextualExpectedDuration = this.activity.expectedDuration;
        }
        return this._contextualExpectedDuration;
    }

    set contextualExpectedDuration(value) {
        this._contextualExpectedDuration = value.toString();
    }

    get contextualTimeAllowance() {
        return this._contextualTimeAllowance;
    }

    set contextualTimeAllowance(value) {
        this._contextualTimeAllowance = value;
    }

    get parent() {
        return this._parent;
    }

    set parent(parent) {
        this._parent = parent;
        this._parentId = parent ? parent.id : null;
    }

    getAncestor() {
        let topAncestor = this;
        while (!topAncestor.isRoot()) {
            topAncestor = topAncestor.parent;
        }
        return topAncestor;
    }

    get subscriptions() {
        return this._subscriptions;
    }

    set subscriptions(value) {
        this._subscriptions = value;
    }

    removeSubscription(subscriptionName) {
        for (const index in this._subscriptions) {
            if (this._subscriptions[index].name === subscriptionName) {
                this._subscriptions.splice(index, 1);
                break;
            }
        }
    }


    get isLocked() {
        return this._isLocked;
    }

    set isLocked(value) {
        this._isLocked = value;
    }


    get isExpanded() {
        return this._isExpanded;
    }

    set isExpanded(value) {
        this._isExpanded = value;
    }

    get x() {
        return this._x;
    }

    set x(x) {
        this._x = Math.round(x);
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = Math.round(y);
    }

    setPosition(x, y) {
        this._x = x;
        this._y = y;
    }

    getPosition() {
        return [this._x, this._y];
    }

    get treeDepth() {
        return this._treeDepth;
    }

    set treeDepth(depth) {
        this._treeDepth = depth;
    }

    get leafCount() {
        return this._leafCount;
    }

    set leafCount(value) {
        this._leafCount = value;
    }

    get contextualName() {
        let returnName = null;
        if ((this._contextualName === ``) || (this._contextualName == undefined)) {
            if (this._activity) {
                returnName = this._activity.name;
            }
        } else {
            returnName = this._contextualName;
        }
        return returnName;
    }

    set contextualName(value) {
        this._contextualName = value;
    }

    get contextualDescription() {
        let returnDescription = null;
        if ((this._contextualDescription === ``) || (this._contextualName == undefined)) {
            if (this._activity) {
                returnDescription = this.activity.description;
            }
        } else {
            returnDescription = this._contextualDescription;
        }
        return returnDescription;
    }

    set contextualDescription(value) {
        this._contextualDescription = value;
    }


    get returnValue() {
        return this._returnValue;
    }

    set returnValue(value) {
        this._returnValue = value;
    }


    get returnState() {
        return this._returnState;
    }

    set returnState(value) {
        this._returnState = value;
    }

    get testReturnValue() {
        return this._testReturnValue;
    }

    set testReturnValue(value) {
        this._testReturnValue = value;
    }

    get testReturnState() {
        return this._testReturnState;
    }

    set testReturnState(value) {
        this._testReturnState = value;
    }


    get requiresOutputFrom() {
        return this._requiresOutputFrom;
    }

    set requiresOutputFrom(value) {
        this._requiresOutputFrom = value;
    }

    addRequiresOutputFrom(node) {
        this._requiresOutputFrom.push(node);
    }

    get providesOutputTo() {
        return this._providesOutputTo;
    }

    set providesOutputTo(value) {
        this._providesOutputTo = value;
    }

    addProvidesOutputTo(node) {
        this._providesOutputTo(node);
    }

    get dependencySlot() {
        return this._dependencySlot;
    }

    set dependencySlot(value) {
        this._dependencySlot = value;
    }

    isTopProducerSibling() {
        return this._dependencySlot === 0;
    }

    // /////////////////////////////////////////////////////////////////////////////////////////
    // ///////////////////////////////// Inner Jag Assignments  ////////////////////////////////
    // ///////////////////   ( This will go away once extending JAG Model )    /////////////////
    // /////////////////////////////////////////////////////////////////////////////////////////
    get name() {
        return (this.activity === undefined) ? `` : this.activity.name;
    }

    set name(name) {
        if (this.activity !== undefined) {
            this.activity.name = name;
        }
    }

    get description() {
        return (this.activity === undefined) ? `` : this.activity.description;
    }

    set description(name) {
        if (this.activity !== undefined) {
            this.activity.name = name;
        }
    }

    getShortUrn() {
        const parts = this.urn.split(`:`);
        const lastPart = parts.pop().trim();
        return lastPart;
    }

    gatherDescendentUrns(childNodeModel = this, workStack = []) {   // need this in nodes
        workStack.push(childNodeModel.urn);
        childNodeModel.children.forEach((child) => {
            this.gatherDescendentUrns(child, workStack);
        });
        return workStack;
    }

    gatherDescendentIds(childNodeModel = this, workStack = []) {   // need this in nodes
        workStack.push(childNodeModel.id);
        childNodeModel.children.forEach((child) => {
            this.gatherDescendentIds(child, workStack);
        });
        return workStack;
    }

    gatherDescendents(childNodeModel = this, workStack = []) {   // need this in nodes
        workStack.push(childNodeModel);
        childNodeModel.children.forEach((child) => {
            this.gatherDescendents(child, workStack);
        });
        return workStack;
    }


    // activitiesInDataScope(urn) {    // return array of nodes matching urn
    //     const matchStack = [];
    //     const workStack = [];
    //
    //     workStack.push(this);
    //     workStack.push(this.children);
    //     while (workStack.length > 0) {
    //         const nodeModel = workStack.pop();
    //         if (nodeModel.activity.urn === urn) {
    //             matchStack.push(nodeModel);
    //         }
    //     }
    //     return matchStack;
    // }

    childrenWithActivity(urn) {
        const matchStack = [];
        this.children.forEach((child) => {
            if (child.activity.urn === urn) {
                matchStack.push(child)
            }
        })
        return matchStack
    }

    activitiesInProject(urn) {    // return array of nodes matching urn
        const matchStack = [];
        const workStack = [];

        workStack.push(this);
        while (workStack.length > 0) {
            const nodeModel = workStack.pop();

            if (nodeModel.activity.urn === urn) {
                matchStack.push(nodeModel);
            }
            nodeModel.children.forEach((kid) => {
                workStack.push(kid);
            });
        }
        return matchStack;
    }

    isActivityInProject(urn) {
        return (this.activitiesInProject(urn).length > 0);
    }

    setDepth() {
        if (this.isRoot()) {
            this.treeDepth = 0;
        } else {
            this.treeDepth = this.parent.treeDepth + 1;
        }
    }


    incrementDepth(depthCount) {
        this._treeDepth = depthCount + 1;
        this._children.forEach((child) => {
            child.incrementDepth(this._treeDepth);
        });
    }

    incrementLeafCount(moreLeaves) {
        this._leafCount = this._leafCount + moreLeaves;
        if (this.parent) {
            this.parent.incrementLeafCount();
        }
    }

    hasChildren() {
        return (this.children.length !== 0);
    }

    addChild(node) {                              // moved to controller
        if (this.canHaveChildren) {
            this._children.push(node);
            node.parent = this;
            node.incrementDepth(this._treeDepth);
        } else {
            alert(`Node must first be assigned a valid URN`);
        }
    }

    findTreeHeight() {
        return this.findDeepestLeaf() - this.treeDepth;
    }

    findDeepestLeaf() {
        const depths = [];
        if (this.hasChildren()) {
            this.children.forEach((child) => {
                depths.push(child.findDeepestLeaf());
            });
        } else {
            depths.push(this.treeDepth);
        }
        return Math.max(...depths);
    }


    leafcounter() {
        if (this.hasChildren()) {
            let sum = 0;
            this.children.forEach((child) => {
                child.leafCount = child.leafcounter();
                sum = sum + child.leafCount;
            });
            this.leafCount = sum;
            return sum;
        } else {
            this.leafCount = 1;
            return this.leafCount;
        }
    }

    getChildrenDependencyDepth() {
        let depth = 0;
        this.children.forEach((childNodeModel) => {
            if (childNodeModel.dependencySlot > depth) {
                depth = childNodeModel.dependencySlot;
            }
        });
        return depth;
    }


    removeChild(child) {
        const filtered = this.children.filter((entry) => {
            // if (entry.id !== child.id) {
            //     return entry;
            // }
            // xxxxx
            return entry.id !== child.id;
        });
        this.children = filtered;
    }


    replaceChild(newChild) {
        const workStack = [];
        if (this.id === newChild.id) {
            return newChild;
        } else {
            workStack.push(this);
            while (workStack.length > 0) {
                const workingNode = workStack.pop();
                workingNode.children.forEach((child) => {
                    if (child.id === newChild.id) {
                        workingNode.removeChild(child);
                        workingNode.addChild(newChild);
                        return this;
                    } else {
                        workStack.push(child);
                    }
                });
            }
        }
    }


    findChildById(id) {
        const workStack = [];
        workStack.push(this);
        while (workStack.length > 0) {
            const checkNode = workStack.pop();
            if (checkNode.id === id) {
                return checkNode;
            } else {
                checkNode.children.forEach((child) => {
                    workStack.push(child);
                });
            }
        }
        return null;
    }

    getLastChild() {
        return this._children[this.children.length - 1];
    }

    canHaveChildren() {  // already pushed to activity model
        return ((this.activity !== undefined) && (Validation.isValidUrn(this.activity.urn)));
    }

    childCount() {
        return this._children.length;
    }


    isRoot() {
        return this._id === this._projectId;
    }         // is determined by lack of parent.

    isLeaf() {
        return this.childCount() === 0;
    }

    toJSON() {
        const json = {
            id: this._id,
            urn: this._urn,
            childId: this._childId,
            parentId: this._parentId,
            projectId: this._projectId,
            isLocked: this._isLocked,
            isExpanded: this._isExpanded,
            x: this._x,
            y: this._y,
            contextualName: this._contextualName,
            contextualExpectedDuration: this._contextualExpectedDuration,
            contextualTimeAllowance: this._contextualTimeAllowance,
            contextualDescription: this._contextualDescription,
            subscriptions: [],
            returnValue: this._returnValue,
            returnState: this._returnState,
            testReturnValue: this._testReturnValue,
            testReturnState: this._testReturnState

        };
        const childStack = [];
        for (const child of this._children) {
            childStack.push(child.toJSON());
        }
        json.children = childStack;
        return json;
    }

    static fromJSON(json) {
        const childStack = [];
        for (const child of json.children) {
            childStack.push(Node.fromJSON(child));
        }
        json.children = childStack;
        const node = new Node(json);
        return node;
    }


}

