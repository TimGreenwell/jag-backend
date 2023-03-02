'use strict';

export default class GraphService extends EventTarget {

    connect() {
        const host = `jag.baby`;
        this._ch = new WebSocket(`wss://${host}:8887`);
        this._ch.addEventListener(`open`, this._handleConnection.bind(this));
        this._ch.addEventListener(`message`, this._handleMessage.bind(this));
        this._ch.addEventListener(`error`, this._handleConnection.bind(this));
    }

    _handleConnection(e) {
        this.dispatchEvent(new CustomEvent(`connection`, {
            detail: {
                type: e.type,
                data: {
                    timestamp: e.timestamp,
                    websocket: e.target
                }
            }
        }));
    }

    _handleMessage(e) {
        const data = JSON.parse(e.detail);
        this.dispatchEvent(new CustomEvent(data.type, {detail: data}));
    }

    runGraph(urn, data) {
        const payload = {
            type: `run`,
            data: {
                urn,
                inputs: data.inputs,
                actor: data.actor
            }
        };
        this._ch.send(JSON.stringify(payload));
    }

    uploadGraph(graph) {
        const payload = {
            type: `upload`,
            data: graph
        };
        this._ch.send(JSON.stringify(payload));
    }

}

