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
import express, {response} from "express";
import bodyParser from 'body-parser';
import jwt from "jsonwebtoken";
const app = express();

// Import Session Configuration
let accessToken;
import expressSession from 'express-session';
import passport from 'passport';
import {Issuer, Strategy} from "openid-client";
const memoryStore = new expressSession.MemoryStore();


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
    // passport.authenticate() is middleware which will authenticate the request. By default, when authentication succeeds,
    //     1) the req.user property is set to the authenticated user,
    //     2) login session is established,
    // Two kinds of passport.authenticate.  This sets up the authenticator
    passport.authenticate(`oidc`)(req, res, next);  //  then to client's redirect_uris -> https://jag.baby/jag/auth/callback
};

const session = {
    secret: process.env.SECRET,         // used to sign the session ID cookie,
    cookie: {},
    resave: false,                      // forces session to be saved back to session store (unwanted)
    saveUninitialized: true,            // something about uninitialized sessions being saved (bots & tourists)
    store: memoryStore                  // not exist in one demo
};
app.use(expressSession(session));
// request.session object is added to request.

// app.use(bodyParser.json());
// initializing Passport and the session authentication middleware
app.use(passport.initialize());
app.use(passport.authenticate(`session`));
// alias app.use(passport.session());
// request.session.passport object is added to request

passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
    console.log(`User Info`);
    console.log(userinfo);
    console.log(`-----------------------------`);
    accessToken = tokenSet.access_token;
    console.log(accessToken);
    return done(null, tokenSet.claims());     // returns tokenSet.claims() to serializeUser
}));

// authenticate a strategy (one-time) -> serialize user to storage
passport.serializeUser(function (user, done) {
    console.log(`-----------------------------`);
    console.log(`serialize user`);
    console.log(user);
    console.log(`-----------------------------`);
    done(null, user);
    // So in effect during "serializeUser", the PassportJS library adds the authenticated user
    // to end of the "req.session.passport" object. This allows the authenticated user to be
    // "attached" to a unique session. Directly maintains authenticated users for each session
    // within the "req.session.passport.user.{..}"
});
// Populates (constantly) 'user' with req.session.passport.user.{..}

// authenticate a session  (everytime) -> deserialize user ! this adds req.user
// The .user is now attached to the session.
passport.deserializeUser(function (user, done) {
    done(null, user);
});

// Middleware to see how the params are populated by Passport
let count = 1;

let printData = (req, res, next) => {
    console.log(`\n==============================`);
    console.log(`------------>  ${count++}`);

    console.log(`req.body.username -------> ${req.body.username}`);
    console.log(`req.body.password -------> ${req.body.password}`);

    console.log(`\n req.session.passport -------> `);
    console.log(req.session.passport);

    console.log(`\n req.user -------> `);
    console.log(req.user);

    console.log(`\n Session and Cookie`);
    console.log(`req.session.id -------> ${req.session.id}`);
    console.log(`req.session.cookie -------> `);
    console.log(req.session.cookie);

    console.log(`===========================================\n`);

    next();
};

app.use(printData);
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
    // redirects the user to a public route
    res.redirect(`https://work.greenwell.de`);
});

app.use(`/jag`, (req, res, next) => {
    console.log(`##########>  ${accessToken}`);
    // res.header(`Authorization`, `Bearer ${accessToken}`);
    res.cookie(`access_token`, accessToken, {
        httpOnly: true,
        secure: false
    });
    // res.setHeader(`Authorization`, `Bearer ${accessToken}`);
    next();
});

//  The hard way -- goodbye weekend
// app.use(cookieParser());
// app.use(`/jag`, (req, res, next) => {
//     if (req.session && req.session.passport && req.session.passport.user) {
//         console.log(`GOT A PASSPORT USER`);
//         const privateKEY = process.env.JWT_KEY;
//         const signOptions = {
//             issuer: `https://jag.baby/auth/realms/realm1`,
//             subject: `ed981ea7-2a11-4d3d-bdbf-8e1bb5c4b0eb`,
//             audience: `client1`,
//             expiresIn: `12h`,
//             algorithm: `RS256`
//         };
//         console.log(privateKEY);
//         const token = jwt.sign(req.session.passport.user, privateKEY, signOptions);
//         console.log("Token - " + token)
//         res.cookie(`access_token`, token, {
// //             httpOnly: true,
// //             secure: process.env.NODE_ENV === `production`
// //         });
//     } else {
//         console.log(`NO PASSPORT USER NOW`);
//     }
//     next();
// });


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