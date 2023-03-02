// /**
//  * @file Bind point
//  *
//  * @author mvignati
//  * @version 1.65
//  */
//
// 'use strict';
//
// import {uuidV4} from "../utils/uuid.js";
// import Endpoint from "./endpoint.js";
//
// export default class Bindpoint {
//
//     constructor({
//         id = uuidV4(),
//         owner,                                   // should I use owner or node    'node' obj will cause stackoverflow in db setup  'owner' id is more looping to find what we need.
//         endpoint
//     } = {}) {
//         this._id = id;
//         this._owner = owner;
//         this._endpoint = endpoint;
//     }
//
//
//     get id() {
//         return this._id;
//     }
//
//     set id(value) {
//         this._id = value;
//     }
//
//     get owner() {
//         return this._owner;
//     }
//
//     set owner(value) {
//         this._owner = value;
//     }
//
//     get endpoint() {
//         return this._endpoint;
//     }
//
//     set endpoint(value) {
//         this._endpoint = value;
//     }
//
//     toJSON() {
//         const json = {id: this._id,
//             owner: this._owner,
//             endpoint: this.endpoint.toJSON()};
//         return json;
//     }
//
//     static fromJSON(element) {
//         const newEndpoint = new Bindpoint();
//         newEndpoint.id = element.id;
//         newEndpoint.owner = element.owner;
//         newEndpoint.endpoint = Endpoint.fromJSON(element.endpoint);
//         return newEndpoint;
//     }
//
// }
