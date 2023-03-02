/**
 * @fileOverview IA table component.
 *
 * @author mvignati
 * @version 2.03
 */

'use strict';

import AgentModel from '../models/agent.js';
import AnalysisModel from '../models/analysis-model.js';
import ActivityModel from '../models/activity.js';
import TeamModel from '../models/team.js';
import StorageService from '../services/storage-service.js';
import Popupable from '../utils/popupable.js';
import AnalysisView from './ia-analysis.js';
import UserPrefs from "../utils/user-prefs.js";


// $export_analysis.addEventListener('click', this._handleExportAnalysisPopup.bind(this));
// $import_analysis.addEventListener('click', this._handleImportAnalysis.bind(this));
// $analysis_file.addEventListener('change', this._handleUploadAnalysis.bind(this));


class IATable extends Popupable {

    constructor() {
        super();
        this.setPopupBounds(this);
        this._analysisModel = null;                    // the Analysis Model holding the data
        this._availableActivityUrns = [];              // for building a select list
        this._domElements = {                          // _domElements : name, selector, analysis, (description), (create), (import), (export), (file)
            name: undefined,
            selector: undefined,
            analysis: undefined
        };
        this._initUI();
        this._boundRefresh = this._refresh.bind(this);
    }

    get analysisModel() {
        return this._analysisModel;
    }

    set analysisModel(newAnalysisModel) {
        this._analysisModel = newAnalysisModel;
    }

    get availableActivityUrns() {
        return this._availableActivityUrns;
    }

    set availableActivityUrns(jagUrnList) {
        this._availableActivityUrns = jagUrnList;
    }

    // get analysisView() {
    //     return this._domElements.analysis;                           // never used and confuses other local vars
    // }


    displayAnalysis(analysisModel = this._analysisModel) {
        // Called by ControllerIA..

        // remove current view if it exists
        if (this._domElements.analysis !== undefined) {
            this.removeChild(this._domElements.analysis);
        }

        this._analysisModel = analysisModel;
        // Create and append a new Analysis View to this structure
        const analysisView = new AnalysisView(this._analysisModel);
        this.appendChild(analysisView);
        this._domElements.analysis = analysisView;
        // Enable name and description (@TODO - this might make more sense in a separate panel (like AT Properties)
        this._domElements.name.removeAttribute(`disabled`);
        this._domElements.name.value = this._analysisModel.name;
        this._domElements.description.removeAttribute(`disabled`);
        this._domElements.description.value = this._analysisModel.description;

        this._analysisModel.team.addEventListener(`update`, this._boundRefresh);
        this._agents = this._analysisModel.team.agents;
        for (const agent of this._agents) {
            agent.addEventListener(`update`, this._boundRefresh);
        }
    }


    _initUI() {
        const $header = document.createElement(`header`);
        // const $new_analysis = document.createElement('button');

        const $analysis_name_wrapper = document.createElement(`div`);
        const $analysis_name_label = document.createElement(`label`);
        const $analysis_name = document.createElement(`input`);

        const $analysis_description_wrapper = document.createElement(`div`);
        const $analysis_description_label = document.createElement(`label`);
        const $analysis_description = document.createElement(`input`);

        // const $export_analysis = document.createElement('button');
        // const $import_analysis = document.createElement('button');
        const $analysis_file = document.createElement(`input`);

        // $new_analysis.innerText = 'Create AnalysisModel';
        // $new_analysis.setAttribute('id', 'new-analysis');
        $analysis_name_label.setAttribute(`for`, `analysis-name`);
        $analysis_name_label.innerText = `Name`;
        $analysis_name.setAttribute(`name`, `analysis-name`);
        $analysis_name.setAttribute(`id`, `analysis-name`);
        $analysis_name.setAttribute(`disabled`, ``);
        $analysis_description_label.setAttribute(`for`, `analysis-description`);
        $analysis_description_label.innerText = `Description`;
        $analysis_description.setAttribute(`name`, `analysis-description`);
        $analysis_description.setAttribute(`id`, `analysis-description`);
        $analysis_description.setAttribute(`disabled`, ``);
        // $export_analysis.innerText = 'Export';
        // $export_analysis.setAttribute('id', 'export-analysis');
        // $import_analysis.innerText = 'Import';
        // $import_analysis.setAttribute('id', 'import-analysis');
        $analysis_file.setAttribute(`id`, `analysis-file`);
        $analysis_file.setAttribute(`type`, `file`);

        // $header.appendChild($new_analysis);
        $header.appendChild($analysis_name_label);

        $analysis_name_wrapper.appendChild($analysis_name_label);
        $analysis_name_wrapper.appendChild($analysis_name);
        $header.appendChild($analysis_name_wrapper);

        $analysis_description_wrapper.appendChild($analysis_description_label);
        $analysis_description_wrapper.appendChild($analysis_description);
        $header.appendChild($analysis_description_wrapper);

        // $header.appendChild($export_analysis);
        // $header.appendChild($import_analysis);
        $header.appendChild($analysis_file);

        // $new_analysis.addEventListener('click', this._handleNewAnalysisPopup.bind(this));
        $analysis_name.addEventListener(`blur`, this._handleAnalysisNameChange.bind(this));
        $analysis_description.addEventListener(`blur`, this._handleAnalysisDescriptionChange.bind(this));
        // $export_analysis.addEventListener('click', this._handleExportAnalysisPopup.bind(this));
        // $import_analysis.addEventListener('click', this._handleImportAnalysis.bind(this));
        $analysis_file.addEventListener(`change`, this._handleUploadAnalysis.bind(this));

        this.appendChild($header);

        // this._domElements.create = $new_analysis;
        this._domElements.name = $analysis_name;
        this._domElements.description = $analysis_description;
        // this._domElements.export = $export_analysis;
        // this._domElements.import = $import_analysis;
        this._domElements.file = $analysis_file;
    }

