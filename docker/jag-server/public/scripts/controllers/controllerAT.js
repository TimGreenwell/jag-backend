/**
 *
 * JAG - Authoring Tool
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import LiveNode from "../models/live-node.js";
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
        StorageService.subscribe(`command-livenode-created`, this.commandLiveNodeCreatedHandler.bind(this));           // }
        StorageService.subscribe(`command-livenode-updated`, this.commandLiveNodeUpdatedHandler.bind(this));           // Noone dispatches this
        StorageService.subscribe(`command-livenode-deleted`, this.commandLiveNodeDeletedHandler.bind(this));           // }
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

        const allLiveNodes = await StorageService.all(`livenode`);
        allLiveNodes.forEach((liveNode) => {
            this.addDerivedProjectData(liveNode);
            this.cacheProject(liveNode);
        });

        // Event function (event parameter unused)
        window.onblur = function () {
            console.log(`[info] onblur() activated`);  //
        };
    }

    initializePanels() {
        this._activityLibrary.addListItems([...this._activityMap.values()]);
        const projectNodeOnly = [...this.projectMap.values()].filter((liveNode) => {
            return liveNode.isRoot();
        });
        this._projectLibrary.addListItems(projectNodeOnly);
    }

    initializeHandlers() {
        this._playground.addEventListener(`event-promote-project`, this.eventPromoteProjectHandler.bind(this));             // button to promote liveNode  to projectNode
        this._playground.addEventListener(`event-activity-created`, this.eventActivityCreatedHandler.bind(this));           // 'Create Activity' Popup initiated by Menu
        this._playground.addEventListener(`event-activity-updated`, this.eventActivityUpdatedHandler.bind(this));           // Any structural change to liveNodes affects Activities
        this._playground.addEventListener(`event-livenode-updated`, this.eventLiveNodeUpdatedHandler.bind(this));           // LiveNode isExpanded property changed
        this._playground.addEventListener(`event-livenodes-selected`, this.eventLiveNodesSelectedHandler.bind(this));       // mouse clicks on liveNodes
        this._playground.addEventListener(`event-livenode-repositioned`, this.eventLiveNodeRepositionedHandler.bind(this)); // mouse movement event
        this._playground.addEventListener(`event-projects-connected`, this.eventProjectsConnectedHandler.bind(this));       // onEdgeFinalized between liveNodes (user connects)
        this._playground.addEventListener(`event-playground-clicked`, this.eventPlaygroundClickedHandler.bind(this));       // user deselects by clicking background
        this._playground.addEventListener(`event-import-jag`, this.eventImportJagHandler.bind(this));                       // popup to import JAG JSON

        this._properties.addEventListener(`event-activity-updated`, this.eventActivityUpdatedHandler.bind(this));           // Activity property updates
        this._properties.addEventListener(`event-livenode-updated`, this.eventLiveNodeUpdatedHandler.bind(this));           // LiveNode property updates (contextual)
        this._properties.addEventListener(`event-export-jag`, this.eventExportJagHandler.bind(this));                       // button to export JAG and Activities to file as JSON
        this._properties.addEventListener(`event-export-svg`, this.eventExportSvgHandler.bind(this));                       // button to export JAG as svg
        this._properties.addEventListener(`event-urn-changed`, this.eventUrnChangedHandler.bind(this));                     // URN changed - rename or clone actions
        this._properties.addEventListener(`event-endpoints-selected`, this.eventEndpointsSelected.bind(this));              // URN changed - rename or clone actions

        this._menu.addEventListener(`event-add-activity`, this.eventAddActivityHandler.bind(this));                         // menu item: call 'Create Activity' popup
        this._menu.addEventListener(`event-clear-playground`, this.eventClearPlaygroundHandler.bind(this));                 // menu item: clear liveNodes from playground
        this._menu.addEventListener(`event-define-livenode`, this.eventDefineLiveNodeHandler.bind(this));                   // menu item: open Define LiveNode tab(s)
        this._menu.addEventListener(`event-redraw-svg`, this.eventRedrawSvgHandler.bind(this));                             // menu item: auto-place liveNodes
        this._menu.addEventListener(`event-popup-importer`, this.eventPopupImporterHandler.bind(this));                     // menu item: call 'Import Jag' popup
        // this._menu.addEventListener(`event-toggle-timeview`...   (handled upstairs at jag-at.js)                         // menu item: open timeview panel
        this._menu.addEventListener(`event-toggle-colorize`, this.eventToggleColorHandler.bind(this));

        this._activityLibrary.addEventListener(`event-activity-selected`, this.eventActivitySelectedHandler.bind(this));    // Clicking Activity instantiates LiveNode in playground
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
     * eventLiveNodeUpdatedHandler            (a) - LiveNode isExpanded/location property changed
     * eventLiveNodesSelectedHandler              - user selects LiveNode in graph
     * eventLiveNodeRepositionedHandler           - user repositioned LiveNode
     * eventProjectsConnectedHandler        (a)  - user connects two Project Nodes with an edge
     * eventPlaygroundClickedHandler     (a)  - user selects liveNode
     * eventImportJagHandler             (a)  - popup import JAG JSON
     * eventPromoteProjectHandler        (a)  - button to promote liveNode to ProjectNode
     *
     *    -- properties --
     * eventUrnChangedHandler            (C)  - URN field is changed
     * eventActivityUpdatedHandler       (C)  - user updates an Activity related field
     * eventLiveNodeUpdatedHandler   (Playground) - user updates a LiveNode related field
     * eventExportJagHandler                  - button to export JAG and Activities to file

     * eventUrnChangedHandler         (a)(C)  - URN field is changed
     *
     *       -- menu --
     * eventAddActivityHandler                - menu item: call 'Create Activity' popup
     * eventClearPlaygroundHandler            - menu item: clear liveNodes from playground
     * eventDefineNodeHandler                 - menu item: open Define LiveNode tab(s)
     * eventRedrawSvgHandler                - menu item: auto-place nodes @todo still not pretty
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

    async eventLiveNodeUpdatedHandler(event) {
        let projectNode;
        const updatedLiveNode = event.detail.liveNode;
        if (updatedLiveNode.parentId) {  // Not same as root... this handles the project node of tree that has just been claimed by another project.  (parent comes next step)
            projectNode = this.fetchProject(updatedLiveNode.projectId);
            projectNode.replaceChild(updatedLiveNode);
        } else {
            projectNode = updatedLiveNode;
        }
        await StorageService.update(projectNode, `livenode`);
    }

    eventLiveNodesSelectedHandler(event) {
        const selectedLiveNodesArray = event.detail.selectedLiveNodesArray;
        this._properties.handleSelectionUpdate(selectedLiveNodesArray);
        // this._timeview.refreshTimeview(selectedNodeArray[0]);    // Selecting a node also updates it. Need to look into that
        // ide.handleSelectionUpdate(e.detail);
    }

    eventLiveNodeRepositionedHandler(event) {
        event.stopPropagation();
        const liveNode = event.detail.liveNode;
        liveNode.x = event.detail.x;
        liveNode.y = event.detail.y;
    }

    async eventProjectsConnectedHandler(event) {            // only needed id's
        const projectNodeId = event.detail.projectNodeId;
        const parentLiveNodeId = event.detail.parentLiveNodeId;
        const childLiveNodeId = event.detail.childLiveNodeId;


        const projectModel = this.fetchProject(projectNodeId);
        const parentLiveNode = this.searchTreeForId(projectModel, parentLiveNodeId);
        parentLiveNode.isExpanded = true;
        const childLiveNode = this.fetchProject(childLiveNodeId);

        if (this.loopDetection(projectModel, parentLiveNode, childLiveNode)) {
            alert(`That node join results in an infinite loop problem - please consider an alternative design`);
            this._playground._refreshPlayground(projectModel);
        } else {
            if (this._timeview) {
                this._timeview.refreshTimeview();
            }
            const childId = parentLiveNode.activity.addChild(childLiveNode.urn);
            parentLiveNode.addChild(childLiveNode);  // do not think this does anything here... or?
            childLiveNode.childId = childId;  // this could also be done later. ok here

            if (parentLiveNode.activity.connector.execution === `livenode.execution.none`) {
                parentLiveNode.activity.connector.execution = `livenode.execution.sequential`;
            }

            this.repopulateProject(parentLiveNode, projectNodeId);

            this.cacheProject(childLiveNode);
            this.cacheProject(parentLiveNode);

            event.detail.activity = parentLiveNode.activity;
            await this.eventActivityUpdatedHandler(event);

            event.detail.liveNodeId = childLiveNode.id;
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
            const jagDescription = LiveNode.fromJSON(jag);  // @TODO  is right? LiveNode.fromJSON --- and not Activity.fromJSOON
            const liveNode = new LiveNode(jagDescription);
            this.addDerivedProjectData(liveNode);
            this.cacheProject(liveNode);
            jagPromises.push(StorageService.create(liveNode, `livenode`));
        }
        await Promise.all(jagPromises);
    }

    /**   -- Properties --  */

    // eventUrnChangedHandler --- hosted by common controller.
    // eventActivityUpdatedHandler --- hosted by common controller.
    // eventLiveNodeUpdatedHandler --- common with 'playground' handler

    eventEndpointsSelected(event) {
        const selectedFromEndpoints = event.detail.fromEndpoints;
        const selectedToEndpoints = event.detail.toEndpoints;
        this._playground.showEndpoint(selectedFromEndpoints, selectedToEndpoints);
    }

    eventExportJagHandler(event) {
        const liveNode = event.detail.liveNode;
        const descendantUrns = this.gatherDescendentUrns(liveNode);
        const neededActivities = descendantUrns.map((urn) => {
            const activityModel = this.fetchActivity(urn);
            const activityJson = JSON.stringify(activityModel.toJSON(), null, 4);
            return activityJson;
        });
        const jagJson = JSON.stringify(liveNode.toJSON(), null, 4);
        const fileData = `{"activities" : [${neededActivities}], "jags" : [${jagJson}]}`;

        const a = document.createElement(`a`);
        const data = `data:application/json,${encodeURI(fileData)}`;
        a.href = data;
        a.download = `${liveNode.activity.name}.json`;
        a.click();
    }

    eventExportSvgHandler(event) {
        const liveNode = event.detail.liveNode;
        this._playground.printSvg(`${liveNode.name}-jag.svg`);
        this._timeview.printSvg(`${liveNode.name}-layout.svg`);
    }

    async eventPromoteProjectHandler(event) {
        const newProjectNode = event.detail.liveNode;
        newProjectNode.childId = null;
        newProjectNode.parentId = null;
        this.addDerivedProjectData(newProjectNode);
        // this.cacheProject(newProject);        // updating and caching project just before a 'create' -useful?
        await StorageService.create(newProjectNode, `livenode`);
        this._playground._refreshPlayground(newProjectNode);
    }

    /**   -- Menu --  */

    eventAddActivityHandler() {
        this._playground._handleNewActivityPopup();         // @todo consider moving popupable to menu as well  ( double agree) iaMenu as well
    }

    eventClearPlaygroundHandler() {
        this._playground.clearPlayground();
    }

    eventDefineLiveNodeHandler() {
        //  let origin = window.location.origin
        function openInNewTab(href) {
            Object.assign(document.createElement(`a`), {
                target: `_blank`,
                rel: `noopener noreferrer`,
                href
            }).click();
        }

        const selectedLiveNodes = this._playground.selectedLiveNodes;

        selectedLiveNodes.forEach((selectedLiveNode) => {
            const projectId = selectedLiveNode.projectId;
            const liveNodeId = selectedLiveNode.id;
            openInNewTab(`./node.html?project=${projectId}&livenode=${liveNodeId}`);
        });
    }

    eventRedrawSvgHandler() {
        this._playground.layoutLiveNodes();
    }

    eventPopupImporterHandler() {
        // This just calls the popup to get the data.  That result calls:eventImportJagHandler
        this._playground._eventImportJagHandler();
    }

    // eventToggleTimeviewHandler() {
    //     const selectedLiveNodes = this._playground.selectedLiveNodes;
    //     this._timeview.refreshTimeview(selectedLiveNodes[0]);
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
        const newProjectNode = this.buildLiveNodeTreeFromActivity(activitySelected, isExpanded);
        this.addDerivedProjectData(newProjectNode);
        this.cacheProject(newProjectNode);

        await StorageService.create(newProjectNode, `livenode`);
        // this._playground._buildNodeViewFromLiveNode(newProjectNode)
        this._playground._refreshPlayground(newProjectNode);
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
        console.log(`Local>> (project deleted) `);
        const removedLiveNodeId = event.detail.liveNodeId;
        await StorageService.delete(removedLiveNodeId, `livenode`);
    }

    async eventProjectLockedHandler(event) {
        console.log(`Local>> (project locked) `);
        const lockedLiveNode = event.detail.liveNode;
        lockedLiveNode.isLocked = !lockedLiveNode.isLocked;
        await StorageService.update(lockedLiveNode, `livenode`);
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
     * commandLiveNodeCreatedHandler
     * commandLiveNodeUpdatedHandler
     * commandLiveNodeDeletedHandler
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
                deletePromises.push(StorageService.delete(viewedProject, `livenode`));
            }
        }
        await Promise.all(deletePromises);
        this._playground.unselectEverything();  // for error when selected liveNode is deleted
        this._activityLibrary.removeLibraryListItem(deletedActivityUrn);
    }

    commandActivityClonedHandler(clonedActivity, clonedActivityUrn) {
        UserPrefs.setDefaultUrnPrefixFromUrn(clonedActivityUrn);
        this._playground._addActivityNodeTree(clonedActivity, clonedActivityUrn);   // This is in BUCKET
    }

    commandActivityReplacedHandler(newActivity, replacedActivityUrn) {
        this._playground.replaceActivityNode(newActivity, replacedActivityUrn);  // This is in BUCKET
        this._activityLibrary.replaceItem(newActivity, replacedActivityUrn);                   // Replace Activity list item in activityLibrary
    }

    commandLiveNodeCreatedHandler(createdLiveNode, createdLiveNodeId) {
        this.addDerivedProjectData(createdLiveNode);
        this.cacheProject(createdLiveNode);
        this._projectLibrary.addListItem(createdLiveNode);       // Add Activity list item to Library
    }

    async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
        this.cacheActivity(updatedActivity);
        const updatePromises = [];

        for (const viewedProject of this._playground.viewedProjects) {
            const cachedViewedProject = this.fetchProject(viewedProject.id);

            if (cachedViewedProject.isActivityInProject(updatedActivityUrn)) {
                const updatedProject = this.updateTreeWithActivityChange(updatedActivity, cachedViewedProject);
                updatePromises.push(StorageService.update(updatedProject, `livenode`));
            }
        }
        await Promise.all(updatePromises);
        this._properties.handleExternalActivityUpdate(updatedActivity, updatedActivityUrn);   // change property window values if that one is changed in IA
        this._activityLibrary.updateItem(updatedActivity);
    }

    commandLiveNodeUpdatedHandler(updatedLiveNode, updatedLiveNodeId) {
        this.addDerivedProjectData(updatedLiveNode);
        this.cacheProject(updatedLiveNode);
        console.log(`((COMMAND IN) >>  liveNode Updated: ${updatedLiveNode.activity.name} / ${updatedLiveNodeId}`);
        this._playground._refreshPlayground(updatedLiveNode);  // <- causing issues
        this._projectLibrary.updateItem(updatedLiveNode);
        this._timeview.refreshTimeview(updatedLiveNode);
    }

    commandLiveNodeDeletedHandler(deletedLiveNodeId) {
        this.uncacheProject(deletedLiveNodeId);
        this._playground.deleteLiveNode(deletedLiveNodeId);
        this._projectLibrary.removeProjectLibraryListItem(deletedLiveNodeId);
    }

    /**
     *                                  Support Functions
     *
     * buildLiveNodeTreeFromActivity   (c)   Build liveNode tree given root activity
     * gatherDescendentUrns              Build set of all child urns
     * gatherAncestorUrns                Build set of direct ancestor urns
     * loopDetection                     -> No URN exists as both descendant and ancestor (feedback detection)
     *
     */
    // buildLiveNodeTreeFromActivity --- hosted by common controller.

    gatherDescendentUrns(childLiveNode, workStack = []) {
        workStack.push(childLiveNode.urn);
        childLiveNode.children.forEach((child) => {
            this.gatherDescendentUrns(child, workStack);
        });
        return workStack;
    }

    gatherAncestorUrns(projectModelId, parentModelId) {
        const urnStack = [];
        let nextParentId = parentModelId;
        const projectNode = this.fetchProject(projectModelId);
        do {
            const foundChildLiveNode = projectNode.findChildById(nextParentId);
            urnStack.push(foundChildLiveNode.urn);
            nextParentId = foundChildLiveNode.parentId;
        } while (nextParentId);
        return urnStack;
    }

    loopDetection(projectModel, parentLiveNode, childLiveNode) {
        const descendentStack = this.gatherDescendentUrns(childLiveNode);
        const ancestorStack = this.gatherAncestorUrns(projectModel.id, parentLiveNode.id);
        const intersection = descendentStack.filter((x) => {
            return ancestorStack.includes(x);
        });
        return (intersection.length > 0);
    }

}
