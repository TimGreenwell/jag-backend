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

    _createMenuItem(id, img, text) {
        const $el = document.createElement(`span`);
        $el.id = `menu-${id}`;
        $el.classList.add(`menu-item`);

        if (img) {
            const $img = document.createElement(`img`);
            $img.src = img;
            $el.appendChild($img);
        }

        if (text) {
            const $text = document.createElement(`span`);
            $text.innerText = text;
            $el.appendChild($text);
        }

        return $el;
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
        $title.innerText = `JAG Authoring Tool`;
        $leftLiDiv.appendChild($title);

        //
        // The center section containing the menu options (Currently: Clear)
        //
        const $centerLi = document.createElement(`li`);
        $ul.appendChild($centerLi);

        const $centerLiDiv = document.createElement(`div`);
        $centerLi.appendChild($centerLiDiv);

        const $new = document.createElement(`span`);
        $new.id = `menu-new`;
        $new.classList.add(`menu-item`);
        $new.innerText = ` new\nactivity`;
        $centerLiDiv.appendChild($new);

        $new.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-add-activity`, {}));
        }.bind(this));

        const $clear = document.createElement(`span`);
        $clear.id = `menu-clear-all`;
        $clear.classList.add(`menu-item`);
        $clear.innerText = `clear\nspace`;
        $centerLiDiv.appendChild($clear);
        $clear.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-clear-playground`));
        }.bind(this));

        const $redraw = document.createElement(`span`);
        $redraw.id = `menu-redraw-nodes`;
        $redraw.classList.add(`menu-item`);
        $redraw.innerText = `redraw\nnodes`;
        $centerLiDiv.appendChild($redraw);
        $redraw.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-redraw-nodes`));
        }.bind(this));

        const $define = document.createElement(`span`);
        $define.id = `menu-define-node`;
        $define.classList.add(`menu-item`);
        $define.innerText = `define\nnode`;
        $centerLiDiv.appendChild($define);
        $define.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-define-node`));
        }.bind(this));

        const $import = document.createElement(`span`);
        $import.id = `menu-import-data`;
        $import.classList.add(`menu-item`);
        $import.innerText = `import\nJAG`;
        $centerLiDiv.appendChild($import);
        $import.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-popup-importer`));
        }.bind(this));


        const $timeview = document.createElement(`span`);
        $timeview.id = `menu-toggle-timeview`;
        $timeview.classList.add(`menu-item`);
        $timeview.innerText = `toggle\ntimeview`;
        $centerLiDiv.appendChild($timeview);
        $timeview.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-toggle-timeview`));
        }.bind(this));

        const $colorize = document.createElement(`span`);
        $colorize.id = `menu-toggle-colorize`;
        $colorize.classList.add(`menu-item`);
        $colorize.innerText = `demo\ncolor`;
        $centerLiDiv.appendChild($colorize);
        $colorize.addEventListener(`click`, function (e) {
            this.dispatchEvent(new CustomEvent(`event-toggle-colorize`));
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

