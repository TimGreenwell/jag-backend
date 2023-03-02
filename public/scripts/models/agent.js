/**
 * @fileOverview Agent model.
 *
 * @author mvignati
 * @version 0.42
 */

'use strict';

import {uuidV4} from '../utils/uuid.js';

export default class AgentModel extends EventTarget {

    constructor({
        id = uuidV4(),
        name = AgentModel.DEFAULT_NAME,
        urn,
        description,
        dateCreated,
        isLocked,
        assessments = new Map()
    } = {}) {
        super();
        this._id = id;
        this._name = name;
        this._description = description;
        this._urn = urn;
        this._dateCreated = dateCreated;

        this._isLocked = isLocked;
        this._assessments = assessments;     // a Map of urn to assessment
    }

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
                extra: {name}
            }
        }));
    }

    get urn() {
        return this._urn;
    }

    set urn(value) {
        this._urn = value;
    }

    get dateCreated() {
        return this._dateCreated;
    }

    set dateCreated(value) {
        this._dateCreated = value;
    }

    get description() {
        return this._description;
    }

    set description(value) {
        this._description = value;
    }

    get isLocked() {
        return this._isLocked;
    }

    set isLocked(value) {
        this._isLocked = value;
    }

    setAssessment(urn, assessment) {
        this._assessments.set(urn, assessment);
        this.dispatchEvent(new CustomEvent(`update`, {
            detail: {
                id: this._id,
                property: `assessment`,
                extra: {
                    urn,
                    assessment
                }
            }
        }));
    }

    assessment(node) {
        if (node.urn === ``) {
            return undefined;
        }

        return this._assessments.get(node.urn);
    }

    static fromJSON(json) {
        const assessments = new Map();
        for (const urn in json.assessments) {
            const value = json.assessments[urn];
            let assessment;

            if (value === 1) {
                assessment = AgentModel.CAN_DO_PERFECTLY;
            } else if (value === 2) {
                assessment = AgentModel.CAN_DO;
            } else if (value === 3) {
                assessment = AgentModel.CAN_HELP;
            } else if (value === 4) {
                assessment = AgentModel.CANNOT_DO;
            }

            assessments.set(urn, assessment);
        }
        json.assessments = assessments;

        return new AgentModel(json);
    }

    toJSON() {
        const json = {
            id: this._id,
            name: this._name,
            urn: this._urn,
            description: this._description,
            isLocked: this._isLocked,
            dateCreated: this._dateCreated,
            assessments: {}
        };

        for (const assessment of this._assessments.keys()) {
            const symbol = this._assessments.get(assessment);
            let value = 0;

            if (symbol === AgentModel.CAN_DO_PERFECTLY) {
                value = 1;
            } else if (symbol === AgentModel.CAN_DO) {
                value = 2;
            } else if (symbol === AgentModel.CAN_HELP) {
                value = 3;
            } else if (symbol === AgentModel.CANNOT_DO) {
                value = 4;
            }

            json.assessments[assessment] = value;
        }

        return json;
    }

}

AgentModel.CAN_DO_PERFECTLY = Symbol(`Can Do Perfectly`);
AgentModel.CAN_DO = Symbol(`Can Do`);
AgentModel.CAN_HELP = Symbol(`Can Help`);
AgentModel.CANNOT_DO = Symbol(`Cannot Do`);
AgentModel.DEFAULT_NAME = `Agent`;
