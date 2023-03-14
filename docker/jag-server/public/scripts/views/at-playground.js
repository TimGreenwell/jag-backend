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
        this._viewedProjectsMap = new Map();               // All active projects mapped - (projectNode id, projectNode)
        this._selectedLiveNodesMap = new Map();            // All selected liveNodes mapped (liveNode id, liveNode)
        this._selectedEdge = null;                         // single selected edge
        // this.currentLiveNode = null;                    // liveNode in focus (selected or head of selected)  // needed?  - we have selectedActivityNodeMap
        this.hasColor = false;

        // EVENTS
        document.addEventListener(`keydown`, this.onKeyDown.bind(this));                        // ctrl for select children
        this._playgroundSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));       // mousewheel (zooming)
        this._playgroundSvg.addEventListener(`mousedown`, this.mousedownController.bind(this));
        // Bounded (events that require eventual removing)
        this._boundDragView = this.dragView.bind(this);                                              // pan svg
        this._boundStopDragView = this.stopDragView.bind(this);                                      // cease panning
        this._boundFinalizeEdge = this.finalizeEdge.bind(this);

        this._boundSignalPossibleChild = this.signalPossibleChild.bind(this);
        this._boundDragEdgeDestination = this.dragEdgeDestination.bind(this);
        this._boundRestoreNormalColor = this.restoreNormalColor.bind(this);
        this._boundDragLiveNode = this.dragLiveNode.bind(this);
        this._boundStopDraggingLiveNode = this.stopDraggingLiveNode.bind(this);
    }

    get selectedLiveNodes() {
        const selectedIdArray = Array.from(this._selectedLiveNodesMap.values());
        return selectedIdArray;
    }

    get viewedProjects() {
        const viewedProjectNodes = Array.from(this._viewedProjectsMap.values());
        return viewedProjectNodes;
    }

    /**
     *  EVENTS
     *
     * ---mousedown events
     * mousedownController (all mouse clicks)
     * handleSvgNodeGroupAddButton (clicking add button)
     * handleSvgNodeGroupExpandButton (clicking expand button)
     * handleSvgNodeGroupSelected (clicking node)
     * handleEdgeSelected  (clicking edge)
     * handleSvgBackgroudSelected (clicking background)
     *
     */
    mousedownController(e) {
        // e.stopPropagation();
        e.stopImmediatePropagation();
        const elementType = this.svg.fetchTargetElementType(e.target);

        if (elementType === `add`) {
            this.handleSvgNodeGroupAddButton(e);
        }
        if (elementType === `expand`) {
            this.handleSvgNodeGroupExpandButton(e);
        }
        if (elementType === `rect`) {
            this.handleSvgNodeGroupSelected(e);
        }
        if (elementType === `edge`) {
            this.handleEdgeSelected(e);
        }
        if (elementType === `background`) {
            this.handleSvgBackgroudSelected(e);
        }
    }

    handleSvgNodeGroupAddButton(e) {
        e.stopPropagation();
        // 1. For every active LiveNode - add Event listeners:
        // a) on mouse up == check if valid and add as child.
        // b) on mouse over == check if valid and light up some color

        const parentId = this.svg.fetchTargetId(e.target);
        const parentLiveNode = this.retrieveLiveNode(parentId);
        const parentProjectId = parentLiveNode.projectId;
        this.viewedProjects.forEach((project) => {
            if (project.id !== parentProjectId) {
                const svgNodeGroup = this.svg.fetchSvgNodeGroup(project.id);
                svgNodeGroup.classList.add(`possibleChild`);   // the other way
                svgNodeGroup.addEventListener(`mouseenter`, this._boundSignalPossibleChild);
                svgNodeGroup.addEventListener(`mouseleave`, this._boundRestoreNormalColor);
            }
        });
        // 2 light up some color0
        this.svg.signalPossibleChild(parentLiveNode);
        // 3 start edge following mouse
        const rect = this.svg.fetchRectangle(parentLiveNode.id);
        const height = Number(rect.getAttributeNS(null, `height`));
        const width = Number(rect.getAttributeNS(null, `width`));
        const sourceBox = {x: parentLiveNode.x,
            y: parentLiveNode.y,
            height,
            width};
        const edge = this.svg.createEdgeToCursor(parentLiveNode.id, sourceBox);
        this._playgroundSvg.appendChild(edge);
        // this.currentLiveNode = parentLiveNode;
        document.addEventListener(`mousemove`, this._boundDragEdgeDestination);
        document.addEventListener(`mouseup`, this._boundFinalizeEdge);
    }

    handleSvgNodeGroupExpandButton(e) {
        e.stopPropagation();
        const id = this.svg.fetchTargetId(e.target);
        const liveNode = this.retrieveLiveNode(id);
        liveNode.isExpanded = !liveNode.isExpanded;
        if ((liveNode.isExpanded) && (this._isStacked(liveNode))) {
            this.layoutLiveNodes([liveNode]);
        }
        this.showExpand(liveNode);
        this.dispatchLiveNodeUpdated(liveNode);
    }

    handleSvgNodeGroupSelected(e) {
        const liveNodeId = this.svg.fetchTargetId(e.target);
        const rectangle = this.svg.fetchRectangle(liveNodeId);
        rectangle.setAttributeNS(null, `cursor`, `grabbing`);
        this.unselectEverything();
        const selectedLiveNode = this.retrieveLiveNode(liveNodeId);
        if ((e.ctrlKey) || (!selectedLiveNode.isExpanded)) {
            selectedLiveNode.gatherDescendents().forEach((descendantLiveNode) => {
                this._selectedLiveNodesMap.set(descendantLiveNode.id, descendantLiveNode);
                this.svg.selectSvgNodeGroup(descendantLiveNode);
            });
        }
        this._selectedLiveNodesMap.set(selectedLiveNode.id, selectedLiveNode);
        this.svg.selectSvgNodeGroup(selectedLiveNode);
        this.svgCursor = this.screenToSVGCoords(e);   // transform screen to svg

        this.svgCursor.x = Math.round(e.x);
        this.svgCursor.y = Math.round(e.y);

        this.svgSelectedItems = {incomingEdges: [],
            outgoingEdges: [],
            svgNodeGroupMap: new Map()};
        this._selectedLiveNodesMap.forEach((value, key) => {
            const incomingEdge = this.svg.fetchEdgeTo(key);
            const outgoingEdges = this.svg.fetchEdgesFrom(key);
            const svgNodeGroup = this.svg.fetchSvgNodeGroup(key);
            if (incomingEdge) {
                this.svgSelectedItems.incomingEdges.push(incomingEdge);
            }
            this.svgSelectedItems.outgoingEdges = [...this.svgSelectedItems.outgoingEdges, ...Array.from(outgoingEdges)];
            this.svgSelectedItems.svgNodeGroupMap.set(key, svgNodeGroup);
        });

        const selectedLiveNodesArray = Array.from(this._selectedLiveNodesMap.values());
        console.log("selectedLiveNodeArray - good?? looks like it")
        console.log(selectedLiveNodesArray)
        this.dispatchEvent(new CustomEvent(`event-livenodes-selected`, {
            detail: {
                selectedLiveNodesArray: selectedLiveNodesArray
            }
        }));


        this._playgroundWrapperDiv.addEventListener(`mousemove`, this._boundDragLiveNode);
        this._playgroundWrapperDiv.addEventListener(`mouseup`, this._boundStopDraggingLiveNode);
        this._playgroundWrapperDiv.addEventListener(`mouseleave`, this._boundStopDraggingLiveNode);
    }

    handleEdgeSelected(e) {
        this.unselectEverything();
        this._selectedEdge = e.target;
        this.svg.selectEdge(this._selectedEdge);
        this.dispatchEvent(new CustomEvent(`event-playground-clicked`));
    }

    handleSvgBackgroudSelected(e) {
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
     * dragEdgeDestination (drag edge to new child)
     * dragLiveNode (change position of liveNode)
     * dragView (moving entire graph)
     *
     */

    dragEdgeDestination(e) {
        console.log(e)
        e.stopPropagation();
        console.log("stopping propagation")
        const edge = this.svg.fetchEdgeToCursor();
        const cursorPoint = this.screenToSVGCoords(e);
        this.svg.followCursor(edge, cursorPoint);
    }

    dragLiveNode(e) {
        e.preventDefault();
        const changeX = this.applyZoom(Math.round(e.x - this.svgCursor.x));
        const changeY = this.applyZoom(Math.round(e.y - this.svgCursor.y)); // Diff between cursor start and now.

        this.svgSelectedItems.svgNodeGroupMap.forEach((svgNodeGroup, key) => {
            // A static position can be found as x,y in the liveNode in selectedItems map
            const id = this.svg.fetchTargetId(svgNodeGroup);
            const liveNode = this._selectedLiveNodesMap.get(id);
            this.svg.modifyTransform(svgNodeGroup, liveNode, changeX, changeY);
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
     * signalPossibleChild (notify lineNode is possible child during edge dragging)
     * restoreNormalColor (cancel notification)
     * svgWheelZoomEvent
     * stopDragView
     * stopDraggingLiveNode (complete dragging)
     * finalizeEdge
     */

    signalPossibleChild(e) {
        e.stopPropagation();
        e.preventDefault();
        const id = this.svg.fetchTargetId(e.target);
        const liveNode = this._viewedProjectsMap.get(id);
        this.svg.signalPossibleChild(liveNode);
    }

    restoreNormalColor(e) {
        const id = this.svg.fetchTargetId(e.target);
        const liveNode = this._viewedProjectsMap.get(id);
        this.svg.unselectSvgNodeGroup(liveNode);
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

    stopDraggingLiveNode(e) {
        e.preventDefault();
        const liveNodeId = this.svg.fetchTargetId(e.target);
        const svgNodeGroup = this.svg.fetchSvgNodeGroup(liveNodeId);
        svgNodeGroup.setAttributeNS(null, `cursor`, `grab`);

        const movedLiveNode = this.retrieveLiveNode(liveNodeId);
        const rootNode = this._viewedProjectsMap.get(movedLiveNode.projectId);
        this.svgSelectedItems.svgNodeGroupMap.forEach((svgNodeGroupItem) => {
            const id = this.svg.fetchTargetId(svgNodeGroupItem);

            const liveNode = this._selectedLiveNodesMap.get(id);

            const transformString = svgNodeGroupItem.getAttributeNS(null, `transform`);
            const transformComponents = this.svg.parse(transformString);
            const groupTransformX = Number(transformComponents.translate[0]);
            const groupTransformY = Number(transformComponents.translate[1]);
            const deltaX = groupTransformX - liveNode.x;
            const deltaY = groupTransformY - liveNode.y;
            if ((deltaX !== 0) || (deltaY !== 0)) {
                liveNode.x = groupTransformX;
                liveNode.y = groupTransformY;
            }
        });
        this.dispatchLiveNodeUpdated(movedLiveNode);
        this._playgroundWrapperDiv.removeEventListener(`mousemove`, this._boundDragLiveNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseup`, this._boundStopDraggingLiveNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseleave`, this._boundStopDraggingLiveNode);
    }

    finalizeEdge(ev) {
        const edge = this.svg.fetchEdgeToCursor();
        const parentLiveNodeId = this.svg.fetchEdgeSourceId(edge);
        const parentLiveNode = this.retrieveLiveNode(parentLiveNodeId);
        const childLiveNodeId = this.svg.fetchTargetId(ev.target);
        const childLiveNode = this._viewedProjectsMap.get(childLiveNodeId);
        document.removeEventListener(`mousemove`, this._boundDragEdgeDestination);
        document.removeEventListener(`mouseup`, this._boundFinalizeEdge);
        this.viewedProjects.forEach((project) => {
            if (project.id !== parentLiveNode.projectId) {
                const svgNodeGroup = this.svg.fetchSvgNodeGroup(project.id);
                svgNodeGroup.classList.remove(`possibleChild`);   // the other way
                svgNodeGroup.removeEventListener(`mouseenter`, this._boundSignalPossibleChild);
                svgNodeGroup.removeEventListener(`mouseleave`, this._boundRestoreNormalColor);
                this.svg.unselectSvgNodeGroup(project);
            }
        });

        this.svg.unselectSvgNodeGroup(parentLiveNode);
        edge.remove();

        if (this._viewedProjectsMap.has(childLiveNodeId) && (childLiveNodeId !== parentLiveNodeId)) {
            if (window.confirm(`Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                this.dispatchEvent(new CustomEvent(`event-projects-connected`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        projectNodeId: parentLiveNode.projectId,
                        parentLiveNodeId: parentLiveNode.id,
                        childLiveNodeId: childLiveNode.id
                    }
                }));
            }
        }
    }

    /**
     *  Events
     *
     * ---keydown events
     * onKeyDown (key pressed - delete liveNode or edge)
     */

    onKeyDown(event) {
        event.stopImmediatePropagation();
        // const $node = event.target;
        if (event.key === `Delete`) {
            if (this._selectedEdge) {
                // const sourceLiveNodeId = this.svg.fetchEdgeSourceId(this._selectedEdge);
                // const sourceLiveNode = this.retrieveLiveNode(sourceNodeId);
                const destinationLiveNodeId = this.svg.fetchEdgeDestinationId(this._selectedEdge);

                const destinationLiveNode = this.retrieveLiveNode(destinationLiveNodeId);
                if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                    const parentActivity = destinationLiveNode.parent.activity;
                    parentActivity.bindings = parentActivity.bindings.filter((binding) => {
                        return ((binding.to.exchangeSourceUrn !== destinationLiveNode.activity.urn) && (binding.from.exchangeSourceUrn !== destinationLiveNode.activity.urn));
                    });
                    const childActivityChildId = destinationLiveNode.childId;
                    const remainingChildren = parentActivity._children.filter((child) => {
                        return child.id !== childActivityChildId;
                    });
                    parentActivity.children = remainingChildren;
                    this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                        detail: {activity: parentActivity}
                    }));
                    this.dispatchEvent(new CustomEvent(`event-promote-project`, {
                        detail: {liveNode: destinationLiveNode}
                    }));

                    // this._selectedLiveNodesMap.delete(selectedLiveNode.id);
                    this.unselectEverything();
                    this.dispatchEvent(new CustomEvent(`event-playground-clicked`));
                }
            } else
            if (this._selectedLiveNodesMap.size > 1) {
                alert(`Can only clear/disconnect one selected item`);
            } else if (this._selectedLiveNodesMap.size < 1) {
                alert(`Must select at least one item to clear/disconnect`);
            } else {
                // if the selected liveNode is a root - then clear the project from the playground
                // if the selected liveNode is a non-root - then disconnect the jag from its parent (triggers DB update which auto redraws graphics)
                const selectedLiveNode = [...this._selectedLiveNodesMap.values()][0];
                if (selectedLiveNode.isRoot()) {
                    this.clearPlayground(selectedLiveNode.projectId);
                } else {
                    if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                        const parentActivity = selectedLiveNode.parent.activity;
                        const childActivityChildId = selectedLiveNode.childId;
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
     * toggleColor (complete dragging liveNode)
     * _handleNewActivityPopup
     * clearPlayground
     * deleteLiveNode
     * _eventImportJagHandler
     * printSvg
     *
     */

    showEndpoint(selectedFromEndpoints, selectedToEndpoints) {        // future - to unhide the data flow
        // const [focusLiveNode] = this.selectedLiveNodes.values();
        this.svg.hideAllOutputEndpoints();
        this.svg.hideAllInputEndpoints();
        this.svg.hideAllBindings();
        const selectedEndpoints = [...selectedFromEndpoints, ...selectedToEndpoints];
        selectedEndpoints.forEach((endpoint) => {
            this.viewedProjects.forEach((projectNode) => {
                const liveNodeList = projectNode.getLiveNodesByJag(endpoint.exchangeSourceUrn);
                liveNodeList.forEach((liveNode) => {
                    let $endpoint;
                    if (endpoint.direction === `input`) {
                        $endpoint = this.svg.fetchInputEndpoint(liveNode.id, endpoint.exchangeName);
                    } else {
                        $endpoint = this.svg.fetchOutputEndpoint(liveNode.id, endpoint.exchangeName);
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

    deleteLiveNode(deadId) {
        this._viewedProjectsMap.delete(deadId);
        this._selectedLiveNodesMap.delete(deadId);
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

    translate(liveNode, offset) {
        liveNode.x = liveNode.x + offset.x;
        liveNode.y = liveNode.y + offset.y;
        liveNode.children.forEach((child) => {
            return this.translate(child, offset);
        });
        return liveNode;
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
                const currentLiveNode = workStack.pop();
                lowX = Math.min(currentLiveNode.x, lowX);
                highX = Math.max(currentLiveNode.x, highX);
                lowY = Math.min(currentLiveNode.y, lowY);
                highY = Math.max(currentLiveNode.y, highY);
                workStack.push(...currentLiveNode.children);
            }

            if ((lowX < 0) || (lowY < 0)) {
                const workStack = [];
                workStack.push(project);
                while (workStack.length > 0) {
                    const currentLiveNode = workStack.pop();
                    if (lowX < 0) {
                        currentLiveNode.x = currentLiveNode.x + Math.abs(lowX);
                    }
                    if (lowY < 0) {
                        currentLiveNode.y = currentLiveNode.y + Math.abs(lowY);
                    }
                    currentLiveNode.children.forEach((child) => {
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
     * dispatchLiveNodeUpdated - dispatch a event-livenode-updated    @TODO -- is this really necessary? possible using instances :3
     * retrieveLiveNode  - Search all viewed liveNodes matching particular id
     * unselectEverything - very convenient.  Several events end by unselecting all items.
     * showExpand & collapseAll - display (or not) depending on isExpanded flag
     */

    dispatchLiveNodeUpdated(liveNode) { // @TODO --- send array of updates
        this.dispatchEvent(new CustomEvent(`event-livenode-updated`, {    // (or send an array of updates)
            detail: {liveNode}
        }));
    }

    retrieveLiveNode(id) {
        let liveNodeRetrieved;
        for (const project of this._viewedProjectsMap.values()) {
            const findLiveNode = project.findChildById(id);
            if (findLiveNode) {
                liveNodeRetrieved = findLiveNode;
            }
        }
        return liveNodeRetrieved;
    }

    unselectEverything() {
        this._selectedLiveNodesMap.forEach((value, key) => {
            this._selectedLiveNodesMap.delete(value.id);  // redundant with the clear below?
            this.svg.unselectSvgNodeGroup(value);
        });
        if (this._selectedEdge) {
            this.svg.unselectEdge(this._selectedEdge);
            this._selectedEdge = null;
        }
        this._selectedLiveNodesMap.clear();
    }

    collapseAll(liveNode) {
        const edge = this.svg.fetchEdgeTo(liveNode.id);
        const svgNodeGroup = this.svg.fetchSvgNodeGroup(liveNode.id);
        svgNodeGroup.classList.add(`hidden`);
        edge.classList.add(`hidden`);
        liveNode.children.forEach((child) => {
            this.collapseAll(child);
        });
    }

    showExpand(liveNode) {
        liveNode.children.forEach((child) => {
            if (liveNode.isExpanded) {
                const edge = this.svg.fetchEdgeTo(child.id);
                const svgNodeGroup = this.svg.fetchSvgNodeGroup(child.id);
                svgNodeGroup.classList.remove(`hidden`);
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
     * layoutLiveNodes - auto-find pretty locations for liveNode and children. Label width -> x ; leafs -> y
     * redrawSvg - handles the zoom and pan of viewport across the SVG content
     * applyZoom
     */

    findLongestAtEachDepth(projectNode) {
        const depthToLengthArray = [];
        const startingLevel = projectNode.treeDepth;
        const workStack = [];
        workStack.push(projectNode);
        while (workStack.length > 0) {
            const currentLiveNode = workStack.pop();
            const currentRect = this.svg.fetchRectangle(currentLiveNode.id);
            const currentRectLength = Number(currentRect.getAttributeNS(null, `width`));
            if ((depthToLengthArray[currentLiveNode.treeDepth - startingLevel] === undefined) ||
                (depthToLengthArray[currentLiveNode.treeDepth - startingLevel] < currentRectLength)) {
                depthToLengthArray[currentLiveNode.treeDepth - startingLevel] = currentRectLength;
            }
            if (currentLiveNode.isExpanded) {
                currentLiveNode.children.forEach((child) => {
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

    _isStacked(projectNode) {
        const workStack = [];
        let isStacked = false;
        workStack.push(...projectNode.children);
        while (workStack.length > 0) {
            const currentItem = workStack.pop();
            if ((currentItem.x === projectNode.x) && (currentItem.y === projectNode.y)) {
                isStacked = true;
            }
            workStack.push(...currentItem.children);
        }
        return isStacked;
    }

    layoutLiveNodes(liveNodeArray = [...this.selectedLiveNodes.values()]) {
        const horizontalLeftMargin = 50;
        const horizontalRightMargin = 50;
        let xIndentArray = [];
        let startTreeDepth = 0;
        let leafCount = 0;
        const boxHeight = this.svg.standardBoxHeight;
        const separationSpacing = 15;
        const startPoint = new Point();
        const offsetPoint = new Point();

        function layoutTree(liveNode) {
            if ((liveNode.hasChildren()) && (liveNode.isExpanded)) {
                let childrenVerticalRange = 0;

                liveNode.children.sort((a, b) => {
                    return ((a.dependencySlot > b.dependencySlot) ? 1 : ((b.dependencySlot > a.dependencySlot) ? -1 : 0));
                });

                liveNode.children.forEach((child) => {
                    child = layoutTree(child);
                    childrenVerticalRange = childrenVerticalRange + child.y;
                });
                liveNode.x = xIndentArray[liveNode.treeDepth - startTreeDepth];
                liveNode.y = (childrenVerticalRange / liveNode.children.length);
                return liveNode;
            } else {
                liveNode.x = xIndentArray[liveNode.treeDepth - startTreeDepth];
                liveNode.y = (leafCount * (boxHeight + separationSpacing));
                leafCount = leafCount + 1;
                return liveNode;
            }
        }

        liveNodeArray.forEach((liveNode) => {
            liveNode.x = liveNode.x ? liveNode.x : 0;
            liveNode.y = liveNode.y ? liveNode.y : 0;
            const longestAtEachDepthArray = this.findLongestAtEachDepth(liveNode);
            xIndentArray = this.xIndentForDepth(longestAtEachDepthArray, horizontalLeftMargin);
            startTreeDepth = liveNode.treeDepth;
            startPoint.x = liveNode.x;
            startPoint.y = liveNode.y;
            liveNode = layoutTree(liveNode);               //?@todo i forgot -- what does this do?
            offsetPoint.x = startPoint.x - liveNode.x;
            offsetPoint.y = startPoint.y - liveNode.y;
            liveNode = this.translate(liveNode, offsetPoint);
            this.dispatchLiveNodeUpdated(liveNode);
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

    _refreshPlayground(projectNode) {
        this._viewedProjectsMap.set(projectNode.id, projectNode);
        this._redrawPlayground();
        if ((projectNode.isExpanded) && (this._isStacked(projectNode))) {
            this.layoutLiveNodes([projectNode]);
            this._redrawPlayground();
        }
    }

    _redrawPlayground() {
        this.shift();
        // delete the svg
        this.svg.clearBackground(this.svg.fetchBackground());
        // if projectLiveNode is Root ->  add it to the list of viewed trees. (viewedProjectsMap)
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
        this._selectedLiveNodesMap.forEach((value, key) => {
            this._selectedLiveNodesMap.set(value.id, value); // ?
            this.svg.selectSvgNodeGroup(value);
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



    buildJointActivityGraph(parentGroup, liveNode) {
        const svgBox = {x: liveNode.x,
            y: liveNode.y,
            width: 0,
            height: 0};

        const svgSubGroup = this.svg.createSubGroup(liveNode.id);
        const svgSubGroupTop = svgSubGroup.firstChild;
        const svgNodeGroup = this.svg.createSvgNodeGroup(liveNode.id);
        this.svg.positionItem(svgNodeGroup, liveNode.x, liveNode.y);
        parentGroup.appendChild(svgSubGroup);
        svgSubGroup.insertBefore(svgNodeGroup, svgSubGroupTop);

        const labelElement = this.svg.createTextElement(liveNode.name, liveNode.id);
        const svgText = this.svg.positionItem(labelElement, this.svg.horizontalLeftMargin, this.svg.standardBoxHeight / 4);
        const groupTop = svgNodeGroup.firstChild;
        svgNodeGroup.insertBefore(svgText, groupTop);
        svgBox.height = this.svg.standardBoxHeight;
        let possibleWidth1;

        if ((liveNode.isLeaf()) && (!liveNode.isRoot())) {
            possibleWidth1 = this.svg.labelWidth(labelElement) + this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin;
        } else {
            possibleWidth1 = this.svg.labelWidth(labelElement) + this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin + this.svg.buttonSize;
        }

        const possibleWidth2 = Math.max(liveNode.activity.getInputs().length, liveNode.activity.getOutputs().length) * 10;
        svgBox.width = Math.max(possibleWidth1, possibleWidth2);
        const svgRect = this.svg.createRectangle(svgBox.width, svgBox.height, liveNode.id);
        this.svg.positionItem(svgRect, 0, 0);

        this.svg.applyLightnessDepthEffect(svgRect, liveNode.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgRect, liveNode.treeDepth, this.treeHeight);
        }
        svgNodeGroup.insertBefore(svgRect, svgText);

        // Apply placement warning
        liveNode.providesOutputTo.forEach((dependantLiveNode) => {
            if (dependantLiveNode.y < (liveNode.y + svgBox.height)) {
                this.svg.signalWarning(liveNode);
                this.svg.signalWarning(dependantLiveNode);
            }
        });


        this.svgSize.width = Math.max(this.svgSize.width, svgBox.x + svgBox.width);
        this.svgSize.height = Math.max(this.svgSize.height, svgBox.y + svgBox.height);

        if (liveNode.hasChildren()) {
            const showButton = this.svg.createExpandButton(liveNode.id, svgBox.width, svgBox.height, liveNode.isExpanded);
            // showButton.addEventListener(`mousedown`, this.toggleExpand.bind(this));
            showButton.classList.add(`button`);
            svgNodeGroup.insertBefore(showButton, svgText);
        }
        if (this._viewedProjectsMap.size > 1) {
            const addButton = this.svg.createAddButton(liveNode.id, svgBox.width, svgBox.height);
            this.svg.applyLightnessDepthEffect(addButton, liveNode.treeDepth, this.treeHeight);
            addButton.classList.add(`button`);
            svgNodeGroup.insertBefore(addButton, svgText);
        }

        if (liveNode.activity.getInputs().length !== 0) {
            const spread = svgBox.width / (liveNode.activity.getInputs().length + 1);  // +1 -> making space from corners
            const topLayer = [];
            liveNode.activity.getInputs().forEach((endpoint) => {
                topLayer.push(endpoint.exchangeName);
            });
            liveNode.activity.getInputs().forEach((endpoint) => {
                const endpointCircle = this.svg.createInputEndpoint(liveNode.id, endpoint.exchangeName);
                endpointCircle.classList.add(`hidden`);
                const position = spread + (topLayer.indexOf(endpoint.exchangeName) * spread);
                this.svg.positionItem(endpointCircle, position, 0);
                svgNodeGroup.insertBefore(endpointCircle, svgText);
            });
        }

        if (liveNode.activity.getOutputs().length !== 0) {
            const spread = svgBox.width / (liveNode.activity.getOutputs().length + 1);  // +1 -> making space from corners
            const bottomLayer = [];
            liveNode.activity.getOutputs().forEach((endpoint) => {
                bottomLayer.push(endpoint.exchangeName);
            });
            liveNode.activity.getOutputs().forEach((endpoint) => {
                const endpointCircle = this.svg.createOutputEndpoint(liveNode.id, endpoint.exchangeName);
                endpointCircle.classList.add(`hidden`);
                const position = spread + (bottomLayer.indexOf(endpoint.exchangeName) * spread);
                this.svg.positionItem(endpointCircle, position, svgBox.height);
                svgNodeGroup.insertBefore(endpointCircle, svgText);
            });
        }


        liveNode.children.forEach((child) => {
            const svgSubNodeBox = this.buildJointActivityGraph(svgSubGroup, child);
            const svgEdge = this.svg.createEdge(liveNode.id, child.id, svgBox, svgSubNodeBox);
            svgEdge.addEventListener(`mousedown`, this.mousedownController.bind(this));
            svgSubGroup.appendChild(svgEdge);
        });
        this.buildBindings(svgSubGroup, liveNode);
        return svgBox;
    }

    buildBindings(parentGroup, liveNode) {
        liveNode.activity.bindings.forEach((binding) => {
            const fromLiveNodes = [];
            let checkStack = [];
            checkStack.push(liveNode);
            checkStack.push(...liveNode.children);
            while (checkStack.length > 0) {
                const checkLiveNode = checkStack.pop();
                if (checkLiveNode.activity.urn === binding.from.exchangeSourceUrn) {
                    fromLiveNodes.push(checkLiveNode);
                }
            }

            const toLiveNodes = [];
            checkStack = [];
            checkStack.push(liveNode);
            checkStack.push(...liveNode.children);
            while (checkStack.length > 0) {
                const checkLiveNode = checkStack.pop();
                if (checkLiveNode.activity.urn === binding.to.exchangeSourceUrn) {
                    toLiveNodes.push(checkLiveNode);
                }
            }
            fromLiveNodes.forEach((fromLiveNode) => {
                toLiveNodes.forEach((toLiveNode) => {
                    const newBinding = this.svg.createBinding(fromLiveNode, binding.from, toLiveNode, binding.to);
                    // if ((liveNode.children.includes(fromLiveNode)) && (liveNode.children.includes(toLiveNode))) {
                    //     toLiveNode.activity.becomeConsumerOf(fromLiveNode.activity);
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
