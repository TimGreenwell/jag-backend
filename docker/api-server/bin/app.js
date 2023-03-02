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
const port = process.env.PORT || 8888;
const root = process.argv[2] || `.`;
// import path from "path";
import dotenv from "dotenv";
dotenv.config({path: `./.env`});

// Import Api Routes
import {postgresRouter} from "../api/routes/postgresRoutes.js";

// Import Express
import express from "express";
const app = express();

// Import Express Session Authentication
import expressSession from 'express-session';
import passport from 'passport';
import {Issuer, Strategy} from "openid-client";

const memoryStore = new expressSession.MemoryStore();
const session = {
    secret: `another_long_secret`,      // used to sign the session ID cookie,
    cookie: {},
    resave: false,                      // forces session to be saved back to session store (unwanted)
    saveUninitialized: true,            // something about uninitialized sessions being saved (bots & tourists)
    store: memoryStore                  // not exist in one demo
};
app.use(expressSession(session));
// request.session object is added to request.

const keycloakIssuer = await Issuer.discover(`http://auth-keycloak:8080/auth/realms/realm1`);
const client = new keycloakIssuer.Client({
    client_id: `jag-api-postgres`,
    client_secret: `long_secret-here`,
    redirect_uris: [`https://jag.baby/api/v1/auth/callback`],
    post_logout_redirect_uris: [`https://jag.baby/api/v1/logout/callback`],
    response_types: [`code`]
});
passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
    return done(null, tokenSet.claims());
}));
// request.session.passport object is added to request
app.use(passport.initialize());
app.use(passport.authenticate(`session`));

passport.serializeUser(function (user, done) {
    console.log(`-----------------------------`);
    console.log(`serialize user`);
    console.log(user);
    console.log(`-----------------------------`);
    done(null, user);
});
// Called (once) by Strategy to add authenticated user to req.session.passport.user.{..}
// The user is now attached to the session.
passport.deserializeUser(function (user, done) {
    done(null, user);
});
// Populates (constantly) 'user' with req.session.passport.user.{..}
// Calling done(null,user) will attach this to req.user => req.user..{..}

app.get(`/api/v1/auth/callback`, (req, res, next) => {
    console.log(`About to authenticate2`);
    passport.authenticate(`oidc`, {
        successRedirect: `/api/v1`,
        failureRedirect: `https://www.greenwell.de`
    })(req, res, next);
});

// start logout request
app.get(`/api/v1/logout`, (req, res) => {
    res.redirect(client.endSessionUrl());
});

// logout callback
app.get(`/api/v1/logout/callback`, (req, res) => {
    console.log(`Calling logout`);
    // clears the persisted user from the local storage
    req.logout();
    // redirects the user to a public route
    res.redirect(`https://work.greenwell.de`);
});

const checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    passport.authenticate(`oidc`)(req, res, next);
};

// function myMiddleware1(req, res, next) {
//     if (req.user) {
//         req.newProperty = req.user;
//         res.newProperty = req.user;
//         res.set({
//             whoami: req.user
//         });
//     }
//     next();
// }
//
// app.use(myMiddleware1);

// app.use(`/jag`, checkAuthenticated, express.static(path.join(process.cwd(), root)));
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