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
import LiveNode from "../models/live-node.js";
import StorageService from "../services/storage-service.js";
import InputValidator from "../utils/validation.js";
import CellModel from "../models/cell.js";
import Traversal from "../utils/traversal.js";

// noinspection JSUnusedGlobalSymbols
export default class Controller extends EventTarget {

    constructor() {
        super();
        this._activityMap = new Map();       // Activity cache
        this._projectMap = new Map();        // LiveNode cache (For project heads and every descendent)
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
     *      buildLiveNodeTreeFromActivity     - build node tree from Activity Model & initial Expanded option.
     *      getChildrenToAdd              - compares activity children to node children to determine adds needed
     *      getChildrenToRemove           - compares activity children to node children to determine deletes needed
     *      searchTreeForId               - return node by id
     *      searchTreeForChildId          - return node by childID
     *      removeAllChildren           - generic tree - remove children from parent (1 level deep)
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
        const liveNodeStack = [];
        const orphanedChildProjectNodeStack = [];
        liveNodeStack.push(projectNode);
        while (liveNodeStack.length > 0) {
            const currentLiveNode = liveNodeStack.pop();
            if ((changedActivity.urn === undefined) || (currentLiveNode.urn === changedActivity.urn)) {
                if (changedActivity.urn === undefined) {
                    console.log(`Not bad - this happens when the URN of change is not known.  For example, a rebuild from an archive or fresh pull`);
                }
                const changingLiveNodeChildren = currentLiveNode.children.map((child) => {
                    return {
                        urn: child.urn,
                        id: child.childId
                    };
                });
                const changedActivityChildren = changedActivity.children;
                const addedActivityChildren = this.getChildrenToAdd(changingLiveNodeChildren, changedActivityChildren);
                const removedActivityChildren = this.getChildrenToRemove(changingLiveNodeChildren, changedActivityChildren);

                addedActivityChildren.forEach((newActivityChild) => {
                    // 1) get newly created activity from map. 2) Create LiveNode
                    const childActivity = this.fetchActivity(newActivityChild.urn);
                    const childLiveNode = new LiveNode();
                    childLiveNode.urn = childActivity.urn;
                    childLiveNode.activity = childActivity;
                    childLiveNode.childId = newActivityChild.id;  // Give the child the 'childId' that was listed in the Parent's Jag children.  (separated them from other children of same urn)
                    childLiveNode.parent = currentLiveNode;
                    this.repopulateProject(childLiveNode, projectNode.projectId);
                    currentLiveNode.addChild(childLiveNode);
                });

                removedActivityChildren.forEach((removedActivityChild) => {
                    const childLiveNode = this.searchTreeForChildId(projectNode, removedActivityChild.id);    // currentLiveNode.getChildById(child.id)
                    currentLiveNode.removeChild(childLiveNode);
                    orphanedChildProjectNodeStack.push(childLiveNode);
                });
            }
            for (const child of currentLiveNode.children) {
                liveNodeStack.push(child);
            }
        }
        for (const orphanedChildProjectNode of orphanedChildProjectNodeStack) {
            orphanedChildProjectNode.parent = orphanedChildProjectNode.id;
            orphanedChildProjectNode.childId = null;
            this.repopulateProject(orphanedChildProjectNode, orphanedChildProjectNode.id);
        }
        return projectNode;
    }

    buildCellTreeFromActivityUrn(newRootActivityUrn) {
        const cellStack = [];
        const resultingCellStack = [];
        const rootActivity = this.fetchActivity(newRootActivityUrn);
        const rootCellModel = new CellModel({
            urn: rootActivity.urn,
            jag: rootActivity,
            is_root: true
        });
        rootCellModel.activity = rootActivity;
        rootCellModel.parentUrn = null;
        rootCellModel.rootUrn = newRootActivityUrn;
        cellStack.push(rootCellModel);
        while (cellStack.length > 0) {
            const currentCell = cellStack.pop();
            for (const child of currentCell.activity.children) {
                const childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childCellModel = new CellModel({
                    urn: childActivity.urn,
                    jag: childActivity,
                    is_root: false
                });
                childCellModel.activity = childActivity;
                childCellModel.childId = child.id;
                childCellModel.parentUrn = currentCell.urn;
                childCellModel.rootUrn = newRootActivityUrn;
                currentCell.addChild(childCellModel, true);
                cellStack.push(childCellModel);
            }
            resultingCellStack.push(currentCell);
        }
        const returnCell = resultingCellStack.shift();
        return returnCell;
    }

