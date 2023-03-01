/**
 * @fileOverview DOM Manipulation Utilities
 *
 * @author mvignati
 * @version 0.01
 */

'use strict';


export default class UserPrefs {



    //static defaultStorageService = `idb-service`;
    static defaultStorageService = 'local-rest-service'

    static getDefaultStorageService() {
        return this.defaultStorageService;
    }


    static defaultUrnPrefix = `us:ihmc:`;

    static getDefaultUrn(name) {
        return this.defaultUrnPrefix + name;
    }

    static getDefaultUrnPrefix() {
        return this.defaultUrnPrefix;
    }

    static setDefaultUrnPrefix(urnPrefix) {
        this.defaultUrnPrefix = urnPrefix;
    }

    static setDefaultUrnPrefixFromUrn(urn) {
        this.defaultUrnPrefix = `${urn.split(`:`).slice(0, -1).join(`:`)}:`;
    }

    static sharedMode = false;

    static getSharedMode() {
        return this.sharedMode;
    }

    static setSharedMode(sharedMode) {
        this.sharedMode = sharedMode;
    }

    static author = `anonymous`;

    static getAuthor() {
        return this.author;
    }

    static setAuthor(author) {
        this.author = author;
    }


}
