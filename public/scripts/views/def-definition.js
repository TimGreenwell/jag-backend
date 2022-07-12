/**
 * @file Playground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */


import FormUtils from "../utils/forms.js";
import Activity from "../models/activity.js";
import Subscription from "../models/subscription.js";
import {functionFactory} from "../utils/function-factory.js";

class Definition extends HTMLElement {

    constructor() {
        super();
        this._definingNode = null;
        this._functionString = String;
        this._failTrigger = false;
        this._winTrigger = false;
        this._output = null;


        this.dataMode = "test";
        this._testBankMap = new Map();
        this._testStateMap = new Map();
        this.testData = new Map();
        this._initUI();
    }

    get definingNode() {
        return this._definingNode;
    }

    set definingNode(node) {
        this._definingNode = node;
    }

    changeDefiningNode(node) {
        this._definingNode = node;
        this.buildTestBank(node)
        this.buildSubscriptionBank(node)
        this._buildFunction(node)
    }

    get functionString() {
        return this._functionString();
    }

    set functionString(string) {
        this._functionString = string
    }

    get output() {
        return this._output();
    }

    getWinTrigger() {
        return this._winTrigger();
    }

    getFailTrigger() {
        return this._failTrigger();
    }



    removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }


    buildSubscriptionBank(subscriptionNode = this._definingNode) {
        this.removeAllChildNodes(this._$subscriptionEntryDiv)
        if (this.definingNode.subscriptions.length > 0) {
            /////////////  SUBSCRIPTIONS - Title Line - Title
            let $subscriptionSubtitle  = document.createElement('H2');
            $subscriptionSubtitle.innerText = "Subscribed To:  "
            this._$subscriptionEntryDiv.appendChild($subscriptionSubtitle)
            /////////////  SUBSCRIPTIONS - Header Line
            let $subscriptionHeaderLine = document.createElement('div');
            $subscriptionHeaderLine.className = 'header-line';
            let $spacer = document.createElement('H2');
            $spacer.innerText = ""
            $spacer.className = "sub-property"
            let $channelName = document.createElement('H2');
            $channelName.innerText = "channel"
            $channelName.className = "sub-property"
            let $lastUpdate = document.createElement('H2');
            $lastUpdate.innerText = "lastUpdate"
            $lastUpdate.className = "sub-property"
            let $conditionCode = document.createElement('H2');
            $conditionCode.innerText = "conditionCode"
            $conditionCode.className = "sub-property"
            let $variableName = document.createElement('H2');
            $variableName.innerText = "variableName"
            $variableName.className = "sub-property"
            $subscriptionHeaderLine.appendChild($spacer)
            $subscriptionHeaderLine.appendChild($channelName)
            $subscriptionHeaderLine.appendChild($lastUpdate)
            $subscriptionHeaderLine.appendChild($conditionCode)
            $subscriptionHeaderLine.appendChild($variableName)
            this._$subscriptionEntryDiv.appendChild($subscriptionHeaderLine)
            subscriptionNode.subscriptions.forEach(subscription => {
                let childSubscription = this.createSubscriptionEntryLine(subscription)
                this._$subscriptionEntryDiv.appendChild(childSubscription)
            })

        }
    }

    createSubscriptionEntryLine(subscription) {
        let $subscriptionEntryLine =  document.createElement('div');
        $subscriptionEntryLine.className = "subscription-line";
        $subscriptionEntryLine.setAttribute("id", subscription.name)
        let $subscriptionRemoveButton  = document.createElement('button');
        $subscriptionRemoveButton.innerText = "-"
        $subscriptionRemoveButton.setAttribute("id", "subscription-remove-button")
        $subscriptionRemoveButton.addEventListener('click', this._removeSubscription.bind(this));
        $subscriptionEntryLine.appendChild($subscriptionRemoveButton)

        let $channelName =  document.createElement('span');
        $channelName.innerText = subscription.name
        $channelName.className = "sub-property"
        let $lastUpdate =  document.createElement('span');
        $lastUpdate.innerText = subscription.lastReportTime
        $lastUpdate.className = "sub-property"
        let $conditionCode =  document.createElement('span');
        $conditionCode.innerText = subscription.lastReportedCode
        $conditionCode.className = "sub-property"
        let $variableName =  document.createElement('span');
        $variableName.innerText = "${" + subscription.name + "}"
        $variableName.className = "sub-property"
        $subscriptionEntryLine.appendChild($channelName)
        $subscriptionEntryLine.appendChild($lastUpdate)
        $subscriptionEntryLine.appendChild($conditionCode)
        $subscriptionEntryLine.appendChild($variableName)
        return ($subscriptionEntryLine)

    }





    buildTestBank(testNode = this._definingNode){
        this.removeAllChildNodes(this.$testerEntryDiv)

        testNode.children.forEach(child => {
            let childTester = this.createTestElement(child)
            this.$testerEntryDiv.appendChild(childTester)
        })
    }


    createTestElement(node) {
        let stateOptions = [];
        let label = node.urn + " / " + node.contextualName;
        const test_el = FormUtils.createPropertyElement("test-" + node.id, label);
        test_el.className = "test-collection"
        this._valueInput = FormUtils.createTextInput('test-value-' + node.id);
        this._valueInput.setAttribute("placeholder", "test return value");
        this._valueInput.setAttribute("node", node.id)
        this._valueInput.className = "test-property";
        this._valueInput.addEventListener('blur', (event) => {
            this._testBankMap.set(node.id, event.target.value);
            this._buildFunction(node)
        });

        let stateDefinition = Definition.STATE;
        for (let state in stateDefinition) {
            stateOptions.push({value: stateDefinition[state].name, text: stateDefinition[state].text})
        }
        this._stateInput = FormUtils.createSelect('test-state-' + node.id, stateOptions, Definition.STATE.ACTIVE.name);
        this._stateInput.className = "test-property";
        this._stateInput.addEventListener('change', this._updateTestStateMap.bind(this));
        test_el.appendChild(this._valueInput);
        test_el.appendChild(this._stateInput)
        return test_el
    }

    _updateTestStateMap(event){
        this._testStateMap.set(event.target.id, event.target.value)
    }

    _updateTestDataMap(event){
        this._testBankMap.set(event.target.id, event.target.value)
    }




    _initUI() {

        ////////////// DATA VALUES - Div
        this.$testerDiv = document.createElement('div');                   // TEST BLOCK Div - Mock input
        this.$testerDiv.className = 'tester definition-block';
        /////////////  DATA VALUES - Div - Title Line
        let $testDivTitleLine =  document.createElement('div');
        $testDivTitleLine.className = 'title-line';
        this.$testerDiv.appendChild($testDivTitleLine)
        /////////////  DATA VALUES - Div - Title Line - Title
        this.$testerTitle = document.createElement('H1');
        this.$testerTitle.innerText = "TEST DATA"
        this.$testerTitle.className = "block-title"
        $testDivTitleLine.appendChild(this.$testerTitle);
        /////////////  SUBSCRIPTIONS - Div Title Line - Add Button
        this._$swapButton  = document.createElement('button');
        this._$swapButton.innerText = (this.dataMode == "live") ? ">Test" : ">Live"
        this._$swapButton.setAttribute("id", "subscription-add-button")
        $testDivTitleLine.appendChild(this._$swapButton)
        /////////////  SUBSCRIPTIONS - Entry Field  (buildTestBank)
        this.$testerEntryDiv = document.createElement('div');
        this.$testerEntryDiv.className = 'tester-entry-field';
        this.$testerDiv.appendChild(this.$testerEntryDiv);
        this.appendChild(this.$testerDiv);

        /////////////  SUBSCRIPTIONS - Div
        const $subscriptionsDiv = document.createElement('div');             // CONDITIONS BLOCK Div - Abort,Fail,Success conditions
        $subscriptionsDiv.className = 'subscription definition-block';
        /////////////  SUBSCRIPTIONS - Div Title Line
        let $subscriptionDivTitleLine =  document.createElement('div');
        $subscriptionDivTitleLine.className = 'title-line';
        $subscriptionsDiv.appendChild($subscriptionDivTitleLine)
        /////////////  SUBSCRIPTIONS - Div Title Line - Title
        this.$subscriptionsDivTitle = document.createElement('H1');
        this.$subscriptionsDivTitle.innerText = "SUBSCRIPTIONS"
        this.$subscriptionsDivTitle.className = "block-title"
        $subscriptionDivTitleLine.appendChild(this.$subscriptionsDivTitle)
        /////////////  SUBSCRIPTIONS - Div Title Line - Add Button
        let $subscriptionAddButton  = document.createElement('button');
        $subscriptionAddButton.innerText = "+"
        $subscriptionAddButton.setAttribute("id", "subscription-add-button")
        $subscriptionDivTitleLine.appendChild($subscriptionAddButton)

        /////////////  SUBSCRIPTIONS - Data Line (createSubscriptionElement)
        this._$subscriptionEntryDiv = document.createElement('div');
        this._$subscriptionEntryDiv.className = "subscription-container"
        $subscriptionsDiv.appendChild(this._$subscriptionEntryDiv)
        this.appendChild($subscriptionsDiv);

        /////////////  FUNCTION
        const $functionDiv = document.createElement('div');               // Synthensis / logic between input and output
        $functionDiv.className = 'function definition-block';
        /////////////  SUBSCRIPTIONS - Div Title Line - Title
        this.$functionDivTitle = document.createElement('H1');
        this.$functionDivTitle.innerText = "FUNCTION"
        this.$functionDivTitle.className = "block-title"
        $functionDiv.appendChild(this.$functionDivTitle)

        let $textAreaWrap = document.createElement('div');
        $textAreaWrap.className = "textAreaWrap"
        this._$textArea = document.createElement('textarea');
        this._$textArea.className = "textArea"
        $textAreaWrap.appendChild(this._$textArea)

        $functionDiv.appendChild($textAreaWrap)


        this._$infoWrap = document.createElement('div');
        this._$infoWrap.className = "info-wrap"
        $functionDiv.appendChild(this._$infoWrap);
        this.appendChild($functionDiv);

        $subscriptionAddButton.addEventListener('click', this._addSubscription.bind(this));
        this._$swapButton.addEventListener('click', this._toggleDataMode.bind(this));

    }

    _templateFunction(returns, operator){
        let templateFunction = functionFactory(returns, operator)
        this._$textArea.value = templateFunction;
    }

    _buildFunction(node) {
        this.removeAllChildNodes(this._$infoWrap)
        let availableChildren = this.getAvailableChildrenReturnValues(node)
        let $availableChildrenSpan = document.createElement('span');
        $availableChildrenSpan.innerText = "${AvailableChildren} = [" + availableChildren + "]              "
        this._$infoWrap.appendChild($availableChildrenSpan)

        let allChildren = this.getAllChildrenReturnValues(node)
        let $allChildrenSpan = document.createElement('span');
        $allChildrenSpan.innerText = "${AllChildren} = [" + allChildren + "]"
        this._$infoWrap.appendChild($allChildrenSpan)


    }

    getAllChildrenReturnValues(node) {
        let values = []
        if (this.dataMode == "live") {
            values = node.children.map(child => {
                if (values) {
                    return values
                } else {
                    return null
                }
            })
        } else {
            values = this.definingNode.children.map(child => {
                let values = this._testBankMap.get(child.id)
                if (values) {
                    return values
                } else {
                    return null
                }
            })
        }
        return values
    }


    getAvailableChildrenReturnValues(node){
        let values = []
        if (this.dataMode == "live") {
            values = node.children.map(child => {
                if ((child.returnValue != 'undefined') || (child.returnValue != 'null')) {
                    return child.returnValue
                }
            })
        } else {
            values = this.definingNode.children.map(child => {
                return this._testBankMap.get(child.id)
            }).filter(value => {
                if ((value != 'undefined') || (value != 'null')) {
                    return value
                }
            })
        }
        return values
    }


    _toggleDataMode(event) {
        if (this.dataMode == "test") {
            this._$swapButton.innerText = ">Live"
            this.dataMode == "live"
        } else {
            this._$swapButton.innerText = ">Test"
            this.dataMode == "test"
        }
    }