    buildLiveNodeTreeFromActivity(rootActivity, isExpanded) {
        const liveNodeStack = [];
        const resultingLiveNodeStack = [];
        //  const rootActivity = this.fetchActivity(newRootActivityUrn); /// I could have just passed in the Model...instead of switching to urn and back.
        const projectNode = new LiveNode();
        projectNode.urn = rootActivity.urn;
        projectNode.activity = rootActivity;
        projectNode.parentUrn = null;
        projectNode.projectId = projectNode.id;
        projectNode.isExpanded = isExpanded;
        liveNodeStack.push(projectNode);
        while (liveNodeStack.length > 0) {
            const currentLiveNode = liveNodeStack.pop();
            for (const child of currentLiveNode.activity.children) {
                const childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childLiveNode = new LiveNode();

                childLiveNode.urn = child.urn;
                childLiveNode.childId = child.id;
                childLiveNode.activity = childActivity;
                childLiveNode.childId = child.id;
                childLiveNode.parentId = currentLiveNode.id;
                childLiveNode.projectId = currentLiveNode.projectId;
                currentLiveNode.addChild(childLiveNode, true);
                liveNodeStack.push(childLiveNode);
            }
            resultingLiveNodeStack.push(currentLiveNode);
        }
        const finalProjectNode = resultingLiveNodeStack.shift();  // TODO: why this way instead of using original projectNode. 
        return finalProjectNode;
    }

    getChildrenToAdd(changingLiveNodeChildren, changedActivityChildren) {                               // originalActivity, updatedActivity) {
        const newActivityChildren = changedActivityChildren.filter((validKid) => {
            return !changingLiveNodeChildren.find((existingKid) => {
                return JSON.stringify(validKid) === JSON.stringify(existingKid);
            });
        });
        return newActivityChildren;
    }

    getChildrenToRemove(changingLiveNodeChildren, changedActivityChildren) {                               // originalActivity, updatedActivity) {
        const removedActivityChildren = changingLiveNodeChildren.filter((existingKid) => {
            return !changedActivityChildren.find((validKid) => {
                return JSON.stringify(existingKid) === JSON.stringify(validKid);
            });
        });
        return removedActivityChildren;
    }

    searchTreeForId(liveNode, id) {
        const findIdCallback = (liveNode) => {
            if (liveNode.id === id) {
                return liveNode;
            }
        };
        const foundLiveNodes = Traversal.iterate(liveNode, findIdCallback);
        if ((foundLiveNodes) && (foundLiveNodes.length > 0)) {
            return foundLiveNodes[0];
        }
    }

    searchTreeForChildId(liveNode, childId) {
        const findChildIdCallback = (liveNode) => {
            if (liveNode.childId === childId) {
                return liveNode;
            }
        };
        const foundLiveNodes = Traversal.iterate(liveNode, findChildIdCallback);
        if ((foundLiveNodes) && (foundLiveNodes.length > 0)) {
            return foundLiveNodes[0];
        }
    }

