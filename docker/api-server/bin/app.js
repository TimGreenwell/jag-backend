/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 *
 * https://medium.com/devops-dudes/securing-node-js-express-rest-apis-with-keycloak-a4946083be51
 * Delete after dev -- morgan(HTTP logger)
 * api-server-postgres-jag
 */

'use strict';

// Import configuration
import dotenv from "dotenv";
dotenv.config({path: `./.env`});
const port = process.env.PORT || 8888;

import {postgresRouter} from "../api/routes/postgresRoutes.js";
import express from "express";
const app = express();

// Middleware
app.get(`/api/v1/healthCheck`, (req, res, next) => {
    res.status(200).send(`{"Message" : "Running"}`);
});
app.use(express.json())
app.use(`/api/v1`, postgresRouter);

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
 */
