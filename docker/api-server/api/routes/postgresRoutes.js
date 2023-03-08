import express from "express";
import * as pgController from "../controllers/postgresController.js";
// import {checkAuthenticated} from "../authentication/authenticate.js"

import parser from 'body-parser';
import passport from "passport";
const {json} = parser;

const postgresRouter = express.Router();
const bodyParser = json();

postgresRouter.use((req, res, next) => {
    // console.log(`Time: `, new Date());
    console.log(`peeker`);
    next();
});

// //////////////////////////////

const keycloakConfig = {
    clientId: `nodejs-microservice`,
    bearerOnly: true,
    serverUrl: `http://localhost:8080/auth`,
    realm: `Demo-Realm`,
    realmPublicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAO...`
};

// ////////////////////////////////

import {ExtractJwt, Strategy} from 'passport-jwt';

// import expressSession from 'express-session';
//
// import { ExtractJwt, Strategy } from 'passport-jwt';
//
// const memoryStore = new expressSession.MemoryStore();
// const session = {
//     secret: `another_long_secret`,      // used to sign the session ID cookie,
//     cookie: {},
//     resave: false,                      // forces session to be saved back to session store (unwanted)
//     saveUninitialized: true,            // something about uninitialized sessions being saved (bots & tourists)
//     store: memoryStore                  // not exist in one demo
// };
// app.use(expressSession(session));

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = `long_secret-here`;
opts.issuer = `https://jag.baby/auth/realms/realm1`;
// opts.audience = `yoursite.net`;

passport.use(new Strategy(opts, async (token, done) => {
    try {
        console.log(`---------> token = `);
        console.log(token);
        return done(null, token.user);
    } catch (error) {
        console.log(`---------> error = `);
        done(error);
    }
}));

const checkAuthenticated = (req, res, next) => {
    console.log(`checking authenticated...`);
    console.log(req.get("Authorization"));
    passport.authenticate(`jwt`, {session: false})(req, res, next);  //  then to client's redirect_uris -> https://jag.baby/api/v1/auth/callback
};
// ////////////////////


postgresRouter.get(`/activities`, checkAuthenticated, pgController.getAllActivities);
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
postgresRouter.get(`/healthCheck`, pgController.healthCheck);

export {postgresRouter};