    // Abstract (@TODO or only DOM nodes?)
    removeAllChildren(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    findRoutes(liveNode, child, routeIndex, routeList) {
        if (liveNode.activity.hasConsumingSiblings(child.activity.urn)) {
            liveNode.activity.bindings.forEach((bind) => {
                if (bind.from.urn === child.activity.urn) {
                    liveNode.children.forEach((childSibling) => {
                        if (childSibling.activity.urn === bind.to.urn) {
                            routeIndex.push(child);
                            this.findRoutes(liveNode, childSibling, routeIndex, routeList);
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

    relocateProject(liveNode, deltaX, deltaY) {
        const changeLocationCallback = (liveNode) => {
            liveNode.x = liveNode.x + deltaX;
            liveNode.y = liveNode.y + deltaY;
        };
        Traversal.iterate(liveNode, changeLocationCallback);
    }

    addDerivedProjectData(liveNode, projectId = liveNode.id) {       // only to be applied at the top.
        this.repopulateParent(liveNode);
        this.repopulateActivity(liveNode);
        this.repopulateProject(liveNode, projectId);      // top specific
        this.repopulateDepth(liveNode);                   // requires parent
        this.establishChildInterdependency(liveNode);
        this.repopulateExpectedDuration(liveNode);
        this.resortChildrenSpatially(liveNode);
        liveNode.leafCount = liveNode.leafcounter();          // only affects this liveNode (@todo repopulate leaf count?)
    }

    repopulateParent(liveNode) {
        const assignParentCallback = (liveNode) => {
            liveNode.children.forEach((child) => {
                child.parent = liveNode;
                child.parentId = liveNode.id;
            });
        };
        Traversal.iterate(liveNode, assignParentCallback);
    }

    repopulateActivity(liveNode) {
        const fetchActivitiesCallback = (liveNode) => {
            liveNode.activity = this.fetchActivity(liveNode.urn);
        };
        Traversal.recurseChildrenPreorder(liveNode, fetchActivitiesCallback);
    }

    repopulateProject(liveNode, projectId) {
        const assignProjectCallback = (liveNode) => {
            liveNode.projectId = projectId;
        };
        Traversal.iterate(liveNode, assignProjectCallback);
    }

    repopulateDepth(liveNode) {  // needs accurate parent info.  @TODO rewrite to not require parent info
        const assignDepthCallback = (liveNode) => {
            liveNode.setDepth();
        };
        Traversal.recurseChildrenPreorder(liveNode, assignDepthCallback);
    }

    establishChildInterdependency(liveNode) {
        const childrenUrnList = liveNode.activity.children.map((child) => {
            return child.urn;
        });
        liveNode.activity.bindings.forEach((binding) => {
            if ((childrenUrnList.includes(binding.from.urn)) && (childrenUrnList.includes(binding.to.urn))) {
                liveNode.children.forEach((fromLiveNode) => {
                    liveNode.children.forEach((toLiveNode) => {
                        if ((fromLiveNode.activity.urn === binding.from.urn) && (toLiveNode.activity.urn === binding.to.urn)) {
                            toLiveNode.becomeConsumerOf(fromLiveNode);
                        }
                    });
                });
            }
        });
    }

    repopulateExpectedDuration(liveNode) {
        const assignDurationCallback = (liveNode) => {
            const childDurationsArray = [];
            liveNode.children.forEach((child) => {
                childDurationsArray.push(child.contextualExpectedDuration);
            });
            if (childDurationsArray.length > 0) {
                const totalExpectedDuration = childDurationsArray.reduce((partialSum, a) => {
                    return partialSum + Number(a);
                }, 0);
                liveNode.contextualExpectedDuration = totalExpectedDuration;
            }
        };

        Traversal.recurseChildrenPostorder(liveNode, assignDurationCallback);
    }

    resortChildrenSpatially(liveNode) {
        const sortChildren = (liveNode) => {
            liveNode.children.sort((a, b) => {
                if (a.y < b.y) {
                    return -1;
                }
                if (a.y > b.y) {
                    return 1;
                }
                return 0;
            });
        };
        Traversal.recurseChildrenPostorder(liveNode, sortChildren);
    }

    // repopulateDataDependence(liveNode) {
    //     const routeList = [];
    //     const childRoutes = [];
    //     const allRoutes = [];
    //     liveNode.children.forEach((child) => {
    //         const routeIndex = [];
    //         if (!liveNode.activity.isDependentSibling(child.activity.urn)) {                // if not dependant on a sibling...(its a starting point)
    //             this.findRoutes(liveNode, child, routeIndex, routeList);
    //         }
    //     });
    //     return routeList;
    // }
}
