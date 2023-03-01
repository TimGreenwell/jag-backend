import * as queries from "../sql/postgres/queries.js";

const updateActivity = async (request, response) => {
    const activity = request.body;
    await queries.updateActivity(activity, request.user.email);

    const children = activity.children;
    for (const child of children) {
        await queries.updateSubactivity(child, activity.urn);
    }

    const endpoints = activity.endpoints;
    for (const endpoint of endpoints) {
        await queries.updateEndpoint(endpoint, activity.urn);
    }

    const bindings = activity.bindings;
    for (const binding of bindings) {
        await queries.updateBinding(binding, activity.urn);
    }
    response.status(204).send(`{}`);
};

const updateJag = async (request, response) => {
    const jag = request.body;
    const workStack = [];
    workStack.push(jag);
    while (workStack.length > 0) {
        const currentNode = workStack.pop();
        await queries.updateJag(currentNode);
        currentNode.children.forEach((child) => {
            workStack.push(child);
        });
    }
    response.status(204).send(`{}`);
};


const updateAgent = async (request, response) => {
    const agent = request.body;
    await queries.updateAgent(agent);
    response.status(204).send(`{}`);
};


const updateTeam = async (request, response) => {
    const team = request.body;
    await queries.updateTeam(team);
    response.status(204).send(`{}`);
};

const updateAnalysis = async (request, response) => {
    const analysis = request.body;
    await queries.updateAnalysis(analysis);
    response.status(204).send(`{}`);
};


const getAllActivities = async (request, response) => {
    let includeShared;
    if (request.query.includeShared) {
        includeShared = request.query.includeShared.toLowerCase() === `true`;
    } else {
        includeShared = false;
    }
    console.log(`getAllActivities  getAllActivities getAllActivities getAllActivities`);
    const activitiesReply = await queries.getAllActivities(includeShared, request.user.email);
    const activities = activitiesReply.rows;

    for (const activity of activities) {
        const endpointsForReply = await queries.getEndpointsFor(activity.urn);
        const endpointsFor = endpointsForReply.rows;
        activity.endpoints = endpointsFor;

        const bindingsForReply = await queries.getBindingsFor(activity.urn);
        const bindingsFor = bindingsForReply.rows;

        for (const bindingFor of bindingsFor) {
            const fromEndpointReply = await queries.getEndpointById(bindingFor.from);
            const toEndpointReply = await queries.getEndpointById(bindingFor.to);
            bindingFor.from = fromEndpointReply.rows[0];
            bindingFor.to = toEndpointReply.rows[0];
        }
        activity.bindings = bindingsFor;

        const subactivitiesForReply = await queries.getSubActivitiesFor(activity.urn);
        const subactivitiesFor = subactivitiesForReply.rows;
        activity.children = subactivitiesFor;
    }

    response.status(200).json(activities);
};


const getActivityById = async (request, response) => {
    const activitiesReply = await queries.getActivityById(request.params.activityId);
    const activity = activitiesReply.rows;

    const endpointsForReply = await queries.getEndpointsFor(request.params.activityId);
    const endpointsFor = endpointsForReply.rows;
    activity.endpoints = endpointsFor;

    const bindingsForReply = await queries.getBindingsFor(request.params.activityId);
    const bindingsFor = bindingsForReply.rows;
    for (const bindingFor of bindingsFor) {
        const fromEndpointReply = await queries.getEndpointById(bindingFor.from);
        const toEndpointReply = await queries.getEndpointById(bindingFor.to);
        bindingFor.from = fromEndpointReply.rows[0];
        bindingFor.to = toEndpointReply.rows[0];
    }
    activity.bindings = bindingsFor;

    const subactivitiesForReply = await queries.getSubActivitiesFor(request.params.activityId);
    const subactivitiesFor = subactivitiesForReply.rows;
    activity.children = subactivitiesFor;

    response.status(200).json(activity);
};

const getAllJags = async (request, response) => {
    const jagList = [];
    const jagsReply = await queries.getAllJags();
    const jags = jagsReply.rows;
    jags.forEach((jag) => {
        if (jag.projectId === jag.id) {
            jagList.push(jag);
        }
    });
    jagList.forEach((jag) => {
        const workStack = [];
        workStack.push(jag);
        while (workStack.length > 0) {
            const workJag = workStack.pop();
            workJag.children = [];
            jags.forEach((jag) => {
                if (jag.parentId === workJag.id) {
                    workJag.children.push(jag);
                    workStack.push(jag);
                }
            });
        }
    });
    response.status(200).json(jagList);
};

const getJagByProjectId = async (request, response) => {
    let projectHead;
    const jagsReply = await queries.getJagByProjectId(request.params.projectId);
    const jags = jagsReply.rows;
    jags.forEach((jag) => {
        if (jag.projectId === jag.id) {
            projectHead = jag;
        }
    });

    const workStack = [];
    workStack.push(projectHead);
    while (workStack.length > 0) {
        const workJag = workStack.pop();
        workJag.children = [];
        jags.forEach((jag) => {
            if (jag.parentId === workJag.id) {
                workJag.children.push(jag);
                workStack.push(jag);
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


const deleteJagByProjectId = async (request, response) => {
    await queries.deleteJagByProjectId(request.params.projectId);
    response.status(204).send(`{}`);
};

const deleteActivityById = async (request, response) => {
    await queries.deleteActivityById(request.params.activityId);
    response.status(204).send(`{}`);
};


const createTables = async (request, response) => {
    await queries.createTables();
    response.json({message: `Created all tables`});
};

const dropTables = async (request, response) => {
    await queries.dropTables();
    response.json({message: `Dropped all tables`});
};

export {
    updateActivity,
    updateJag,
    getAllActivities,
    getActivityById,
    getAllJags,
    getAllAgents,
    getAllTeams,
    getAllAnalyses,
    updateAgent,
    updateTeam,
    updateAnalysis,
    getJagByProjectId,
    deleteActivityById,
    deleteJagByProjectId,
    createTables,
    dropTables
};
