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
const port = 8888;
const root = process.argv[2] || `.`;
import path from "path";
import dotenv from "dotenv";
dotenv.config({path: `./.env`});

// Import Express
import express from "express";
import bodyParser from 'body-parser';
const app = express();

// Import Session Configuration
import expressSession from 'express-session';
import passport from 'passport';
import {Issuer, Strategy} from "openid-client";
const memoryStore = new expressSession.MemoryStore();
const session = {
    secret: process.env.SECRET,         // used to sign the session ID cookie,
    cookie: {},
    resave: false,                      // forces session to be saved back to session store (unwanted)
    saveUninitialized: true,            // something about uninitialized sessions being saved (bots & tourists)
    store: memoryStore                  // not exist in one demo
};

const keycloakIssuer = await Issuer.discover(`http://auth-keycloak:8080/auth/realms/realm1`);
const client = new keycloakIssuer.Client({
    client_id: `client1`,
    client_secret: `long_secret-here`,
    redirect_uris: [`https://jag.baby/jag/auth/callback`],
    post_logout_redirect_uris: [`https://jag.baby/jag/logout/callback`],
    response_types: [`code`]
});
const checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    passport.authenticate(`oidc`)(req, res, next);
    console.log(`## ${req.user} ##`);
    // passport.authenticate() is middleware which will authenticate the request. By default, when authentication succeeds,
    //     1) the req.user property is set to the authenticated user,
    //     2) login session is established,
};


app.use(expressSession(session));
// request.session object is added to request.

app.use(bodyParser.json());
// initializing Passport and the session authentication middleware
app.use(passport.initialize());
app.use(passport.authenticate(`session`));

//google this-> app.use(passport.authenticate  jwt session
// alias app.use(passport.session());
// request.session.passport object is added to request

passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
    return done(null, tokenSet.claims());
}));
// authenticate a strategy (one-time) -> serialize user to storage
passport.serializeUser(function (user, done) {
    console.log(`-----------------------------`);
    console.log(`serialize user`);
    console.log(user);
    console.log(`-----------------------------`);
    done(null, user);
});
// Populates (constantly) 'user' with req.session.passport.user.{..}

// authenticate a session  (everytime) -> deserialize user ! this adds req.user
// The user is now attached to the session.
passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.get(`/jag/auth/callback`, (req, res, next) => {
    console.log(`in /jag/auth/callback -- passport.authenticate`);
    passport.authenticate(`oidc`, {
        successRedirect: `/jag`,
        failureRedirect: `https://www.greenwell.de`
    })(req, res, next);
    console.log(`--> ${JSON.stringify(req.body)}`);
    console.log(`#--#`);
    console.log(req.user);
    console.log(`#--#`);
});

// start logout request
app.get(`/jag/logout`, (req, res) => {
    res.redirect(client.endSessionUrl());
});

// logout callback
app.get(`/jag/logout/callback`, (req, res) => {
    console.log(`Calling logout`);
    // clears the persisted user from the local storage
    req.logout();
    // redirects the user to a public route
    res.redirect(`https://work.greenwell.de`);
});

app.use(`/jag`, (req, res, next) => {
    console.log(`--> ${req.headers["authorization"]}`);

    next();
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
// -session storage-, or -cookie storage-.
//
// 4) On future requests, the JWT is added to the authorization header prefixed by the bearer,
// and the server will validate its signature by decoding the token before proceeding to send a
// response. The content of the header would look like this: Authorization: Bearer <token>.
//
// 5) On the logout operation, the token on the client-side is destroyed without server interaction.
//
