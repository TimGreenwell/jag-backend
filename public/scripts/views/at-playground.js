/**
 * @file AtPlayground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import Popupable from '../utils/popupable.js';
import UserPrefs from '../utils/user-prefs.js';
import SvgObject from '../models/svg-object.js';
import Area from '../models/area.js';
import Point from '../models/point.js';

class AtPlayground extends Popupable {

    constructor() {
        super();
        this._playgroundWrapperDiv = document.createElement(`div`);
        this._playgroundWrapperDiv.id = `playground-wrapper`;
        this.setPopupBounds(this._playgroundWrapperDiv);
        this.appendChild(this._playgroundWrapperDiv);
        this.svg = new SvgObject(`jag`);
        this.svg.standardHue = 200;
        this.svg.selectedHue = 150;
        this.svg.possibleHue = 50;
        this.svg.horizontalLeftMargin = 10;
        this.svg.horizontalRightMargin = 10;
        this.svg.verticalTopMargin = 10;
        this.svg.verticalBottomMargin = 10;
        this.svg.lineWidth = 2;
        this.svg.standardFontSize = 17;
        this.svg.stepBrightness = 5;
        this.svg.chosenPattern = `diagonals`;
        this._playgroundSvg = this.svg.buildSvg();
        this.$def = this.svg.createDefinitionContainer();
        this._playgroundSvg.appendChild(this.$def);
        this.patternMap = this.svg.createCustomPatterns();
        this.$chosenPattern = this.patternMap.get(this.svg.chosenPattern);
        this.$def.appendChild(this.$chosenPattern);
        this._background = this.svg.createBackground();
        this._playgroundSvg.appendChild(this._background);
        this._playgroundWrapperDiv.appendChild(this._playgroundSvg);

        // SVG control (panning, zooming)
        this.windowSize = null;
        this.svgCursor = new Point();
        this.panPosition = new Point();
        this.svgLocation = new Point();
        this.svgSize = new Area();
        this.zoomStep = 0;

        // Data objects displayed by the SVG
        this._viewedProjectsMap = new Map();               // All active Jag root nodes - id,node
        this._selectedNodesMap = new Map();         // set of ActivityNodes (selected)
        this._selectedEdge = null;                         // single selected edge
        // this.currentNodeModel = null;                      // node in focus (selected or head of selected)  // needed?  - we have selectedActivityNodeMap
        this.hasColor = false;

        // EVENTS
        document.addEventListener(`keydown`, this.onKeyDown.bind(this));                        // ctrl for select children
        this._playgroundSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));       // mousewheel (zooming)
        this._playgroundSvg.addEventListener(`mousedown`, this.mousedownController.bind(this));
        // Bounded (events that require eventual removing)
        this._boundDragView = this.dragView.bind(this);                                              // pan svg
        this._boundStopDragView = this.stopDragView.bind(this);                                      // cease panning
        this._boundFinalizeEdge = this.finalizeEdge.bind(this);
        this._boundLinkNodes = this.linkNodes.bind(this);
        this._boundSignalPossibleChild = this.signalPossibleChild.bind(this);
        this._boundRestoreNormalColor = this.restoreNormalColor.bind(this);
        this._boundDragNode = this.dragNode.bind(this);
        this._boundStopDraggingNode = this.stopDraggingNode.bind(this);
    }

    get selectedNodes() {
        const selectedIdArray = Array.from(this._selectedNodesMap.values());
        return selectedIdArray;
    }

    get viewedProjects() {
        const viewedRootNodes = Array.from(this._viewedProjectsMap.values());
        return viewedRootNodes;
    }

    /**
     *  EVENTS
     *
     * ---mousedown events
     * mousedownController (all mouse clicks)
     * addNode (clicking add button)
     * toggleExpand (clicking expand button)
     * eventNodeSelected (clicking node)
     * selectEdge  (clicking edge)
     * svgMouseDownEvent (clicking background)
     *
     */
    mousedownController(e) {
        // e.stopPropagation();
        e.stopImmediatePropagation();
        const elementType = this.svg.fetchTargetElementType(e.target);

        if (elementType === `add`) {
            this.addNode(e);
        }
        if (elementType === `expand`) {
            this.toggleExpand(e);
        }
        if (elementType === `rect`) {
            this.eventNodeSelected(e);
        }
        if (elementType === `edge`) {
            this.selectEdge(e);
        }
        if (elementType === `background`) {
            this.svgMouseDownEvent(e);
        }
    }

    addNode(e) {
        e.stopPropagation();
        // 1. For every active Node - add Event listeners:
        // a) on mouse up == check if valid and add as child.
        // b) on mouse over == check if valid and light up some color

        const parentId = this.svg.fetchTargetId(e.target);
        const parentNodeModel = this.retrieveNodeModel(parentId);
        const parentProjectId = parentNodeModel.projectId;
        this.viewedProjects.forEach((project) => {
            if (project.id !== parentProjectId) {
                const nodeGroup = this.svg.fetchNodeGroup(project.id);
                nodeGroup.classList.add(`possibleChild`);   // the other way
                nodeGroup.addEventListener(`mouseenter`, this._boundSignalPossibleChild);
                nodeGroup.addEventListener(`mouseleave`, this._boundRestoreNormalColor);
            }
        });
        // 2 light up some color0
        this.svg.signalPossibleChild(parentNodeModel);
        // 3 start edge following mouse
        const rect = this.svg.fetchRectangle(parentNodeModel.id);
        const height = Number(rect.getAttributeNS(null, `height`));
        const width = Number(rect.getAttributeNS(null, `width`));
        const sourceBox = {x: parentNodeModel.x,
            y: parentNodeModel.y,
            height,
            width};
        const edge = this.svg.createEdgeToCursor(parentNodeModel.id, sourceBox);
        this._playgroundSvg.appendChild(edge);
        // this.currentNodeModel = parentNodeModel;
        document.addEventListener(`mousemove`, this._boundLinkNodes);
        document.addEventListener(`mouseup`, this._boundFinalizeEdge);
    }

    toggleExpand(e) {
        e.stopPropagation();
        const id = this.svg.fetchTargetId(e.target);
        const nodeModel = this.retrieveNodeModel(id);
        nodeModel.isExpanded = !nodeModel.isExpanded;
        if ((nodeModel.isExpanded) && (this._isStacked(nodeModel))) {
            this.layoutNodes([nodeModel]);
        }
        this.showExpand(nodeModel);
        this.saveNode(nodeModel);
    }

    eventNodeSelected(e) {           // on mousedown  applied during jag-node create
        const nodeModelId = this.svg.fetchTargetId(e.target);
        const rectangle = this.svg.fetchRectangle(nodeModelId);
        rectangle.setAttributeNS(null, `cursor`, `grabbing`);
        this.unselectEverything();
        const selectedNodeModel = this.retrieveNodeModel(nodeModelId);
        if ((e.ctrlKey) || (!selectedNodeModel.isExpanded)) {
            selectedNodeModel.gatherDescendents().forEach((descendant) => {
                this._selectedNodesMap.set(descendant.id, descendant);
                this.svg.selectNode(descendant);
            });
        }
        this._selectedNodesMap.set(selectedNodeModel.id, selectedNodeModel);
        this.svg.selectNode(selectedNodeModel);
        this.svgCursor = this.screenToSVGCoords(e);   // transform screen to svg

        this.svgCursor.x = Math.round(e.x);
        this.svgCursor.y = Math.round(e.y);

        this.svgSelectedItems = {incomingEdges: [],
            outgoingEdges: [],
            nodes: new Map()};
        this._selectedNodesMap.forEach((value, key) => {
            const incomingEdge = this.svg.fetchEdgeTo(key);
            const outgoingEdges = this.svg.fetchEdgesFrom(key);
            const node = this.svg.fetchNodeGroup(key);
            if (incomingEdge) {
                this.svgSelectedItems.incomingEdges.push(incomingEdge);
            }
            this.svgSelectedItems.outgoingEdges = [...this.svgSelectedItems.outgoingEdges, ...Array.from(outgoingEdges)];
            this.svgSelectedItems.nodes.set(key, node);
        });

        const selectedNodeArray = Array.from(this._selectedNodesMap.values());
        this.dispatchEvent(new CustomEvent(`event-nodes-selected`, {
            detail: {selectedNodeArray}
        }));

        this._playgroundWrapperDiv.addEventListener(`mousemove`, this._boundDragNode);
        this._playgroundWrapperDiv.addEventListener(`mouseup`, this._boundStopDraggingNode);
        this._playgroundWrapperDiv.addEventListener(`mouseleave`, this._boundStopDraggingNode);
    }

    selectEdge(e) {
        this.unselectEverything();
        this._selectedEdge = e.target;
        this.svg.selectEdge(this._selectedEdge);
        this.dispatchEvent(new CustomEvent(`event-playground-clicked`));
    }

    svgMouseDownEvent(e) {
        this.unselectEverything();
        this._redrawPlayground();
        this.dispatchEvent(new CustomEvent(`event-playground-clicked`));

        this.windowSize = this.getBoundingClientRect();
        this._initialMouse = {
            x: Math.round(e.clientX),
            y: Math.round(e.clientY)
        };

        this.addEventListener(`mousemove`, this._boundDragView);
        this.addEventListener(`mouseup`, this._boundStopDragView);
    }

    /**
     *  Events
     *
     * ---mousemove events
     * linkNodes (drag edge to new child)
     * dragNode (change position of node)
     * dragView (moving entire graph)
     *
     */

    linkNodes(e) {
        e.stopPropagation();
        const edge = this.svg.fetchEdgeToCursor();
        const cursorPoint = this.screenToSVGCoords(e);
        this.svg.followCursor(edge, cursorPoint);
    }

    dragNode(e) {
        e.preventDefault();
        const changeX = this.applyZoom(Math.round(e.x - this.svgCursor.x));
        const changeY = this.applyZoom(Math.round(e.y - this.svgCursor.y)); // Diff between cursor start and now.

        this.svgSelectedItems.nodes.forEach((nodeGroup, key) => {
            // A static position can be found as x,y in the nodeModel in selectedItems map
            const id = this.svg.fetchTargetId(nodeGroup);
            const nodeModel = this._selectedNodesMap.get(id);
            this.svg.modifyTransform(nodeGroup, nodeModel, changeX, changeY);
        });
        this.svgSelectedItems.incomingEdges.forEach((edge) => {
            this.svg.changeDestination(this.svgSelectedItems, edge);
        });
        this.svgSelectedItems.outgoingEdges.forEach((edge) => {
            this.svg.changeSource(this.svgSelectedItems, edge);
        });
    }

    dragView(e) {
        // The svg dragged by mouse - AS SEEN IN TIMEVIEW
        const zoomedBox = new Area();
        zoomedBox.width = this.applyZoom(this.windowSize.width);
        zoomedBox.height = this.applyZoom(this.windowSize.height);
        const svgViewSizeX = this.svgSize.width;
        const svgViewSizeY = this.svgSize.height;

        if (zoomedBox.width > svgViewSizeX) {
            this.panPosition.x = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.x - e.clientX);
            this.panPosition.x = Math.min(
                this.svgLocation.x + delta,
                svgViewSizeX - zoomedBox.width
            );
        }
        if (zoomedBox.height > svgViewSizeY) {
            this.panPosition.y = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.y - e.clientY);
            this.panPosition.y = Math.min(
                this.svgLocation.y + delta,
                svgViewSizeY - zoomedBox.height
            );
        }
        if (this.panPosition.x < 0) {
            this.panPosition.x = 0;
        }
        if (this.panPosition.y < 0) {
            this.panPosition.y = 0;
        }
        this.redrawSvg();
    }

    /**
     *  Events
     *
     * ---mouseover / mouseenter / mouseleave / mousewheel / mouseup events
     * signalPossibleChild (notify node is possible child during linking of nodes)
     * restoreNormalColor (cancel notification)
     * svgWheelZoomEvent
     * stopDragView
     * stopDraggingNode (complete dragging node)
     * finalizeEdge
     */

    signalPossibleChild(e) {
        e.stopPropagation();
        e.preventDefault();
        const id = this.svg.fetchTargetId(e.target);
        const nodeModel = this._viewedProjectsMap.get(id);
        this.svg.signalPossibleChild(nodeModel);
    }

    restoreNormalColor(e) {
        const id = this.svg.fetchTargetId(e.target);
        const nodeModel = this._viewedProjectsMap.get(id);
        this.svg.unselectNode(nodeModel);
    }

    svgWheelZoomEvent(event) {
        // The wheel of Zoom - AS SEEN IN TIMEVIEW
        event.preventDefault();
        if (event.deltaY > 0) {
            this.zoomStep = this.zoomStep + 1;
        } else {
            this.zoomStep = this.zoomStep - 1;
        }
        this.redrawSvg();
    }

    stopDragView() {
        // The svg not being dragged by mouse - AS SEEN IN TIMEVIEW
        this.removeEventListener(`mousemove`, this._boundDragView);
        this.svgLocation.x = this.panPosition.x;
        this.svgLocation.y = this.panPosition.y;
    }

    stopDraggingNode(e) {
        e.preventDefault();
        const nodeModelId = this.svg.fetchTargetId(e.target);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModelId);
        nodeGroup.setAttributeNS(null, `cursor`, `grab`);

        const movedNode = this.retrieveNodeModel(nodeModelId);
        const rootNode = this._viewedProjectsMap.get(movedNode.projectId);
        this.svgSelectedItems.nodes.forEach((nodeItem) => {
            const id = this.svg.fetchTargetId(nodeItem);

            const nodeModel = this._selectedNodesMap.get(id);

            const transformString = nodeItem.getAttributeNS(null, `transform`);
            const transformComponents = this.svg.parse(transformString);
            const groupTransformX = Number(transformComponents.translate[0]);
            const groupTransformY = Number(transformComponents.translate[1]);
            const deltaX = groupTransformX - nodeModel.x;
            const deltaY = groupTransformY - nodeModel.y;
            if ((deltaX !== 0) || (deltaY !== 0)) {
                nodeModel.x = groupTransformX;
                nodeModel.y = groupTransformY;
            }
        });
        this.saveNode(movedNode);
        this._playgroundWrapperDiv.removeEventListener(`mousemove`, this._boundDragNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseup`, this._boundStopDraggingNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseleave`, this._boundStopDraggingNode);
    }

    finalizeEdge(ev) {
        const edge = this.svg.fetchEdgeToCursor();
        const parentNodeId = this.svg.fetchEdgeSourceId(edge);
        const parentNodeModel = this.retrieveNodeModel(parentNodeId);
        const childNodeId = this.svg.fetchTargetId(ev.target);
        const childNodeModel = this._viewedProjectsMap.get(childNodeId);
        document.removeEventListener(`mousemove`, this._boundLinkNodes);
        document.removeEventListener(`mouseup`, this._boundFinalizeEdge);
        this.viewedProjects.forEach((project) => {
            if (project.id !== parentNodeModel.projectId) {
                const nodeGroup = this.svg.fetchNodeGroup(project.id);
                nodeGroup.classList.remove(`possibleChild`);   // the other way
                nodeGroup.removeEventListener(`mouseenter`, this._boundSignalPossibleChild);
                nodeGroup.removeEventListener(`mouseleave`, this._boundRestoreNormalColor);
                this.svg.unselectNode(project);
            }
        });

        this.svg.unselectNode(parentNodeModel);
        edge.remove();

        if (this._viewedProjectsMap.has(childNodeId) && (childNodeId !== parentNodeId)) {
            if (window.confirm(`Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                this.dispatchEvent(new CustomEvent(`event-nodes-connected`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        projectNodeId: parentNodeModel.projectId,
                        parentNodeId: parentNodeModel.id,
                        childNodeId: childNodeModel.id
                    }
                }));
            }
        }
    }

    /**
     *  Events
     *
     * ---keydown events
     * onKeyDown (key pressed - delete node or edge)
     */

    onKeyDown(event) {
        event.stopImmediatePropagation();
        // const $node = event.target;
        if (event.key === `Delete`) {
            if (this._selectedEdge) {
                // const sourceNodeId = this.svg.fetchEdgeSourceId(this._selectedEdge);
                // const sourceNode = this.retrieveNodeModel(sourceNodeId);
                const destinationNodeId = this.svg.fetchEdgeDestinationId(this._selectedEdge);

                const destinationNode = this.retrieveNodeModel(destinationNodeId);
                if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                    const parentActivity = destinationNode.parent.activity;
                    parentActivity.bindings = parentActivity.bindings.filter((binding) => {
                        return ((binding.to.exchangeSourceUrn !== destinationNode.activity.urn) && (binding.from.exchangeSourceUrn !== destinationNode.activity.urn));
                    });
                    const childActivityChildId = destinationNode.childId;
                    const remainingChildren = parentActivity._children.filter((child) => {
                        return child.id !== childActivityChildId;
                    });
                    parentActivity.children = remainingChildren;
                    this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                        detail: {activity: parentActivity}
                    }));
                    this.dispatchEvent(new CustomEvent(`event-promote-project`, {
                        detail: {node: destinationNode}
                    }));

                    // this._selectedNodesMap.delete(selectedNodeModel.id);
                    this.unselectEverything();
                    this.dispatchEvent(new CustomEvent(`event-playground-clicked`));
                }
            } else
            if (this._selectedNodesMap.size > 1) {
                alert(`Can only clear/disconnect one selected item`);
            } else if (this._selectedNodesMap.size < 1) {
                alert(`Must select at least one item to clear/disconnect`);
            } else {
                // if the selected node is a root - then clear the project from the playground
                // if the selected node is a non-root node - then disconnect the jag from its parent (triggers DB update which auto redraws graphics)
                const selectedNodeModel = [...this._selectedNodesMap.values()][0];
                if (selectedNodeModel.isRoot()) {
                    this.clearPlayground(selectedNodeModel.projectId);
                } else {
                    if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                        const parentActivity = selectedNodeModel.parent.activity;
                        const childActivityChildId = selectedNodeModel.childId;
                        const remainingChildren = parentActivity._children.filter((entry) => {
                            return entry.id !== childActivityChildId;
                        });
                        parentActivity.children = remainingChildren;

                        let childUrns = parentActivity.children.map((child) => {
                            return child.urn;
                        })

                        let newBindings = parentActivity.bindings.filter((binding) => {
                            return ((childUrns.includes(binding.from.exchangeSourceUrn)) && (childUrns.includes(binding.to.exchangeSourceUrn)))
                        })

                        parentActivity.bindings = newBindings;

                        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                            detail: {activity: parentActivity}
                        }));
                        this.unselectEverything();
                    }
                }
                this.dispatchEvent(new CustomEvent(`event-playground-clicked`));
            }
        }
    }


    /**
     *  Events
     *
     * --- external calls and events
     * showEndpoint(endpoints)
     * toggleColor (complete dragging node)
     * _handleNewActivityPopup
     * clearPlayground
     * deleteNodeModel
     * _eventImportJagHandler
     * printSvg
     *
     */

    showEndpoint(selectedFromEndpoints, selectedToEndpoints) {        // future - to unhide the data flow
        // const [focusNode] = this.selectedNodes.values();
        this.svg.hideAllOutputEndpoints();
        this.svg.hideAllInputEndpoints();
        this.svg.hideAllBindings();
        const selectedEndpoints = [...selectedFromEndpoints, ...selectedToEndpoints];
        selectedEndpoints.forEach((endpoint) => {
            this.viewedProjects.forEach((project) => {
                const nodeList = project.activitiesInProject(endpoint.exchangeSourceUrn);
                nodeList.forEach((node) => {
                    let $endpoint;
                    if (endpoint.direction === `input`) {
                        $endpoint = this.svg.fetchInputEndpoint(node.id, endpoint.exchangeName);
                    } else {
                        $endpoint = this.svg.fetchOutputEndpoint(node.id, endpoint.exchangeName);
                    }
                    $endpoint.classList.remove(`hidden`);

                    const $bindings = this.svg.fetchBindingsFrom($endpoint.id);
                    $bindings.forEach(($binding) => {
                        $binding.classList.remove(`hidden`);
                        const $toEndpointId = this.svg.fetchBindingDestinationId($binding);
                        const $toEndpoint = this.svg.fetchSvgObjectFromId($toEndpointId);
                        $toEndpoint.classList.remove(`hidden`);
                    });
                });
            });
        });
    }


    toggleColor() {
        this.hasColor = !this.hasColor;
        this.unselectEverything();
        this._redrawPlayground();
    }

    _handleNewActivityPopup(e) {
        const $initiator = document.getElementById(`menu-new`);
        this.popup({
            content: AtPlayground.NOTICE_CREATE_JAG,
            trackEl: this,
            inputs: {}, // event: e},
            highlights: [$initiator]
        });
    }

    clearPlayground(projectId = undefined) {
        if (projectId) {
            this._viewedProjectsMap.delete(projectId);
        } else {
            this._viewedProjectsMap.clear();
        }
        this.unselectEverything();
        this._redrawPlayground();
    }

    deleteNodeModel(deadId) {
        this._viewedProjectsMap.delete(deadId);
        this._selectedNodesMap.delete(deadId);
        this.clearPlayground(deadId);
    }

    _eventImportJagHandler(e) {
        const $initiator = document.getElementById(`menu-new`);
        this.popup({
            content: AtPlayground.NOTICE_PASTE_JAG,
            trackEl: this,
            inputs: {},
            highlights: [$initiator]
        });
    }

    printSvg(name) {
        this.svg.saveSvg(this._playgroundSvg, name);
    }

    /**
     *  Utility
     *
     * --- coordinate conversion
     * screenToSVGCoords - screen coords to svg coords (needed for exact placements at mouse location)
     * translate - change in svg coords based on mouse deltas.  (exact placement not desired)
     * shift - move viewed object completely on viewing space
     */

    screenToSVGCoords(e) {
        // Read the SVG's bounding rectangle...
        const canvasRect = this._playgroundSvg.getBoundingClientRect();
        // ...and transform clientX / clientY to be relative to that rectangle
        return {
            x: this.applyZoom(e.clientX - canvasRect.x),
            y: this.applyZoom(e.clientY - canvasRect.y)
        };
    }

    translate(node, offset) {
        node.x = node.x + offset.x;
        node.y = node.y + offset.y;
        node.children.forEach((child) => {
            return this.translate(child, offset);
        });
        return node;
    }

    shift() {
        this.viewedProjects.forEach((project) => {
            const workStack = [];
            let lowX = project.x;
            let highX = project.x;
            let lowY = project.y;
            let highY = project.y;

            workStack.push(project);
            while (workStack.length > 0) {
                const currentNode = workStack.pop();
                lowX = Math.min(currentNode.x, lowX);
                highX = Math.max(currentNode.x, highX);
                lowY = Math.min(currentNode.y, lowY);
                highY = Math.max(currentNode.y, highY);
                workStack.push(...currentNode.children);
            }

            if ((lowX < 0) || (lowY < 0)) {
                const workStack = [];
                workStack.push(project);
                while (workStack.length > 0) {
                    const currentNode = workStack.pop();
                    if (lowX < 0) {
                        currentNode.x = currentNode.x + Math.abs(lowX);
                    }
                    if (lowY < 0) {
                        currentNode.y = currentNode.y + Math.abs(lowY);
                    }
                    currentNode.children.forEach((child) => {
                        workStack.push(child);
                    });
                }
            }
        });
    }


    /**
     *  Utility
     *
     * ---
     * saveNode - dispatch a event-node-updated    @TODO -- is this really necessary? possible using instances :3
     * retrieveNodeModel  - Search all viewed JAGs for node matching particular id
     * unselectEverything - very convenient.  Several events end by unselecting all items.
     * showExpand & collapseAll - display (or not) depending on isExpanded flag
     */

    saveNode(nodeModel) { // @TODO --- saveNode/saveNodes
        this.dispatchEvent(new CustomEvent(`event-node-updated`, {    // (or send an array of updates)
            detail: {nodeModel}
        }));
    }

    retrieveNodeModel(id) {
        let nodeRetrieved;
        for (const project of this._viewedProjectsMap.values()) {
            const findNode = project.findChildById(id);
            if (findNode) {
                nodeRetrieved = findNode;
            }
        }
        return nodeRetrieved;
    }

    unselectEverything() {
        this._selectedNodesMap.forEach((value, key) => {
            this._selectedNodesMap.delete(value.id);  // redundant with the clear below?
            this.svg.unselectNode(value);
        });
        if (this._selectedEdge) {
            this.svg.unselectEdge(this._selectedEdge);
            this._selectedEdge = null;
        }
        this._selectedNodesMap.clear();
    }

    collapseAll(nodeModel) {
        const edge = this.svg.fetchEdgeTo(nodeModel.id);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        nodeGroup.classList.add(`hidden`);
        edge.classList.add(`hidden`);
        nodeModel.children.forEach((child) => {
            this.collapseAll(child);
        });
    }

    showExpand(nodeModel) {
        nodeModel.children.forEach((child) => {
            if (nodeModel.isExpanded) {
                const edge = this.svg.fetchEdgeTo(child.id);
                const nodeGroup = this.svg.fetchNodeGroup(child.id);
                nodeGroup.classList.remove(`hidden`);
                edge.classList.remove(`hidden`);
                this.showExpand(child);
            } else {
                this.collapseAll(child);
            }
        });
    }

    /**
     *  Utility
     *
     * --- pretty display
     * findLongestAtEachDepth - find longest label at each depth in order to display pretty.
     * xIndentForDepth - determine x-indent to pretty display for each tree depth
     * isStacked - if all children occupy same spot (new and have no location)
     * layoutNodes - auto-find pretty locations for node and children. Label width -> x ; leafs -> y
     * redrawSvg - handles the zoom and pan of viewport across the SVG content
     * applyZoom
     */

    findLongestAtEachDepth(rootNode) {
        const depthToLengthArray = [];
        const startingLevel = rootNode.treeDepth;
        const workStack = [];
        workStack.push(rootNode);
        while (workStack.length > 0) {
            const currentNode = workStack.pop();
            const currentRect = this.svg.fetchRectangle(currentNode.id);
            const currentRectLength = Number(currentRect.getAttributeNS(null, `width`));
            if ((depthToLengthArray[currentNode.treeDepth - startingLevel] === undefined) ||
                (depthToLengthArray[currentNode.treeDepth - startingLevel] < currentRectLength)) {
                depthToLengthArray[currentNode.treeDepth - startingLevel] = currentRectLength;
            }
            if (currentNode.isExpanded) {
                currentNode.children.forEach((child) => {
                    workStack.push(child);
                });
            }
        }
        return depthToLengthArray;
    }

    xIndentForDepth(longestAtEachDepthArray, margin) {
        const indentArray = [];
        indentArray[0] = margin;
        for (let depth = 1; depth < longestAtEachDepthArray.length; depth++) {
            indentArray[depth] = longestAtEachDepthArray[depth - 1] + margin + indentArray[depth - 1];
        }
        return indentArray;
    }

    _isStacked(projectNodeModel) {
        const workStack = [];
        let isStacked = false;
        workStack.push(...projectNodeModel.children);
        while (workStack.length > 0) {
            const currentItem = workStack.pop();
            if ((currentItem.x === projectNodeModel.x) && (currentItem.y === projectNodeModel.y)) {
                isStacked = true;
            }
            workStack.push(...currentItem.children);
        }
        return isStacked;
    }

    layoutNodes(nodeArray = [...this.selectedNodes.values()]) {
        const horizontalLeftMargin = 50;
        const horizontalRightMargin = 50;
        let xIndentArray = [];
        let startTreeDepth = 0;
        let leafCount = 0;
        const boxHeight = this.svg.standardBoxHeight;
        const separationSpacing = 15;
        const startPoint = new Point();
        const offsetPoint = new Point();

        function layoutTree(nodeModel) {
            if ((nodeModel.hasChildren()) && (nodeModel.isExpanded)) {
                let childrenVerticalRange = 0;

                nodeModel.children.sort((a, b) => {
                    return ((a.dependencySlot > b.dependencySlot) ? 1 : ((b.dependencySlot > a.dependencySlot) ? -1 : 0));
                });

                nodeModel.children.forEach((child) => {
                    child = layoutTree(child);
                    childrenVerticalRange = childrenVerticalRange + child.y;
                });
                nodeModel.x = xIndentArray[nodeModel.treeDepth - startTreeDepth];
                nodeModel.y = (childrenVerticalRange / nodeModel.children.length);
                return nodeModel;
            } else {
                nodeModel.x = xIndentArray[nodeModel.treeDepth - startTreeDepth];
                nodeModel.y = (leafCount * (boxHeight + separationSpacing));
                leafCount = leafCount + 1;
                return nodeModel;
            }
        }

        nodeArray.forEach((node) => {
            node.x = node.x ? node.x : 0;
            node.y = node.y ? node.y : 0;
            const longestAtEachDepthArray = this.findLongestAtEachDepth(node);
            xIndentArray = this.xIndentForDepth(longestAtEachDepthArray, horizontalLeftMargin);
            startTreeDepth = node.treeDepth;
            startPoint.x = node.x;
            startPoint.y = node.y;
            node = layoutTree(node);
            offsetPoint.x = startPoint.x - node.x;
            offsetPoint.y = startPoint.y - node.y;
            node = this.translate(node, offsetPoint);
            this.saveNode(node);
        });
    }

    redrawSvg() {
        const zoomedBoxWidth = this.applyZoom(this.windowSize.width);
        const zoomedBoxHeight = this.applyZoom(this.windowSize.height);
        if ((zoomedBoxWidth > 0) && (zoomedBoxHeight > 0)) {
            this._playgroundSvg.setAttribute(
                `viewBox`,
                `${this.panPosition.x} ${this.panPosition.y}  ${zoomedBoxWidth}  ${zoomedBoxHeight}`
            );
        }
    }

    applyZoom(num) {
        const zoomedNum = num + (num * this.zoomStep * 0.05);
        return zoomedNum;
    }

    /**
     *  Main Construction
     *
     * _refreshPlayground -
     * buildJointActivityGraphs
     * buildJointActivityGraph
     */

    _refreshPlayground(projectNodeModel) {
        this._viewedProjectsMap.set(projectNodeModel.id, projectNodeModel);
        this._redrawPlayground();
        if ((projectNodeModel.isExpanded) && (this._isStacked(projectNodeModel))) {
            this.layoutNodes([projectNodeModel]);
            this._redrawPlayground();
        }
    }

    _redrawPlayground() {
        this.shift();
        // delete the svg
        this.svg.clearBackground(this.svg.fetchBackground());
        // if projectNodeModel is Root ->  add it to the list of viewed trees. (viewedProjectsMap)
        // if not - remove it from the list of viewed trees. (viewedProjectsMap)
        this.treeHeight = 0;
        this._viewedProjectsMap.forEach((value, key) => {
            if (!value.isRoot()) {
                this._viewedProjectsMap.delete(value.id);
            }
            this.treeHeight = Math.max(this.treeHeight, value.findTreeHeight());
        });
        const background = this.svg.fetchBackground();
        this.buildJointActivityGraphs(background, this._viewedProjectsMap);
        this._selectedNodesMap.forEach((value, key) => {
            this._selectedNodesMap.set(value.id, value); // ?
            this.svg.selectNode(value);
        });
        this.windowSize = this.getBoundingClientRect();  // I'd recommend getBBox (which is part of SVG 1.1) o
        this.redrawSvg();
    }


    buildJointActivityGraphs(svg, viewedJagRoots) {
        //       let jagScope = new PlaygroundBox();
        viewedJagRoots.forEach((jagRoot) => {
            this.buildJointActivityGraph(svg, jagRoot);
            this.showExpand(jagRoot);
        });
    }

    isEndpointBoundToChild(activity, endpointId) {
        let isBound = false;
        activity.bindings.forEach((binding) => {
            if ((binding.from.exchangeSourceUrn === activity.urn) && (binding.from.exchangeName === endpointId)) {
                isBound = true;
            }
        });
        return isBound;
    }



    buildJointActivityGraph(parentGroup, nodeModel) {
        const nodeBox = {x: nodeModel.x,
            y: nodeModel.y,
            width: 0,
            height: 0};

        const subgroup = this.svg.createSubGroup(nodeModel.id);
        const subgroupTop = subgroup.firstChild;
        const nodeContentGroup = this.svg.createNodeGroup(nodeModel.id);
        this.svg.positionItem(nodeContentGroup, nodeModel.x, nodeModel.y);
        parentGroup.appendChild(subgroup);
        subgroup.insertBefore(nodeContentGroup, subgroupTop);

        const labelElement = this.svg.createTextElement(nodeModel.name, nodeModel.id);
        const svgText = this.svg.positionItem(labelElement, this.svg.horizontalLeftMargin, this.svg.standardBoxHeight / 4);
        const groupTop = nodeContentGroup.firstChild;
        nodeContentGroup.insertBefore(svgText, groupTop);
        nodeBox.height = this.svg.standardBoxHeight;
        let possibleWidth1;

        if ((nodeModel.isLeaf()) && (!nodeModel.isRoot())) {
            possibleWidth1 = this.svg.labelWidth(labelElement) + this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin;
        } else {
            possibleWidth1 = this.svg.labelWidth(labelElement) + this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin + this.svg.buttonSize;
        }

        const possibleWidth2 = Math.max(nodeModel.activity.getInputs().length, nodeModel.activity.getOutputs().length) * 10;
        nodeBox.width = Math.max(possibleWidth1, possibleWidth2);
        const svgRect = this.svg.createRectangle(nodeBox.width, nodeBox.height, nodeModel.id);
        this.svg.positionItem(svgRect, 0, 0);

        this.svg.applyLightnessDepthEffect(svgRect, nodeModel.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgRect, nodeModel.treeDepth, this.treeHeight);
        }
        nodeContentGroup.insertBefore(svgRect, svgText);

        // Apply placement warning
        nodeModel.providesOutputTo.forEach((dependantNode) => {
            if (dependantNode.y < (nodeModel.y + nodeBox.height)) {
                this.svg.signalWarning(nodeModel);
                this.svg.signalWarning(dependantNode);
            }
        });


        this.svgSize.width = Math.max(this.svgSize.width, nodeBox.x + nodeBox.width);
        this.svgSize.height = Math.max(this.svgSize.height, nodeBox.y + nodeBox.height);

        if (nodeModel.hasChildren()) {
            const showButton = this.svg.createExpandButton(nodeModel.id, nodeBox.width, nodeBox.height, nodeModel.isExpanded);
            // showButton.addEventListener(`mousedown`, this.toggleExpand.bind(this));
            showButton.classList.add(`button`);
            nodeContentGroup.insertBefore(showButton, svgText);
        }
        if (this._viewedProjectsMap.size > 1) {
            const addButton = this.svg.createAddButton(nodeModel.id, nodeBox.width, nodeBox.height);
            this.svg.applyLightnessDepthEffect(addButton, nodeModel.treeDepth, this.treeHeight);
            addButton.classList.add(`button`);
            nodeContentGroup.insertBefore(addButton, svgText);
        }

        if (nodeModel.activity.getInputs().length !== 0) {
            const spread = nodeBox.width / (nodeModel.activity.getInputs().length + 1);  // +1 -> making space from corners
            const topLayer = [];
            nodeModel.activity.getInputs().forEach((endpoint) => {
                topLayer.push(endpoint.exchangeName);
            });
            nodeModel.activity.getInputs().forEach((endpoint) => {
                const endpointCircle = this.svg.createInputEndpoint(nodeModel.id, endpoint.exchangeName);
                endpointCircle.classList.add(`hidden`);
                const position = spread + (topLayer.indexOf(endpoint.exchangeName) * spread);
                this.svg.positionItem(endpointCircle, position, 0);
                nodeContentGroup.insertBefore(endpointCircle, svgText);
            });
        }

        if (nodeModel.activity.getOutputs().length !== 0) {
            const spread = nodeBox.width / (nodeModel.activity.getOutputs().length + 1);  // +1 -> making space from corners
            const bottomLayer = [];
            nodeModel.activity.getOutputs().forEach((endpoint) => {
                bottomLayer.push(endpoint.exchangeName);
            });
            nodeModel.activity.getOutputs().forEach((endpoint) => {
                const endpointCircle = this.svg.createOutputEndpoint(nodeModel.id, endpoint.exchangeName);
                endpointCircle.classList.add(`hidden`);
                const position = spread + (bottomLayer.indexOf(endpoint.exchangeName) * spread);
                this.svg.positionItem(endpointCircle, position, nodeBox.height);
                nodeContentGroup.insertBefore(endpointCircle, svgText);
            });
        }


        nodeModel.children.forEach((child) => {
            const subNodeBox = this.buildJointActivityGraph(subgroup, child);
            const svgEdge = this.svg.createEdge(nodeModel.id, child.id, nodeBox, subNodeBox);
            svgEdge.addEventListener(`mousedown`, this.mousedownController.bind(this));
            subgroup.appendChild(svgEdge);
        });
        this.buildBindings(subgroup, nodeModel);
        return nodeBox;
    }

    buildBindings(parentGroup, nodeModel) {
        nodeModel.activity.bindings.forEach((binding) => {
            const fromNodes = [];
            let checkStack = [];
            checkStack.push(nodeModel);
            checkStack.push(...nodeModel.children);
            while (checkStack.length > 0) {
                const checkNodeModel = checkStack.pop();
                if (checkNodeModel.activity.urn === binding.from.exchangeSourceUrn) {
                    fromNodes.push(checkNodeModel);
                }
            }

            const toNodes = [];
            checkStack = [];
            checkStack.push(nodeModel);
            checkStack.push(...nodeModel.children);
            while (checkStack.length > 0) {
                const checkNodeModel = checkStack.pop();
                if (checkNodeModel.activity.urn === binding.to.exchangeSourceUrn) {
                    toNodes.push(checkNodeModel);
                }
            }
            fromNodes.forEach((fromNode) => {
                toNodes.forEach((toNode) => {
                    const newBinding = this.svg.createBinding(fromNode, binding.from, toNode, binding.to);
                    // if ((nodeModel.children.includes(fromNode)) && (nodeModel.children.includes(toNode))) {
                    //     toNode.activity.becomeConsumerOf(fromNode.activity);
                    // }
                    parentGroup.appendChild(newBinding);
                });
            });
        });
    }


}

// END OF CLASS

AtPlayground.POPUP_TYPES = {
    WARNING: `popup-warning`,
    NOTICE: `popup-notice`,
    INFO: `popup-info`
};

// why cant this go inside scope.? Does anyone else need it?
AtPlayground.NOTICE_CREATE_JAG = Popupable._createPopup({
    type: AtPlayground.POPUP_TYPES.NOTICE,
    name: `Add New JAG Activity`,
    description: `Be precise.  You can always edit this later.`,
    properties: [
        {
            name: `name`,
            label: `Name`,
            type: `text`,
            options() {
                const eventMap = new Map();
                eventMap.set(`input`, () => {
                    const newName = UserPrefs.getDefaultUrnPrefix() + document.getElementById(`name`).value;
                    const validUrnChars = new RegExp(`[^0-9a-zA-Z:-]+`, `gu`);
                    const convName = newName.replace(` `, `-`).replace(validUrnChars, ``).toLowerCase();
                    document.getElementById(`urn`).value = convName;
                });
                return eventMap;
            }
        },
        {
            name: `urn`,
            label: `URN`,
            type: `text`,
            options() {
                const eventMap = new Map();
                return eventMap;
            }
        },
        {
            name: `description`,
            label: `Description`,
            type: `textarea`,
            options() {
                const paramMap = new Map();
                paramMap.set(`cols`, 19);
                paramMap.set(`rows`, 3);
                return paramMap;
            }
        }
    ],
    actions: [
        {
            text: `Create`,
            color: `black`,
            bgColor: `green`,
            //         action: function ({inputs: {}, outputs: activityConstruct}) {
            action({outputs: activityConstruct}) {                             // or maybe {inputs = {}, outputs: activityConstruct}
                this.dispatchEvent(new CustomEvent(`event-activity-created`, {
                    bubbles: true,
                    composed: true,
                    detail: {activityConstruct}
                }));
            }
        },
        {
            text: `Cancel`,
            color: `white`,
            bgColor: `black`
        }


    ]
    // display: ?
    // fallback: ?
    // skip: ?
});


// why cant this go inside scope.? Does anyone else need it?
AtPlayground.NOTICE_PASTE_JAG = Popupable._createPopup({
    type: AtPlayground.POPUP_TYPES.NOTICE,
    name: `Recreate JAG`,
    description: `Paste previously exported JAG`,
    properties: [
        {
            name: `description`,
            label: `JSON`,
            type: `textarea`,
            options() {
                const paramMap = new Map();
                paramMap.set(`cols`, 19);
                paramMap.set(`rows`, 4);
                return paramMap;
            }
        }
    ],
    actions: [
        {
            text: `Create`,
            color: `black`,
            bgColor: `green`,
            action({outputs: json}) {
                this.dispatchEvent(new CustomEvent(`event-import-jag`, {
                    bubbles: true,
                    composed: true,
                    detail: {result: json.description}
                }));
            }
        },
        {
            text: `Cancel`,
            color: `white`,
            bgColor: `black`
        },
        {
            text: `Or select a file...`,
            color: `white`,
            bgColor: `black`,
            async action() {                          //  input:{}, output:{}
                const getFiles = () => {
                    new Promise((resolve) => {
                        const input = document.createElement(`input`);
                        input.type = `file`;
                        input.onchange = () => {
                            return resolve([...input.files]);
                        };
                        input.click();
                    });
                };

                const selectedFiles = await getFiles();

                const reader = new FileReader();
                reader.addEventListener(`load`, function (event) {
                    this.dispatchEvent(new CustomEvent(`event-import-jag`, {
                        bubbles: true,
                        composed: true,
                        detail: {result: event.target.result}
                    }));
                }.bind(this));

                const selectedFile = selectedFiles[0];
                reader.readAsText(selectedFile);
            }
        }
    ]
    // display: ?
    // fallback: ?
    // skip: ?
});

customElements.define(`jag-playground`, AtPlayground);

export default customElements.get(`jag-playground`);

// /         https://observablehq.com/@danburzo/drawing-svg-rectangles