    _refresh() {
        this._domElements.analysis.layout();
    }

    _handleNewAnalysisPopup() {
        const $initiator = document.getElementById(`assessment-new`);
        this.popup({
            content: IATable.NOTICE_CREATE_ANALYSIS,
            trackEl: this,                                        // this._domElements.create,
            inputs: {table: this},
            highlights: [$initiator]                                     // [this._domElements.create]
        });
    }

    _handleNewAgentPopup() {
        const $initiator = document.getElementById(`agent-new`);
        this.popup({
            content: IATable.NOTICE_CREATE_AGENT,
            trackEl: this,                                        // this._domElements.create,
            inputs: {table: this},
            highlights: [$initiator]                                     // [this._domElements.create]
        });
    }


    _handleExportAnalysisPopup() {
        this.popup({
            content: IATable.NOTICE_EXPORT_STATIC,
            trackEl: this._domElements.export,
            inputs: {table: this},
            highlights: [this._domElements.export]
        });
    }

    _handleAnalysisNameChange(event) {
        this._analysisModel.name = event.target.value;
        this.dispatchEvent(new CustomEvent(`event-analysis-updated`, {
            bubbles: true,
            composed: true,
            detail: {analysis: this._analysisModel}
        }));
    }

    _handleAnalysisDescriptionChange(event) {
        this._analysisModel.description = event.target.value;
        this.dispatchEvent(new CustomEvent(`event-analysis-updated`, {
            bubbles: true,
            composed: true,
            detail: {analysis: this._analysisModel}
        }));
    }

    /**
     * Import / Export Analysis
     *
     *
     *
     */

    async _handleUploadAnalysis() {
        const files = this._domElements.file.files;

        if (files.length < 1) {
            return;
        }

        const file = files[0];
        const content = await file.text();
        const analysisModel = JSON.parse(content);

        if (analysisModel.jags) {
            for (const jag of analysisModel.jags) {
                if (this._availableActivityUrns.contains(jag.urn)) {
                    this.popup({
                        content: IATable.NOTICE_OVERWRITE_JAG,
                        trackEl: this._domElements.import,                  // To separate: put popups in iatable function.  bring rest up.
                        inputs: {jag},
                        highlights: [this._domElements.import]
                    });
                }
            }
        }

        // This verifies data overwrite -- must be called from IA Controller (return true/false)
        // this.popup({
        //     content: IATable.NOTICE_OVERWRITE_ANALYSIS,
        //     trackEl: this._domElements.import,
        //     inputs: {table: this, analysis: analysisModel, conflict: await this._checkImportConflicts(analysisModel)},
        //     highlights: [this._domElements.import]
        // });
    }

