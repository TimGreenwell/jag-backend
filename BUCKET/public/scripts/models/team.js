/**
 * @fileOverview Team model.
 *
 * @author mvignati
 * @version 0.48
 */

'use strict';

import {uuidV4} from '../utils/uuid.js';

export default class TeamModel extends EventTarget {

    constructor({id = uuidV4(), name = TeamModel.DEFAULT_NAME, agentIds = [], performerIds = new Set()} = {}) {
        super();
        this._id = id;
        this._name = name;
        this._agentIds = agentIds;
        this._performerIds = performerIds;
        // non-persistent
        this._agents = [];
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
                extra: {name: this._name}
            }
        }));
    }

    get agentIds() {
        return this._agentIds;
    }

    set agentIds(value) {
        this._agentIds = value;
    }

    get performerIds() {
        return this._performerIds;
    }

    set performerIds(value) {
        this._performerIds = value;
    }

    get agents() {
        return this._agents;
    }

    set agents(value) {
        this._agents = value;
    }

    addAgent(agent) {
        this._agents.push(agent);
        this._agentIds.push(agent.id);
        this.dispatchEvent(new CustomEvent(`update`, {
            detail: {
                id: this._id,
                property: `agents`,
                extra: {agents: this._agents}
            }
        }));
    }

    removeAgent(agent) {
        this._agents.splice(this._agents.indexOf(agent), 1);
        this._agentIds.splice(this._agentIds.indexOf(agent.id), 1);
        this.dispatchEvent(new CustomEvent(`update`, {
            detail: {
                id: this._id,
                property: `agents`,
                extra: {agents: this._agents}
            }
        }));
    }

    setPerformer(id, performer) {
        if (this._performerIds.has(id) && !performer) {
            this._performerIds.delete(id);
        } else if (!this._performerIds.has(id) && performer) {
            this._performerIds.add(id);
        } else {
            return;
        }

        this.dispatchEvent(new CustomEvent(`update`, {
            detail: {
                id: this._id,
                property: `performers`,
                extra: {performers: this._performerIds}
            }
        }));
    }

    performer(id) {
        const ids = this._agents.map((agent) => {
            return agent.id;
        });

        if (ids.indexOf(id) >= 0) {
            return this._performerIds.has(id);
        }

        return undefined;
    }

    save() {
        // TeamService.store(this);
    }

    toJSON() {
        const json = {
            id: this._id,
            name: this._name,
            agentIds: this._agentIds,
            performerIds: Array.from(this._performerIds)
        };
        return json;
    }

    static fromJSON(json) {
        // const agents = [];
        // for (const agent_id of json.agents) {
        //     let agent = await StorageService.get(agent_id,'agent');
        //
        //     // if (agent == undefined) {
        //     //     agent = new AgentModel();
        //     //     await StorageService.create(agent,'agent');
        //     //}
        //
        //     agents.push(agent);
        // }
        // json.agents = agents;

        // json.performers = new Set(json.performers);
        const returnValue = new TeamModel(json);
        return returnValue;
    }

}

TeamModel.DEFAULT_NAME = `Team name`;

