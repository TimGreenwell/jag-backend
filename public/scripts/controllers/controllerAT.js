/**
 *
 * JAG - Authoring Tool
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import NodeModel from "../models/node.js";
import StorageService from "../services/storage-service.js";
import UserPrefs from "../utils/user-prefs.js";
import Controller from "./controller.js";
import Activity from "../models/activity.js";


//  DuplicatedCode,JSUnusedGlobalSymbols,JSUnresolvedFunction,JSUnresolvedVariable

// noinspection JSUnresolvedFunction,JSUnusedLocalSymbols
export default class ControllerAT extends Controller {

    constructor() {
        super();
        this._menu = null;
        this._activityLibrary = null;
        this._projectLibrary = null;
        this._playground = null;
        this._timeview = null;
        this._properties = null;

        StorageService.subscribe(`command-activity-created`, this.commandActivityCreatedHandler.bind(this));   //    }
        StorageService.subscribe(`command-activity-updated`, this.commandActivityUpdatedHandler.bind(this));   // (a)}
        StorageService.subscribe(`command-activity-deleted`, this.commandActivityDeletedHandler.bind(this));   // (a)} All from observable
        StorageService.subscribe(`command-activity-cloned`, this.commandActivityClonedHandler.bind(this));     //    } Cross-tab communications
        StorageService.subscribe(`command-activity-replaced`, this.commandActivityReplacedHandler.bind(this)); //    }
        StorageService.subscribe(`command-node-created`, this.commandNodeCreatedHandler.bind(this));           // }
        StorageService.subscribe(`command-node-updated`, this.commandNodeUpdatedHandler.bind(this));           // }
        StorageService.subscribe(`command-node-deleted`, this.commandNodeDeletedHandler.bind(this));           // }
    }

    set menu(value) {
        this._menu = value;
    }

    set activityLibrary(value) {
        this._activityLibrary = value;
    }

    set projectLibrary(value) {
        this._projectLibrary = value;
    }

    set playground(value) {
        this._playground = value;
    }

    set timeview(value) {
        this._timeview = value;
    }

    set properties(value) {
        this._properties = value;
    }

    async initialize() {
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {
        const allActivities = await StorageService.all(`activity`);
        allActivities.forEach((activity) => {
            this.cacheActivity(activity);
        });

        const allNodes = await StorageService.all(`node`);
        allNodes.forEach((node) => {
            this.addDerivedProjectData(node);
            this.cacheProject(node);
        });

        // Event function (event parameter unused)
        window.onblur = function () {
            console.log(`[info] onblur() activated`);  //
        };
    }

    initializePanels() {
        this._activityLibrary.addListItems([...this._activityMap.values()]);
        const rootOnly = [...this.projectMap.values()].filter((node) => {
            return node.isRoot();
        });
        this._projectLibrary.addListItems(rootOnly);
    }

    initializeHandlers() {
        this._playground.addEventListener(`event-promote-project`, this.eventPromoteProjectHandler.bind(this));             // button to promote node to Jag (root)
        this._playground.addEventListener(`event-activity-created`, this.eventActivityCreatedHandler.bind(this));           // 'Create Activity' Popup initiated by Menu
        this._playground.addEventListener(`event-activity-updated`, this.eventActivityUpdatedHandler.bind(this));           // Any structural change to nodes affects Activities
        this._playground.addEventListener(`event-node-updated`, this.eventNodeUpdatedHandler.bind(this));                   // Node isExpanded property changed
        this._playground.addEventListener(`event-nodes-selected`, this.eventNodesSelectedHandler.bind(this));               // mouse clicks on nodes
        this._playground.addEventListener(`event-node-repositioned`, this.eventNodeRepositionedHandler.bind(this));         // mouse movement event
        this._playground.addEventListener(`event-nodes-connected`, this.eventNodesConnectedHandler.bind(this));             // onEdgeFinalized between nodes (user connects)
        this._playground.addEventListener(`event-playground-clicked`, this.eventPlaygroundClickedHandler.bind(this));       // user deselects by clicking background
        this._playground.addEventListener(`event-import-jag`, this.eventImportJagHandler.bind(this));                       // popup to import JAG JSON

        this._properties.addEventListener(`event-activity-updated`, this.eventActivityUpdatedHandler.bind(this));           // Activity property updates
        this._properties.addEventListener(`event-node-updated`, this.eventNodeUpdatedHandler.bind(this));                   // Node property updates (contextual)
        this._properties.addEventListener(`event-export-jag`, this.eventExportJagHandler.bind(this));                       // button to export JAG and Activities to file as JSON
        this._properties.addEventListener(`event-export-svg`, this.eventExportSvgHandler.bind(this));                       // button to export JAG as svg
        this._properties.addEventListener(`event-urn-changed`, this.eventUrnChangedHandler.bind(this));                     // URN changed - rename or clone actions
        this._properties.addEventListener(`event-endpoints-selected`, this.eventEndpointsSelected.bind(this));              // URN changed - rename or clone actions

        this._menu.addEventListener(`event-add-activity`, this.eventAddActivityHandler.bind(this));                         // menu item: call 'Create Activity' popup
        this._menu.addEventListener(`event-clear-playground`, this.eventClearPlaygroundHandler.bind(this));                 // menu item: clear nodes from playground
        this._menu.addEventListener(`event-define-node`, this.eventDefineNodeHandler.bind(this));                           // menu item: open Define Node tab(s) using selected node(s)
        this._menu.addEventListener(`event-redraw-nodes`, this.eventLayoutNodesHandler.bind(this));                         // menu item: auto-place nodes @todo still not pretty
        this._menu.addEventListener(`event-popup-importer`, this.eventPopupImporterHandler.bind(this));                     // menu item: call 'Import Jag' popup
        // this._menu.addEventListener(`event-toggle-timeview`...   (handled upstairs at jag-at.js)                         // menu item: open timeview panel
        this._menu.addEventListener(`event-toggle-colorize`, this.eventToggleColorHandler.bind(this));

        this._activityLibrary.addEventListener(`event-activity-selected`, this.eventActivitySelectedHandler.bind(this));    // Clicking Activity instantiates Node in playground
        this._activityLibrary.addEventListener(`event-activity-deleted`, this.eventActivityDeletedHandler.bind(this));      // Permanently delete Activity
        this._activityLibrary.addEventListener(`event-activity-locked`, this.eventActivityLockedHandler.bind(this));        // 'Lock' Activity (restrict deletes and renames)

        this._projectLibrary.addEventListener(`event-project-selected`, this.eventProjectSelectedHandler.bind(this));       // Project chosen for playground
        this._projectLibrary.addEventListener(`event-project-deleted`, this.eventProjectDeletedHandler.bind(this));         // Permanently delete a project
        this._projectLibrary.addEventListener(`event-project-locked`, this.eventProjectLockedHandler.bind(this));           // 'Lock' Project (restrict deletes and updates)
    }

    /**
     *                                   Upward Event Handlers
     * 'Upward handlers' for "locally generated events" that result in the submission of data changes
     * for storage and distribution.
     *
     *  "locally generated events" = some user interaction or detected remote change that requires another
     *  local action.  Data processing in this phase is minimal. Primarily concerned with translating the initial
     *  event into an event dispatch that is understood across the application.
     *
     *  example: a user changes an Activity name, this will produce a standardized command to 'update Activity' for
     *  storage.  Once the Activity is stored, a notification is sent to all Panels requiring that information to
     *  update themselves.
     *
     * (C) indicates common methods between controllers (share code) -- see controller.js
     * (a) async - usually do to storage requirements.
     *
     *    -- playground --
     * eventActivityCreatedHandler    (a) (C) - popup create Activity (original event in menu starts playground popup)
     * eventActivityUpdatedHandler    (a) (C) - structure change
     * eventNodeUpdatedHandler            (a) - Node isExpanded/location property changed
     * eventNodesSelectedHandler              - user selects Node in graph
     * eventNodeRepositionedHandler           - user repositioned Node
     * eventNodesConnectedHandler        (a)  - user connects two Nodes with an edge
     * eventPlaygroundClickedHandler     (a)  - user selects node
     * eventImportJagHandler             (a)  - popup import JAG JSON
     * eventPromoteProjectHandler        (a)  - button to promote node to Jag (root)
     *
     *    -- properties --
     * eventUrnChangedHandler            (C)  - URN field is changed
     * eventActivityUpdatedHandler       (C)  - user updates an Activity related field
     * eventNodeUpdatedHandler   (Playground) - user updates a Node related field
     * eventExportJagHandler                  - button to export JAG and Activities to file

     * eventUrnChangedHandler         (a)(C)  - URN field is changed
     *
     *       -- menu --
     * eventAddActivityHandler                - menu item: call 'Create Activity' popup
     * eventClearPlaygroundHandler            - menu item: clear nodes from playground
     * eventDefineNodeHandler                 - menu item: open Define Node tab(s) using selected node(s)
     * eventRedrawNodesHandler                - menu item: auto-place nodes @todo still not pretty
     * eventPopupImporterHandler              - menu item: call 'Import Jag' popup
     *
     *  -- activity library --
     * eventActivitySelectedHandler       (a) - user selects Activity for playground (creates Graph)
     * eventActivityDeletedHandler        (a) - user permanently deletes Activity
     * eventActivityLockedHandler         (a) - user locks Activity against delete/updates
     *
     *   -- project library --
     * eventProjectSelectedHandler        (a) - user selects Graph for playground (recovers Graph)
     * eventProjectDeletedHandler         (a) - user permanently deletes Graph
     * eventProjectLockedHandler          (a) - user locks Graph against delete/updates
     *
     */

    /**   -- Playground --  */

    // eventActivityCreatedHandler --- hosted by common controller.

    // eventActivityUpdatedHandler --- hosted by common controller.

    async eventNodeUpdatedHandler(event) {
        let projectNode;
        const updatedNodeModel = event.detail.nodeModel;
        if (updatedNodeModel.parentId) {  // Not same as root... this handles the root node of tree that has just been claimed by another project.  (parent comes next step)
            projectNode = this.fetchProject(updatedNodeModel.projectId);
            projectNode.replaceChild(updatedNodeModel);
        } else {
            projectNode = updatedNodeModel;
        }
        await StorageService.update(projectNode, `node`);
    }

    eventNodesSelectedHandler(event) {
        const selectedNodeArray = event.detail.selectedNodeArray;
        this._properties.handleSelectionUpdate(selectedNodeArray);
        // this._timeview.refreshTimeview(selectedNodeArray[0]);    // Selecting a node also updates it. Need to look into that
        // ide.handleSelectionUpdate(e.detail);
    }

    eventNodeRepositionedHandler(event) {
        event.stopPropagation();
        const nodeModel = event.detail.nodeModel;
        nodeModel.x = event.detail.x;
        nodeModel.y = event.detail.y;
    }

    async eventNodesConnectedHandler(event) {            // only needed id's
        const projectNodeId = event.detail.projectNodeId;
        const parentNodeId = event.detail.parentNodeId;
        const childNodeId = event.detail.childNodeId;


        const projectModel = this.fetchProject(projectNodeId);
        const parentNodeModel = this.searchTreeForId(projectModel, parentNodeId);
        parentNodeModel.isExpanded = true;
        const childNodeModel = this.fetchProject(childNodeId);

        if (this.loopDetection(projectModel, parentNodeModel, childNodeModel)) {
            alert(`That node join results in an infinite loop problem - please consider an alternative design`);
            this._playground._refreshPlayground(projectModel);
        } else {
            if (this._timeview) {
                this._timeview.refreshTimeview();
            }
            const childId = parentNodeModel.activity.addChild(childNodeModel.urn);
            parentNodeModel.addChild(childNodeModel);  // do not think this does anything here... or?
            childNodeModel.childId = childId;  // this could also be done later. ok here

            if (parentNodeModel.activity.connector.execution === `node.execution.none`) {
                parentNodeModel.activity.connector.execution = `node.execution.sequential`;
            }

            this.repopulateProject(parentNodeModel, projectNodeId);

            this.cacheProject(childNodeModel);
            this.cacheProject(parentNodeModel);

            event.detail.activity = parentNodeModel.activity;
            await this.eventActivityUpdatedHandler(event);

            event.detail.nodeModelId = childNodeModel.id;
            await this.eventProjectDeletedHandler(event);
        }
    }

    eventPlaygroundClickedHandler() {
        this._properties.handleSelectionUnselected();
    }

    /**
     * @typedef {Object} jsonDescriptor
     * @property {activities: String} jsonDescriptor
     */
    async eventImportJagHandler(event) {
        const json = event.detail.result;
        const jsonDescriptor = JSON.parse(json);
        const activities = jsonDescriptor[`activities`];   // was .activities (and worked)
        const jags = jsonDescriptor.jags;

        const activityPromises = [];
        for (const activity of activities) {
            const activityModel = Activity.fromJSON(activity);
            const fullActivityModel = new Activity(activityModel);
            this.cacheActivity(fullActivityModel);
            activityPromises.push(StorageService.create(fullActivityModel, `activity`));
        }
        await Promise.all(activityPromises);

        const jagPromises = [];
        for (const jag of jags) {
            const jagModel = NodeModel.fromJSON(jag);
            const fullJagModel = new NodeModel(jagModel);
            this.addDerivedProjectData(fullJagModel);
            this.cacheProject(fullJagModel);
            jagPromises.push(StorageService.create(fullJagModel, `node`));
        }
        await Promise.all(jagPromises);
    }

    /**   -- Properties --  */

    // eventUrnChangedHandler --- hosted by common controller.
    // eventActivityUpdatedHandler --- hosted by common controller.
    // eventNodeUpdatedHandler --- common with 'playground' handler

    eventEndpointsSelected(event) {
        const selectedFromEndpoints = event.detail.fromEndpoints;
        const selectedToEndpoints = event.detail.toEndpoints;
        this._playground.showEndpoint(selectedFromEndpoints, selectedToEndpoints);
    }

    eventExportJagHandler(event) {
        const node = event.detail.node;
        const descendantUrns = this.gatherDescendentUrns(node);
        const neededActivities = descendantUrns.map((urn) => {
            const activityModel = this.fetchActivity(urn);
            const activityJson = JSON.stringify(activityModel.toJSON(), null, 4);
            return activityJson;
        });
        const jagJson = JSON.stringify(node.toJSON(), null, 4);
        const fileData = `{"activities" : [${neededActivities}], "jags" : [${jagJson}]}`;

        const a = document.createElement(`a`);
        const data = `data:application/json,${encodeURI(fileData)}`;
        a.href = data;
        a.download = `${node.activity.name}.json`;
        a.click();
    }

    eventExportSvgHandler(event) {
        const node = event.detail.node;
        this._playground.printSvg(`${node.name}-jag.svg`);
        this._timeview.printSvg(`${node.name}-layout.svg`);
    }

    async eventPromoteProjectHandler(event) {
        const newProject = event.detail.node;
        newProject.childId = null;
        newProject.parentId = null;
        this.addDerivedProjectData(newProject);
        // this.cacheProject(newProject);        // updating and caching project just before a 'create' -useful?
        await StorageService.create(newProject, `node`);
        this._playground._refreshPlayground(newProject);
    }

    /**   -- Menu --  */

    eventAddActivityHandler() {
        this._playground._handleNewActivityPopup();         // @todo consider moving popupable to menu as well  ( double agree) iaMenu as well
    }

    eventClearPlaygroundHandler() {
        this._playground.clearPlayground();
    }

    eventDefineNodeHandler() {
        //  let origin = window.location.origin
        function openInNewTab(href) {
            Object.assign(document.createElement(`a`), {
                target: `_blank`,
                rel: `noopener noreferrer`,
                href
            }).click();
        }

        const selectedNodes = this._playground.selectedNodes;

        selectedNodes.forEach((selectedNode) => {
            const projectId = selectedNode.projectId;
            const nodeId = selectedNode.id;
            openInNewTab(`./node.html?project=${projectId}&node=${nodeId}`);
        });
    }

    eventLayoutNodesHandler() {
        this._playground.layoutNodes();
    }

    eventPopupImporterHandler() {
        // This just calls the popup to get the data.  That result calls:eventImportJagHandler
        this._playground._eventImportJagHandler();
    }

    // eventToggleTimeviewHandler() {
    //     const selectedNodes = this._playground.selectedNodes;
    //     this._timeview.refreshTimeview(selectedNodes[0]);
    // }

    eventToggleColorHandler() {
        this._playground.toggleColor();
    }

    /**   -- Activity Library --  */

    async eventActivityDeletedHandler(event) {
        // Scan every activity to see if it contains a child which matches the deleted activity.
        // If match found, remove that child from the parent and signal update on the parent.

        const deadActivityUrn = event.detail.activityUrn;
        const updatePromises = [];
        for (const activity of this._activityMap.values()) {
            const remainingChildren = activity.children.filter((kid) => {
                return kid.urn !== deadActivityUrn;
            });
            if (remainingChildren.length < activity.children.length) {
                activity.children = remainingChildren;
                updatePromises.push(StorageService.update(activity, `activity`));
            }
        }
        await Promise.all(updatePromises);
        await StorageService.delete(deadActivityUrn, `activity`);
    }

    async eventActivityLockedHandler(event) {
        console.log(`Local>> (jag locked) `);
        const lockedActivity = event.detail.activity;
        lockedActivity.isLocked = !lockedActivity.isLocked;
        await StorageService.update(lockedActivity, `activity`);
    }


    async eventActivitySelectedHandler(event) {
        console.log(`Local>> (Activity selected / Activity list item selected) `);
        const activitySelected = event.detail.activity;
        const isExpanded = event.detail.isExpanded;
        const newProjectRootNode = this.buildNodeTreeFromActivity(activitySelected, isExpanded);
        this.addDerivedProjectData(newProjectRootNode);
        this.cacheProject(newProjectRootNode);

        await StorageService.create(newProjectRootNode, `node`);
        // this._playground._buildNodeViewFromNodeModel(newProjectRootNode)
        this._playground._refreshPlayground(newProjectRootNode);
    }

    /**   -- Project Library --  */

    eventProjectSelectedHandler(event) {
        console.log(`Local>> (project line item selected) `);
        const projectSelected = event.detail.projectModel;
        const expandRequested = event.detail.isExpanded;
        projectSelected.isExpanded = expandRequested;
        this.addDerivedProjectData(projectSelected);
        this.cacheProject(projectSelected);
        this._playground._refreshPlayground(projectSelected);
    }

    async eventProjectDeletedHandler(event) {
        console.log(`Local>> (node deleted) `);
        const deadNodeModelId = event.detail.nodeModelId;
        await StorageService.delete(deadNodeModelId, `node`);
    }

    async eventProjectLockedHandler(event) {
        console.log(`Local>> (node locked) `);
        const lockedNodeModel = event.detail.nodeModel;
        lockedNodeModel.isLocked = !lockedNodeModel.isLocked;
        await StorageService.update(lockedNodeModel, `node`);
    }

    /**
     *                                   Downward Command Handlers
     * 'Command handlers' refer to the process that starts when our Subscribers are notified and continues until
     * the appropriate changes are made to the views.  Its entirely possible (and common) that the events were
     * initiated locally but that is transparent to the logic.  The origin of commands is irrelevant to the logic.
     *
     * commandActivityCreatedHandler
     * commandActivityUpdatedHandler
     * commandActivityDeletedHandler
     * commandActivityClonedHandler
     * commandActivityReplacedHandler
     * commandNodeCreatedHandler
     * commandNodeUpdatedHandler
     * commandNodeDeletedHandler
     *
     */

    commandActivityCreatedHandler(createdActivity, createdActivityUrn) {
        this.cacheActivity(createdActivity);
        UserPrefs.setDefaultUrnPrefixFromUrn(createdActivityUrn);
        this._activityLibrary.addListItem(createdActivity);
        this.cacheActivity(createdActivity);
    }

    async commandActivityDeletedHandler(deletedActivityUrn) {
        console.log(`((COMMAND IN)) >> Activity Deleted`);
        // const deletedActivity = this.fetchActivity(deletedActivityUrn);
        this.uncacheActivity(deletedActivityUrn);
        const deletePromises = [];
        for (const viewedProject of this._playground.viewedProjects) {
            if (viewedProject.id === deletedActivityUrn) {
                deletePromises.push(StorageService.delete(viewedProject, `node`));
            }
        }
        await Promise.all(deletePromises);
        this._playground.unselectEverything();  // for error when selected node is deleted
        this._activityLibrary.removeLibraryListItem(deletedActivityUrn);
    }

    commandActivityClonedHandler(clonedActivity, clonedActivityUrn) {
        UserPrefs.setDefaultUrnPrefixFromUrn(clonedActivityUrn);
        this._playground._addActivityNodeTree(clonedActivity, clonedActivityUrn);
    }

    commandActivityReplacedHandler(newActivity, replacedActivityUrn) {
        this._playground.replaceActivityNode(newActivity, replacedActivityUrn);
        this._activityLibrary.replaceItem(newActivity, replacedActivityUrn);                   // Replace Activity list item in activityLibrary
    }

    commandNodeCreatedHandler(createdNodeModel, createdNodeId) {
        this.addDerivedProjectData(createdNodeModel);
        this.cacheProject(createdNodeModel);
        this._projectLibrary.addListItem(createdNodeModel);       // Add Activity list item to Library
    }

    async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
        this.cacheActivity(updatedActivity);
        const updatePromises = [];

        for (const viewedProject of this._playground.viewedProjects) {
            const cachedViewedProject = this.fetchProject(viewedProject.id);

            if (cachedViewedProject.isActivityInProject(updatedActivityUrn)) {
                const updatedProject = this.updateTreeWithActivityChange(updatedActivity, cachedViewedProject);
                updatePromises.push(StorageService.update(updatedProject, `node`));
            }
        }
        await Promise.all(updatePromises);
        this._properties.handleExternalActivityUpdate(updatedActivity, updatedActivityUrn);   // change property window values if that one is changed in IA
        this._activityLibrary.updateItem(updatedActivity);
    }

    commandNodeUpdatedHandler(updatedNodeModel, updatedNodeId) {
        this.addDerivedProjectData(updatedNodeModel);
        this.cacheProject(updatedNodeModel);
        console.log(`((COMMAND IN) >>  Node Updated: ${updatedNodeModel.activity.name} / ${updatedNodeId}`);
        this._playground._refreshPlayground(updatedNodeModel);  // <- causing issues
        this._projectLibrary.updateItem(updatedNodeModel);
        this._timeview.refreshTimeview(updatedNodeModel);
    }

    commandNodeDeletedHandler(deletedNodeId) {
        this.uncacheProject(deletedNodeId);
        this._playground.deleteNodeModel(deletedNodeId);
        this._projectLibrary.removeNodeLibraryListItem(deletedNodeId);
    }

    /**
     *                                  Support Functions
     *
     * buildNodeTreeFromActivity   (c)   Build node tree given root activity
     * gatherDescendentUrns              Build set of all child urns
     * gatherAncestorUrns                Build set of direct ancestor urns
     * loopDetection                     -> No URN exists as both descendant and ancestor (feedback detection)
     *
     */
    // buildNodeTreeFromActivity --- hosted by common controller.

    gatherDescendentUrns(childNodeModel, workStack = []) {   // need this in nodes
        workStack.push(childNodeModel.urn);
        childNodeModel.children.forEach((child) => {
            this.gatherDescendentUrns(child, workStack);
        });
        return workStack;
    }

    gatherAncestorUrns(projectModelId, parentModelId) {
        const urnStack = [];
        let nextParentId = parentModelId;
        const projectNode = this.fetchProject(projectModelId);
        do {
            const checkNode = projectNode.findChildById(nextParentId);
            urnStack.push(checkNode.urn);
            nextParentId = checkNode.parentId;
        } while (nextParentId);
        return urnStack;
    }

    loopDetection(projectModel, parentNodeModel, childNodeModel) {
        const descendentStack = this.gatherDescendentUrns(childNodeModel);
        const ancestorStack = this.gatherAncestorUrns(projectModel.id, parentNodeModel.id);
        const intersection = descendentStack.filter((x) => {
            return ancestorStack.includes(x);
        });
        return (intersection.length > 0);
    }

}
