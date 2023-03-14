import * as pool from "../../db/postgres-config.js";
import fs from "fs";

const getAllJags = async (includeShared = false, author) => {
    console.log(`Query> getAllJags`);
    let queryResult;
    if (includeShared) {
        console.log(`Get em all`);
        const selectJags = fs.readFileSync(`api/sql/postgres/select/jags-shared.sql`).toString();
        queryResult = await pool.query(selectJags).
            then((result) => {
                return result;
            }).catch((e) => {
                console.log(`bad: ${e}`);
            });
    } else {
        console.log(`Just get the owned ones`);
        const selectJags = fs.readFileSync(`api/sql/postgres/select/jags-owned.sql`).toString();
        queryResult = await pool.query(selectJags, [author]).
            then((result) => {
                return result;
            }).catch((e) => {
                console.log(`bad: ${e}`);
            });
    }
    return queryResult;
};

const getJagById = async (id) => {
    console.log(`Query> getJagById`);
    const selectJagById = fs.readFileSync(`api/sql/postgres/select/jag-by-id.sql`).toString();
    const queryResult = await pool.query(selectJagById, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const getAllAgents = async () => {
    console.log(`Query> getAllAgents`);
    const selectAgents = fs.readFileSync(`api/sql/postgres/select/agents.sql`).toString();
    const queryResult = await pool.query(selectAgents).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getAllTeams = async () => {
    console.log(`Query> getAllTeams`);
    const selectTeams = fs.readFileSync(`api/sql/postgres/select/teams.sql`).toString();
    const queryResult = await pool.query(selectTeams).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const getAllAnalyses = async () => {
    console.log(`Query> getAllAnalyses`);
    const selectAnalyses = fs.readFileSync(`api/sql/postgres/select/analyses.sql`).toString();
    const queryResult = await pool.query(selectAnalyses).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getAllEndpoints = async () => {
    console.log(`Query> getAllEndpoints`);
    const selectEndpoints = fs.readFileSync(`api/sql/postgres/select/endpoints.sql`).toString();
    const queryResult = await pool.query(selectEndpoints).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getEndpointsFor = async (urn) => {
    console.log(`Query> getEndpointsFor`);
    const selectEndpointsFor = fs.readFileSync(`api/sql/postgres/select/endpoints-for-jag.sql`).toString();
    const queryResult = await pool.query(selectEndpointsFor, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getEndpointById = async (id) => {
    console.log(`Query> getEndpointById`);
    const selectEndpointById = fs.readFileSync(`api/sql/postgres/select/endpoint-by-id.sql`).toString();
    const queryResult = await pool.query(selectEndpointById, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const getAllBindings = async () => {
    console.log(`Query> getAllBindings`);
    const selectBindings = fs.readFileSync(`api/sql/postgres/select/bindings.sql`).toString();
    const queryResult = await pool.query(selectBindings).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad binding all select: ${e}`);
        });
    return queryResult;
};

const getBindingsFor = async (urn) => {
    console.log(`Query> getBindingsFor`);
    const selectBindingsFor = fs.readFileSync(`api/sql/postgres/select/bindings-for-jag.sql`).toString();
    const queryResult = await pool.query(selectBindingsFor, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad binding for select: ${e}`);
        });
    return queryResult;
};

const getAllInnerJags = async () => {
    console.log(`Query> getAllInnerJags`);
    const selectInnerJags = fs.readFileSync(`api/sql/postgres/select/innerjags.sql`).toString();
    const queryResult = await pool.query(selectInnerJags).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getInnerJagsFor = async (urn) => {
    console.log(`Query> getInnerJagsFor`);
    const selectInnerJagsFor = fs.readFileSync(`api/sql/postgres/select/innerjags-for-jag.sql`).toString();
    const queryResult = await pool.query(selectInnerJagsFor, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getAllLiveNodes = async () => {
    console.log(`Query> getAllLiveNodes`);
    const selectLiveNodes = fs.readFileSync(`api/sql/postgres/select/livenodes.sql`).toString();
    const queryResult = await pool.query(selectLiveNodes).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getLiveNodesByProjectId = async (id) => {
    console.log(`Query> getLiveNodesByProjectId`);
    const selectLiveNodesByProjectId = fs.readFileSync(`api/sql/postgres/select/livenodes-by-project-id.sql`).toString();
    const queryResult = await pool.query(selectLiveNodesByProjectId, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getLiveNodeById = async (id) => {
    console.log(`Query> getLiveNodeById`);
    const selectLiveNodeById = fs.readFileSync(`api/sql/postgres/select/livenode-by-id.sql`).toString();
    const queryResult = await pool.query(selectLiveNodeById, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const deleteJagById = async (id) => {
    console.log(`Query> deleteJagById`);
    const deleteJagById = fs.readFileSync(`api/sql/postgres/delete/jags-by-id.sql`).toString();
    const queryResult = await pool.query(deleteJagById, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const deleteLiveNodeProjectById = async (id) => {
    console.log(`Query> deleteLiveNodeByProjectId`);
    const deleteLiveNodessByProjectId = fs.readFileSync(`api/sql/postgres/delete/livenodes-by-project-id.sql`).toString();
    const queryResult = await pool.query(deleteLiveNodessByProjectId, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const updateJag = async (jag, author) => {
    console.log(`Query> updateJag`);
    const upsertJag = fs.readFileSync(`api/sql/postgres/upsert/jag.sql`).toString();
    const values = [
        jag.urn,
        jag.author = author,
        jag.collapsed,
        jag.connector.execution,
        jag.connector.operator,
        jag.connector.returns,
        jag.createdDate,
        jag.description,
        jag.expectedDuration,
        jag.isLocked,
        jag.lockedBy,
        jag.modifiedDate,
        jag.name
    ];
    const queryResult = await pool.query(upsertJag, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const updateEndpoint = async (endpoint, owner_id) => {
    console.log(`Query> updateEndpoint`);
    const upsertEndpoint = fs.readFileSync(`api/sql/postgres/upsert/endpoint.sql`).toString();

    const values = [
        endpoint.id,
        endpoint.direction,
        endpoint.exchangeName,
        endpoint.exchangeSourceUrn,
        endpoint.exchangeType,
        owner_id
    ];
    const queryResult = await pool.query(upsertEndpoint, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const updateInnerJag = async (innerJag, owner_id) => {
    console.log(`Query> updateInnerJag`);
    const upsertInnerJag = fs.readFileSync(`api/sql/postgres/upsert/innerjag.sql`).toString();
    const values = [
        innerJag.id,
        innerJag.urn,
        owner_id
    ];
    const queryResult = await pool.query(upsertInnerJag, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const updateBinding = async (binding, owner_id) => {
    console.log(`Query> updateBinding`);
    const upsertBinding = fs.readFileSync(`api/sql/postgres/upsert/binding.sql`).toString();
    const values = [
        binding.id,
        binding.to.id,
        binding.from.id,
        owner_id
    ];
    console.log(values);
    const queryResult = await pool.query(upsertBinding, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const updateAgent = async (agent) => {
    console.log(`Query> updateAgent`);
    const upsertAgent = fs.readFileSync(`api/sql/postgres/upsert/agent.sql`).toString();
    const values = [
        agent.id,
        agent.dateCreated,
        agent.description,
        agent.isLocked,
        agent.name,
        agent.urn
    ];
    const queryResult = await pool.query(upsertAgent, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const updateTeam = async (team) => {
    console.log(`Query> updateTeam`);
    const upsertTeam = fs.readFileSync(`api/sql/postgres/upsert/team.sql`).toString();
    const values = [
        team.id,
        team.name
    ];
    const queryResult = await pool.query(upsertTeam, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const updateAnalysis = async (analysis) => {
    console.log(`Query> updateAnalysis`);
    const upsertAnalysis = fs.readFileSync(`api/sql/postgres/upsert/analysis.sql`).toString();
    const values = [
        analysis.id,
        analysis.description,
        analysis.isLocked,
        analysis.name,
        analysis.rootUrn,
        analysis.teamId
    ];
    const queryResult = await pool.query(upsertAnalysis, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const updateLiveNodes = async (liveNode) => {
    console.log(`Query> updateLiveNode`);
    const upsertLiveNode = fs.readFileSync(`api/sql/postgres/upsert/livenode.sql`).toString();
    const values = [
        liveNode.id,
        liveNode.childId,
        liveNode.contextualDescription,
        liveNode.contextualName,
        liveNode.contextualExpectedDuration,
        liveNode.isExpanded,
        liveNode.isLocked,
        liveNode.parentId,
        liveNode.projectId,
        liveNode.returnState,
        liveNode.returnValue,
        liveNode.testReturnState,
        liveNode.testReturnValue,
        liveNode.urn,
        liveNode.x,
        liveNode.y
    ];
    const queryResult = await pool.query(upsertLiveNode, values).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};


const createTable = async (tableDefinition) => {
    const queryResult = await pool.query(tableDefinition).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const createTables = async () => {
    console.log(`Query> dropTables`);
    const tableDrop = fs.readFileSync(`api/sql/postgres/db/create-tables.sql`).toString();
    const queryResult = await pool.query(tableDrop).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const dropTables = async () => {
    console.log(`Query> dropTables`);
    const tableDrop = fs.readFileSync(`api/sql/postgres/db/drop-tables.sql`).toString();
    const queryResult = await pool.query(tableDrop).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

export {
    getAllLiveNodes,
    getLiveNodeById,
    getLiveNodesByProjectId,
    getAllJags,
    getJagById,
    getAllEndpoints,
    getEndpointsFor,
    getEndpointById,
    getAllBindings,
    getBindingsFor,
    getAllInnerJags,
    getInnerJagsFor,
    updateJag,
    updateEndpoint,
    updateInnerJag,
    updateBinding,
    updateLiveNodes,
    updateAgent,
    updateTeam,
    updateAnalysis,
    deleteJagById,
    deleteLiveNodeProjectById,
    createTables,
    dropTables,
    getAllAgents,
    getAllTeams,
    getAllAnalyses
};
