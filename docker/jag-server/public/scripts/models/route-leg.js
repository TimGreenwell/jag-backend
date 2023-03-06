/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import RouteEndpoint from "./endpoint.js";

export default class RouteLeg extends EventTarget {

    constructor({
        id,
        sourceEndpoint = new RouteEndpoint(),
        destinationEndpoints = []   // Array of RouteEndpoint;
    } = {}) {
        super();
        this._id = id;
        this._sourceEndpoint = sourceEndpoint;
        this._destinationEndpoints = destinationEndpoints;
        this._status = null;
    }


}

/*

Notes:
Patterns to consider:
Message - simple message exchange (might be converted into multiple messages)
Headers might include: expiration(ttl?), sequenceNumber, type(command/document)

Message Channel - message inserted into certain named channel
CompetingConsumers - several consumers compete for messages.
Content-Based Routing - something in message determines which client gets it (.choice.when(header("type").isEqualTo("ff"))
Selective Consumer - Consumer chooses which messages to take.
Event-Driven Consumer - (asynchronous receiver)
Polling Consumer - consumer will ask when its ready

Guaranteed Delivery -- can resend to that leg
Message Expiration -

*/
