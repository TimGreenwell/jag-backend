/**
 * @file Configuration/settings menu for Authoring Tool.
 *
 * @author cwilber
 * @copyright Copyright © 2021 IHMC, all rights reserved.
 * @version 0.23
 */

customElements.define(`jag-menu`, class extends HTMLElement {

    constructor() {
        super();
        this.$leftLiDiv = null;
        this.$rightLiDiv = null;
        this._initUI();
    }


    _initUI() {
        const $ul = document.createElement(`ul`);
        //
        //    The left section containing the application name "JAG Authoring Tool"
        //
        const $leftLi = document.createElement(`li`);
        $ul.appendChild($leftLi);

        const $leftLiDiv = document.createElement(`div`);
        $leftLi.appendChild($leftLiDiv);

        const $title = document.createElement(`span`);
        $title.id = `menu-title`;
        $title.classList.add(`menu-item`);
        $title.innerText = `Interoperability Assessment`;
        $leftLiDiv.appendChild($title);

        //
        // The center section containing the menu options (Currently: Clear)
        //
        const $centerLi = document.createElement(`li`);
        $ul.appendChild($centerLi);

        const $centerLiDiv = document.createElement(`div`);
        $centerLi.appendChild($centerLiDiv);

        const $new = document.createElement(`span`);
        $new.id = `assessment-new`;
        $new.classList.add(`menu-item`);
        $new.innerText = `  create\nassessment`;
        $centerLiDiv.appendChild($new);
        $new.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-create-assessment`, {}));
        }.bind(this));

        const $agent = document.createElement(`span`);
        $agent.id = `agent-new`;
        $agent.classList.add(`menu-item`);
        $agent.innerText = `  create\nagent`;
        $centerLiDiv.appendChild($agent);
        $agent.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-create-agent`, {}));
        }.bind(this));


        const $import = document.createElement(`span`);
        $import.id = `import`;
        $import.classList.add(`menu-item`);
        $import.innerText = `import`;
        $centerLiDiv.appendChild($import);
        $import.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-import-assessment`));
        }.bind(this));

        const $export = document.createElement(`span`);
        $export.id = `export`;
        $export.classList.add(`menu-item`);
        $export.innerText = `export`;
        $centerLiDiv.appendChild($export);
        $export.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-export-assessment`));
        }.bind(this));


        const $timeview = document.createElement(`span`);
        $timeview.id = `menu-toggle-timeview`;
        $timeview.classList.add(`menu-item`);
        $timeview.innerText = `toggle\ntimeview`;
        $centerLiDiv.appendChild($timeview);
        $timeview.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-toggle-timeview`));
        }.bind(this));

        //
        // The right section containing the IHMC logo
        //
        const $rightLi = document.createElement(`li`);
        $ul.appendChild($rightLi);

        const $rightLiDiv = document.createElement(`div`);
        $rightLiDiv.classList.add(`menu-item`);
        $rightLi.appendChild($rightLiDiv);

        const $logoImage = document.createElement(`img`);
        $logoImage.id = `menu-logo`;
        $logoImage.setAttribute(`src`, `/jag/icons/ihmc_logo.png`);
        $rightLiDiv.appendChild($logoImage);

        this.appendChild($ul);


        this.$leftLiDiv = $leftLiDiv;
        this.$centerLiDiv = $centerLiDiv;
        this.$rightLiDiv = $rightLiDiv;
    }

});

export default customElements.get(`jag-menu`);

