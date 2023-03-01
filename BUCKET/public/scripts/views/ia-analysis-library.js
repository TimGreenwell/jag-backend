/**
 * @file AnalysisModel library for IA editor.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.16
 */

customElements.define(`analysis-library`, class extends HTMLElement {

    constructor() {
        super();
        this._libraryList = [];
        this._initUI();
        this.clearItems();
    }

    clearItems() {
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = [];
    }

    _initUI() {
        // const $header = document.createElement('header');
        const $search = document.createElement(`input`);
        const $list = document.createElement(`ol`);

        $search.classList.add(`library-search`);
        $search.placeholder = `Analyses`;
        $list.classList.add(`library-list`);

        this.appendChild($search);
        this.appendChild($list);

        this._$list = $list;

        $search.addEventListener(`keyup`, this._filterFromSearchInput.bind(this));
    }

    // ////////////////////////////////////////////////////////////////////////////////
    // ////////  Supporting controllerAT //////////////////////////////////////////////
    // ////////////////////////////////////////////////////////////////////////////////


    createListItemCollection(model, idx = -1) {
        const id = model.urn || ``;
        const root = model.rootUrn;
        const name = model.name;
        const description = model.description || ``;

        const li = document.createElement(`li`);
        li.className = `list-item`;
        li.id = id;

        const deleteIconClickedHandler = function (event) {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent(`event-analysis-deleted`, {
                detail: {analysisId: model.id}
            }));
        };

        const lockIconClickedHandler = function (event) {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent(`event-analysis-locked`, {
                detail: {analysisId: model.id}
            }));
        };


        const $topHalfWrapper = document.createElement(`div`);
        $topHalfWrapper.className = `top-half item-line`;
        const $nameEntry = document.createElement(`span`);
        $nameEntry.classList.add(`name-entry`);
        $nameEntry.innerText = name;

        const toggleLock = document.createElement(`div`);
        toggleLock.classList.add(`library-button`, `lock-button`);
        toggleLock.addEventListener(`click`, lockIconClickedHandler.bind(this));

        $topHalfWrapper.appendChild(toggleLock);
        $topHalfWrapper.appendChild($nameEntry);

        const $bottomHalfWrapper = document.createElement(`div`);
        $bottomHalfWrapper.className = `bottom-half item-line`;
        const $descriptionEntry = document.createElement(`span`);
        $descriptionEntry.classList.add(`description-entry`);
        $descriptionEntry.innerText = root;

        const deleteJag = document.createElement(`div`);
        if (!model.isLocked) {
            deleteJag.classList.add(`library-button`, `delete-button`);
            deleteJag.addEventListener(`click`, deleteIconClickedHandler.bind(this));
        }

        $bottomHalfWrapper.appendChild(deleteJag);
        $bottomHalfWrapper.appendChild($descriptionEntry);
        const p = document.createElement(`p`);
        p.innerHTML = description;  // analysis description

        li.appendChild($topHalfWrapper);
        li.appendChild($bottomHalfWrapper);
        li.appendChild(p);

        const search_params = [];
        search_params.push(name.toLowerCase());
        search_params.push(root.toLowerCase());
        search_params.push(description.toLowerCase());

        $bottomHalfWrapper.addEventListener(`click`, (event) => {
            this.dispatchEvent(new CustomEvent(`event-analysis-selected`, {
                detail: {model}
            }));
        });

        $topHalfWrapper.addEventListener(`click`, (event) => {
            this.dispatchEvent(new CustomEvent(`event-analysis-selected`, {
                detail: {model}
            }));
        });

        const newItem = {
            element: li,
            search_content: search_params.join(` `),
            model
        };

        return newItem;

        // ?    model.addEventListener('copy', this._createItem.bind(this));
    }

    addListItem(analysisModel) {
        // handleNodeStorageCreated (@controllerAT)
        const listItemElement = this.createListItemCollection(analysisModel);
        this._libraryList.push(listItemElement);
        this._$list.appendChild(listItemElement.element);
    }

    // noinspection JSUnusedGlobalSymbols
    addListItems(analysisModelArray) {
        analysisModelArray.forEach((analysisModel) => {
            this.addListItem(analysisModel);
        });
    }

    // noinspection JSUnusedGlobalSymbols
    removeLibraryListItem(deletedAnalysisId) {
        // handleJagStorageDeleted (@controllerAT)
        for (const item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = this._libraryList.filter((entry) => {
            return entry.analysis.id !== deletedAnalysisId;
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

export default customElements.get(`analysis-library`);


// async _getChildModels(model, map) {
//     if(!model.children)
//         return map;
//     for (let child_details of model.children) {
//         const child = await this._getDefinitionForURN(child_details.urn);
//         map.set(child_details.urn, child);
//         map = await this._getChildModels(child, map);
//     }
//     return map;
// }
// ///////////////////////////////////////////////
// updateListItem(updatedAnalysisModel, idx = -1) {
//     console.log("Analysis Library (updateListItem) received NOTIFICATION for analysis-storage-updated")
//
//     for (let idx in this._libraryList) {
//         if (this._libraryList[idx].model.id === updatedAnalysisModel.id) {
//
//             const rootUrn = this._libraryList[idx].element.querySelectorAll("pre").item(0).innerText;
//             const name = updatedAnalysisModel.name;
//             const description = updatedAnalysisModel.description;
//             this._libraryList[idx].element.querySelectorAll("h3").item(0).innerText = name;
//             this._libraryList[idx].element.querySelectorAll("p").item(0).innerText = description;
//             const search_params =[];
//             search_params.push(name.toLowerCase());
//             search_params.push(rootUrn.toLowerCase());
//             search_params.push(description.toLowerCase());
//             this._libraryList[idx].search_content = search_params.join(" ");
//         }
//     }
// }


