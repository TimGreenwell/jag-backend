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
const keyCache = new Map();
import fetch from "node-fetch";

// Import Express
import express, {response} from "express";
import bodyParser from 'body-parser';
import jwt from "jsonwebtoken";
const app = express();


// ////////////////////////////////


// Import Session Configuration
let accessToken;
import expressSession from 'express-session';
import passport from 'passport';
import {Issuer, Strategy} from "openid-client";   // Keycloak-connect is deprecated
const memoryStore = new expressSession.MemoryStore();

// Authorization flow
// Step 1) - get instantiated Issuer/IdP/Auth Server -- in our case -> keycloak
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
    // passport.authenticate() is middleware which will authenticate the request. By default, when authentication succeeds,
    //     1) the req.user property is set to the authenticated user,
    //     2) login session is established,
    // Two kinds of passport.authenticate.  This sets up the authenticator
    passport.authenticate(`oidc`)(req, res, next);  //  then to client's redirect_uris -> https://jag.baby/jag/auth/callback
};

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

const session = {
    secret: process.env.SECRET,         // sign session ID cookie (prevent users from changing cookies?),
    cookie: {},
    resave: false,                      // forces session to be saved back to session store (unwanted)
    saveUninitialized: false,            // something about uninitialized sessions being saved (bots & (healthchecks?))
    store: memoryStore                  // not exist in one demo
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
    // So in effect during "serializeUser", the PassportJS library adds the authenticated user
    // to end of the "req.session.passport" object. Directly maintains authenticated users for each session
    // within the "req.session.passport.user.{..}"
});
// Populates (constantly) 'user' with req.session.passport.user.{..}

passport.deserializeUser(function (user, done) {
    done(null, user);
});
// + req.user   (initiated by session validation)

app.get(`/jag/auth/callback`, (req, res, next) => {
    console.log(`in /jag/auth/callback -- passport.authenticate`);
    // Two kinds of passport.authenticate.  This authenticates and routes.
    // (accessToken is not defined here)
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
    console.log(`Calling logout`);
    // clears the persisted user from the local storage
    req.logout();
    res.redirect(`https://work.greenwell.de`);
});

const jsonParser = bodyParser.json();
app.all([`/jag/api/v1`, `/jag/api/v1*`], jsonParser , async (req, res) => {
    const newUrl = req.url.replace(`/jag`, ``);
    console.log(`req outgoing to http://api-server:8888${newUrl}`);
    let options = {method: req.method,
        headers: {
            "Content-Type": `application/json`,
            Authorization: `Bearer ${accessToken}`
        }};
    console.log("++++++")
    console.log(req.body);
    if ((req.method === `POST`) || (req.method === `PUT`)) {
        options = {...options,
            body: JSON.stringify(req.body)};
    }
    console.log(options);

    const remoteResponse = await fetch(`http://api-server:8888${newUrl}`, options);
    // const remoteResponseJson = await remoteResponse.json();
    const remoteResponseJson = await remoteResponse.text();
    console.log(`remoteResponse`);
    console.log(remoteResponseJson);
    res.status(200).send(remoteResponseJson);
    ////       ITS IN HERE SOMEWHERE   - TEXT VS JSON
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


// https://medium.com/devops-dudes/secure-nestjs-rest-api-with-keycloak-745ef32a2370
// https://access.redhat.com/documentation/en-us/red_hat_single_sign-on_continuous_delivery/5/html-single/securing_applications_and_services_guide/index#nodejs_adapter
