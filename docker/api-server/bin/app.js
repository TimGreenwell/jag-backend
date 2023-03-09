/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 *
 * https://medium.com/devops-dudes/securing-node-js-express-rest-apis-with-keycloak-a4946083be51
 * Delete after dev -- morgan(HTTP logger)
 */

'use strict';

// Import configuration
import * as pgController from "../api/controllers/postgresController.js";
import fetch from "node-fetch";
const port = process.env.PORT || 8888;
const root = process.argv[2] || `.`;
import path from "path";
import dotenv from "dotenv";
dotenv.config({path: `./.env`});

// Import Express
import jwt from "jsonwebtoken";
import parser from 'body-parser';
import passport from "passport";
const {json} = parser;
import express from "express";
const postgresRouter = express.Router();
const bodyParser = json();
const app = express();

import {ExtractJwt, Strategy} from 'passport-jwt';


// ///////////////////

const keyCache = new Map();
// ////////////////////////////////
const fetchPublicKeys = async ({realm, authServerUrl, useCache}) => {
    const url = `${authServerUrl}/auth/realms/${realm}/protocol/openid-connect/certs`;
    if (useCache && keyCache[url]) {
        return keyCache.get(url);
    } else {
        const jsonwebtoken = await fetch(url, {method: `GET`,
            headers: {"Content-Type": `application/json`}});
        const jwt = await jsonwebtoken.json();

        const keys = jwt ? jwt.keys : `No Keys`;
        let rsaKey;
        keys.forEach((key) => {
            if (key.kty === `RSA`) {
                rsaKey = key;
            }
        });
        keyCache.set(url, rsaKey);
        return rsaKey;
    }
};


// ////////////////


const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = `long_secret-here`;
opts.issuer = `https://jag.baby/auth/realms/realm1`;
// opts.algorithms = ["HS256", "HS384"];
// opts.audience = 'client1';

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


// Authorization flow   ??????????????  needed -- how else know client?
// Step 1) - get instantiated Issuer/IdP/Auth Server -- in our case -> keycloak
// const keycloakIssuer = await Issuer.discover(`http://auth-keycloak:8080/auth/realms/realm1`);
// const client = new keycloakIssuer.Client({
//     client_id: `api-server-postgres-jag`,
//     client_secret: `long_secret-here`,
//     redirect_uris: [`https://jag.baby/api/v1/auth/callback`],
//     post_logout_redirect_uris: [`https://jag.baby/api/v1/logout/callback`],
//     response_types: [`code`]
// });

// app.use(passport.initialize());
// app.use(passport.authenticate(`session`));


// google this-> app.use(passport.authenticate  jwt session
/*
 * additional express app config
 * app.use(bodyParser.json());
 * app.use(bodyParser.urlencoded({ extended: false }));
 */

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

const checkAuthenticated = async (req, res, next) => {
    console.log(`Pulling Public Keys - RSA`);
    const rsaKey = await fetchPublicKeys({realm: `realm1`,
        authServerUrl: `http://auth-keycloak:8080`});
    console.log(`checking authenticated...`);

    // (req.get("Authorization"));      <--- get jwt
    // req.headers.authorization         <--- get jwt
    const token = req.headers.authorization.split(` `)[1];
    // const x5c = `-----BEGIN PUBLIC KEY-----${rsaKey.x5c[0]} -----END PUBLIC KEY-----`
    const x5c = rsaKey.x5c.pop();
    console.log(`x5c- > ${JSON.stringify(x5c)}`)
    jwt.verify(token, x5c.replace(/\\n/g, '\n'), {algorithms: [`RS256`]}, (err, decoded) => {
        console.log(`-1-`);
        console.log(err);
        console.log(`-2-`);
        console.log(decoded);
    });
    console.log(`.3.`);
    passport.authenticate(`jwt`, {session: false})(req, res, next);  //  then to client's redirect_uris -> https://jag.baby/api/v1/auth/callback
};

app.use(`/api/v1`, postgresRouter);

postgresRouter.get(`/activities`, await checkAuthenticated, pgController.getAllActivities);
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

// app.get('/accessResource', (req, res)=>{
//     const token = req.headers.authorization.split(' ')[1];
//     //Authorization: 'Bearer TOKEN'
//     if(!token)
//     {
//         res.status(200).json({success:false, message: "Error!
//             Token was not provided."});
//         }
//         //Decoding the token
//         const decodedToken = jwt.verify(token,"secretkeyappearshere" );
//         res.status(200).json({success:true, data:{userId:decodedToken.userId,
//                 email:decodedToken.email});
//     })

const server = app.listen(port);

server.on(`listening`, () => {
    return console.log(`API server started on ${port}`);
});

process.on(`SIGTERM`, () => {
    console.error(`\nTerminating server.`);
    server.close();
});

process.on(`SIGINT`, () => {
    console.error(`\nInterrupting server.`);
    server.close();
});

/**
 * To run -
 * npm start - official
 * npm run dev - to use nodemon (auto server restarts)
 *
 * Middleware we can delete after dev --
 * morgan - logging HTTP requests on the terminal
 *
 * Dotenv useful as dev for setting environment variables... used by node's process and docker-compose
 */
