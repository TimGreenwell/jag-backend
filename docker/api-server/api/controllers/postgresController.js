import * as queries from "../sql/postgres/queries.js";

const updateJag = async (request, response) => {
    const jag = request.body;
    if (request.user) {
        await queries.updateJag(jag, request.user.email);
        const children = jag.children;
        for (const child of children) {
            await queries.updateInnerJag(child, jag.urn);
        }

        const endpoints = jag.endpoints;
        for (const endpoint of endpoints) {
            await queries.updateEndpoint(endpoint, jag.urn);
        }

        const bindings = jag.bindings;
        for (const binding of bindings) {
            await queries.updateBinding(binding, jag.urn);
        }
        console.log(`1`);
        response.status(200).json(`{"Message":"completed"}`);
    } else {
        console.log(`2`);
        response.status(200).json(`{"Message":"completed"}`);   // @TODO remove once authentication ok.
    }
};

const updateLiveNodes = async (request, response) => {
    const liveNode = request.body;
    const liveNodeStack = [];
    liveNodeStack.push(liveNode);
    while (liveNodeStack.length > 0) {
        const currentLiveNode = liveNodeStack.pop();
        await queries.updateLiveNodes(currentLiveNode);
        currentLiveNode.children.forEach((childLiveNode) => {
            liveNodeStack.push(childLiveNode);
        });
    }
    response.status(200).json(`{"Message":"completed"}`);
};


const updateAgent = async (request, response) => {
    const agent = request.body;
    await queries.updateAgent(agent);
    response.status(200).json(`{"Message":"completed"}`);
};


const updateTeam = async (request, response) => {
    const team = request.body;
    await queries.updateTeam(team);
    response.status(200).json(`{"Message":"completed"}`);
};

const updateAnalysis = async (request, response) => {
    const analysis = request.body;
    await queries.updateAnalysis(analysis);
    response.status(200).json(`{"Message":"completed"}`);
};


const getAllJags = async (request, response) => {
    let includeShared;
    if (request.query.includeShared) {
        includeShared = request.query.includeShared.toLowerCase() === `true`;
    } else {
        includeShared = false;
    }
    console.log(`getAllJags  getAllJags getAllJags getAllJags`);

    let ownerFilter = ``;
    if (request.user) {
        ownerFilter = request.user.email;
    } else {
        ownerFilter = ``;
    }

    const jagsReply = await queries.getAllJags(includeShared, ownerFilter);
    const jags = jagsReply.rows;

    for (const jag of jags) {
        const endpointsForReply = await queries.getEndpointsFor(jag.urn);
        const endpointsFor = endpointsForReply.rows;
        jag.endpoints = endpointsFor;

        const bindingsForReply = await queries.getBindingsFor(jag.urn);
        const bindingsFor = bindingsForReply.rows;

        for (const bindingFor of bindingsFor) {
            const fromEndpointReply = await queries.getEndpointById(bindingFor.from);
            const toEndpointReply = await queries.getEndpointById(bindingFor.to);
            bindingFor.from = fromEndpointReply.rows[0];
            bindingFor.to = toEndpointReply.rows[0];
        }
        jag.bindings = bindingsFor;

        const innerJagsForReply = await queries.getInnerJagsFor(jag.urn);
        const innerJagsFor = innerJagsForReply.rows;
        jag.children = innerJagsFor;
    }

    response.status(200).json(jags);
};


const getJagById = async (request, response) => {
    const jagsReply = await queries.getJagById(request.params.jagId);
    const jag = jagsReply.rows;

    const endpointsForReply = await queries.getEndpointsFor(request.params.jagId);
    const endpointsFor = endpointsForReply.rows;
    jag.endpoints = endpointsFor;

    const bindingsForReply = await queries.getBindingsFor(request.params.jagId);
    const bindingsFor = bindingsForReply.rows;
    for (const bindingFor of bindingsFor) {
        const fromEndpointReply = await queries.getEndpointById(bindingFor.from);
        const toEndpointReply = await queries.getEndpointById(bindingFor.to);
        bindingFor.from = fromEndpointReply.rows[0];
        bindingFor.to = toEndpointReply.rows[0];
    }
    jag.bindings = bindingsFor;

    const innerJagsForReply = await queries.getInnerJagsFor(request.params.jagId);
    const innerJagsFor = innerJagsForReply.rows;
    jag.children = innerJagsFor;

    response.status(200).json(jag);
};

