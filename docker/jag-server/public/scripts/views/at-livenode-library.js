/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

import LiveNode from '../models/live-node.js';

customElements.define(`project-library`, class extends HTMLElement {

    constructor() {
        super();
        this._libraryList = [];                         // <li> elements of projectNode name & description + (search context) + nodeModel
        this._initUI();
        this.clearLibraryList();
    }

    _initUI() {
        const $search = document.createElement(`input`);
        const $list = document.createElement(`ol`);

        $search.classList.add(`library-search`);
        $search.placeholder = `JAGs`;
        $list.classList.add(`library-list`);

        this.appendChild($search);
        this.appendChild($list);

        this._$list = $list;

        $search.addEventListener(`keyup`, this._filterFromSearchInput.bind(this));
    }


    clearLibraryList() {  // clearing the views
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = [];
    }

    // ////////////////////////////////////////////////////////////////////////////////
    // ////////  Supporting controllerAT //////////////////////////////////////////////
    // ////////////////////////////////////////////////////////////////////////////////

    createListItemCollection(newLiveNode) {
        if (newLiveNode instanceof LiveNode) {
            const urn = newLiveNode.urn;
            const name = newLiveNode.contextualName || ``;
            const description = newLiveNode.contextualDescription || ``;

            const li = document.createElement(`li`);
            li.className = `list-item`;

            const deleteIconClickedHandler = function (event) {
                event.stopPropagation();
                this.dispatchEvent(new CustomEvent(`event-project-deleted`, {
                    detail: {liveNodeId: newLiveNode.id}
                }));
            };

            const lockIconClickedHandler = function (event) {
                event.stopPropagation();
                this.dispatchEvent(new CustomEvent(`event-project-locked`, {
                    detail: {liveNode: newLiveNode}
                }));
            };


            // const $header = document.createElement('header');
            const $topHalfWrapper = document.createElement(`div`);
            $topHalfWrapper.className = `top-half item-line`;
            const $nameEntry = document.createElement(`span`);
            $nameEntry.classList.add(`name-entry`);
            $nameEntry.innerText = newLiveNode.contextualName;

            const toggleLock = document.createElement(`div`);
            toggleLock.classList.add(`library-button`, `lock-button`);
            toggleLock.addEventListener(`click`, lockIconClickedHandler.bind(this));

            $topHalfWrapper.appendChild(toggleLock);
            $topHalfWrapper.appendChild($nameEntry);

            const $bottomHalfWrapper = document.createElement(`div`);
            $bottomHalfWrapper.className = `bottom-half item-line`;
            const $descriptionEntry = document.createElement(`span`);
            $descriptionEntry.classList.add(`description-entry`);
            $descriptionEntry.innerText = newLiveNode.contextualDescription;


            const deleteButton = document.createElement(`div`);
            if (!newLiveNode.isLocked) {
                deleteButton.classList.add(`library-button`, `delete-button`);
                deleteButton.addEventListener(`click`, deleteIconClickedHandler.bind(this));
            }

            $bottomHalfWrapper.appendChild(deleteButton);
            $bottomHalfWrapper.appendChild($descriptionEntry);

            li.appendChild($topHalfWrapper);
            li.appendChild($bottomHalfWrapper);

            const search_params = [];
            search_params.push(urn.toLowerCase());
            search_params.push(name.toLowerCase());
            search_params.push(description.toLowerCase());

            // Send the newLiveNode and all its children through the dispatch
            $bottomHalfWrapper.addEventListener(`click`, (event) => {
                this.dispatchEvent(new CustomEvent(`event-project-selected`, {
                    detail: {
                        projectModel: newLiveNode,
                        isExpanded: !event.shiftKey
                    }
                }));
            });

            $topHalfWrapper.addEventListener(`click`, (event) => {
                this.dispatchEvent(new CustomEvent(`event-project-selected`, {
                    detail: {
                        projectModel: newLiveNode,
                        isExpanded: !event.shiftKey
                    }
                }));
            });

            const newItem = {
                element: li,
                search_content: search_params.join(` `),
                liveNode: newLiveNode
            };

            return newItem;

            //    liveNode.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
        } else {
            console.log(`ERROR -- unexpected type for newliveNode [library-addItem]`);
        }
    }


    addListItem(newLiveNode) {                                 // /// WHEN NODE CREATED
        if (newLiveNode.isRoot()) {
            const listItemCollection = this.createListItemCollection(newLiveNode);
            this._libraryList.push(listItemCollection);
            this._$list.appendChild(listItemCollection.element);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    addListItems(liveNodeArray) {
        // initializePanels (@controllerAT)
        liveNodeArray.forEach((liveNode) => {
            this.addListItem(liveNode);
        });
    }

    // noinspection JSUnusedGlobalSymbols
    updateItem(updatedLiveNode) {                                 // /// WHEN NODE UPDATED
        // @TODO high priority to rethink
        // Way too much spinning for something this simple
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = this._libraryList.filter((entry) => {
            return entry.liveNode.isRoot();
        });
        // iterate backwards when splicing from inside
        // but only splicing out max 1 thing - so irrelevant.

        this._libraryList.forEach((libraryItem) => {
            if (libraryItem.liveNode.id === updatedLiveNode.id) {
                const listItemCollection = this.createListItemCollection(updatedLiveNode);
                libraryItem.element = listItemCollection.element;
                libraryItem.search_content = listItemCollection.search_content;
                libraryItem.liveNode = listItemCollection.liveNode;
            }
        });
        for (const item of this._libraryList) {
            this._$list.appendChild(item.element);
        }
    }


    removeProjectLibraryListItem(id) {                                             // // WHEN NODE DELETED
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = this._libraryList.filter((entry) => {
            return entry.liveNode.id !== id;
        });
        for (const item of this._libraryList) {
            this._$list.appendChild(item.element);
        }
    }


    // updateStructureChange(projectNodes) {
    //     for (const item of this._libraryList) {
    //         this._$list.removeChild(item.element);
    //     }
    //
    //     projectNodes.forEach((project) => {
    //         return this.createListItemCollection(project);
    //     });
    //
    //     for (const item of this._libraryList) {
    //         this._$list.appendChild(item.element);
    //     }
    // }


    // @TODO are updateItem and replaceItem functionally equivalent? Do I need both?

    // noinspection JSUnusedGlobalSymbols
    replaceItem(newLiveNode, replacedUrn) {
        // handleJagStorageReplaced (@controllerAT)
        this.removeProjectLibraryListItem(replacedUrn);
        this.appendChild(newLiveNode);
    }


    _filterFromSearchInput(e) {
        const search_text = e.srcElement.value.toLowerCase();
        this._libraryList.forEach((item) => {
            if (item.element) {
                item.element.style.display = `block`;
                if (!item.search_content.includes(search_text)) {
                    item.element.style.display = `none`;
                }
            }
        });
    }

    //  called by jag-at when listener on graph-service hears 'resources'

    // handleResourceUpdate(message) {
    //     message.data.sort((a, b) => {
    //         return a.name.localeCompare(b.name);
    //     });
    //
    //     message.data.forEach((resource) => {
    //         this.addItem(resource);
    //     });
    // }

});

export default customElements.get(`project-library`);

// <project-library> (this)
//   <input class='library-search'></input>
//   <ol class='library-list'>
//      ( Line items added later by addItems )
//   </ol>
// </project-library>


// Add the <li id='urn'>
//           <h3> 'name' </h3>
//           <p> 'description'
//         </li>