    // async _checkImportConflicts(analysisModel) {
    //     {
    //         //const service = AnalysisService.instance('idb-service');
    //         if (await StorageService.has(analysisModel.id, 'analysis'))
    //             return true;
    //     }
    //
    //     {
    //         //const service = NodeService.instance('idb-service');
    //         for (const node of analysisModel.nodes)
    //             if (await StorageService.has(node.id, 'node'))
    //                 return true;
    //     }
    //
    //     {
    //         //const service = TeamService.instance('idb-service');
    //         for (const team of analysisModel.teams)
    //             if (await StorageService.has(team.id, 'team'))
    //                 return true;
    //     }
    //
    //     {
    //         //const service = AgentService.instance('idb-service');
    //         for (const team of analysisModel.teams)
    //             for (const agent of team.agents)
    //                 if (await StorageService.has(agent.id, 'agent'))
    //                     return true;
    //     }
    // }

    _handleImportAnalysis() {
        this._domElements.file.click();
    }

    //  Marked for death ---- never seen in use anywhere
    // _createAnalysisEntry(analysisModel) {
    //     const $option = document.createElement('option');
    //     $option.setAttribute('value', analysisModel.id);
    //
    //     let name = analysisModel.name;
    //     if (name === '')
    //         name = IATable.FALLBACK_ANALYSIS_NAME;
    //
    //     $option.innerText = name;
    //     return $option;
    // }

    async import(analysisModelImport) {
        // Sort nodes with the least number of children first.
        analysisModelImport.nodes.sort((a, b) => {
            return a.children.length - b.children.length;
        });

        for (const node of analysisModelImport.nodes) {
            // const nodeModel = await NodeModel.fromJSON(node);
            // //await service.create(nodeModel,'node');
            // await StorageService.create(nodeModel, 'node');
        }


        // const team_service = TeamService.instance('idb-service');
        // const team_service = StorageService.getStorageInstance('idb-service');

        // const agent_service = AgentService.instance('idb-service');
        // const agent_service = StorageService.getStorageInstance('idb-service');

        for (const team of analysisModelImport.teams) {
            for (const agent of team.agents) {
                await StorageService.create(AgentModel.fromJSON(agent), `agent`);
            }

            team.agents = team.agents.map((agent) => {
                return agent.id;
            });
            const agentModel = await TeamModel.fromJSON(team);   // WHY AWAIT?
            await StorageService.create(agentModel, `team`);
        }


        // const service = AnalysisService.instance('idb-service');
        // const service = StorageService.getStorageInstance('idb-service');

        const analysisModel = await AnalysisModel.fromJSON({            // WHY AWAIT?
            id: analysisModelImport.id,
            name: analysisModelImport.name,
            root: analysisModelImport.root,
            description: analysisModelImport.description || ``,
            teams: analysisModelImport.teams.map((team) => {
                return team.id;
            })
        });

        await StorageService.create(analysisModel, `analysis`);

        this.dispatchEvent(new CustomEvent(`create-analysis`, {detail: {analysis: analysisModel}}));
    }

    async export(static_jags) {
        const analysisModel = this._analysisModel;
        const json = analysisModel.toJSON();

        const root = analysisModel.root;
        let children = [root];

        const jags = [];

        json.nodes = [];

        while (children.length > 0) {
            const child = children.splice(0, 1)[0];

            if (!children) {
                children = [];
            }

            if (child.children) {
                for (const grandchild in child.children) {
                    children.push(child.children[grandchild]);
                }
            }

            json.nodes.push(child.toJSON());

            if (child.urn !== `` && jags.indexOf(child.urn) === -1) {
                jags.push(child.urn);
            }
        }

        if (static_jags === true) {
            json.jags = [];
            // const service = JAGService.instance('idb-service');
            // const service = StorageService.getStorageInstance('idb-service');

            const jagPromises = [];
            for (const jag of jags) {
                StorageService.get(jag, `activity`).then((activity) => {
                    // json.jags.push(activity.toJSON());
                    // 21Sep2023 - above seems wrong
                    jagPromises.push(activity.toJSON());
                });
            }
            await Promise.all(jagPromises);
        }

        const teams = [];
        for (const team of analysisModel.teams) {
            const jteam = team.toJSON();

            const agents = [];
            for (const agent of team.agents) {
                agents.push(agent.toJSON());
            }
            jteam.agents = agents;

            teams.push(jteam);
        }
        json.teams = teams;

        const a = document.createElement(`a`);
        const data = `data:application/json,${encodeURI(JSON.stringify(json))}`;
        a.href = data;
        a.download = `${analysisModel.name}.json`;
        a.click();
    }

}

