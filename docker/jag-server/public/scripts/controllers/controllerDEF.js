/**
 *
 * The basic structure is here - as an idea gen.
 * However, there is no cross-tab communication going.
 * The fetchProject does not have the cache data the original tab has.
 * The subscribes are not doing anything,
 *
 * @ TODO - almost everything needed here.
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

    constructor(startProjectId = null, startLiveNodeId = null) {
        super();
        this._currentProjectId = startProjectId;
        this._currentLiveNodeId = startLiveNodeId;
        this._menu = null;
        this._definition = null;

        StorageService.subscribe(`command-livenode-updated`, this.commandLiveNodeUpdatedHandler.bind(this)); // Noone dispatches this.
        StorageService.subscribe(`command-livenode-deleted`, this.commandLiveNodeDeletedHandler.bind(this)); // }
    }//@TODO -- do livenodes update across the command path? Or just Event path.
     // It looks like maybe they should..
    // commandLiveNodeUpdatedHandler is trying to read in parameters.

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

        const allProjects = await StorageService.all(`livenode`);
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
        console.log("_currentProjectId")
        console.log(this._currentProjectId)
        const project = this.fetchProject(this._currentProjectId);
        console.log("initializeProject")
        console.log(project)
        const liveNode = this.searchTreeForId(project, this._currentLiveNodeId);
        this._definition.definingLiveNode = liveNode;
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
     * commandLiveNodeUpdatedHandler
     * commandLiveNodeDeletedHandler
     *
     */

    commandLiveNodeUpdatedHandler(updatedProject, updatedProjectId) {
        console.log(`((COMMAND INCOMING) >>  liveNode Updated`);
        if (this._currentProjectId === updatedProjectId) {
            this.addDerivedProjectData(updatedProject);
            console.log("in commandLiveNodeUpdatedHandler")
            console.log(updatedProject)
            const liveNode = this.searchTreeForId(updatedProject, this._currentLiveNodeId);
            this._definition.reset(liveNode);
        }
    }

    commandLiveNodeDeletedHandler(deletedLiveNodeId) {
        console.log(`((COMMAND INCOMING) >>  liveNode Deleted`);
        this.uncacheProject(deletedLiveNodeId);
    }

    /**
     *                                  Support Functions
     *
     * searchProjectForLiveNodeId
     *
     */
    //
    // searchTreeForId(rootLiveNode, liveNodeId) {
    //     console.log("searchTreeForId sees rootLiveNode as...")
    //     console.log(rootLiveNode)
    //     const liveNodeStack = [];
    //     liveNodeStack.push(rootLiveNode);
    //     while (liveNodeStack.length > 0) {
    //         const checkLiveNode = liveNodeStack.pop();
    //         if (checkLiveNode.id === liveNodeId) {
    //             return checkLiveNode;
    //         }
    //         checkLiveNode.children.forEach((checkLiveNodeChild) => {
    //             return liveNodeStack.push(checkLiveNodeChild);
    //         });
    //     }
    //     return null;
    // }

    // marked for death
    // searchTreeForChildId(rootLiveNode,liveNodeId) {
    //     let liveNodeStack = []
    //     liveNodeStack.push(rootLiveNode)
    //     while(liveNodeStack.length>0){
    //         let checkLiveNode = liveNodeStack.pop();
    //         if (checkLiveNode.id === liveNodeId) {return checkLiveNode}
    //         checkLiveNode.children.forEach(child => liveNodeStack.push(child))
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
