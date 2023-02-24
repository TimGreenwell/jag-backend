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
// const PREFERRED_SOURCE = process.env.PREFERRED_SOURCE || "postgresdb";
// console.log(`Preferred source set as :> ${PREFERRED_SOURCE}`);
const port = process.env.PORT || 8888;
const root = process.argv[2] || `.`;
import path from "path";
import dotenv from "dotenv";
dotenv.config({path: `./.env`});

// Import Api Routes
import {postgresRouter} from "../api/routes/postgresRoutes.js";

// Import Express
import express from "express";
const app = express();

// Import Express Session Authentication
// xxx import {checkAuthenticated} from "../api/authentication/authenticate.js";
import expressSession from 'express-session';
import passport from 'passport';
import {Issuer, Strategy} from "openid-client";

const memoryStore = new expressSession.MemoryStore();
app.use(expressSession({
    secret: `another_long_secret`,
    resave: false,
    saveUninitialized: true,
    store: memoryStore                  // not exist in one demo
}));

app.use(passport.initialize());
app.use(passport.authenticate(`session`));         // ? app.use(passport.session())
// I think here the req.session object is added.

const keycloakIssuer = await Issuer.discover(`http://auth:8080/auth/realms/realm1`);
console.log(`Discovered issuer %s %O`, keycloakIssuer.issuer, keycloakIssuer.metadata);
console.log(`------------------------------------------------------------------------`);
const client = new keycloakIssuer.Client({
    client_id: `client1`,
    client_secret: `long_secret-here`,
    redirect_uris: [`https://jag.baby/jag/auth/callback`],
    post_logout_redirect_uris: [`https://jag.baby/jag/logout/callback`],
    response_types: [`code`]
});
passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
    return done(null, tokenSet.claims());
}));
// I think here the req.session.passport object is added.

passport.serializeUser(function (user, done) {
    console.log('-----------------------------');
    console.log('serialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});
// Called (once) by Strategy to add authenticated user to req.session.passport.user.{..}
// The user is now attached to the session.
passport.deserializeUser(function (user, done) {
    done(null, user);
});
// Populates (constantly) 'user' with req.session.passport.user.{..}
// Calling done(null,user) will attach this to req.user => req.user..{..}

// app.use(express.urlencoded({extended: true}));
// app.use(express.json({limit: `15mb`}));
// app.use(express.json());             // added
// app.use(morgan(`dev`));              // added

app.get(`/jag/auth/callback`, (req, res, next) => {
    console.log(`About to authenticate2`);
    passport.authenticate(`oidc`, {
        successRedirect: `/jag`,
        failureRedirect: `/`
    })(req, res, next);
});

// start logout request
app.get(`/jag/logout`, (req, res) => {
    res.redirect(client.endSessionUrl());
});
app.get(`/logout/callback`, (req, res) => {

// logout callback
app.get(`/jag/logout/callback`, (req, res) => {
    console.log(`Calling logout`);
    // clears the persisted user from the local storage
    req.logout();
    // redirects the user to a public route
    res.redirect(`https://work.greenwell.de`);
});

const checkAuthenticated = (req, res, next) => {
    console.log(`Check if Authenticated`);
    if (req.isAuthenticated()) {
        console.log(`It was...`);
        return next();
    }
    console.log(`It was not...`);
    passport.authenticate(`oidc`)(req, res, next);
};

app.use(`/jag`, checkAuthenticated, express.static(path.join(process.cwd(), root)));
app.use(`/api/v1`, checkAuthenticated, postgresRouter);


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


// https://github.com/austincunningham/keycloak-express-openid-client/blob/master/index.js





