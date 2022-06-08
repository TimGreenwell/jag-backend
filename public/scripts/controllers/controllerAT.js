/**
 * @fileOverview Jag ControllerIA.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';

import InputValidator from "../utils/validation.js";
import StorageService from "../services/storage-service.js";
import JagModel from "../models/jag.js";
import UserPrefs from "../utils/user-prefs.js";


export default class ControllerAT {

    constructor() {

        this._menu = null;
        this._library = null;
        this._playground = null;
        this._properties = null;

        this._jagModelMap = new Map();         // All JagModels - should be in sync with storage
        this._nodeModelMap = new Map();        // All nodes - should be in sync with storage
        this._currentAnalysis = undefined;       // type: AnalysisModel

        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));   // just blocking for now - troubleshooting
        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));
        StorageService.subscribe("jag-storage-deleted", this.handleJagStorageDeleted.bind(this));   // All from observable
        StorageService.subscribe("jag-storage-cloned", this.handleJagStorageCloned.bind(this));
        StorageService.subscribe("jag-storage-replaced", this.handleJagStorageReplaced.bind(this));
    }

    // StorageService.subscribe("jag-storage-updated", this.updateJagNode.bind(this));
    // StorageService.subscribe("jag-storage-created", this._addJagNodeTree.bind(this));
    // StorageService.subscribe("jag-storage-deleted", this.deleteJagNode.bind(this));         // a;ll from playground
    // StorageService.subscribe("jag-storage-cloned", this._addJagNodeTree.bind(this));
    // StorageService.subscribe("jag-storage-replaced", this.replaceJagNode.bind(this));


    set menu(value) {
        this._menu = value;
    }

    set library(value) {
        this._library = value;
    }

    set playground(value) {
        this._playground = value;
    }

    set properties(value) {
        this._properties = value;
    }

    get jagModelMap() {
        return this._jagModelMap;
    }

    set jagModelMap(newJagModelMap) {
        this._jagModelMap = newJagModelMap;
    }

    addJagModel(jagModel) {
        this._jagModelMap.set(jagModel.urn, jagModel)
    }

    get nodeModelMap() {
        return this._nodeModelList;
    }

    set nodeModelMap(newNodeModelMap) {
        this._nodeModelList = newNodeModelList;
    }

    addNodeModel(newNodeModel) {
        this._nodeModelMap.set(newNodeModel.id, newNodeModel)
    }

    get currentAnalysis() {
        return this._currentAnalysis;
    }

    set currentAnalysis(newAnalysisModel) {
        this._currentAnalysis = newAnalysisModel;
    }

    async initialize() {
        UserPrefs.setDefaultUrnPrefix("us:tim:")
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {
        let allJags = await StorageService.all('jag')
        allJags.forEach(jag => this.addJagModel(jag));
    }

    initializePanels() {
        this._library.addListItems([...this._jagModelMap.values()])
    }

    initializeHandlers() {
        this._playground.addEventListener('local-jag-created', this.localJagCreatedHandler.bind(this));  // popup create
        this._playground.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));  // jag structure updates
        this._playground.addEventListener('playground-nodes-selected', this.playgroundNodesSelectedHandler.bind(this));

        this._properties.addEventListener('local-urn-renamed', this.localUrnRenamedHandler.bind(this));
        this._properties.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));  // jag property updates
    //    this._properties.addEventListener('local-jag-deleted', this.localJagDeletedHandler.bind(this));  // @todo - button to add
    //    this._properties.addEventListener('local-jag-locked', this.localJagLockedHandler.bind(this));  // @todo - button to add

        this._menu.addEventListener('add-new-node', this.addNewNodeHandler.bind(this));
        this._menu.addEventListener('clear-playground', this.clearPlaygroundHandler.bind(this));  // Event: 'clear-playground' - menu item selected to clear nodes from playground
        this._menu.addEventListener('clear-selected', this.clearSelectedHandler.bind(this));

        this._library.addEventListener('library-lineItem-selected', this.libraryLineItemSelectedHandler.bind(this));
        this._library.addEventListener('local-jag-deleted', this.localJagDeletedHandler.bind(this));
        this._library.addEventListener('local-jag-locked', this.localJagLockedHandler.bind(this));  // @todo - needs better icon
    }

    libraryLineItemSelectedHandler(event) {
        const jagModelSelected = event.detail.jagModel;
        const expandRequested = event.detail.expanded;
        let childrenMap = this._getChildModels(jagModelSelected, new Map());
        this._playground.handleLibraryListItemSelected({              // This will need to look different after Nodes are implemented here
            jagModel: jagModelSelected,
            jagModel_set: childrenMap,
            expanded: expandRequested
        });
    }





    clearSelectedHandler(event) {
        console.log(event)
        console.log("---- Delete Selected ---               ( I dont think we want a real pruning.")
        this._playground.handleDeleteSelected(event);
    }

    clearPlaygroundHandler() {
        this._playground.clearPlayground();
    }

    addNewNodeHandler() {
        this._playground._handleNewNodePopup();
    }


    playgroundNodesSelectedHandler(event) {
        const eventDetail = event.detail;
        this._properties.handleSelectionUpdate(eventDetail);
        //ide.handleSelectionUpdate(e.detail);
    }

    async localJagCreatedHandler(event) {
        const eventDetail = event.detail;
        const urn = eventDetail.urn;
        const description = eventDetail.description;
        const name = eventDetail.name;
        const newJagModel = new JagModel({urn: urn, name: name, description: description});
        if (InputValidator.isValidUrn(newJagModel.urn)) {
            await StorageService.create(newJagModel, 'jag');
            this._playground._addJagNodeTree(newJagModel, newJagModel.urn);         // updates locally (only fresh new orphan leafs)
        } else {
            window.alert("Invalid URN");
        }
    }

    async localJagUpdatedHandler(event) {
        const eventDetail = event.detail;
        const updatedJagModel = eventDetail.jagModel;
        await StorageService.update(updatedJagModel, 'jag');
    }

    async localJagLockedHandler(event) {
        const lockedJagModelUrn = event.detail.jagModelUrn;
        const lockedJagModel = this._jagModelMap.get(lockedJagModelUrn)
        lockedJagModel.isLocked = true;
        await StorageService.update(lockedJagModel, 'jag');
    }


    async localJagDeletedHandler(event) {
        const deadJagModelUrn = event.detail.jagModelUrn;
        await StorageService.delete(deadJagModelUrn, 'jag');
    }


// This is an identical copy (hopefully) of the URN updater found in views/Properties
    // I can't decide on a common area for updates such as this.  Views arent shared.  A controller area?
    // Maybe just the model (stoage is data) but circular reference problem with schema.
    // Currently thinking a controller area if more can be found.


    async localUrnRenamedHandler(event) {
        const eventDetail = event.detail;
        const newUrn = eventDetail.newUrn;
        const originalUrn = eventDetail.originalUrn;
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newUrn + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newUrn + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isLocked' tag.
        // URN changes are renames until the JagModel is marked as 'isLocked'.
        // After 'isLocked', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newUrn);
        if (isValid) {
            let origJagModel = await StorageService.get(originalUrn, 'jag');  // needed to check if 'isLocked'
            let urnAlreadyBeingUsed = await StorageService.has(newUrn, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    let newJagModel = await StorageService.get(originalUrn, 'jag');

                    // is the target JagModel locked?
                    if (newJagModel.isLocked) {
                        // FAIL  - CANT OVERWRITE LOCKED JagModel
                    } else // target JagModel is NOT locked

                    { // is the original JagModel locked?
                        if (origJagModel.isLocked) {
                            await StorageService.clone(originalUrn, newUrn, 'jag');
                        } else { /// the original JagModel is not locked
                            await StorageService.replace(originalUrn, newUrn, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JagModel
                }
            } else {  // urn not already being used
                // is the original JagModel locked?
                console.log("is locked - " + origJagModel.isLocked);
                if (origJagModel.isLocked) {
                    await this.cloneJagModel(origJagModel, newUrn)
                } else {/// the original JagModel is not locked
                    await StorageService.replace(originalUrn, newUrn, 'jag');
                }
            }
        }

    }


    _getChildModels(parentJAGModel, childrenJAGMap) {
        if (!parentJAGModel.children)              // @TODO or.. if (parentJAGModel.children) then for loop...  return childrenJAGMap
            return childrenJAGMap;
        for (let childDetails of parentJAGModel.children) {
            const childJAGModel = this._jagModelMap.get(childDetails.urn)
            childrenJAGMap.set(childDetails.urn, childJAGModel);
            childrenJAGMap = this._getChildModels(childJAGModel, childrenJAGMap);
        }
        return childrenJAGMap;
    }

    /**
     * Remote Handler - update, create, delete, cloned*, replaced*
     * @param updatedJagModel
     * @param updatedJagUrn
     */

    handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
        this._jagModelMap.set(updatedJagModel.urn,updatedJagModel)
        // let childrenMap = this._getChildModels(updatedJagModel, new Map());
        // console.log("dddddddddd")
        // console.log(updatedJagModel)
        // console.log(childrenMap)
        // this._playground.handleRefresh({              // This will need to look different after Nodes are implemented here
        //     jagModel: updatedJagModel,
        //     jagModel_set: childrenMap
        // });



        this._playground.updateJagNode(updatedJagModel, updatedJagUrn);         // update the graph node view on update
        this._properties.handleStorageUpdate(updatedJagModel, updatedJagUrn);   // change property window values if that one is changed in IA
        this._library.updateItem(updatedJagModel);
    }

    handleJagStorageCreated(createdJagModel, createdJagUrn) {
        this._jagModelMap.set(createdJagUrn,createdJagModel)
        UserPrefs.setDefaultUrnPrefixFromUrn(createdJagUrn)
        this._library.addItem(createdJagModel);                                   // Add JagModel list item to Library
    }

    handleJagStorageDeleted(deletedJagUrn) {
        this._jagModelMap.delete(deletedJagUrn)
        console.log("controllerAT -- " + deletedJagUrn)
        this._playground.deleteJagNode(deletedJagUrn)
        this._library.removeLibraryListItem(deletedJagUrn)
    }

    handleJagStorageCloned(clonedJagModel, clonedJagUrn) {
        UserPrefs.setDefaultUrnPrefixFromUrn(clonedJagUrn)
        this._playground._addJagNodeTree(clonedJagModel, clonedJagUrn)
    }

    handleJagStorageReplaced(newJagModel, replacedJagUrn) {
        //  UserPrefs.setDefaultUrnPrefixFromUrn(newJagModel.urn)
        this._playground.replaceJagNode(newJagModel, replacedJagUrn)
        this._library.replaceItem(newJagModel, replacedJagUrn)                   // Replace JagModel list item in library
    }


}