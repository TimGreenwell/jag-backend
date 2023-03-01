/**
 *
 * JAG - Common Controller
 * The common controller contains the code that would normally be present in two or more of the other controllers.
 * This generally includes event-initiated handlers and a few support methods.
 *
 * The supported controllers include:
 * controllerAT - The Authoring Tool Controller
 * controllerDEF - The DefineNode Controller (assigning node operations)
 * controllerIA - The Interdependency Analysis Controller
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import Activity from "../models/activity.js";
import NodeModel from "../models/node.js";
import StorageService from "../services/storage-service.js";
import InputValidator from "../utils/validation.js";
import CellModel from "../models/cell.js";
import Traversal from "../utils/traversal.js";

// noinspection JSUnusedGlobalSymbols
export default class Controller extends EventTarget {

    constructor() {
        super();
        this._activityMap = new Map();       // Activity cache
        this._projectMap = new Map();        // Node cache (For project heads and every descendent)
        this._analysisMap = new Map();       // Analysis cache
        this._currentAnalysis = undefined;   // type: AnalysisModel
    }

    get activityMap() {
        return this._activityMap;
    }

    set activityMap(newActivityMap) {
        this._activityMap = newActivityMap;
    }

    uncacheActivity(activityId) {
        this._activityMap.delete(activityId);
    }

    cacheActivity(activity) {
        this._activityMap.set(activity.urn, activity);
    }

    fetchActivity(activityId) {
        return this._activityMap.get(activityId);
    }

    get projectMap() {
        return this._projectMap;
    }

    set projectMap(newProjectMap) {
        this._projectMap = newProjectMap;
    }

    uncacheProject(projectId) {
        this._projectMap.delete(projectId);
    }

    cacheProject(project) {
        this._projectMap.set(project.id, project);
        project.children.forEach((child) => {
            this.cacheProject(child);
        });
    }

    fetchProject(projectId) {
        const cachedProject = this._projectMap.get(projectId);
        if (!cachedProject) {
            console.log(`Could not find the node ${projectId}. Expect some issues.  We should be going to DB at this point`);
        }
        return cachedProject;
    }

    get analysisMap() {
        return this._analysisMap;
    }

    set analysisMap(newAnalysisMap) {
        this._analysisMap = newAnalysisMap;
    }

    uncacheAnalysis(analysisId) {
        this._analysisMap.delete(analysisId);
    }

    cacheAnalysis(analysis) {
        this._analysisMap.set(analysis.id, analysis);
    }

    fetchAnalysis(analysisId) {
        return this._analysisMap(analysisId);
    }

    get currentAnalysis() {
        return this._currentAnalysis;
    }

    set currentAnalysis(value) {
        this._currentAnalysis = value;
    }

    /**
     *                                   Upward Event Handlers
     * 'Upward handlers' for "locally generated events" that result in the submission of data changes
     * for storage and distribution.
     *
     *  "locally generated events" = some user interaction or detected remote change that requires another
     *  local action.  Data processing in this phase is minimal.
     *
     *  These Handlers were identical across multiple tabs
     *   eventActivityCreatedHandler       (C)  - popup create Activity (original event in menu starts playground popup)
     *   eventActivityUpdatedHandler       (C)  - structure change
     *   eventUrnChangedHandler            (C)  - URN field is changed
     */

    async eventActivityCreatedHandler(event) {
        const activityConstruct = event.detail.activityConstruct;
        console.log(`\nLocal>> (Activity ${activityConstruct.urn} creating) `);
        if (this.activityMap.has(activityConstruct.urn)) {
            window.alert(`That URN already exists`);
        } else {
            const newActivity = new Activity(event.detail.activityConstruct);
            newActivity.createdDate = Date.now();
            if (InputValidator.isValidUrn(newActivity.urn)) {
                await StorageService.create(newActivity, `activity`);
            } else {
                window.alert(`Invalid URN`);
            }
        }
    }

    async eventActivityUpdatedHandler(event) {                                       // Store and notify 'Updated JAG'
        const updatedActivity = event.detail.activity;               // Locally updated Activity - uncached.
        console.log(`\nLocal>> (Activity ${updatedActivity.urn} updating) `);
        updatedActivity.modifiedDate = Date.now();
        await StorageService.update(updatedActivity, `activity`);
    }

    async eventUrnChangedHandler(event) {
        const originalUrn = event.detail.originalUrn;
        const newUrn = event.detail.newUrn;
        const URL_RENAME_WARNING_POPUP = `The new URN (${newUrn}) is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)`;
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // URN changes are renames until the Activity is marked as 'isLocked'.
        // After 'isLocked', URN changes are copies.

        //  Is it a valid URN?
        const isValid = InputValidator.isValidUrn(newUrn);
        if (isValid) {
            const originalActivity = await StorageService.get(originalUrn, `activity`);  // needed to check if 'isLocked'
            const urnAlreadyBeingUsed = await StorageService.has(newUrn, `activity`);
            if (urnAlreadyBeingUsed) {
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    const newActivity = await StorageService.get(originalUrn, `activity`);

                    if (newActivity.isLocked) {
                        // FAIL  - can not overwrite LOCKED Activity
                    } else { // target Activity is NOT locked
                        // is the original Activity locked?
                        if (originalActivity.isLocked) {
                            await StorageService.clone(originalUrn, newUrn, `activity`);
                        } else { // / the original Activity is not locked
                            await StorageService.replace(originalUrn, newUrn, `activity`);
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- not overwriting existing Activity
                }
            } else {  // urn not already being used
                // is the original Activity locked?
                if (originalActivity.isLocked) {
                    await this.cloneActivity(originalActivity, newUrn);
                } else { // / the original Activity is not locked
                    await StorageService.replace(originalUrn, newUrn, `activity`);
                }
            }
        }
    }


    /**
     *
     *                Support Methods
     *
     *      updateTreeWithActivityChange  - update properties and look for updates/deletes to incorporate
     *      buildCellTreeFromActivityUrn  - build activity tree from root node
     *      buildNodeTreeFromActivity     - build node tree from Activity Model & initial Expanded option.
     *      getChildrenToAdd              - compares activity children to node children to determine adds needed
     *      getChildrenToRemove           - compares activity children to node children to determine deletes needed
     *      searchTreeForId               - return node by id
     *      searchTreeForChildId          - return node by childID
     *      removeAllChildNodes           - generic tree - remove children from parent (1 level deep)
     *      findRoutes                    - find all routes of data passing between siblings.
     *      relocateProject               - update node locations after a move

     *      addDerivedProjectData         - conglomeration of `repopulates`
     *      repopulateParent              - re-parent nodes after structure change
     *      repopulateActivity            - attach Activity Object (@todo maybe better to just use repeated cache/storage access)
     *      repopulateProject             - re-assign projectId after structure change
     *      repopulateDepth               - re-assign depth in tree after structure change
     *      establishChildInterdependency - derive which siblings need which siblings (who produces, who consumes)
     *      repopulateExpectedDuration
     *      resortChildrenSpatially
     *      relocateProject               - change all node locations after move
     */

    updateTreeWithActivityChange(changedActivity, projectNode) {
        const nodeStack = [];
        const orphanedRootStack = [];
        nodeStack.push(projectNode);
        while (nodeStack.length > 0) {
            const currentNode = nodeStack.pop();
            if ((changedActivity.urn === undefined) || (currentNode.urn === changedActivity.urn)) {
                if (changedActivity.urn === undefined) {
                    console.log(`Not bad - this happens when the URN of change is not known.  For example, a rebuild from an archive or fresh pull`);
                }
                const existingNodeChildren = currentNode.children.map((child) => {
                    return {
                        urn: child.urn,
                        id: child.childId
                    };
                });
                const validNodeChildren = changedActivity.children;
                const kidsToAdd = this.getChildrenToAdd(existingNodeChildren, validNodeChildren);
                const kidsToRemove = this.getChildrenToRemove(existingNodeChildren, validNodeChildren);

                kidsToAdd.forEach((child) => {
                    // 1) get newly created activity from map. 2) Create Node
                    const childActivity = this.fetchActivity(child.urn);
                    const childNodeModel = new NodeModel();
                    childNodeModel.urn = childActivity.urn;
                    childNodeModel.activity = childActivity;
                    childNodeModel.childId = child.id;  // Give the child the 'childId' that was listed in the Parent's Jag children.  (separated them from other children of same urn)
                    childNodeModel.parent = currentNode;
                    this.repopulateProject(childNodeModel, projectNode.projectId);
                    currentNode.addChild(childNodeModel);
                });

                kidsToRemove.forEach((child) => {
                    const childNodeModel = this.searchTreeForChildId(projectNode, child.id);    // currentNode.getChildById(child.id)
                    currentNode.removeChild(childNodeModel);
                    orphanedRootStack.push(childNodeModel);
                });
            }
            for (const child of currentNode.children) {
                nodeStack.push(child);
            }
        }
        for (const orphanedRootNode of orphanedRootStack) {
            orphanedRootNode.parent = orphanedRootNode.id;
            orphanedRootNode.childId = null;
            this.repopulateProject(orphanedRootNode, orphanedRootNode.id);
        }
        return projectNode;
    }

    buildCellTreeFromActivityUrn(newRootActivityUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootActivity = this.fetchActivity(newRootActivityUrn);
        const rootCellModel = new CellModel({
            urn: rootActivity.urn,
            jag: rootActivity,
            is_root: true
        });
        rootCellModel.activity = rootActivity;
        rootCellModel.parentUrn = null;
        rootCellModel.rootUrn = newRootActivityUrn;
        nodeStack.push(rootCellModel);
        while (nodeStack.length > 0) {
            const currentNode = nodeStack.pop();
            for (const child of currentNode.activity.children) {
                const childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childCellModel = new CellModel({
                    urn: childActivity.urn,
                    jag: childActivity,
                    is_root: false
                });
                childCellModel.activity = childActivity;
                childCellModel.childId = child.id;
                childCellModel.parentUrn = currentNode.urn;
                childCellModel.rootUrn = newRootActivityUrn;
                currentNode.addChild(childCellModel, true);
                nodeStack.push(childCellModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }

    buildNodeTreeFromActivity(rootActivity, isExpanded) {
        const nodeStack = [];
        const resultStack = [];
        //  const rootActivity = this.fetchActivity(newRootActivityUrn); /// I could have just passed in the Model...instead of switching to urn and back.
        const rootNodeModel = new NodeModel();
        rootNodeModel.urn = rootActivity.urn;
        rootNodeModel.activity = rootActivity;
        rootNodeModel.parentUrn = null;
        rootNodeModel.projectId = rootNodeModel.id;
        rootNodeModel.isExpanded = isExpanded;
        nodeStack.push(rootNodeModel);
        while (nodeStack.length > 0) {
            const currentNode = nodeStack.pop();
            for (const child of currentNode.activity.children) {
                const childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childNodeModel = new NodeModel();

                childNodeModel.urn = child.urn;
                childNodeModel.childId = child.id;
                childNodeModel.activity = childActivity;
                childNodeModel.childId = child.id;
                childNodeModel.parentId = currentNode.id;
                childNodeModel.projectId = currentNode.projectId;
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }

    getChildrenToAdd(existingKids, validKids) {                               // originalActivity, updatedActivity) {
        const returnValue = validKids.filter((validKid) => {
            return !existingKids.find((existingKid) => {
                return JSON.stringify(validKid) === JSON.stringify(existingKid);
            });
        });
        return returnValue;
    }

    getChildrenToRemove(existingKids, validKids) {                               // originalActivity, updatedActivity) {
        const returnValue = existingKids.filter((existingKid) => {
            return !validKids.find((validKid) => {
                return JSON.stringify(existingKid) === JSON.stringify(validKid);
            });
        });
        return returnValue;
    }

    searchTreeForId(node, id) {
        const findIdCallback = (node) => {
            if (node.id === id) {
                return node;
            }
        };
        const foundNodes = Traversal.iterate(node, findIdCallback);
        if ((foundNodes) && (foundNodes.length > 0)) {
            return foundNodes[0];
        }
    }

    searchTreeForChildId(node, childId) {
        const findChildIdCallback = (node) => {
            if (node.childId === childId) {
                return node;
            }
        };
        const foundNodes = Traversal.iterate(node, findChildIdCallback);
        if ((foundNodes) && (foundNodes.length > 0)) {
            return foundNodes[0];
        }
    }

    removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    findRoutes(node, child, routeIndex, routeList) {
        if (node.activity.hasConsumingSiblings(child.activity.urn)) {
            node.activity.bindings.forEach((bind) => {
                if (bind.from.urn === child.activity.urn) {
                    node.children.forEach((childSibling) => {
                        if (childSibling.activity.urn === bind.to.urn) {
                            routeIndex.push(child);
                            this.findRoutes(node, childSibling, routeIndex, routeList);
                            routeIndex.pop(); // the end consumer
                            routeIndex.pop(); // current producerUrn (it gets re-added if another binding found)
                        }
                    });
                }
            });
        } else {
            routeIndex.push(child);
            routeList.push([...routeIndex]);
        }
        return routeList;
    }

    relocateProject(node, deltaX, deltaY) {
        const changeLocationCallback = (node) => {
            node.x = node.x + deltaX;
            node.y = node.y + deltaY;
        };
        Traversal.iterate(node, changeLocationCallback);
    }

    addDerivedProjectData(node, projectId = node.id) {       // only to be applied at the top.
        this.repopulateParent(node);
        this.repopulateActivity(node);
        this.repopulateProject(node, projectId);      // top specific
        this.repopulateDepth(node);                   // requires parent
        this.establishChildInterdependency(node);
        this.repopulateExpectedDuration(node);
        this.resortChildrenSpatially(node);
        node.leafCount = node.leafcounter();          // only affects this node (@todo repopulate leaf count?)
    }

    repopulateParent(node) {
        const assignParentCallback = (node) => {
            node.children.forEach((child) => {
                child.parent = node;
                child.parentId = node.id;
            });
        };
        Traversal.iterate(node, assignParentCallback);
    }

    repopulateActivity(node) {
        const fetchActivitiesCallback = (node) => {
            node.activity = this.fetchActivity(node.urn);
        };
        Traversal.recurseChildrenPreorder(node, fetchActivitiesCallback);
    }

    repopulateProject(node, projectId) {
        const assignProjectCallback = (node) => {
            node.projectId = projectId;
        };
        Traversal.iterate(node, assignProjectCallback);
    }

    repopulateDepth(node) {  // needs accurate parent info.  @TODO rewrite to not require parent info
        const assignDepthCallback = (node) => {
            node.setDepth();
        };
        Traversal.recurseChildrenPreorder(node, assignDepthCallback);
    }

    establishChildInterdependency(node) {
        const childrenUrnList = node.activity.children.map((child) => {
            return child.urn;
        });
        node.activity.bindings.forEach((binding) => {
            if ((childrenUrnList.includes(binding.from.urn)) && (childrenUrnList.includes(binding.to.urn))) {
                node.children.forEach((fromNode) => {
                    node.children.forEach((toNode) => {
                        if ((fromNode.activity.urn === binding.from.urn) && (toNode.activity.urn === binding.to.urn)) {
                            toNode.becomeConsumerOf(fromNode);
                        }
                    });
                });
            }
        });
    }

    repopulateExpectedDuration(node) {
        const assignDurationCallback = (node) => {
            const childDurationsArray = [];
            node.children.forEach((child) => {
                childDurationsArray.push(child.contextualExpectedDuration);
            });
            if (childDurationsArray.length > 0) {
                const totalExpectedDuration = childDurationsArray.reduce((partialSum, a) => {
                    return partialSum + Number(a);
                }, 0);
                node.contextualExpectedDuration = totalExpectedDuration;
            }
        };

        Traversal.recurseChildrenPostorder(node, assignDurationCallback);
    }

    resortChildrenSpatially(node) {
        const sortChildren = (node) => {
            node.children.sort((a, b) => {
                if (a.y < b.y) {
                    return -1;
                }
                if (a.y > b.y) {
                    return 1;
                }
                return 0;
            });
        };
        Traversal.recurseChildrenPostorder(node, sortChildren);
    }

    // repopulateDataDependence(node) {
    //     const routeList = [];
    //     const childRoutes = [];
    //     const allRoutes = [];
    //     node.children.forEach((child) => {
    //         const routeIndex = [];
    //         if (!node.activity.isDependentSibling(child.activity.urn)) {                // if not dependant on a sibling...(its a starting point)
    //             this.findRoutes(node, child, routeIndex, routeList);
    //         }
    //     });
    //     return routeList;
    // }
}
