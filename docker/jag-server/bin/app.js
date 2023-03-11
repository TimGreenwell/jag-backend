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

// App configuration
const port = process.env.PORT || 8888;
const root = process.argv[2] || `.`;
import path from "path";
import dotenv from "dotenv";
dotenv.config({path: `./.env`});

// Import Express
import express, {response} from "express";
import bodyParser from 'body-parser';
const app = express();
import expressSession from 'express-session';

// Authentication
import fetch from "node-fetch";
let accessToken;
import passport from 'passport';
import {Issuer, Strategy} from "openid-client";   // Keycloak-connect is deprecated
const memoryStore = new expressSession.MemoryStore();
const session = {
    secret: process.env.SECRET,         // sign session ID cookie (prevent users from changing cookies?),
    cookie: {},
    resave: false,                      // forces session to be saved back to session store (unwanted)
    saveUninitialized: false,            // something about uninitialized sessions being saved (bots & (healthchecks?))
    store: memoryStore                  // not exist in one demo
};

// Authorization flow
// get instantiated Issuer/IdP/Auth Server (keycloak)
const keycloakIssuer = await Issuer.discover(`http://auth-keycloak:8080/auth/realms/realm1`);
const client = new keycloakIssuer.Client({
    client_id: `client1`,
    client_secret: `NmU3WVp8WdZFG5MSQS1DcC3aGXE4Y1tx`,
    redirect_uris: [`https://jag.baby/jag/auth/callback`],
    post_logout_redirect_uris: [`https://jag.baby/jag/logout/callback`],
    response_types: [`code`]
});

const checkAuthenticated = async (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    //     1) the req.user property is set to the authenticated user,
    //     2) login session is established,
    // Two kinds of passport.authenticate.  This sets up the authenticator
    passport.authenticate(`oidc`)(req, res, next);
    //  then to client's redirect_uris -> https://jag.baby/jag/auth/callback
};

app.get(`/jag/healthCheck`, (req, res) => {
    res.status(200).send(`{}`);
});
app.use(expressSession(session));
app.use(express.json());
// +request.session object

app.use(passport.initialize());
app.use(passport.authenticate(`session`));
// +request.session.passport

passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
    console.log(`${userinfo.preferred_username} has logged in.`);
    accessToken = tokenSet.access_token;
    return done(null, tokenSet.claims());     // returns tokenSet.claims() ---> serializeUser
}));

// authenticate a strategy (one-time) -> serialize user to storage
passport.serializeUser(function (user, done) {
    console.log(`${user.preferred_username} has been serialized into the Sessions`);
    done(null, user);
    // The PassportJS library adds the authenticated user to end of the "req.session.passport" object. Directly maintains
    // authenticated users for each session within the "req.session.passport.user.{..}"
    // +req.session.passport.user.{..}
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});
// + req.user   (initiated by session validation)

app.get(`/jag/auth/callback`, (req, res, next) => {
    // Two kinds of passport.authenticate.  This authenticates and routes.
    passport.authenticate(`oidc`, {
        successRedirect: `/jag`,
        failureRedirect: `https://www.greenwell.de`
    })(req, res, next);
});

// start logout request
app.get(`/jag/logout`, (req, res) => {
    res.redirect(client.endSessionUrl());
});

// logout callback
app.get(`/jag/logout/callback`, (req, res) => {
    req.logout();
    res.redirect(`https://work.greenwell.de`);
});

const jsonParser = bodyParser.json();
app.all([`/jag/api/v1`, `/jag/api/v1*`], jsonParser , async (req, res) => {
    const newUrl = req.url.replace(`/jag`, ``);
    let options = {method: req.method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }};
    let body = req.body;
    let bodyString = JSON.stringify(body);
    if ((req.method === `POST`) || (req.method === `PUT`)) {
        options = {...options,
            "body": bodyString};
    }
    const remoteResponse = await fetch(`http://api-server:8888${newUrl}`, options);
    const remoteResponseObj = await remoteResponse.json();
    res.status(200).json(remoteResponseObj);
});

app.use(`/jag`, checkAuthenticated, express.static(path.join(process.cwd(), root)));

const server = app.listen(port);

server.on(`listening`, () => {
    return console.log(`JAG server started on ${port}`);
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

//
// 1) The user submits login credentials to the backend server.
//
// 2) Upon the request, the server verifies the credentials before generating an encrypted
// JWT with a secret key and sends it back to the client.
//
// 3) On the client-side, the browser stores the token locally using the -local storage-,
// -session storage-, or -(cookie storage)-.
//
// 4) On future requests, the JWT is added to the authorization header prefixed by the bearer,
// and the server will validate its signature by decoding the token before proceeding to send a
// response. The content of the header would look like this: Authorization: Bearer <token>.
//
// 5) On the logout operation, the token on the client-side is destroyed without server interaction.
//
