import express from "express";
import * as pgController from "../controllers/postgresController.js";

import parser from 'body-parser';
const {json} = parser;

const postgresRouter = express.Router();
const bodyParser = json();

postgresRouter.use((req, res, next) => {
    // console.log(`Time: `, new Date());
    console.log(`-a do-nothing middleware`);
    console.log(`-inside API postgresRouter-`);
    next();
});

postgresRouter.get(`/activities`, pgController.getAllActivities);
postgresRouter.get(`/activities/:activityId`, pgController.getActivityById);
postgresRouter.get(`/jags`, pgController.getAllJags);
postgresRouter.get(`/agents`, pgController.getAllAgents);
postgresRouter.get(`/teams`, pgController.getAllTeams);
postgresRouter.get(`/analyses`, pgController.getAllAnalyses);
postgresRouter.get(`/jags/:projectId`, pgController.getJagByProjectId);
postgresRouter.put(`/activities`, bodyParser, pgController.updateActivity);
postgresRouter.put(`/jags`, bodyParser, pgController.updateJag);
postgresRouter.put(`/agents`, bodyParser, pgController.updateAgent);
postgresRouter.put(`/teams`, bodyParser, pgController.updateTeam);
postgresRouter.put(`/analyses`, bodyParser, pgController.updateAnalysis);
postgresRouter.delete(`/activities/:activityId`, pgController.deleteActivityById);
postgresRouter.delete(`/jags/:projectId`, pgController.deleteJagByProjectId);
postgresRouter.get(`/createTables`, pgController.createTables);
postgresRouter.get(`/dropTables`, pgController.dropTables);

export {postgresRouter};
