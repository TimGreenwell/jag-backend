/**
 * @fileOverview Jag ControllerIA.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';


import StorageService from "../services/storage-service.js";
import CellModel from "../models/cell.js";
import Activity from "../models/activity.js";
import AnalysisModel from "../models/analysis-model.js";
import TeamModel from "../models/team.js";
import AgentModel from "../models/agent.js";
import UserPrefs from "../utils/user-prefs.js";
import Controller from "./controller.js";
import InputValidator from "../utils/validation.js";

// noinspection DuplicatedCode,JSUnusedGlobalSymbols,JSUnresolvedFunction,JSUnresolvedVariable
export default class ControllerIA extends Controller {

    constructor() {
        super();
        this._analysisLibrary = null;           // HTMLElement
        this._agentLibrary = null;
        this._iaProperties = null;                    // HTML Element
        this._iaMenu = null;
        this._iaTable = null;                   // HTMLElement extending Popupable

        //     this._activityMap = new Map();          // All JAGs - should be in sync with storage
        //     this._analysisMap = new Map();     // All analyses - should be in sync with storage
        this._agentMap = new Map();     // All analyses - should be in sync with storage
        this._teamMap = new Map();     // All analyses - should be in sync with storage
        this._currentAnalysis = undefined;      // type: AnalysisModel

        StorageService.subscribe(`command-activity-created`, this.commandActivityCreatedHandler.bind(this));
        StorageService.subscribe(`command-activity-updated`, this.commandActivityUpdatedHandler.bind(this));   // just blocking for now - troubleshooting
        StorageService.subscribe(`command-activity-deleted`, this.commandActivityDeletedHandler.bind(this));
        // StorageService.subscribe("command-activity-cloned", this.commandActivityClonedHandler.bind(this));
        // StorageService.subscribe("command-activity-replaced", this.commandActivityReplacedHandler.bind(this));

        StorageService.subscribe(`command-agent-created`, this.commandAgentCreatedHandler.bind(this));
        StorageService.subscribe(`command-agent-updated`, this.commandAgentUpdatedHandler.bind(this));
        StorageService.subscribe(`command-agent-deleted`, this.commandAgentDeletedHandler.bind(this));
        StorageService.subscribe(`command-team-created`, this.commandTeamCreatedHandler.bind(this));
        StorageService.subscribe(`command-analysis-created`, this.commandAnalysisCreatedHandler.bind(this));
    }

    get agentMap() {
        return this._agentMap;
    }

    set agentMap(newAgentMap) {
        this._agentMap = newAgentMap;
    }

    uncacheAgent(agentId) {
        this._agentMap.delete(agentId);
    }

    cacheAgent(agent) {
        this._agentMap.set(agent.id, agent);
    }

    fetchAgent(agentId) {
        return this._agentMap.get(agentId);
    }

    get teamMap() {
        return this._teamMap;
    }

    set teamMap(newTeamMap) {
        this._teamMap = newTeamMap;
    }

    uncacheTeam(teamId) {
        this._teamMap.delete(teamId);
    }

    cacheTeam(team) {
        this._teamMap.set(team.id, team);
    }

    fetchTeam(teamId) {
        return this._teamMap.get(teamId);
    }


    // Panel Setters
    set analysisLibrary(value) {
        this._analysisLibrary = value;
    }

    set iaProperties(value) {
        this._iaProperties = value;
    }

    set iaTable(value) {
        this._iaTable = value;
    }

    set iaMenu(value) {
        this._iaMenu = value;
    }

    set agentLibrary(value) {
        this._agentLibrary = value;
    }

    async initialize() {
        //    UserPrefs.setDefaultUrnPrefix("us:tim:")
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {
        const allActivities = await StorageService.all(`activity`);
        allActivities.forEach((activity) => {
            return this.cacheActivity(activity);
        });

        // @TODO need this?  -shouldnt - IA is Jag-based
        const allNodes = await StorageService.all(`node`);
        allNodes.forEach((node) => {
            if (node.id === node.projectId) {
                this.addDerivedProjectData(node);
            }});

        const allAgents = await StorageService.all(`agent`);
        allAgents.forEach((agent) => {
            return this.cacheAgent(agent);
        });

        const allTeams = await StorageService.all(`team`);
        allTeams.forEach((team) => {
            team.agentIds.forEach((agent) => {
                team.agents.push(this.fetchAgent(agent));
            });
            this.cacheTeam(team);
        });


        const allAnalyses = await StorageService.all(`analysis`);
        allAnalyses.forEach((analysis) => {
            return this.cacheAnalysis(analysis);
        });
    }

    initializePanels() {
        this._analysisLibrary.addListItems([...this._analysisMap.values()]);
        this._agentLibrary.addListItems([...this._agentMap.values()]);
    }

    initializeHandlers() {
        this._iaTable.addEventListener(`event-agent-created`, this.eventAgentCreatedHandler.bind(this));  // popup create
        this._iaTable.addEventListener(`event-analysis-created`, this.eventAnalysisCreatedHandler.bind(this));  // popup create
        this._iaTable.addEventListener(`event-analysis-updated`, this.eventAnalysisUpdatedHandler.bind(this));  // jag structure updates
        // this._iaTable.addEventListener('event-analysis-deleted', this.eventAnalysisDeletedHandler.bind(this));  // jag structure updates
        this._iaTable.addEventListener(`event-cell-addchild`, this.eventNodeAddChildHandler.bind(this));  // '+' clicked on jag cell (technically undefined jag)         // does that really need to come up this far?
        this._iaTable.addEventListener(`event-cell-prunechild`, this.eventNodePruneChildHandler.bind(this));
        this._iaTable.addEventListener(`event-collapse-toggled`, this.eventCollapseToggledHandler.bind(this));
        this._iaTable.addEventListener(`event-urn-changed`, this.eventUrnChangedHandler.bind(this));
        this._iaTable.addEventListener(`event-activity-created`, this.eventActivityCreatedHandler.bind(this));
        this._iaTable.addEventListener(`event-activity-updated`, this.eventActivityUpdatedHandler.bind(this));
        // this._iaTable.addEventListener('event-activity-deleted', this.eventJagDeletedHandler.bind(this));
        this._analysisLibrary.addEventListener(`event-analysis-selected`, this.eventAnalysisSelected.bind(this));
        // this.nodeModel.addEventListener('sync', this._syncViewToModel.bind(this));

        this._iaMenu.addEventListener(`event-create-assessment`, this.eventCreateAssessment.bind(this));
        this._iaMenu.addEventListener(`event-create-agent`, this.eventCreateAgent.bind(this));
        // this.eventCreateAssessment);
        this._iaMenu.addEventListener(`event-import-assessment`, this.eventImportAssessment.bind(this));     // bring up?
        this._iaMenu.addEventListener(`event-export-assessment`, this.eventExportAssessment.bind(this));   // bring up??
        // $export_analysis.addEventListener('click', this._handleExportAnalysisPopup.bind(this));
        // $import_analysis.addEventListener('click', this._handleImportAnalysis.bind(this));
        // $analysis_file.addEventListener('change', this._handleUploadAnalysis.bind(this));

        this._agentLibrary.addEventListener(`event-agent-selected`, this.eventAgentSelectedHandler.bind(this));       // Project chosen for playground
        this._agentLibrary.addEventListener(`event-agent-locked`, this.eventAgentLockedHandler.bind(this));
        this._agentLibrary.addEventListener(`event-agent-deleted`, this.eventAgentDeletedHandler.bind(this));

        this._iaProperties.addEventListener(`event-agent-removed`, this.eventAgentRemovedHandler.bind(this));
    }


    eventAgentRemovedHandler(event) {
        console.log(`Local>> (agent removed from team) `);
        const agentId = event.detail.removedAgent;
        const agent = this.fetchAgent(agentId);
        this._currentAnalysis.team.removeAgent(agent);
        this._iaTable.displayAnalysis(this._currentAnalysis);
        this._iaProperties._updateProperties();
    }

    eventAgentSelectedHandler(event) {
        console.log(`Local>> (project line item selected) `);
        const agentSelected = event.detail.agent;
        this._currentAnalysis.team.addAgent(agentSelected);
        this._iaTable.displayAnalysis(this._currentAnalysis);
        this._iaProperties._updateProperties();
    }

    commandAgentUpdatedHandler(updatedAgent, updatedAgentUrn) {
        this.cacheAgent(updatedAgent);
        this._agentLibrary.updateItem(updatedAgent);
    }

    async commandAgentDeletedHandler(deletedAgentUrn) {
        // @TODO If the Agent is the last member of a team - do we delete the team?  Voting yes.
        console.log(`((COMMAND INCOMING)) >> Agent Deleted`);
        const deletedAgent = this.fetchAgent(deletedAgentUrn);
        // Remove Agent from teams
        const promises = [];
        for (const [teamId, team] of this._teamMap) {
            if (team.agentIds.contains(deletedAgentUrn)) {
                team.agentIds.removeChild(deletedAgentUrn);
                if (team.agentIds > 0) {
                    promises.push(StorageService.update(team, `team`));
                } else {
                    promises.push(StorageService.delete(team.id, `team`));
                }
            }
        }
        await Promise.all(promises);
        this.uncacheAgent(deletedAgentUrn);
        this._agentLibrary.removeLibraryListItem(deletedAgentUrn);
    }

    async eventAgentDeletedHandler(event) {
        console.log(`Local>> (agent deleted) `);
        const deadAgentUrn = event.detail.agentUrn;
        await StorageService.delete(deadAgentUrn, `agent`);
    }

    async eventAgentLockedHandler(event) {
        console.log(`Local>> (agent locked) `);
        const lockedAgent = event.detail.agent;
        lockedAgent.isLocked = !lockedAgent.isLocked;
        await StorageService.update(lockedAgent, `agent`);
    }

    eventCreateAssessment() {
        this._iaTable._handleNewAnalysisPopup();                // @todo consider moving popupable to menu as well  ( double agree) iaMenu as well
    }

    eventCreateAgent() {
        this._iaTable._handleNewAgentPopup();                // @todo consider moving popupable to menu as well  ( double agree) iaMenu as well
    }

    eventImportAssessment() {
        this._iaTable._handleImportAnalysis();
    }

    eventExportAssessment() {
        this._iaTable._handleExportAnalysisPopup();
    }


    // ////////////////////////////////////////////////////////////////////////////////
    // ////////  controllerIA - UPWARD Control  ///////////////////////////////////////
    // ////////////////////////////////////////////////////////////////////////////////
    /**
     *
     *                                     Upward Event Handlers
     *      'Upward handlers' refer to the process that starts at the initial event and ends at the submission of
     *      the resulting data for storage and distribution.
     *
     *      'initial event' = some user interaction or detected remote change that requires initiates another local action
     *      Data processing in this phase is minimal - it is primarily concerned with translating the initial
     *      event into a standard command that is understood across the application.
     *
     *      example: a user changing an Agent name will produce a standardized command to 'update Agent' to be
     *      stored and distributed.
     *
     * eventAnalysisCreatedHandler - requires createStandardAnalysis, displayAnalysis
     * eventAnalysisUpdatedHandler
     * eventAnalysisDeletedHandler  *
     * eventNodeAddChildHandler
     * eventNodePruneChildHandler  - this is a disconnect (not a delete) of a chilid activity from its parent
     * eventCollapseToggledHandler
     * eventUrnChangedHandler      (C)
     * eventActivityCreatedHandler (C)
     * eventActivityUpdatedHandler (C)
     * eventJagDeletedHandler       *
     * eventAnalysisSelected
     *
     */


    async eventAgentCreatedHandler(event) {
        console.log(`Local>> (local agent created) `);
        const agentConstruct = event.detail.agentConstruct;
        if (this.agentMap.has(agentConstruct.urn)) {
            window.alert(`That URN already exists`);
        } else {
            const newAgent = new AgentModel(event.detail.agentConstruct);
            newAgent.dateCreated = Date.now();
            if (InputValidator.isValidUrn(newAgent.urn)) {
                await StorageService.create(newAgent, `agent`);
            } else {
                window.alert(`Invalid URN`);
            }
        }
    }

    async eventAnalysisCreatedHandler(event) {
        const standardAnalysis = await this.createStandardAnalysis(event.detail.name, event.detail.rootUrn, `Popup`);
        this._iaProperties.team = standardAnalysis.team;
    }

    async eventAnalysisUpdatedHandler(event) {
        await StorageService.update(event.detail.analysis, `analysis`);
    }

    eventNodeAddChildHandler(event) {      // if not working - check why this->._currentAnalysis is not being updated (just passed)
        // This will not be permanent until a valid URN is set.  Not-persistent.
        // @TODO push this back down into iaTable (from there - to there)
        const parentCell = event.detail.cell;
        this._currentAnalysis = this._iaTable._analysisModel;
        if (parentCell.canHaveChildren) {
            const childActivity = new Activity({
                urn: UserPrefs.getDefaultUrnPrefix(),
                name: ``
            });
            // Normally, we would pass this new Jag up for storage and distribution - however it is only temporary since it does
            // not yet have a valid URN or name.
            const childCell = new CellModel({urn: childActivity.urn});
            childCell.activity = childActivity;
            childCell.parentUrn = parentCell.urn;
            childCell.rootUrn = parentCell.rootUrn;
            parentCell.addChild(childCell);
            this._iaTable.displayAnalysis(this._currentAnalysis);
        } else {
            alert(`Node must first be assigned a valid URN`);
        }
    }

    async eventNodePruneChildHandler(event) {
        // A Prune (or any delete) is a potentially significant change.
        // Going to just update parent.  Actually prune node?
        // After a quick check we are not pruning the head.

        const parentActivityUrn = event.detail.cell.parent.urn;
        const childActivityUrn = event.detail.cell.urn;
        const parentActivity = this._activityMap.get(parentActivityUrn);
        const childActivity = this._activityMap.get(childActivityUrn);
        const parentActivityChildren = parentActivity.children;
        let index = 0;
        let found = false;
        while ((index < parentActivityChildren.length) && (!found)) {
            if (parentActivityChildren[index].urn === childActivity.urn) {
                parentActivityChildren.splice(index, 1);
                found = true;
            } else {
                index = index + 1;
            }
        }
        parentActivity.children = parentActivityChildren;
        await StorageService.update(parentActivity, `activity`);
    }

    eventCollapseToggledHandler(event) {
        const cell = event.detail.cell;
        cell.toggleCollapse();             //  -- think this is going to be moved to an Analysis array if we want it saved.
        // just initialize tree would be nice - but think it needs to start from scratch.
        // earlier version of this just call a 'layout'event - whats that?
        this._iaTable.analysisView.layout();
    }

    async eventAnalysisSelected(event) {
        this._currentAnalysis = event.detail.model;
        this._currentAnalysis.rootCellModel = await this.buildCellTreeFromActivityUrn(this._currentAnalysis.rootUrn);
        await this.displayAnalysis(this._currentAnalysis);
        this._iaProperties.team = event.detail.model.team;
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
     * commandActivityClonedHandler   *
     * commandActivityReplacedHandler  *
     * commandAnalysisCreatedHandler
     *
     */

    async commandActivityCreatedHandler(createdActivity, createdActivityUrn) {
        this.cacheActivity(createdActivity);
        UserPrefs.setDefaultUrnPrefixFromUrn(createdActivityUrn);
        // thought below is to surgically add it to the node tree - if its in the currentAnalysis
        // until then, just drawing the whole thing.
        if (this._currentAnalysis) {
            // @TODO CHECK IF THIS URN IS RELEVANT TO THE ANALYSIS
            this._currentAnalysis.rootCellModel = await this.buildCellTreeFromActivityUrn(this._currentAnalysis.rootUrn);
            await this.displayAnalysis(this._currentAnalysis);
        }
    }

    async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
        // Be nicer to separate structure change (needing redraw) and property change (probably not needing redraw)
        // However - can't think of a way to infer what change was made without more effort than a redraw.
        this.cacheActivity(updatedActivity);
        this._currentAnalysis.rootCellModel = await this.buildCellTreeFromActivityUrn(this._currentAnalysis.rootUrn);
        await this.displayAnalysis(this._currentAnalysis);
    }

    commandActivityDeletedHandler(deletedActivityUrn) {
        if (this._iaTable.analysisModel) {
            console.log(`Check if deleted jag is in the analysis`);
            console.log(`if so - check if it is the head`);
            console.log(`   if so - delete the analysis`);
            console.log(`    if not --- prune that section and redraw`);
        }
    }

    commandAgentCreatedHandler(createdAgentModel, createdAgentId) {
        this.cacheAgent(createdAgentModel);
        this._agentLibrary.addListItem(createdAgentModel);
    }

    commandTeamCreatedHandler(createdTeamModel, createdTeamId) {
        // pad agents array from agentIds
        const agents = [];
        for (const agentId of createdTeamModel.agentIds) {
            agents.push(this.fetchAgent(agentId));
        }
        createdTeamModel.agents = agents;
        this.cacheTeam(createdTeamModel);
        if ((this._currentAnalysis) && this._currentAnalysis.analysisModel.team.id === createdTeamId) {
            this._currentAnalysis.analysisModel.team = createdTeamModel;
        }
    }


    async commandAnalysisCreatedHandler(createdAnalysisModel, createdAnalysisId) {
        createdAnalysisModel.team = this.fetchTeam(createdAnalysisModel.teamId);
        createdAnalysisModel.jag = this.fetchActivity(createdAnalysisModel.urn);
        this.cacheAnalysis(createdAnalysisModel);
        // if (this._iaTable.analysisModel) {
        this._currentAnalysis = createdAnalysisModel;
        const newRootCellModel = await this.buildCellTreeFromActivityUrn(createdAnalysisModel.rootUrn);
        createdAnalysisModel.rootCellModel = newRootCellModel;
        this._iaTable.displayAnalysis(createdAnalysisModel);
        //  }
        this._analysisLibrary.addListItem(createdAnalysisModel);
        this._iaProperties.team = createdAnalysisModel.team;
    }


    /**
     *                                        Support Functions
     *
     * createStandardAnalysis -  Builds generic Analysis with Team and 2 Agents during creation
     *                           required by 1) eventAnalysisCreatedHandler
     * displayAnalysis -         redraws the analysis table
     *                           required by 1) eventAnalysisCreatedHandler
     *
     * buildCellTreeFromActivityUrn   Build node tree given root URN
     *                           required by: eventAnalysisSelected
     *                           @TODO same nodes as Project nodes? similar / non-permanent
     *
     */


    // replaceNodeById(rootNode, replacementItem) {
    //     const workStack = [];
    //     workStack.push(rootNode);
    //     while (workStack > 0) {
    //         let currentNode = workStack.pop();
    //         if (currentNode.id === replacementItem.id) {
    //             currentNode = replacementItem;
    //             return rootNode;
    //         } else {
    //             currentNode.children.forEach((child) => workStack.push(child));
    //         }
    //     }
    // }

    async createAgent({name, urn} = {}) {
        const newAgent = new AgentModel({
            name,
            urn
        });
        await StorageService.create(newAgent, `agent`);
        return newAgent;
    }

    async createTeam(name = `unnamed`, agentIds = [], performers = []) {
        const newTeam = new TeamModel({
            name,
            agentIds
        });
        await StorageService.create(newTeam, `team`);
        return newTeam;
    }

    async createAnalysis({name, description, rootUrn, teamId} = {}) {     // @todo I like the named parameter pattern - might look at standardizing on it.
        const newAnalysis = new AnalysisModel({
            name,
            rootUrn,
            teamId
        });
        await StorageService.create(newAnalysis, `analysis`);
        return newAnalysis;
    }

    async createStandardAnalysis(analysisName, rootUrn, source) {
        const agent1 = await this.createAgent({
            name: `Agent 1`,
            urn: `org.example.agent1`
        });
        const agent2 = await this.createAgent({
            name: `Agent 2`,
            urn: `org.example.agent2`
        });
        const newTeam = await this.createTeam(`Team Blue`, [agent1.id, agent2.id]);
        const newAnalysis = await this.createAnalysis({
            name: analysisName,
            rootUrn,
            teamId: newTeam.id
        });// @todo I like the named parameter pattern - might look at standardizing on it.
        return newAnalysis;
    }

    async displayAnalysis(analysisModel) {
        //  let analysisModel = await StorageService.get(id, 'analysis');
        analysisModel.rootCellModel = await this.buildCellTreeFromActivityUrn(analysisModel.rootUrn);
        // maybe necessary?
        analysisModel.jag = this.fetchActivity(analysisModel.urn);
        analysisModel.team = this.fetchTeam(analysisModel.teamId);
        this._iaTable.displayAnalysis(analysisModel);
    }

    // blending these two together --- update the projectModel to the existing activityModels.

    // possible common area contender

    async saveCellModel(newCellModel) {
        if (await StorageService.has(newCellModel, `node`)) {
            await StorageService.update(newCellModel, `node`);
        } else {
            if (newCellModel.isValid()) {
                await StorageService.create(newCellModel, `node`);
            } else {
                window.alert(`Invalid URN`);
            }
        }
    }               // possible common area contender

    async saveJag() {
        if (await StorageService.has(this, `activity`)) {
            await StorageService.update(this, `activity`);
        } else {
            await StorageService.create(this, `activity`);
        }
    }

    async deleteLeafNode(leaf) {
        if (!leaf.isRootNode()) {
            const index = leaf.parent.children.indexOf(leaf);
            leaf.parent.children.splice(index, 1);
            await StorageService.update(leaf.parent, `node`);
        }

        if (InputValidator.isValidUrn(leaf.activity.urn)) {
            await StorageService.delete(leaf.id, `node`);
        } else {
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent(`sync`));
        }
    }

    deleteAllChildren(childList) {
        childList.forEach(async (child) => {
            this.deleteAllChildren([...child.children]);
            // 2 Dispatchers here - only listener in views/Analysis
            this.dispatchEvent(new CustomEvent(`detach`, {
                detail: {
                    target: child,
                    layout: false
                }
            }));
            await this.deleteLeafNode(child);
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent(`sync`));
        });
    }

    async _createChildren() {
        const promises = [];
        for (const child of this.jag.children) {
            promises.push(StorageService.get(child.urn, `activity`).then((jag) => {
                const model = new Node();
                model.urn = jag.urn;
                this.addChild(model, true);
                StorageService.create(model, `node`);
            }));
        }
        await Promise.all(promises);
    }

    addChild(child, layout = true) {
        child.parent = this;
        this._children.push(child);

        // Only Dispatcher & Only Listener in views/Analysis      // cant we just call 'attach' in analysis view?
        this.dispatchEvent(new CustomEvent(`attach`, {
            detail: {
                target: child,
                reference: this,
                layout
            }
        }));

        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent(`sync`));
    }

    // addChild(node){                          // from nodemodel --originall called when the +sign is clicked.
    //     if (this.canHaveChildren) {
    //         const child = new LiveNode();
    //         this._children.push(node);
    //         node.parent = this;
    //     } else {
    //         alert("LiveNode must first be assigned a valid URN")
    //     }
    // }

    async _updateJAG(jag) {
        this._jag = jag;
        this.save();
        this.deleteAllChildren();
        await this._createChildren();
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent(`sync`));
    }

    // / OBSOLETE but might be used later
    // /  The surgical method of deleting a node and all its children
    // Does not scour for other occurrences of other identical parent jags
    async prune(node) {
        this.deleteAllChildren([...node.children]);  // passing a copy because the node.children is going to be modified

        if (node.isRoot()) {
            await this.deleteLeafNode(node);
        }
        // 2 Dispatchers here - only listener in views/Analysis
        // this.dispatchEvent(new CustomEvent('detach', {
        //     detail: {
        //         target: this
        //     }
        // }));
        this._iaTable.analysisView.detach(node);
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent(`sync`));
    }

    repopulateActivity(currentNode) {
        currentNode.activity = this._activityMap.get(currentNode.urn);
        for (const child of currentNode.children) {
            this.repopulateActivity(child);
        }
    }

    repopulateParent(currentNode) {
        for (const child of currentNode.children) {
            child.parent = currentNode;
            this.repopulateParent(child);
        }
    }

}
