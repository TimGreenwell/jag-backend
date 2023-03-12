# Joint Activity Graph Authoring Tool (JAGAT)

The Joint Activity Graph (JAG) is a concept created by Dr. Matt Johnson et. al. from the Florida Institute for Human and Machine Cognition (IHMC) in "Understanding Human-Autonomy Teaming through Interdependence AnalysisModel" (2019). A JAG represents the ability of multiple agents in a human-machine or machine-machine team to work independent and interdependent of one another to accomplish a goal or task, and can be represented fundamentally as a tree with distinct, meaningful properties to HAT applications.

## Purpose

The JAGAT web application provides a friendly user interface for drag-and-drop creating of JAGs and connection to the JAG Core engine, written in Java.

## Dependencies

JAGAT runs on LiveNode.js utilizing the Express.js web application framework and a variety of propriety graphics and logic modules.

## Getting Started

To run JAGAT, you will need the LiveNode Package Manager (npm). Clone this repository or extract a compressed copy to a target directory, navigate to the target directory in a terminal, and execute

`npm install`

to automatically install the required modules. There are three default configurations to run JAGAT: development, secure, and production. To run any environment, execute

`node bin/app.js <environment>`

where \<environment> is `develpoment`, `secure` or `production`.

Alternatively, when running the development environment, you may simply use

`npm start`

### Environments

`development`: runs on port 8888 by default and uses HTTP. Cookies are insecure, unreliable and accessible on client-side.

`secure`: runs on port 8888 by default and uses HTTPS with local SSL credentials in `ssl/` (not provided). Cookies are secure, reliable and inaccessible on client-side.

`production`: runs on port 8889 by default and uses HTTPS; uses local SSL credentials in `ssl/` by default (not provided), but this is heavily discouraged in true production deployments. Cookies are secure, reliable and inaccessible on client-side.

Environment specific configurations are found in `config/env/`. Each configuration must be named identical to the environment used, and must exist. Missing or broken configurations will prevent JAGAT from running and throw a verbose error detailing the requirement.

Cookie secrets provided in `config/credentials.js` are random and should be replaced.