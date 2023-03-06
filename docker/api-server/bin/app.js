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

// google this-> app.use(passport.authenticate  jwt session
/*
 * additional express app config
 * app.use(bodyParser.json());
 * app.use(bodyParser.urlencoded({ extended: false }));
 */

app.use(`/api/v1`,  postgresRouter);


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