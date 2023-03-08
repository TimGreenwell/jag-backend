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
import path from "path";
import dotenv from "dotenv";
dotenv.config({path: `./.env`});

// Import Api Routes
import {postgresRouter} from "../api/routes/postgresRoutes.js";

// Import Express
import express from "express";
import passport_jwt from "passport-jwt";
const app = express();

// Import Session Configuration
// let accessToken;
// import expressSession from 'express-session';
// import passport from 'passport';
// import {Issuer, Strategy} from "openid-client";
// const memoryStore = new expressSession.MemoryStore();

//
//
// let JwtStrategy = passport_jwt.Strategy;
// let ExtractJwt = passport_jwt.ExtractJwt;
// let opts = {}
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// opts.secretOrKey = 'secret';
// opts.issuer = 'https://jag.baby/auth/realms/realm1';
// opts.algorithms = ["HS256", "HS384"];
// opts.audience = 'client1';
// passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
//     console.log('PassportJwt Strategy being processed');
//     console.log(User)
//
//     User.findOne({id: jwt_payload.sub}, function(err, user) {
//         if (err) {
//             return done(err, false);
//         }
//         if (user) {
//             return done(null, user);
//         } else {
//             return done(null, false);
//             // or you could create a new account
//         }
//     });
//
//     // User.findById(jwtPayload.sub)
//     //     .then((user) => {
//     //         if (user) {
//     //             done(null, user);
//     //         } else {
//     //             done(null, false);
//     //         }
//     //     })
//     //     .catch((error) => {
//     //         done(error, false);
//     //     })
// }));








// Authorization flow
// Step 1) - get instantiated Issuer/IdP/Auth Server -- in our case -> keycloak
// const keycloakIssuer = await Issuer.discover(`http://auth-keycloak:8080/auth/realms/realm1`);
// const client = new keycloakIssuer.Client({
//     client_id: `api-server-postgres-jag`,
//     client_secret: `long_secret-here`,
//     redirect_uris: [`https://jag.baby/api/v1/auth/callback`],
//     post_logout_redirect_uris: [`https://jag.baby/api/v1/logout/callback`],
//     response_types: [`code`]
// });


// const session = {
//     secret: process.env.SECRET,         // used to sign the session ID cookie,
//     cookie: {},
//     resave: false,                      // forces session to be saved back to session store (unwanted)
//     saveUninitialized: true,            // something about uninitialized sessions being saved (bots & tourists)
//     store: memoryStore                  // not exist in one demo
// };
// app.use(expressSession(session));
// app.use(express.json());
// request.session object is added to request.

// app.use(bodyParser.json());
// initializing Passport and the session authentication middleware


// app.use(passport.initialize());
// app.use(passport.authenticate(`session`));


// alias app.use(passport.session());
// request.session.passport object is added to request

// passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
//     console.log(`User Info`);
//     console.log(userinfo);
//     console.log(`-----------------------------`);
//     accessToken = tokenSet.access_token;
//     console.log(accessToken);
//     return done(null, tokenSet.claims());     // returns tokenSet.claims() to serializeUser
// }));

// passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
//     console.log(`User Info`);
//     console.log(userinfo);
//     console.log(`-----------------------------`);
//     accessToken = tokenSet.access_token;
//     console.log(accessToken);
//     return done(null, tokenSet.claims());     // returns tokenSet.claims() to serializeUser
// }));


// passport.serializeUser(function (user, done) {
//     console.log(`-----------------------------`);
//     console.log(`serialize user`);
//     console.log(user);
//     console.log(`-----------------------------`);
//     done(null, user);
//     // So in effect during "serializeUser", the PassportJS library adds the authenticated user
//     // to end of the "req.session.passport" object. This allows the authenticated user to be
//     // "attached" to a unique session. Directly maintains authenticated users for each session
//     // within the "req.session.passport.user.{..}"
// });


// passport.deserializeUser(function (user, done) {
//     done(null, user);
// });
//
// app.get(`/api/v1/auth/callback`, (req, res, next) => {
//     console.log(`in /api/v1/auth/callback -- passport.authenticate`);
//     // Two kinds of passport.authenticate.  This authenticates and routes.
//     // (accessToken is not defined here)
//     passport.authenticate(`oidc`, {
//         successRedirect: `/api/v1`,
//         failureRedirect: `https://www.greenwell.de`
//     })(req, res, next);
// });

// app.get(`/api/v1/logout`, (req, res) => {
//     res.redirect(client.endSessionUrl());
// });
//
// app.get(`/api/v1/logout/callback`, (req, res) => {
//     console.log(`Calling logout`);
//     // clears the persisted user from the local storage
//     req.logout();
//     res.redirect(`https://work.greenwell.de`);
// });



// google this-> app.use(passport.authenticate  jwt session
/*
 * additional express app config
 * app.use(bodyParser.json());
 * app.use(bodyParser.urlencoded({ extended: false }));
 */

app.use(`/api/v1`, postgresRouter);



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