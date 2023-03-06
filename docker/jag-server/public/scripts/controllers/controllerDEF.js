/**
 *
 * JAG - Authoring Tool
 *
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import StorageService from "../services/storage-service.js";
import Controller from "./controller.js";

// noinspection DuplicatedCode,JSUnusedGlobalSymbols,JSUnresolvedFunction,JSUnresolvedVariable
export default class ControllerDEF extends Controller {

    constructor(startProjectId = null, startNodeId = null) {
        super();
        this._currentProjectId = startProjectId;
        this._currentNodeId = startNodeId;
        this._menu = null;
        this._definition = null;

        StorageService.subscribe(`command-node-updated`, this.commandNodeUpdatedHandler.bind(this)); // }
        StorageService.subscribe(`command-node-deleted`, this.commandNodeDeletedHandler.bind(this)); // }
    }

    // Panel Setters
    set menu(value) {
        this._menu = value;
    }

    set definition(value) {
        this._definition = value;
    }

    async initialize() {
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {         // @TODO --- it might not be worth caching this -- might should just hit DB..
        const allActivities = await StorageService.all(`activity`);
        allActivities.forEach((activity) => {
            this.cacheActivity(activity);
        });

        const allProjects = await StorageService.all(`node`);
        allProjects.forEach((project) => {
            if (this._currentProjectId === project.id) {
                this.addDerivedProjectData(project);
            }
        });

        // Event function (event parameter unused)
        window.onblur = function () {
            console.log(`window.onblur`);
        };
    }

    initializePanels() {
        const project = this.fetchProject(this._currentProjectId);
        const node = this.searchTreeForId(project, this._currentNodeId);
        this._definition.definingNode = node;
        this._definition.buildTestBank();
    }

    initializeHandlers() {
        // this._menu.addEventListener(`event-execution-updated`, this.eventExecutionUpdatedHandler.bind(this));
        // this._menu.addEventListener(`event-returns-updated`, this.eventReturnsUpdatedHandler.bind(this));
        this._menu.addEventListener(`event-operator-updated`, this.eventOperatorUpdatedHandler.bind(this));
    }

    /**
     *                                   Upward Event Handlers
     * 'Upward handlers' refer to the process that starts at the initial event and ends at the submission of
     * the resulting data for storage and distribution.
     *
     *  'initial event' = some user interaction or detected remote change that requires initiates another local action
     *  Data processing in this phase is minimal - it is primarily concerned with translating the initial
     *  event into a standard command that is understood across the application.
     *
     *  example: a user changing an Activity name will produce a standardized command to 'update Activity' to be
     *  stored and distributed.
     *
     * (C) indicates common methods between controllers (share code)
     *    -- dashboard --
     *
     *       -- menu --
     * eventExecutionUpdatedHandler                - user selects Execution from dropdown
     * eventReturnsUpdatedHandler                  - user selects Returns from dropdown
     * eventOperatorUpdatedHandler                 - user selects Operator from dropdown
     *
     */

    /**   -- Dashboard --  */

    /**   -- Menu --  */

    eventOperatorUpdatedHandler(event) {
        const returns = event.detail.returns;
        const operator = event.detail.operator;
        this._definition._templateFunction(returns, operator);
    }

    /**
     *                                   Downward Command Handlers
     * 'Command handlers' refer to the process that starts when our Subscribers are notified and continues until
     * the appropriate changes are made to the views.  Its entirely possible (and common) that the events were
     * initiated locally but that is transparent to the logic.  The origin of commands is irrelevant to the logic.
     *
     * commandNodeUpdatedHandler
     * commandNodeDeletedHandler
     *
     */

    commandNodeUpdatedHandler(updatedProject, updatedProjectId) {
        console.log(`((COMMAND INCOMING) >>  Node Updated`);
        if (this._currentProjectId === updatedProjectId) {
            this.addDerivedProjectData(updatedProject);
            const node = this.searchTreeForId(updatedProject, this._currentNodeId);
            this._definition.reset(node);
        }
    }

    commandNodeDeletedHandler(deletedNodeId) {
        console.log(`((COMMAND INCOMING) >>  Node Deleted`);
        this.uncacheProject(deletedNodeId);
    }

    /**
     *                                  Support Functions
     *
     * searchTreeForId
     *
     */

    searchTreeForId(treeNode, id) {
        const workStack = [];
        workStack.push(treeNode);
        while (workStack.length > 0) {
            const checkNode = workStack.pop();
            if (checkNode.id === id) {
                return checkNode;
            }
            checkNode.children.forEach((child) => {
                return workStack.push(child);
            });
        }
        return null;
    }

    // marked for death
    // searchTreeForChildId(treeNode,childId) {
    //     let workStack = []
    //     workStack.push(treeNode)
    //     while(workStack.length>0){
    //         let checkNode = workStack.pop();
    //         if (checkNode.childId === childId) {return checkNode}
    //         checkNode.children.forEach(child => workStack.push(child))
    //     }
    //     return null
    // }


    // marked for death
    // async localJagDisconnectedHandler(event){              //localActivityNodeCleared?
    //     let changingActivity = event.detail.activityUrn
    //     let leavingJagChild = event.detail.activityChild
    //
    //     let projectRoot = this.fetchProject(leavingNodeModel.projectId)
    //     this.repopulateParent(projectRoot)
    //     let losingParents = leavingNodeModel.parent;
    //     let losingParentsJag = this.fetchActivity(losingParents.urn)
    //     let remainingChildren = losingParentsJag.children.filter(entry => {
    //         if (entry.id !== leavingNodeModel.childId) {
    //             return entry;
    //         }
    //     })
    //     losingParentsJag.children = remainingChildren
    //     await StorageService.update(losingParentsJag, 'activity');
    // }

}
