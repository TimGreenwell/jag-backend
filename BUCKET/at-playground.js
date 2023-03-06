/**
 * @file AtPlayground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import ActivityNodeElement from '../docker/jag-server/public/scripts/views/at-support/jag-node.js';
import EdgeElement from '../docker/jag-server/public/scripts/views/at-support/edge.js';
import Popupable from '../docker/jag-server/public/scripts/utils/popupable.js';
import UserPrefs from "../docker/jag-server/public/scripts/utils/user-prefs.js";

class AtPlayground extends Popupable {

    constructor() {
        super();
        this._edgeContainerDiv = document.createElementNS(`http://www.w3.org/2000/svg`, `svg`);
        this._edgeContainerDiv.id = `edges-container`;
        this._edgeContainerDiv.setAttribute(`version`, `1.1`);
        this._edgeContainerDiv.setAttribute(`xmlns`, `http://www.w3.org/2000/svg`);
        this.appendChild(this._edgeContainerDiv);

        this._nodeContainerDiv = document.createElement(`div`);
        this._nodeContainerDiv.id = `nodes-container`;
        this.appendChild(this._nodeContainerDiv);
        this.setPopupBounds(this._nodeContainerDiv);

        this._viewedProjectsMap = new Map();         // All active Jag root nodes
        this._activeActivityNodeElementSet = new Set();    // set of ActivityNodes (view) -- All elements (see viewedNodes for the supprting nodeModel)
        this._selectedActivityNodeElementSet = new Set();  // set of ActivityNodes (view)
        this._is_edge_being_created = false;

        this._cardinals = {
            left: this._createCardinal(`left`, 1, 0),
            right: this._createCardinal(`right`, -1, 0),
            up: this._createCardinal(`up`, 0, 1),
            down: this._createCardinal(`down`, 0, -1)
        };

        this._canMoveView = {
            left: false,
            right: false,
            up: false,
            down: false
        };

        this._showCardinals(this._canMoveView);

        this._zoomFactor = 1.00;

        this._boundHandleEdgeSelected = this._handleEdgeSelected.bind(this);
        this._boundOnEdgeUpdated = this.onEdgeUpdated.bind(this);
        this._boundOnEdgeCanceled = this.onEdgeCanceled.bind(this);
        this._boundDragView = this.dragView.bind(this);
        this._boundStopDragView = this.stopDragView.bind(this);


        // Turned this off temporarily.  Most keys have no function here.  They all work when
        // a node inside is selected
        document.addEventListener(`keydown`, this.onKeyDown.bind(this));

        this.addEventListener(`mousedown`, this.playgroundClicked.bind(this));

        this.addEventListener(`mousemove`, (e) => {
            e.stopPropagation();
            this._edgeContainerDiv.dispatchEvent(new MouseEvent(`mousemove`, {
                clientX: e.clientX,
                clientY: e.clientY
            }));
        });

        //  this.addEventListener('dragenter', this.onPreImport.bind(this));     // what is this?
        //  this.addEventListener('dragover', this.cancelDefault.bind(this));   // preventDefault
        //  this.addEventListener('drop', this.onImport.bind(this));
    }

    get selectedNodes() {
        const selectedIdArray = [...this._selectedActivityNodeElementSet].map((element) => {
            return element.nodeModel;
        });
        return selectedIdArray;
    }

    get viewedNodes() {             // Returns the nodeModels inside the active elements
        const viewedIdArray = [...this._activeActivityNodeElementSet].map((element) => {
            return element.nodeModel;
        });
        return viewedIdArray;
    }

    get viewedProjects() {
        const viewedRootNodes = Array.from(this._viewedProjectsMap.values());
        return viewedRootNodes;
    }


    /**
     *      Local Handlers
     *         -- Edge Handling
     *         -- Pan and Zoom
     */

    /**
     * Edge Handling
     *
     * _handleEdgeSelected
     * onEdgeInitialized
     * _createEdge
     * onEdgeUpdated
     * onEdgeFinalized
     * cancelEdge
     * onEdgeCanceled
     *
     */

    _handleEdgeSelected(e) {
        if (e.detail.selected) {
            this._selectedActivityNodeElementSet.add(e.target);
        } else {
            this._selectedActivityNodeElementSet.delete(e.target);
        }
    }

    onEdgeInitialized(e, node) {
        this.removeEventListener(`mousemove`, this._boundDragView);
        this.removeEventListener(`mouseup`, this._boundStopDragView);
        this.addEventListener(`mousemove`, this._boundOnEdgeUpdated);
        this.addEventListener(`mouseup`, this._boundOnEdgeCanceled);

        this._created_edge = this._createEdge(node);
        this._is_edge_being_created = true;

        const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
        this._created_edge.setEnd(x, y);
    }

    _createEdge(origin, id = undefined) {
        const edge = new EdgeElement(this._edgeContainerDiv);
        edge.setLeadActivityNode(origin);
        if (id) {
            edge.setChildId(id);
        }
        edge.addEventListener(`keydown`, this.onKeyDown.bind(this));                     // mmmmmmmmmmmmmmmmm
        return edge;
    }

    onEdgeUpdated(e) {
        if (!this._is_edge_being_created) {
            return;
        }

        const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
        this._created_edge.setEnd(x, y);
    }

    onEdgeFinalized(e) {
        const node = e.target.offsetParent;

        if (!this._is_edge_being_created) {
            return;
        }

        if (window.confirm(`Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
            this._is_edge_being_created = false;
            this._created_edge.setSubActivityNode(node);                // a lot happens in here
            this._created_edge.addEventListener(`event-nodes-selected`, this._boundHandleEdgeSelected);
            // EVENT-NODES-SELECTED only dispatched at the 'this' level.

            // identical issue below
            // parentActivity.addChild(childActivity);       @TODO Where did this parent obtain the child.  It works but dont know where it came from.
            // JAG.AddChild happens way down when jag-node.completeOutEdge finishes.
            // @TODO consider bringing it up here (separation of functionality)

            const parentNodeModel = this._created_edge._leadActivityNode.nodeModel;
            const childNodeModel = this._created_edge._subActivityNode.nodeModel;

            // childNodeModel.parent = parentNodeModel;
            // childNodeModel.childId = this._created_edge._childId
            // parentNodeModel.addChild(childNodeModel);

            //  @TODO -- Maybe the 'join new project stuff should go here?' -- setAttribute(project,newAncestor)  +  reparent
            //  @TODO -- half thought update Jag should come first - but now think the order is good... thoughts?

            this.dispatchEvent(new CustomEvent(`event-nodes-connected`, {
                bubbles: true,
                composed: true,
                detail: {
                    projectNodeId: parentNodeModel.projectId,
                    parentNodeId: parentNodeModel.id,
                    childNodeId: childNodeModel.id
                }
            }));

            //   //      this._viewedProjectsMap.delete(childNodeModel.id)
        } else {
            this.cancelEdge();
        }
    }

    cancelEdge() {
        if (!this._is_edge_being_created) {
            return;
        }

        this.removeEventListener(`mousemove`, this._boundOnEdgeUpdated);
        this.removeEventListener(`mouseup`, this._boundOnEdgeCanceled);

        this._created_edge.destroy();
        this._created_edge = undefined;
        this._is_edge_being_created = false;
    }

    onEdgeCanceled(e, node) {
        this.cancelEdge();
    }


    /**
     *
     * AtPlayground Pan and Zoom
     *
     * _createCardinal
     * _checkBounds
     * _showCardinals
     * _zoomView
     * _dragView
     * dragView
     * stopDragView
     * fromClientToPlaygroundCoordinates
     *
     */

    _createCardinal(type, dx, dy) {
        const cardinal = document.createElement(`div`);
        cardinal.classList.add(`cardinal`);
        cardinal.classList.add(type);

        this.appendChild(cardinal);

        cardinal.addEventListener(`mouseenter`, () => {
            const hoverInterval = setInterval(function () {
                this._dragView(dx * AtPlayground.DEFAULT_CARDINAL_MULTIPLIER, dy * AtPlayground.DEFAULT_CARDINAL_MULTIPLIER);
            }.bind(this), 10);

            cardinal.addEventListener(`mouseleave`, () => {
                clearInterval(hoverInterval);
            });
        });

        return cardinal;
    }

    _checkBounds(nodes = this._activeActivityNodeElementSet) {
        const bounds = this.getBoundingClientRect();
        const [minX, minY, maxX, maxY] = [bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height];
        let showLeft,
            showRight,
            showUp,
            showDown;

        for (const node of nodes) {
            if (node.visible) {
                const {x, y, width, height} = node.getBoundingClientRect();

                if (x < minX) {
                    showLeft = true;
                }
                if (x + width > maxX) {
                    showRight = true;
                }
                if (y < minY) {
                    showUp = true;
                }
                if (y + height > maxY) {
                    showDown = true;
                }
            }
        }

        if (nodes == this._activeActivityNodeElementSet) {
            return this._showCardinals({
                left: showLeft || false,
                right: showRight || false,
                up: showUp || false,
                down: showDown || false
            });
        }

        return this._showCardinals({
            left: showLeft,
            right: showRight,
            up: showUp,
            down: showDown
        });
    }

    _showCardinals(toggle = {
        left,
        right,
        up,
        down
    }) {
        this._canMoveView = {
            left: toggle.left == undefined ? this._canMoveView.left : toggle.left,
            right: toggle.right == undefined ? this._canMoveView.right : toggle.right,
            up: toggle.up == undefined ? this._canMoveView.up : toggle.up,
            down: toggle.down == undefined ? this._canMoveView.down : toggle.down
        };

        for (const [key, value] of Object.entries(toggle)) {
            if (value == true || value == false) {
                this._cardinals[key].classList.toggle(`visible`, value);
            }
        }

        return this._canMoveView;
    }

    _zoomView(factor) {
        this._zoomFactor = factor;
        const transform = `scale(${factor})`;
        this._edgeContainerDiv.style.transform = transform;
        this._nodeContainerDiv.style.transform = transform;
        this._checkBounds();
    }

    _dragView(dx, dy) {
        for (const node of this._activeActivityNodeElementSet) {
            node.translate(dx, dy, false);

            node.nodeModel.x = Math.round(node.nodeModel.x + dx);
            node.nodeModel.y = Math.round(node.nodeModel.y + dy);
        }

        this._checkBounds();
    }

    dragView(e) {
        const dx = e.clientX - this._initialMouse.x;
        const dy = e.clientY - this._initialMouse.y;

        this._dragView(dx, dy);

        this._initialMouse = {
            x: e.clientX,
            y: e.clientY
        };
    }

    stopDragView(event) {
        this.removeEventListener(`mousemove`, this._boundDragView);
    }

    fromClientToPlaygroundCoordinates(x, y) {
        const px = x - this.offsetLeft;
        const py = y - this.offsetTop;
        return [px, py];
    }

    /**
     *
     * playgroundClicked
     * cancelDefault
     * onImport
     */

    handlePlaygroundSelectedNodes(e) {           // on mousedown  applied during jag-node create
        const $node = e.target.offsetParent;
        if (!e.shiftKey) {
            this._selectedActivityNodeElementSet.forEach((local_node) => {
                if (local_node != $node) {
                    local_node.setSelected(false);
                }
            });
            this._selectedActivityNodeElementSet.clear();
        }

        this._selectedActivityNodeElementSet.add($node);

        if (e.ctrlKey) {
            const all_selected = $node.setSelected(true, new Set());   // @TODO looks like it wants two booleans.  not a set.
            for (const sub_node of all_selected) {
                this._selectedActivityNodeElementSet.add(sub_node);
            }
        } else {
            $node.setSelected(true);
        }

        const selectedActivityNodeElementArray = [...this._selectedActivityNodeElementSet];
        const selectedNodeArray = selectedActivityNodeElementArray.map((jagNodeElement) => {
            return jagNodeElement.nodeModel;
        });

        this.dispatchEvent(new CustomEvent(`event-nodes-selected`, {
            detail: {selectedNodeArray}
        }));
        e.stopPropagation();  // Don't let it bubble up to the playgroundClicker handler.
    }

    playgroundClicked(e) {
        // The background clicker

        let unselectedNodeArray = null;
        if (!e.shiftKey) {
            const unselectedActivityNodeElementArray = [...this._selectedActivityNodeElementSet];
            unselectedNodeArray = unselectedActivityNodeElementArray.map((jagNodeElement) => {
                return jagNodeElement.nodeModel;
            });
            this.deselectAll();
        }

        const selectedActivityNodeElementArray = [...this._selectedActivityNodeElementSet];
        const selectedNodeArray = selectedActivityNodeElementArray.map((jagNodeElement) => {
            return jagNodeElement.nodeModel;
        });
        this.dispatchEvent(new CustomEvent(`event-playground-clicked`, {
            detail: {
                selectedNodeArray,
                unselectedNodeArray
            }
        }));


        this._edgeContainerDiv.dispatchEvent(new MouseEvent(`click`, {
            clientX: e.clientX,
            clientY: e.clientY,
            shiftKey: e.shiftKey
        }));
        this._initialMouse = {
            x: e.clientX,
            y: e.clientY
        };
        this.addEventListener(`mousemove`, this._boundDragView);
        this.addEventListener(`mouseup`, this._boundStopDragView);
    }

    //
    // cancelDefault(e) {
    //     e.preventDefault();
    // }

    // onImport(e) {
    //     e.preventDefault();
    //     const files = e.dataTransfer.files;
    //     const reader = new FileReader();
    //     reader.addEventListener('load', function (content) {
    //     });
    //     reader.readAsText(files[0]);
    // }

    // //////////////////////////////////////////////////////////////////////
    // ///////////  Called from ControllerAT  ///////////////////////////////
    // //////////////////////////////////////////////////////////////////////
    /**
     *
     * Handlers for ControllerAT
     *
     * _buildNodeViewFromNodeModel
     * _handleNewActivityPopup
     * clearPlayground                        - Clears project(s) from playground (@arg: project Id or 'undefined' for all active projects)
     * handleClearSelected (@TODO)
     * handleRefresh
     * affectProjectView
     * _addActivityNodeTree
     * replaceActivityNode
     * createActivityNode  - called on new Project message from above
     * deleteNodeModel
     */


    _buildNodeViewFromNodeModel(currentNodeModel) {
        if ((!currentNodeModel.x) || (!currentNodeModel.y)) {
            currentNodeModel.x = 30 + Math.floor(Math.random() * 20);
            currentNodeModel.y = Math.floor((this.clientHeight / 2) + (Math.random() * 70));
        }
        currentNodeModel.setPosition(currentNodeModel.x, currentNodeModel.y);
        const $newViewNode = this.createActivityNode(currentNodeModel);
        $newViewNode.setTranslation(currentNodeModel.x, currentNodeModel.y);
        if (currentNodeModel.isExpanded) {
            currentNodeModel.children.forEach((child) => {
                const edge = this._createEdge($newViewNode, child.id);         // this wants a jag-node - not a nodeModel
                const $childViewNode = this._buildNodeViewFromNodeModel(child);                          // first build child
                edge.setSubActivityNode($childViewNode);                                                       // then connect tail of edge to it.
                edge.addEventListener(`event-nodes-selected`, this._boundHandleEdgeSelected);
                // EVENT-NODES-SELECTED only dispatched at the 'this' level.
            });
        }
        return $newViewNode;
    }


    redrawSelectedNodes() {
        this.selectedNodes.forEach((node) => {
            this._redrawNodes(node);
        });
    }

    _redrawNodes(currentNodeModel, x = null, y = null) {
        const margin = 25;
        if (x && y) {
            currentNodeModel.x = x;
            currentNodeModel.y = y;
        }
        currentNodeModel.setPosition(currentNodeModel.x, currentNodeModel.y);
        const $newViewNode = this.getNodeViewById(currentNodeModel.id);
        //    const $newViewNode = this.createActivityNode(currentNodeModel)
        $newViewNode.setTranslation(currentNodeModel.x, currentNodeModel.y);

        // assume all children have same height as the parent.
        const x_offset = Math.floor(currentNodeModel.x + $newViewNode.clientWidth + margin);
        const preferred_height = currentNodeModel.leafCount * ($newViewNode.clientHeight + margin);
        let y_offset = Math.floor(currentNodeModel.y - (preferred_height / 2));


        currentNodeModel.children.forEach((child) => {
            const local_preferred_size = child.leafCount * ($newViewNode.clientHeight + margin);
            y_offset = y_offset + (local_preferred_size);
            //     let edge = this._createEdge($newViewNode, child.id);                                       // this wants a jag-node - not a nodeModel
            const $childViewNode = this._redrawNodes(child, x_offset, y_offset);                          // first build child

            //     edge.setSubActivityNode($childViewNode);                                                   // then connect tail of edge to it.
            //     edge.addEventListener('event-nodes-selected', this._boundHandleEdgeSelected);
        });

        return $newViewNode;
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
        for (const jagNode of this._activeActivityNodeElementSet) {
            if ((projectId == undefined) || (jagNode.nodeModel.projectId === projectId)) {
                jagNode.removeAllEdges();
                jagNode.detachHandlers();
                this._activeActivityNodeElementSet.delete(jagNode);
                this._nodeContainerDiv.removeChild(jagNode);
            }
        }
        this._checkBounds();
    }

    // handleRefresh({activity, activity_set, alreadyRefreshedNodes = new Set()}) {
    //     const margin = 50;
    //
    //     for (let node of this._activeActivityNodeElementSet) {
    //         if (!alreadyRefreshedNodes.has(node) && node.activity === activity) {
    //             const root = node.getRoot();
    //
    //             if (root == node) {
    //                 const [x, y] = node.getPosition();
    //                 this._traverseActivityNodeTree(activity, activity_set, true, margin, x, y, node);
    //
    //                 const tree = node.getTree();
    //
    //                 for (const node of tree) {
    //                     alreadyRefreshedNodes.add(node);
    //                 }
    //             } else {
    //                 root.refresh(alreadyRefreshedNodes);
    //             }
    //         }
    //     }
    // }


    deleteActivity(deletedUrn) {             // Activity got updated - does it affect our projects?
        this._viewedProjectsMap.forEach((value, key) => {
            const node = value;
            if (node.isActivityInProject(deletedUrn)) {
                this.dispatchEvent(new CustomEvent(`response-activity-deleted`, {
                    detail: {
                        projectModelId: node.id,
                        activityUrn: deletedUrn
                    }
                })); // event-activity-created in playground uses node
            }
        });
    }


    replaceActivityNode(newActivity, deadUrn) {
        this._activeActivityNodeElementSet.forEach((node) => {
            if (node.nodeModel.activity.urn === deadUrn) {
                node.nodeModel.activity = newActivity;
            }
        });
    }

    // this is called when a new jag appears from above --- applies?
    // note: creates a view based on Activity xxx now NodeModel
    createActivityNode(nodeModel) {
        const $node = new ActivityNodeElement(nodeModel);
        $node.addEventListener(`mousedown`, this.handlePlaygroundSelectedNodes.bind(this));

        $node.addEventListener(`keydown`, this.onKeyDown.bind(this));

        $node.addEventListener(`drag`, () => {
            this._checkBounds();
        });

        $node.addEventListener(`toggle-visible`, (e) => {
            if (e.detail) {
                this._checkBounds($node.getTree());
            } else {
                this._checkBounds();
            }
        });

        // //?? @TODO think about this.
        $node.addEventListener(`refresh`, (e) => {
            this.dispatchEvent(new CustomEvent(`refresh`, {detail: e.detail}));
        });
        // Are these two below not the same info.  activeNodeSet needed?

        $node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
        $node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));

        this._activeActivityNodeElementSet.add($node);
        this._nodeContainerDiv.appendChild($node);
        return $node;
    }

    deleteNodeModel(deadId) {
        // The deadId is a node marked for deletion.  Death can either be
        // annihilation or absorption into another project.  AtPlayground nodes
        // with an ancestor matching deadId are removed.
        // let deadIdModel = this._viewedProjectsMap.get(deadId)
        this._viewedProjectsMap.delete(deadId);
        for (const node of this._activeActivityNodeElementSet) {           // search through active elements
            //        if (node.nodeModel.projectId === deadId) {         // is this node in the tree of the currentNodeModel?
            if (!this._viewedProjectsMap.has(node.nodeModel.projectId)) {
                node.removeAllEdges();
                node.detachHandlers();
                this._activeActivityNodeElementSet.delete(node);
                this._nodeContainerDiv.removeChild(node);
            }
        }
    }


    getNodeViewById(id) {
        for (const node of this._activeActivityNodeElementSet) {           // search through active elements
            if (node.nodeModel.id === id) {         // is this node in the tree of the currentNodeModel?
                return node;
            }
        }
    }

    addNodeModel(projectNodeModel) {
        this._viewedProjectsMap.set(projectNodeModel.projectId, projectNodeModel);
        const $rootNode = this._buildNodeViewFromNodeModel(projectNodeModel);
        return $rootNode;
    }


    // _filterOrphans() {
    //     for (const [key, val] of this._viewedProjectsMap) {
    //         if (!val.isRoot()) {
    //             this._viewedProjectsMap.delete(key);
    //         }
    //     }
    //
    //
    //     for (let index = this._viewedProjectsMap.length - 1; index >= 0; --index) {
    //         if (this._viewedProjectsMap[index].nodeModel.id === updatedNodeModel.id) {
    //             if (updatedNodeModel.id === updatedNodeModel.projectId) {
    //                 const listItemElement = this.createListItemCollection(updatedNodeModel);
    //                 this._libraryList[index] = listItemElement;
    //             } else {
    //                 this._libraryList.splice(index, 1);
    //             }
    //         }
    //     }
    // }

    _rebuildNodeView(projectNodeModel) {
        this.deleteNodeModel(projectNodeModel.id);

        if (projectNodeModel.isRoot()) {
            this.addNodeModel(projectNodeModel);
        } else {
            this._viewedProjectsMap.delete(projectNodeModel.id);
        }
    }

    // //////////////////////////////////////////////////////////////////////
    // ///////////  Support Functions  //////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////
    /**
     *
     * Support Functions
     *
     * _traverseActivityNodeTree    : Required by : _buildNodeViewFromNodeModel, handleRefresh, _addActivityNodeTree
     * deselectAll                  : Required by : playgroundClicked
     * onKeyDown                    : Required by : createActivityNode
     * _getNodePreferredHeight      : Required by : _traverseActivityNodeTree
     *
     */


    deselectAll() {
        this._selectedActivityNodeElementSet.forEach((n) => {
            return n.setSelected(false);
        });
        this._selectedActivityNodeElementSet.clear();
    }

    onKeyDown(event) {
        event.stopImmediatePropagation();
        const $node = event.target;
        if (event.key === `Delete`) {
            if (this._selectedActivityNodeElementSet.length > 1) {
                alert(`Can only clear/disconnect one selected item`);
            } else if (this._selectedActivityNodeElementSet.length < 1) {
                alert(`Must select at least one item to clear/disconnect`);
            } else {
                // if the selected node is a root - then clear the project from the tree (manually remove graphics in clearPlayground)
                // if the selected node is a non-root node - then disconnect the jag from its parent (triggers DB update which auto redraws graphics)
                // @TODO - bit ugly with two functions for 'delete'  - I cant think of alternative
                // @TODO - might consider a deleted edge to mean disconnect jag

                if ($node.nodeModel.projectId === $node.nodeModel.id) {
                    this.clearPlayground($node.nodeModel.projectId);
                    this.deselectAll();
                } else {
                    if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                        const parentActivity = $node.getParent().nodeModel.activity;
                        const childActivityChildId = $node.nodeModel.childId;
                        const remainingChildren = parentActivity._children.filter((entry) => {
                            // if (entry.id !== childActivityChildId) {
                            //     return entry;
                            // }
                            // xxxxxx
                            return entry.id !== childActivityChildId;
                        });
                        parentActivity.children = remainingChildren;
                        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                            detail: {activity: parentActivity}
                        }));
                        this.deselectAll();
                    }
                }
            }
        } else if (event.key === `ArrowLeft`) {
            if (this._canMoveView.left) {
                this._dragView(Number(AtPlayground.DEFAULT_ARROW_MULTIPLIER), 0);
            }
        } else if (event.key === `ArrowRight`) {
            if (this._canMoveView.right) {
                this._dragView(-1 * AtPlayground.DEFAULT_ARROW_MULTIPLIER, 0);
            }
        } else if (event.key === `ArrowUp`) {
            if (this._canMoveView.up) {
                this._dragView(0, Number(AtPlayground.DEFAULT_ARROW_MULTIPLIER));
            }
        } else if (event.key === `ArrowDown`) {
            if (this._canMoveView.down) {
                this._dragView(0, -1 * AtPlayground.DEFAULT_ARROW_MULTIPLIER);
            }
        } else if (event.key === `PageUp`) {
            this._zoomView(this._zoomFactor / AtPlayground.DEFAULT_ZOOM_MULTIPLIER);
        } else if (event.key === `PageDown`) {
            this._zoomView(this._zoomFactor * AtPlayground.DEFAULT_ZOOM_MULTIPLIER);
        }
    }

    _getNodePreferredHeight(jagNode, jagNodeMap) {
        if (!jagNode.children || jagNode.children.length === 0) {
            return 1;
        }

        return jagNode.children.reduce((cut_set_size, child) => {
            const def = jagNodeMap.get(child.urn);
            return cut_set_size + (def ? this._getNodePreferredHeight(def, jagNodeMap) : 0);
        }, 0);
    }

    // handleLibraryListItemSelected({
    //                                   activity: selectedActivity,
    //                                   activity_set: selectedActivityDescendants = new Map(),
    //                                   isExpanded: isExpanded = false
    //                               }) {
    //     this._addActivityNodeTree(selectedActivity, selectedActivityDescendants, isExpanded);
    // }


    _eventImportJagHandler(e) {
        const $initiator = document.getElementById(`menu-new`);
        this.popup({
            content: AtPlayground.NOTICE_PASTE_JAG,
            trackEl: this,
            inputs: {}, // event: e},
            highlights: [$initiator]
        });
    }


}

// END OF CLASS
// Initial UI builder creates
// <svg version="1.1" xmlns="http//www.w3.org/2000/svg"></svg>
//      <div></div>
//      <div class="popup-box" style="visablity


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
                paramMap.set(`cols`, 24);
                paramMap.set(`rows`, 4);
                return paramMap;
            }
        }
    ],
    actions: [
        {
            text: `Create`,
            color: `black`,
            bgColor: `red`,
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

AtPlayground.NOTICE_REMOVE_CHILD = Popupable._createPopup({          // is this running - i want it?
    type: AtPlayground.POPUP_TYPES.NOTICE,
    name: `Disconnect Child`,
    description: `Disconnect this child JAG from parent JAG?`,
    actions: [
        {
            text: `Yes`,
            color: `black`,
            bgColor: `red`,
            action({inputs: {node}}) {
                const edge = node.getParentEdge();
                const id = edge.getChildId();
                const parent = node.getParent();
                const jagUrn = parent.nodeModel.urn;
                const jagChild = {
                    urn: node.nodeModel.urn,
                    id: node.nodeModel.childId
                };
                const remainingChildren = parent.nodeModel.activity.children.filter((entry) => {
                    // if (entry.id !== jagChild.id) {
                    //     return entry;
                    // }
                    // xxxxx
                    return entry.id !== jagChild.id;
                });
                parent.nodeModel.activity.children = remainingChildren;
                this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                    detail: {activity: parent.nodeModel.activity}
                }));
            }
        },
        {
            text: `No`,
            color: `white`,
            bgColor: `black`
        }

    ]
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
                paramMap.set(`cols`, 24);
                paramMap.set(`rows`, 4);
                return paramMap;
            }
        }
    ],
    actions: [
        {
            text: `Create`,
            color: `black`,
            bgColor: `red`,
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

                // for (let file of selectedFiles) {
                //     reader.readAsText(file);
                // }
            }
        }
    ]
    // display: ?
    // fallback: ?
    // skip: ?
});


AtPlayground.DEFAULT_CARDINAL_MULTIPLIER = 10;

AtPlayground.DEFAULT_ARROW_MULTIPLIER = 10;

AtPlayground.DEFAULT_ZOOM_MULTIPLIER = 0.9;

customElements.define(`jag-playground`, AtPlayground);

export default customElements.get(`jag-playground`);


