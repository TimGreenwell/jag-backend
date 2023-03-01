import * as pool from "../../db/postgres-config.js";
import fs from "fs";

const getAllActivities = async (includeShared = false, author) => {
    console.log(`Query> getAllActivities`);
    console.log(`Get shared activities: ${includeShared}`);
    console.log(`Author: ${author}`);
    let queryResult;
    if (includeShared) {
        console.log(`Get em all`);
        const selectActivities = fs.readFileSync(`api/sql/postgres/select/activities-shared.sql`).toString();
        queryResult = await pool.query(selectActivities).
            then((result) => {
                return result;
            }).catch((e) => {
                console.log(`bad: ${e}`);
            });
    } else {
        console.log(`Just get the owned ones`);
        const selectActivities = fs.readFileSync(`api/sql/postgres/select/activities-owned.sql`).toString();
        queryResult = await pool.query(selectActivities, [author]).
            then((result) => {
                return result;
            }).catch((e) => {
                console.log(`bad: ${e}`);
            });
    }
    return queryResult;
};

const getActivityById = async (id) => {
    console.log(`Query> getActivityById`);
    const selectActivitiesById = fs.readFileSync(`api/sql/postgres/select/activity-by-id.sql`).toString();
    const queryResult = await pool.query(selectActivitiesById, [id]).
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
    const selectEndpointsFor = fs.readFileSync(`api/sql/postgres/select/endpoints-for-activity.sql`).toString();
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
    const selectBindingsFor = fs.readFileSync(`api/sql/postgres/select/bindings-for-activity.sql`).toString();
    const queryResult = await pool.query(selectBindingsFor, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad binding for select: ${e}`);
        });
    return queryResult;
};

const getAllSubActivities = async () => {
    console.log(`Query> getAllSubActivities`);
    const selectSubactivities = fs.readFileSync(`api/sql/postgres/select/subactivities.sql`).toString();
    const queryResult = await pool.query(selectSubactivities).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getSubActivitiesFor = async (urn) => {
    console.log(`Query> getSubActivitiesFor`);
    const selectSubactivitiesFor = fs.readFileSync(`api/sql/postgres/select/subactivities-for-activity.sql`).toString();
    const queryResult = await pool.query(selectSubactivitiesFor, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getAllJags = async () => {
    console.log(`Query> getAllJags`);
    const selectJags = fs.readFileSync(`api/sql/postgres/select/jags.sql`).toString();
    const queryResult = await pool.query(selectJags).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const getJagByProjectId = async (id) => {
    console.log(`Query> getJagByProjectId`);
    const selectJagsByProjectId = fs.readFileSync(`api/sql/postgres/select/jags-by-project-id.sql`).toString();
    const queryResult = await pool.query(selectJagsByProjectId, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
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

const deleteActivityById = async (id) => {
    console.log(`Query> deleteActivityById`);
    const deleteActivityById = fs.readFileSync(`api/sql/postgres/delete/activity-by-id.sql`).toString();
    const queryResult = await pool.query(deleteActivityById, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const deleteJagByProjectId = async (id) => {
    console.log(`Query> deleteJagByProjectId`);
    const deleteJagsByProjectId = fs.readFileSync(`api/sql/postgres/delete/jags-by-project-id.sql`).toString();
    const queryResult = await pool.query(deleteJagsByProjectId, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return queryResult;
};

const updateActivity = async (activity, author) => {
    console.log(`Query> updateActivity`);
    const upsertActivity = fs.readFileSync(`api/sql/postgres/upsert/activity.sql`).toString();
    const values = [
        activity.urn,
        activity.author = author,
        activity.collapsed,
        activity.connector.execution,
        activity.connector.operator,
        activity.connector.returns,
        activity.createdDate,
        activity.description,
        activity.expectedDuration,
        activity.isLocked,
        activity.lockedBy,
        activity.modifiedDate,
        activity.name
    ];
    const queryResult = await pool.query(upsertActivity, values).
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

const updateSubactivity = async (subactivity, owner_id) => {
    console.log(`Query> updateSubactivity`);
    const upsertSubactivity = fs.readFileSync(`api/sql/postgres/upsert/subactivity.sql`).toString();
    const values = [
        subactivity.id,
        subactivity.urn,
        owner_id
    ];
    const queryResult = await pool.query(upsertSubactivity, values).
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


const updateJag = async (node) => {
    console.log(`Query> updateJag`);
    const upsertJag = fs.readFileSync(`api/sql/postgres/upsert/jag.sql`).toString();
    const values = [
        node.id,
        node.childId,
        node.contextualDescription,
        node.contextualName,
        node.contextualExpectedDuration,
        node.isExpanded,
        node.isLocked,
        node.parentId,
        node.projectId,
        node.returnState,
        node.returnValue,
        node.testReturnState,
        node.testReturnValue,
        node.urn,
        node.x,
        node.y
    ];
    const queryResult = await pool.query(upsertJag, values).
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


// const assembleTables = () => {
//     const activityCreateTable = fs.readFileSync(`sql/postgres/create-table/activity.sql`).toString();
//     const agentCreateTable = fs.readFileSync(`sql/postgres/create-table/agents.sql`).toString();
//     const agent_assessmentCreateTable = fs.readFileSync(`sql/postgres/create-table/agent_assessment.sql`).toString();
//     const analysisCreateTable = fs.readFileSync(`sql/postgres/create-table/analysis.sql`).toString();
//     const assessmentCreateTable = fs.readFileSync(`sql/postgres/create-table/assessment.sql`).toString();
//     const bindingCreateTable = fs.readFileSync(`sql/postgres/create-table/binding.sql`).toString();
//     const endpointCreateTable = fs.readFileSync(`sql/postgres/create-table/endpoint.sql`).toString();
//     const nodeCreateTable = fs.readFileSync(`sql/postgres/create-table/node.sql`).toString();
//     const performerCreateTable = fs.readFileSync(`sql/postgres/create-table/performer.sql`).toString();
//     const subactivityCreateTable = fs.readFileSync(`sql/postgres/create-table/subactivity.sql`).toString();
//     const subscriptionCreateTable = fs.readFileSync(`sql/postgres/create-table/subscription.sql`).toString();
//     const teamCreateTable = fs.readFileSync(`sql/postgres/create-table/team.sql`).toString();
//     const dbCreateTables = [];
//     dbCreateTables.push(activityCreateTable);
//     dbCreateTables.push(analysisCreateTable);
//     dbCreateTables.push(teamCreateTable);
//     dbCreateTables.push(endpointCreateTable);          // ref: activity
//     dbCreateTables.push(subactivityCreateTable);       // ref: activity
//     dbCreateTables.push(bindingCreateTable);           // ref: endpoint and activity
//     dbCreateTables.push(nodeCreateTable);              // ref: itself
//     dbCreateTables.push(subscriptionCreateTable);      // ref: node
//     dbCreateTables.push(performerCreateTable);         // ref: team
//     dbCreateTables.push(agentCreateTable);             // ref: team
//     dbCreateTables.push(agent_assessmentCreateTable); // ref: agent
//     dbCreateTables.push(assessmentCreateTable);        // ref: agent
//     return dbCreateTables;
// };


// const createTables = async () => {
//     console.log(`Query> createTables`);
//     const dbCreateTables = assembleTables();
//     const queryResultArray = [];
//     for (const dbCreateTable of dbCreateTables) {
//         const queryResult = await createTable(dbCreateTable).
//             then((result) => {
//                 return result;
//             }).catch((e) => {
//                 console.log(`bad: ${e}`);
//             });
//         queryResultArray.push(queryResult);
//     }
//     return queryResultArray;
// };

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

//
// (async () => {
//     const testConnection = fs.readFileSync(`api/sql/postgres/other/test-connection.sql`).toString();
//     const showTables = fs.readFileSync(`sql/postgres/other/show-tables.sql`).toString();
//     let queryResult = await pool.query(testConnection, [`Connection to postgres successful!`]);
//     console.log(`Checking connection to DB`);
//     console.log(queryResult.rows[0].connected);
//     console.log(`Create tables (if necessary)`);
//     await createTables();
//     queryResult = await pool.query({text: showTables,
//         rowMode: `array`});
//     const tableArray = queryResult.rows;
//     console.log(`Existing tables include: ${tableArray}`);
// })();


export {
    getAllJags,
    getJagById,
    getJagByProjectId,
    getAllActivities,
    getActivityById,
    getAllEndpoints,
    getEndpointsFor,
    getEndpointById,
    getAllBindings,
    getBindingsFor,
    getAllSubActivities,
    getSubActivitiesFor,
    updateActivity,
    updateEndpoint,
    updateSubactivity,
    updateBinding,
    updateJag,
    updateAgent,
    updateTeam,
    updateAnalysis,
    deleteActivityById,
    deleteJagByProjectId,
    createTables,
    dropTables,
    getAllAgents,
    getAllTeams,
    getAllAnalyses
};
