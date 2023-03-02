/**
 * @file Configuration/settings menu for Authoring Tool.
 *
 * @author cwilber
 * @copyright Copyright © 2021 IHMC, all rights reserved.
 * @version 0.23
 */

import FormUtils from "../utils/forms.js";
import Activity from "../models/activity.js";

customElements.define(`def-menu`, class extends HTMLElement {

    constructor() {
        super();
        this.$leftLiDiv = null;
        this.$rightLiDiv = null;
        this._initUI();
    }

    _createMenuItem(id, img, text) {
        const $el = document.createElement(`span`);
        $el.id = `def-menu-${id}`;
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
        const $ul = document.createElement(`ul`);                                //  The horizontal list of menu areas (Title, <options>, logo)
        //
        //    The left section containing the application name "JAG Authoring Tool"
        //
        const $leftLi = document.createElement(`li`);                            // Leftmost item (Title)
        $ul.appendChild($leftLi);

        const $leftLiDiv = document.createElement(`div`);                        // (Title) - Div wrapper (needed?)
        $leftLiDiv.classList.add(`menu-title`);
        $leftLi.appendChild($leftLiDiv);

        const $title = document.createElement(`span`);                           // (Title) - Span containing text
        $title.id = `menu-title`;
        $title.classList.add(`menu-item`);
        $title.innerText = `Node Definition`;
        $leftLiDiv.appendChild($title);

        //
        // The center section containing the menu options (Currently: Clear)
        //
        const $centerLi = document.createElement(`li`);                          // Center item (<options>)
        $leftLiDiv.classList.add(`menu-options`);
        $ul.appendChild($centerLi);

        const $centerLiDiv = document.createElement(`div`);                      // (<options>) - Div wrapper for options
        $centerLi.appendChild($centerLiDiv);


        const executionOptions = Activity.getExecutionOptions();

        const execution_el = FormUtils.createPropertyElement(`execution-property`, `Execution`);
        execution_el.className = `menu-select`;
        this._executionSelect = FormUtils.createSelect(`execution-property`, executionOptions);
        this._executionSelect.label = `Execution`;
        // this._executionSelect.className = 'menu-select';
        execution_el.appendChild(this._executionSelect);
        $centerLiDiv.appendChild(execution_el);


        const returnsOptions = Activity.getReturnsOptions(this._executionSelect.value);

        const return_el = FormUtils.createPropertyElement(`returns-property`, `Return`);
        return_el.className = `menu-select`;
        this._returnSelect = FormUtils.createSelect(`execution-property`, returnsOptions);
        this._returnSelect.label = `Return`;
        // this._returnSelect.className = 'menu-select';
        this._returnSelect.disabled = true;
        return_el.appendChild(this._returnSelect);
        $centerLiDiv.appendChild(return_el);


        const onFailOptions = Activity.getOnFailOptions(this._executionSelect.value);

        const onfail_el = FormUtils.createPropertyElement(`onfail-property`, `OnFail`);
        onfail_el.className = `menu-select`;
        this._onfailSelect = FormUtils.createSelect(`execution-property`, onFailOptions);
        this._onfailSelect.label = `on Fail`;
        // this._returnSelect.className = 'menu-select';
        this._onfailSelect.disabled = true;
        onfail_el.appendChild(this._onfailSelect);
        $centerLiDiv.appendChild(onfail_el);


        const operatorOptions = [];
        const operator = Activity.OPERATOR;
        for (const step in operator) {
            operatorOptions.push({
                value: operator[step].name,
                text: operator[step].text
            });
        }

        const operator_el = FormUtils.createPropertyElement(`operator-property`, `Operator`);
        operator_el.className = `menu-select`;
        this._operatorSelect = FormUtils.createSelect(`operator-property`, operatorOptions);
        this._operatorSelect.label = `Operator`;
        // this._operatorSelect.className = 'menu-select';
        this._operatorSelect.disabled = true;
        operator_el.appendChild(this._operatorSelect);
        $centerLiDiv.appendChild(operator_el);


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

        this._executionSelect.addEventListener(`change`, this._executionSelectChange.bind(this));
        this._returnSelect.addEventListener(`change`, this._returnsSelectChange.bind(this));
        this._operatorSelect.addEventListener(`change`, this._operatorSelectChange.bind(this));
        this._onfailSelect.addEventListener(`change`, this._onfailSelectChange.bind(this));
    }


    _executionSelectChange(event) {
        this.dispatchEvent(new CustomEvent(`event-execution-updated`, {
            bubbles: true,
            composed: true,
            detail: {execution: event.value}
        }));
        if (this._executionSelect.value !== `node.execution.none`) {
            const onfailOptions = Activity.getOnFailOptions(this._executionSelect.value);
            while (this._onfailSelect.options.length > 0) {
                this._onfailSelect.remove(0);
            }
            onfailOptions.forEach((option) => {
                const opt = document.createElement(`option`);
                opt.value = option.value;
                opt.text = option.text;
                this._onfailSelect.options.add(opt);
            });
            this._onfailSelect.disabled = false;


            const returnsOptions = Activity.getReturnsOptions(this._executionSelect.value);
            while (this._returnSelect.options.length > 0) {
                this._returnSelect.remove(0);
            }
            returnsOptions.forEach((option) => {
                const opt = document.createElement(`option`);
                opt.value = option.value;
                opt.text = option.text;
                this._returnSelect.options.add(opt);
            });
            this._returnSelect.disabled = false;
        }
    }

    _onfailSelectChange(event) {
        this.dispatchEvent(new CustomEvent(`event-onfail-updated`, {
            bubbles: true,
            composed: true,
            detail: {
                returns: this._returnSelect.value,
                operator: this._operatorSelect.value
            }
        }));
    }


    _returnsSelectChange(event) {
        this.dispatchEvent(new CustomEvent(`event-returns-updated`, {
            bubbles: true,
            composed: true,
            detail: {returns: event.value}
        }));
        const operatorOptions = Activity.getOperatorOptions(this._returnSelect.value);
        while (this._operatorSelect.options.length > 0) {
            this._operatorSelect.remove(0);
        }
        operatorOptions.forEach((option) => {
            const opt = document.createElement(`option`);
            opt.value = option.value;
            opt.text = option.text;
            this._operatorSelect.options.add(opt);
        });
        this._operatorSelect.disabled = false;
    }

    _operatorSelectChange(event) {
        this.dispatchEvent(new CustomEvent(`event-operator-updated`, {
            bubbles: true,
            composed: true,
            detail: {
                returns: this._returnSelect.value,
                operator: this._operatorSelect.value
            }
        }));
    }


});

export default customElements.get(`def-menu`);

