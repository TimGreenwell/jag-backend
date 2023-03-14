import express from "express";
import * as pgController from "../controllers/postgresController.js";
import {checkAuthenticated} from "../authentication/authenticate.js";

const postgresRouter = express.Router();

postgresRouter.get(`/jags`, checkAuthenticated, pgController.getAllJags);
postgresRouter.get(`/jags/:jagId`, checkAuthenticated, pgController.getJagById);
postgresRouter.get(`/livenodes`, checkAuthenticated, pgController.getAllLiveNodes);
postgresRouter.get(`/agents`, checkAuthenticated, pgController.getAllAgents);
postgresRouter.get(`/teams`, checkAuthenticated, pgController.getAllTeams);
postgresRouter.get(`/analyses`, checkAuthenticated, pgController.getAllAnalyses);
postgresRouter.get(`/livenodes/:projectId`, checkAuthenticated, pgController.getLiveNodesByProjectId);
postgresRouter.put(`/jags`, checkAuthenticated, pgController.updateJag);
postgresRouter.put(`/livenodes`, checkAuthenticated, pgController.updateLiveNodes);
postgresRouter.put(`/agents`, checkAuthenticated, pgController.updateAgent);
postgresRouter.put(`/teams`, checkAuthenticated, pgController.updateTeam);
postgresRouter.put(`/analyses`, checkAuthenticated, pgController.updateAnalysis);
postgresRouter.delete(`/jags/:jagId`, checkAuthenticated, pgController.deleteJagById);
postgresRouter.delete(`/livenodes/:projectId`, checkAuthenticated, pgController.deleteLiveNodeProjectById);
postgresRouter.get(`/createTables`, pgController.createTables);
postgresRouter.get(`/dropTables`, checkAuthenticated, pgController.dropTables);
postgresRouter.get(`/healthCheck`, checkAuthenticated, pgController.healthCheck);

export {postgresRouter};
