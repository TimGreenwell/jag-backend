/**
 * @fileOverview AnalysisModel model.
 *
 * @author mvignati
 * @version 0.63
 */

'use strict';

import {uuidV4} from '../utils/uuid.js';

export default class AnalysisModel extends EventTarget {

    // constructor : why pass in root into a new CellModel? results in same.  hrm
    constructor({
        id = uuidV4(),
        name = AnalysisModel.DEFAULT_NAME,
        description = AnalysisModel.DEFAULT_DESCRIPTION,
        rootUrn,
        teamId,
        isLocked
    } = {}) {
        super();
        this._id = id;
        this._name = name;
        this._description = description;
        this._rootUrn = rootUrn;
        this._teamId = teamId;
        this._isLocked = isLocked;

        this._team = undefined;
        this._rootCellModel = undefined;
    }


    // @TODO - Model is pumping out Dispatches in the setters.  Not bad idea - but convention..
    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
        this.dispatchEvent(new CustomEvent(`update`, {
            detail: {
                id: this._id,
                property: `name`,
                extra: {name: this._name}
            }
        }));
    }

    get description() {
        return this._description;
    }

    set description(description) {
        this._description = description;
        this.dispatchEvent(new CustomEvent(`update`, {
            detail: {
                id: this._id,
                property: `description`,
                extra: {description: this._description}
            }
        }));
    }

    get rootUrn() {
        return this._rootUrn;
    }

    set rootUrn(value) {
        this._rootUrn = value;
    }

    get teamId() {
        return this._teamId;
    }

    set teamId(value) {
        this._teamId = value;
    }

    get isLocked() {
        return this._isLocked;
    }

    set isLocked(value) {
        this._isLocked = value;
    }


    get team() {
        return this._team;
    }

    set team(value) {
        this._team = value;
    }

    get rootCellModel() {
        return this._rootCellModel;
    }

    set rootCellModel(value) {
        this._rootCellModel = value;
    }

    static fromJSON(json) {
        // const team_id = json.team;
        // let teamNode = await StorageService.get(team_id, 'team');                      // This should be rebuild at controller.
        // json.team = teamNode;                                                          // Exists only to store its data (team is in team)
        const newAnalysis = new AnalysisModel(json);
        return newAnalysis;
    }

    toJSON() {
        const json = {
            id: this._id,
            name: this._name,
            description: this._description,
            rootUrn: this._rootUrn,
            teamId: this._teamId,
            isLocked: this._isLocked
        };
        return json;
    }

}
AnalysisModel.DEFAULT_NAME = ``;
AnalysisModel.DEFAULT_DESCRIPTION = ``;