_addSubscription(event) {
        let subscriptionChannelName = prompt("Please enter your channel", "");
        let subscription = new Subscription({name: subscriptionChannelName, lastReportTime: null, lastReportedCode: null})
        this._definingNode.subscriptions.push(subscription);
        this.buildSubscriptionBank()
    }

    _removeSubscription(event) {
        let deadSubscription = event.target.parentElement.id;
        this._definingNode.removeSubscription(deadSubscription);
        this.buildSubscriptionBank()
    }
    // When updating a test input --- update the testBankMap... stores test settings across reloads.

}

customElements.define('def-definition', Definition);

export default customElements.get('def-definition');

Definition.STATE = {
    ACTIVE: {
        name: 'active',
        text: "active",
    },
    WAITING: {
        name: 'waiting',
        text: "waiting"
    },
    INITIALIZING: {
        name: 'initializing',
        text: "initializing"
    },
    RECOVERING: {
        name: 'recovering',
        text: "recovering"
    },
    DISCONNECTED: {
        name: 'disconnected',
        text: "disconnected"
    },
    OOB: {
        name: 'oob',
        text: 'Out of Bounds'
    },
    INOP: {
        name: 'inop',
        text: "unoperational"
    },
    UNKNOWN: {
        name: 'unknown',
        text: "unknown"
    },
    IRRELEVENT: {
        name: "irrelevent",
        text: "not applicable"
    }
}