/**
 * @file Wrapper for IndexedDB storage schemas.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.07
 *
 * Schema provides the necessary information describing a record
 * being processed.  This includes the storename, keyfield and
 * the deserialization function required.
 * @TODO Not sure what unique is for.
 * @TODO Should we incorporate a yml/xml config file?  Probably no benefit.
 */

import AnalysisModel from '../models/analysis-model.js';
import Activity from "../models/activity.js";
import Agent from '../models/agent.js';
import Team from '../models/team.js';
import LiveNode from '../models/live-node.js';

export default class Schemas {

    static {
        const ACTIVITY_STORE = {
            name: `activity`,
            key: `urn`,
            deserialize: Activity.fromJSON,
            rest: `jags`,
            indexList: [
                {
                    name: `urn-index`,
                    property: `urn`,
                    options: {
                        unique: true
                    }
                }
            ]
        };

        const LIVENODE_STORE = {
            name: `livenode`,
            key: `id`,
            deserialize: LiveNode.fromJSON,
            rest: `livenodes`,
            indexList: [
                {
                    name: `id-index`,
                    property: `id`,
                    options: {
                        unique: true
                    }
                }
            ]
        };

        const ANALYSIS_STORE = {
            name: `analysis`,
            key: `id`,
            deserialize: AnalysisModel.fromJSON,
            rest: `analyses`,
            indexList: [
                {
                    name: `id-index`,
                    property: `id`,
                    options: {
                        unique: true
                    }
                }
            ]
        };

        const AGENT_STORE = {
            name: `agent`,
            key: `id`,
            deserialize: Agent.fromJSON,
            rest: `agents`,
            indexList: [
                {
                    name: `id-index`,
                    property: `id`,
                    options: {
                        unique: true
                    }
                }
            ]
        };

        const TEAM_STORE = {
            name: `team`,
            key: `id`,
            deserialize: Team.fromJSON,
            rest: `teams`,
            indexList: [
                {
                    name: `id-index`,
                    property: `id`,
                    options: {
                        unique: true
                    }
                }
            ]
        };

        Schemas.SCHEMA_SET = {
            activity: ACTIVITY_STORE,
            livenode: LIVENODE_STORE,
            analysis: ANALYSIS_STORE,
            agent: AGENT_STORE,
            team: TEAM_STORE
        };
    }

    static all() {
        return Object.values(Schemas.SCHEMA_SET);
    }

    static get(schema) {
        if (schema in Schemas.SCHEMA_SET) {
            return Schemas.SCHEMA_SET[schema];
        }
        throw new Error(`Schema '${schema}' does not exist.`);
    }

    static getRest(schema) {
        const restSchema = Schemas.get(schema).rest;
        return restSchema;
    }

    static getKeyValue(schema, obj) {
        const key = Schemas.get(schema).key;
        return (obj[key]);
    }

    static getKey(schema) {
        return Schemas.get(schema).key;
    }

    static async deserialize(schema, description) {
        const newObj = await Schemas.get(schema).deserialize(description);

        return newObj;
    }

}


