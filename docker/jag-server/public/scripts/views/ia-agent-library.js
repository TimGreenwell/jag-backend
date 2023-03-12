/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

// import Agent from '../models/agent.js';

import AgentModel from "../models/agent.js";

customElements.define(`agent-library`, class extends HTMLElement {

    constructor() {
        super();
        this._libraryList = [];                         // <li> elements holding agent.name & description + (search context) + agent
        this._initUI();
        this.clearLibraryList();
    }

    clearLibraryList() {
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = [];
    }

    _initUI() {
        const $header = document.createElement(`header`);
        const $search = document.createElement(`input`);
        const $list = document.createElement(`ol`);

        $search.classList.add(`library-search`);
        $search.placeholder = `Agents`;
        $list.classList.add(`library-list`);

        this.appendChild($search);
        this.appendChild($list);

        this._$list = $list;

        $search.addEventListener(`keyup`, this._filterFromSearchInput.bind(this));
    }


    // ////////////////////////////////////////////////////////////////////////////////
    // ////////  Supporting controllerAT //////////////////////////////////////////////
    // ////////////////////////////////////////////////////////////////////////////////

    // noinspection JSUnusedGlobalSymbols
    updateItem(updatedAgent) {
        const listItemElement = this.createListItemCollection(updatedAgent);
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        for (const idx in this._libraryList) {
            if (this._libraryList[idx].agent.urn === updatedAgent.urn) {
                this._libraryList[idx] = listItemElement;
            }
        }
        for (const item of this._libraryList) {
            this._$list.appendChild(item.element);
        }
    }


    createListItemCollection(newAgent) {
        // handleAgentStorageCreated (@controllerAT)
        const existingUrns = this._libraryList.filter((entry) => {
            return entry.urn;
        });
        if (existingUrns.includes(newAgent.urn)) {
            console.log(`ERROR -- URN already exists [library-addItem]`);
        } else {
            if (newAgent instanceof AgentModel) {
                const urn = newAgent.urn;
                const name = newAgent.name || ``;
                const description = newAgent.description || ``;

                const li = document.createElement(`li`);
                li.className = `list-item`;

                const deleteIconClickedHandler = function (event) {
                    event.stopPropagation();
                    this.dispatchEvent(new CustomEvent(`event-agent-deleted`, {
                        detail: {agentUrn: newAgent.urn}
                    }));
                };

                const lockIconClickedHandler = function (event) {
                    event.stopPropagation();
                    this.dispatchEvent(new CustomEvent(`event-agent-locked`, {
                        detail: {agent: newAgent}
                    }));
                };

                const $topHalfWrapper = document.createElement(`div`);
                $topHalfWrapper.className = `top-half item-line`;
                const $nameEntry = document.createElement(`span`);
                $nameEntry.classList.add(`name-entry`);
                $nameEntry.innerText = newAgent.name;

                const toggleLock = document.createElement(`div`);
                toggleLock.classList.add(`library-button`, `lock-button`);
                toggleLock.addEventListener(`click`, lockIconClickedHandler.bind(this));

                $topHalfWrapper.appendChild(toggleLock);
                $topHalfWrapper.appendChild($nameEntry);

                const $bottomHalfWrapper = document.createElement(`div`);
                $bottomHalfWrapper.className = `bottom-half item-line`;
                const $urnEntry = document.createElement(`span`);
                $urnEntry.classList.add(`urn-entry`);
                $urnEntry.innerText = newAgent.urn;

                const deleteAgent = document.createElement(`div`);
                if (!newAgent.isLocked) {
                    deleteAgent.classList.add(`library-button`, `delete-button`);
                    deleteAgent.addEventListener(`click`, deleteIconClickedHandler.bind(this));
                }

                $bottomHalfWrapper.appendChild(deleteAgent);
                $bottomHalfWrapper.appendChild($urnEntry);

                li.appendChild($topHalfWrapper);
                li.appendChild($bottomHalfWrapper);

                const search_params = [];
                search_params.push(urn.toLowerCase());
                search_params.push(name.toLowerCase());
                search_params.push(description.toLowerCase());

                // Send the newAgent and all its children through the dispatch
                $bottomHalfWrapper.addEventListener(`click`, (event) => {
                    this.dispatchEvent(new CustomEvent(`event-agent-selected`, {
                        detail: {
                            agent: newAgent
                        }
                    }));
                });

                $topHalfWrapper.addEventListener(`click`, (event) => {
                    this.dispatchEvent(new CustomEvent(`event-agent-selected`, {
                        detail: {
                            agent: newAgent
                        }
                    }));
                });

                const newItem = {
                    element: li,
                    search_content: search_params.join(` `),
                    agent: newAgent
                };

                return newItem;

                //    agent.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
            } else {
                console.log(`ERROR -- unexpected type for newAgent [library-addItem]`);
            }
        }
    }

    addListItem(newAgent) {
        const listItemElement = this.createListItemCollection(newAgent);
        this._libraryList.push(listItemElement);
        this._$list.appendChild(listItemElement.element);
    }

    // noinspection JSUnusedGlobalSymbols
    addListItems(agentArray) {
        // initializePanels (@controllerAT)
        agentArray.forEach((agent) => {
            this.addListItem(agent);
        });
    }


    // @TODO are updateItem and replaceItem functionally equivalent? Do I need both?

    // noinspection JSUnusedGlobalSymbols
    replaceItem(newAgent, replacedUrn) {
        // handleAgentStorageReplaced (@controllerAT)
        this.removeLibraryListItem(replacedUrn);
        this.appendChild(newAgent);
    }

    removeLibraryListItem(deletedUrn) {
        // handleAgentStorageDeleted (@controllerAT)
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = this._libraryList.filter((entry) => {
            return entry.agent.urn !== deletedUrn;
        });
        for (const item of this._libraryList) {
            this._$list.appendChild(item.element);
        }
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

});

export default customElements.get(`agent-library`);

// <agent-library> (this)
//   <input class='library-search'></input>
//   <ol class='library-list'>
//      ( Line items added later by addItems )
//   </ol>
// </agent-library>


//         <li id='urn'>
//           <h3> 'name' </h3>
//           <p> 'url'
//         </li>