const getAllLiveNodes = async (request, response) => {
    const liveNodeList = [];
    const liveNodesReply = await queries.getAllLiveNodes();
    const liveNodes = liveNodesReply.rows;
    liveNodes.forEach((liveNode) => {
        if (liveNode.projectId === liveNode.id) {
            liveNodeList.push(liveNode);
        }
    });
    liveNodeList.forEach((liveNode) => {
        const liveNodeStack = [];
        liveNodeStack.push(liveNode);
        while (liveNodeStack.length > 0) {
            const workLiveNode = liveNodeStack.pop();
            workLiveNode.children = [];
            liveNodes.forEach((liveNode) => {
                if (liveNode.parentId === workLiveNode.id) {
                    workLiveNode.children.push(liveNode);
                    liveNodeStack.push(liveNode);
                }
            });
        }
    });
    response.status(200).json(liveNodeList);
};

const getLiveNodesByProjectId = async (request, response) => {
    let projectHead;
    const liveNodeReply = await queries.getLiveNodesByProjectId(request.params.projectId);
    const liveNodes = liveNodeReply.rows;
    liveNodes.forEach((liveNode) => {
        if (liveNode.projectId === liveNode.id) {
            projectHead = liveNode;
        }
    });

    const liveNodeStack = [];
    liveNodeStack.push(projectHead);
    while (liveNodeStack.length > 0) {
        const workLiveNode = liveNodeStack.pop();
        workLiveNode.children = [];
        liveNodes.forEach((liveNode) => {
            if (liveNode.parentId === workLiveNode.id) {
                workLiveNode.children.push(liveNode);
                liveNodeStack.push(liveNode);
            }
        });
    }
    response.status(200).json(projectHead);
};


const getAllAgents = async (request, response) => {
    const agentsReply = await queries.getAllAgents();
    const agents = agentsReply.rows;
    console.log(`curious-->> ${agentsReply}`);
    console.log(agentsReply);
    response.status(200).json(agents);
};

const getAllTeams = async (request, response) => {
    const teamsReply = await queries.getAllTeams();
    const teams = teamsReply.rows;
    response.status(200).json(teams);
};

const getAllAnalyses = async (request, response) => {
    const analysesReply = await queries.getAllAnalyses();
    const analyses = analysesReply.rows;
    console.log(`curious-->> ${analysesReply}`);
    console.log(analysesReply);
    response.status(200).json(analyses);
};


const deleteLiveNodeProjectById = async (request, response) => {
    await queries.deleteLiveNodeProjectById(request.params.projectId);
    response.status(200).json(`{"Message":"completed"}`);
};

const deleteJagById = async (request, response) => {
    await queries.deleteJagById(request.params.jagId);
    response.status(200).json(`{"Message":"completed"}`);
};


const createTables = async (request, response) => {
    await queries.createTables();
    response.status(200).json({message: `Created all tables`});
};

const dropTables = async (request, response) => {
    await queries.dropTables();
    response.status(200).json({message: `Dropped all tables`});
};

const healthCheck = async (request, response) => {
    response.status(200).json(`{"Message":"completed"}`);
};

export {
    updateJag,
    updateLiveNodes,
    getAllJags,
    getJagById,
    getAllLiveNodes,
    getAllAgents,
    getAllTeams,
    getAllAnalyses,
    updateAgent,
    updateTeam,
    updateAnalysis,
    getLiveNodesByProjectId,
    deleteJagById,
    deleteLiveNodeProjectById,
    createTables,
    dropTables,
    healthCheck
};