IATable.POPUP_TYPES = {
    WARNING: `popup-warning`,
    NOTICE: `popup-notice`,
    INFO: `popup-info`
};

IATable.NOTICE_CREATE_ANALYSIS = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: `Create AnalysisModel`,
    description: `Provide a name and root node to create a new analysis.`,
    properties: [
        {
            name: `name`,
            label: `Name`,
            type: `text`
        },
        {
            name: `root`,
            label: `Root JAG`,
            type: `select`,
            async options() {
                const options = [];

                const jags = await StorageService.all(`activity`);     // @todo check if StorageService is really necessary

                for (const jag of jags) {
                    options.push({
                        text: jag.urn,
                        value: jag.urn           //  think maybe this should only be jag.   kkkk
                    });
                }

                return options;
            }
        }
    ],
    actions: [
        {
            text: `Create`,
            color: `white`,
            bgColor: `green`,
            action({inputs: {table}, outputs: {name, root}}) {  // analysisModelname and root URN
                // let id = await this._controller.createAnalysis(name,root);
                this.dispatchEvent(new CustomEvent(`event-analysis-created`, {
                    detail: {name,
                        rootUrn: root}
                }));
            }
        },
        {
            text: `Cancel`,
            color: `black`,
            bgColor: `white`
        }
    ]
});

IATable.NOTICE_EXPORT_STATIC = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: `Export Static`,
    description: `Export this IA table with a static copy of current JAGs?`,
    actions: [
        {
            text: `Yes`,
            color: `black`,
            bgColor: `red`,
            action({inputs: {table}}) {
                table.export(true);
            }
        },
        {
            text: `No`,
            color: `white`,
            bgColor: `black`,
            action({inputs: {table}}) {
                table.export(false);
            }
        }
    ]
});

IATable.NOTICE_OVERWRITE_ANALYSIS = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: `Overwrite AnalysisModel`,
    description: `Data already exists for this analysis. Overwrite existing data?`,
    actions: [
        {
            text: `Overwrite`,
            color: `black`,
            bgColor: `red`,
            action({inputs: {table, analysis}}) {
                table.import(analysisModel);
            }
        },
        {
            text: `Cancel`,
            color: `white`,
            bgColor: `black`
        }
    ],
    fallback: 0,
    skip: ({inputs: {conflict}}) => {
        return !conflict;
    }
});

IATable.NOTICE_OVERWRITE_JAG = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: `Overwrite JAGs`,
    description: ({inputs: {jag}}) => {
        return `The uploaded analysisModel contains a activity at (${jag.urn}), which you already have. Replace it?`;
    },
    actions: [
        {
            text: `Overwrite`,
            color: `black`,
            bgColor: `red`,
            action({inputs: {jag}}) {
                const newActivity = ActivityModel.fromJSON(jag);
                this.dispatchEvent(new CustomEvent(`event-analysis-updated`, {
                    bubbles: true,
                    composed: true,
                    detail: {activity: newActivity}
                }));
                // seems like a create - but really an update --- an upstream check for 'isLocked' should be made.
                //   await StorageService.create(newActivity, 'activity');              /////  really not sure ... was an undefinced 'service.' (no schema)
            }
        },
        {
            text: `Cancel`,
            color: `white`,
            bgColor: `black`
        }
    ]
});

// why cant this go inside scope.? Does anyone else need it?
IATable.NOTICE_CREATE_AGENT = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: `Add New Agent`,
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
                    const urnCharacters = new RegExp(`[^0-9a-zA-Z:-]+`, `gu`);
                    const convName = newName.replace(` `, `-`).replace(urnCharacters, ``).toLowerCase();
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
            action({outputs: agentConstruct}) {
                this.dispatchEvent(new CustomEvent(`event-agent-created`, {
                    bubbles: true,
                    composed: true,
                    detail: {agentConstruct}
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


// IATable.defaultUrn = "us:ihmc:";
IATable.FALLBACK_ANALYSIS_NAME = `AnalysisModel w/o name`;
IATable.ANALYSIS_SELECTOR_TITLE = `Select an analysis`;

customElements.define(`ia-table`, IATable);
export default customElements.get(`ia-table`);

