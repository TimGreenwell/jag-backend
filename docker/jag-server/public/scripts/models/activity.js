/**
 * @file Activity model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.89
 */

import {uuidV4} from "../utils/uuid.js";
import Validation from "../utils/validation.js";
import Binding from "./binding.js";
import Endpoint from "./endpoint.js";
import UserPrefs from "../utils/user-prefs.js";


export default class Activity extends EventTarget {

    constructor({
        urn,
        name,
        description = ``,
        connector = {
            execution: Activity.EXECUTION.NONE.name,
            returns: Activity.RETURNS.ALL.name,
            operator: Activity.OPERATOR.NONE.name,
            onfail: Activity.RETURNS.NONE.name
        },
        endpoints = [],
        // inputs = [],
        // outputs = [],
        children = [],
        bindings = [],   // list of Binding
        author = UserPrefs.getAuthor(),
        createdDate,
        modifiedDate,
        expectedDuration = ``,
        lockedBy,
        isLocked = Boolean(false),
        collapsed = Boolean(false)
    }) {
        super();

        this._urn = urn;
        this._name = name;
        this._description = description;
        this._connector = connector;
        this._endpoints = endpoints;
        // this._inputs = inputs ? [...inputs] : [];
        // this._outputs = outputs ? [...outputs] : [];
        this._children = children ? [...children] : [];
        this._bindings = bindings;

        this._author = author;
        this._createdDate = createdDate;
        this._modifiedDate = modifiedDate;
        this._expectedDuration = expectedDuration;
        this._lockedBy = lockedBy;
        this._isLocked = isLocked;
        this._collapsed = collapsed;


        // The below has not been looked at.
        for (const child of this._children) {
            if (child.annotations) {
                const annotations = new Map();
                for (const annotation in child.annotations) {
                    annotations.set(annotation, child.annotations[annotation]);
                }
                child.annotations = annotations;
            }
        }
        this._endpoints = endpoints;
    }


    get urn() {
        return this._urn;
    }

    set urn(urn) {
        if (!Validation.isValidUrn(this._urn)) {
            this._urn = urn;
        }
    }

    set name(name) {
        this._name = name;
    }

    get name() {
        return this._name;
    }

    set description(description) {
        this._description = description;
    }

    get description() {
        return this._description;
    }

    get author() {
        return this._author;
    }

    set author(value) {
        this._author = value;
    }

    get createdDate() {
        return this._createdDate;
    }

    set createdDate(value) {
        this._createdDate = value;
    }

    get modifiedDate() {
        return this._modifiedDate;
    }

    set modifiedDate(value) {
        this._modifiedDate = value;
    }


    get expectedDuration() {
        return this._expectedDuration;
    }

    set expectedDuration(value) {
        this._expectedDuration = value;
    }

    get lockedBy() {
        return this._lockedBy;
    }

    set lockedBy(value) {
        this._lockedBy = value;
    }

    set connector(value) {
        this._connector = value;
    }

    get connector() {
        return this._connector;
    }


    get endpoints() {
        return this._endpoints;
    }

    set endpoints(value) {
        this._endpoints = value;
    }

    getInputs() {
        const inputs = this.endpoints.filter((endpoint) => {
            return endpoint.direction === `input`;
        });
        return inputs;
    }

    getOutputs() {
        const outputs = this.endpoints.filter((endpoint) => {
            return endpoint.direction === `output`;
        });
        return outputs;
    }

    removeEndpoint(endpoint) {
        const extantEndpoints = this.endpoints.filter((extantEndpoint) => {
            return extantEndpoint !== endpoint;
        });
        this._endpoints = extantEndpoints;
    }

    addEndpoint(endpoint) {
        if (Validation.validateEndpoint(endpoint)) {
            if (this.hasEndpoint(endpoint)) {
                this.removeEndpoint(endpoint.exchangeName);
            }
            this._endpoints.push(endpoint);
            return true;
        } else {
            return false;
        }
    }

    hasEndpoint(endpoint) {
        let found = false;
        this.endpoints.forEach((extantEndpoint) => {
            if (extantEndpoint.equals(endpoint)) {
                found = true;
            }
        });
        return found;
    }

    //
    removeInput(exchangeName) {
        const endpoint = new Endpoint();
        endpoint.exchangeName = exchangeName;
        endpoint.direction = `input`;
        endpoint.exchangeSourceUrn = this.urn;
        this.removeEndpoint(endpoint);
    }

    removeOutput(exchangeName) {
        const endpoint = new Endpoint();
        endpoint.exchangeName = exchangeName;
        endpoint.direction = `output`;
        endpoint.exchangeSourceUrn = this.urn;
        this.removeEndpoint(endpoint);
    }

    addInput(exchangeName, exchangeType) {
        const newEndpoint = new Endpoint({exchangeName,
            exchangeType});
        newEndpoint.direction = `input`;
        newEndpoint.exchangeSourceUrn = this.urn;
        const result = this.addEndpoint(newEndpoint);
        return result;
    }

    addOutput(exchangeName, exchangeType) {
        const newEndpoint = new Endpoint({exchangeName,
            exchangeType});
        newEndpoint.direction = `output`;
        newEndpoint.exchangeSourceUrn = this.urn;
        const result = this.addEndpoint(newEndpoint);
        return result;
    }


    get dependencySlot() {
        return this._dependencySlot;
    }

    set dependencySlot(value) {
        this._dependencySlot = value;
    }

    equalArrays(a, b) {
        a.every((item) => {
            return b.includes(item);
        }) && b.every((item) => {
            return a.includes(item);
        });
    }


    set children(value) {
        this._children = value;
        if ((this._children.length !== 0) && (this.connector.operator === Activity.OPERATOR.NONE.name)) {
            this.connector.operator = Activity.OPERATOR.AND.name;
        }
    }

    get children() {
        return [...this._children];
    }

    hasChildren() {
        return (this._children.length > 0);
    }

    get canHaveChildren() {
        return (Validation.isValidUrn(this.urn));
    }

    set bindings(value) {
        this._bindings = value;
    }

    get bindings() {
        return [...this._bindings];
    }

    addBinding(value) {
        this._bindings.push(value);
    }

    set execution(type) {
        this.connector.execution = type;
    }

    get execution() {
        return this.connector.execution;
    }

    set operator(type) {
        this.connector.operator = type;
    }

    get operator() {
        return this.connector.operator;
    }

    set returns(type) {
        this.connector.returns = type;
    }

    get returns() {
        return this.connector.returns;
    }

    set isLocked(bool) {
        this._isLocked = bool;
    }

    get isLocked() {
        return this._isLocked;
    }

    get collapsed() {
        return this._collapsed;
    }

    set collapsed(value) {
        this._collapsed = value;
    }


    addChild(urn, id = undefined) {  // Add uuidV4 default here
        /**
         * Adds the given Activity as a child to this Activity.
         * If an ID already exists, the child already exists, and this was likely called
         * during creation of a graphical edge for the child of an existing Activity; the call
         * will be ignored and the given ID will be returned.
         * Dispatches an update if ID is undefined.
         *
         * @param {Activity} child Model to add.
         * @param {String} id ID for child, if it exists.
         * @returns {String} uuidV4 string of the child.
         */

        let newId = id;
        if (id === undefined) {   // <-- prob obs now
            newId = uuidV4();
            this._children.push({
                urn,
                id: newId
                //    activity: child   // don't think this is really there.  would be too much to serialize
            });
        }
        if ((this._children.length !== 0) && (this.connector.operator === Activity.OPERATOR.NONE.name)) {
            this.connector.operator = Activity.OPERATOR.AND.name;
        }
        return newId;
    }


    // removeChild(childId) {
    //     for (const index in this._children) {
    //         if (this._children[index].id === childId) {
    //             this._children.splice(index, 1);
    //             break;
    //         }
    //     }
    //     for (const binding of this._bindings) {
    //         if (binding.from.id === childId || binding.to.id === childId) {
    //             this.removeBinding(binding);
    //         }
    //     }
    // }

    /**
     * Sets the name of the child with the given ID to the given name.
     *
     * @param {String} id ID of the child whose name will be set.
     * @param {String} name Name to set to.
     */
    setChildNameXXX(id, name) {
        for (const child of this._children) {
            if (child.id === id) {
                if (child.name !== name) {
                    child.name = name;
                }
                break;
            }
        }
    }

    isChild(urn) {
        let isChild = false;

        this._children.forEach((child) => {
            if (child.urn === urn) {
                isChild = true;
            }
        });
        return isChild;
    }

    /**
     * Sets the description of the child with the given ID to the given description.
     *
     * @param {String} id ID of the child whose description will be set.
     * @param {String} description Description to set to.
     */
    setChildDescriptionXXX(id, description) {
        for (const child of this._children) {
            if (child.id === id) {
                if (child.description !== description) {
                    child.description = description;
                }
                break;
            }
        }
    }


    /**
     * Gets the ID, Activity, property name and type of all possible inputs to the child with the given ID.
     * Includes inputs to this Activity and outputs from sequential children preceding the child with the given ID.
     *
     * @param {String} id ID of the child for which to seek inputs.
     * @returns {Array<{id:String,activity:Activity,property:String,type:String}>} Inputs available to the child with the given ID.
     */
    // inputsTo(id) {
    //     const availableInputs = this._inputs.map((input) => {
    //         return {
    //             id: `this`,
    //             activity: this,
    //             exchangeName: input.exchangeName,
    //             exchangeType: input.exchangeType
    //         };
    //     });
    //
    //     if (this.connector.execution === Activity.EXECUTION.SEQUENTIAL.name) {
    //         for (const child of this._children) {
    //             if (child.id === id) {
    //                 break;
    //             }
    //             if (child.activity) {
    //                 const child_outputs = child.activity.outputs;
    //
    //                 for (const child_output of child_outputs) {
    //                     availableInputs.push({
    //                         id: child.id,
    //                         activity: child.activity,
    //                         property: child_output.exchangeName,
    //                         type: child_output.exchangeType
    //                     });
    //                 }
    //             }
    //         }
    //     }
    //
    //     return availableInputs;
    // }

    removeBinding(removedBinding) {
        let resultBindings;
        if (removedBinding.to) {
            this.bindings = this.bindings.filter((binding) => {
                resultBindings = (!((binding.from.equals(removedBinding.from) &&
                    (binding.to.equals(removedBinding.to)))));
                return resultBindings;
            });
        } else {
            this.bindings = this.bindings.filter((checkBinding) => {
                resultBindings = (!(checkBinding.from.equals(removedBinding.from)));
                return resultBindings;
            });
        }
    }

    /**
     * Is given endpoint bound to something...
     * @returns {boolean}
     */
    isBoundProducerEndpoint(checkEndpoint) {
        let isBoundProducer = false;
        this.bindings.forEach((binding) => {
            if (binding.from.equals(checkEndpoint)) {
                isBoundProducer = true;
            }
        });
        return isBoundProducer;
    }


    isDependentSibling(urn) {
        let isDependentSibling = false;
        this.bindings.forEach((binding) => {
            if ((binding.to.exchangeSourceUrn === urn) && (binding.to.direction = `input`)) {
                const producer = binding.from.exchangeSourceUrn;
                if (this.isChild(producer)) {
                    isDependentSibling = true;
                }
            }
        });
        return isDependentSibling;
    }


    hasConsumingSiblings(urn) {
        let hasConsumingSiblings = false;
        this.bindings.forEach((binding) => {
            if ((binding.from.exchangeSourceUrn === urn) && (binding.from.direction = `output`)) {
                const consumer = binding.to;
                if (this.isChild(consumer.exchangeSourceUrn)) {
                    hasConsumingSiblings = true;
                }
            }
        });
        return hasConsumingSiblings;
    }

    getConsumingSiblings(urn) {
        const consumingSiblings = [];
        this.bindings.forEach((binding) => {
            if ((binding.from.exchangeSourceUrn === urn) && (binding.from.direction = `output`)) {
                const consumer = binding.to;
                if (this.isChild(consumer.exchangeSourceUrn)) {
                    consumingSiblings.push(urn);
                }
            }
        });
    }


    /**
     * Is given endpoint bound from something...
     * @returns {boolean}
     */
    isBoundConsumerEndpoint(checkEndpoint) {
        let isBoundConsumer = false;
        this.bindings.forEach((binding) => {
            if (binding.to.equals(checkEndpoint)) {
                isBoundConsumer = true;
            }
        });
        return isBoundConsumer;
    }

    /**
     * Get list of consuming nodes of endpoint.
     * @param checkEndpoint
     * @returns {*[]}
     */
    getConsumingEndpointsFor(checkEndpoint) {
        const consumers = [];
        this.bindings.forEach((binding) => {
            if (binding.from.equals(checkEndpoint)) {
                consumers.push(binding.to);
            }
        });
        return consumers;
    }

    /**
     * Get list of producing nodes for endpoint.
     * @param checkEndpoint
     * @returns {*[]}
     */
    getProducingEndpointsFor(checkEndpoint) {
        const producers = [];
        this.bindings.forEach((binding) => {
            if (binding.to.equals(checkEndpoint)) {
                producers.push(binding.from);
            }
        });
        return producers;
    }


    getConsumingChildren(urn) {
        let leafConsumers = [];
        if (this.hasConsumingSiblings()) {
            leafConsumers = [...this.getConsumingSiblings()];
        }
        return leafConsumers;
    }

    /**
     * Gets the child of this Activity with the given ID.
     *
     * @param {String} id
     * @returns {{id:String,activity:Activity}} Child of this Activity with the given ID.
     */
    getCanonicalNode(id) {
        if (id === `this`) {
            return {
                id: `this`,
                activity: this
            };
        }

        for (const child of this._children) {
            if (child.id === id) {
                return child;
            }
        }

        return undefined;
    }

    /**
     * Adds the given annotation with name and value to the given child Activity.
     * Dispatches an update.
     *
     * @param {String} id UUID of the child to which to add the annotation.
     * @param {String} name Key name for the new annotation.
     * @param {String} value Value for the new annotation.
     */
    addAnnotation(id, name, value) {
        const child = this.getCanonicalNode(id);

        if (!(child == undefined || child.activity == this)) {
            if (!child.annotations || !child.annotations.has(name) || child.annotations.get(name) !== value) {
                if (!child.annotations) {
                    child.annotations = new Map();
                }
                child.annotations.set(name, value);
            }
        }
    }

    /**
     * Removes the annotation with the given name from the child Activity of the given ID.
     * Dispatches an update.
     *
     * @param {String} id UUID of the child from which to remove the annotation.
     * @param {String} name Key name for the annotation to delete.
     */
    removeAnnotation(id, name) {
        const child = this.getCanonicalNode(id);

        if (!(child == undefined || child.activity == this)) {
            if (!child.annotations) {
                return;
            }

            if (child.annotations.has(name)) {
                child.annotations.delete(name);
            }
        }
    }

    /**
     * Marks the child with the given ID as iterable with the given value.
     *
     * @param {String} id UUID of the child to mark.
     * @param {boolean} value True or false whether or not the child is iterable.
     */
    setIterable(id, value) {
        for (const child of this._children) {
            if (child.id === id) {
                if (child.iterable == value) {
                    return;
                }
                child.iterable = value;
                return;
            }
        }
    }

    getOrderForId(id) {
        if (this.connector.execution === Activity.EXECUTION.PARALLEL.name) {
            return 0;
        }
        for (let i = 0; i < this._children.length; ++i) {
            if (this._children[i].id === id) {
                return i + 1;
            }
        }
        return 0;
    }


    toJSON() {  // @todo -- make children in a map or something simpler
        const json = {
            urn: this._urn,
            name: this._name,
            expectedDuration: this._expectedDuration,
            description: this._description,
            type: `livenode.type.plan`,
            connector: {
                execution: this.connector.execution,
                returns: this.connector.returns,
                operator: this.connector.operator
            },
            endpoints: [],
            // inputs: [],
            // outputs: [],
            children: [],
            bindings: [],
            isLocked: this._isLocked,
            collapsed: this._collapsed
        };


        this._children.forEach((child) => {
            const descriptor = {
                urn: child.urn,
                id: child.id
            };
            if (child.name) {
                descriptor.name = child.name;
            }
            if (child.description) {
                descriptor.description = child.description;
            }

            if (child.annotations && child.annotations.size > 0) {
                descriptor.annotations = {};

                for (const annotation of child.annotations) {
                    descriptor.annotations[annotation[0]] = annotation[1];
                }
            }
            if (child.iterable) {
                descriptor.iterable = true;
            }
            json.children.push(descriptor);
        });

        const endpointStack = [];
        this._endpoints.forEach((endpoint) => {
            endpointStack.push(endpoint.toJSON());
        });
        json.endpoints = endpointStack;

        // this._inputs.forEach((input) => {
        //     json.inputs.push(input);
        // });
        // this._outputs.forEach((output) => {
        //     json.outputs.push(output);
        // });
        const bindingStack = [];
        this._bindings.forEach((binding) => {
            bindingStack.push(binding.toJSON());
        });
        json.bindings = bindingStack;

        return json;
    }

    static fromJSON(json) {
        if (Array.isArray(json)) {
            const jagList = json.map(function (element) {
                try {
                    Validation.validateJAG(element);
                } catch (e) {
                    throw new Error(`Error fromJSON parsing ${JSON.stringify(json)}: ${e.message}`);  // note to self: if you get an error bringing you here, it might be forgetting the schema.
                }

                const returnValue = new Activity(element);
                return returnValue;
            });
            return jagList;
        } else {
            try {
                Validation.validateJAG(json);
            } catch (e) {
                throw new Error(`Error fromJSON parsing ${JSON.stringify(json)}: ${e.message}`);  // note to self: if you get an error bringing you here, it might be forgetting the schema.
            }

            const bindingStack = [];
            for (const binding of json.bindings) {
                bindingStack.push(Binding.fromJSON(binding));
            }
            json.bindings = bindingStack;

            const endpointStack = [];
            for (const endpoint of json.endpoints) {
                endpointStack.push(Endpoint.fromJSON(endpoint));
            }
            json.endpoints = endpointStack;

            const returnValue = new Activity(json);
            return returnValue;
            // @TODO: explode the json definition to use the constructor below
            // return new Activity(urn, name, connector, inputs, outputs, children, bindings);
        }
    }


    static getExecutionOptions() {
        const executionOptions = [];
        const execution = Activity.EXECUTION;
        for (const step in execution) {
            executionOptions.push({
                value: execution[step].name,
                text: execution[step].text
            });
        }
        return executionOptions;
    }

    static getReturnsOptions(executionName) {
        const returnsOptions = [];
        const returns = Activity.RETURNS;
        for (const step in returns) {
            if (returns[step].condition.includes(executionName)) {
                returnsOptions.push({
                    value: returns[step].name,
                    text: returns[step].text
                });
            }
        }
        return returnsOptions;
    }

    static getOnFailOptions(executionName) {
        const onfailOptions = [];
        const onfails = Activity.ONFAIL;
        for (const step in onfails) {
            if (onfails[step].condition.includes(executionName)) {
                onfailOptions.push({
                    value: onfails[step].name,
                    text: onfails[step].text
                });
            }
        }
        return onfailOptions;
    }


    static getOperatorOptions(returnName) {
        const operatorOptions = [];
        const operators = Activity.OPERATOR;
        for (const step in operators) {
            if (operators[step].condition.includes(returnName)) {
                operatorOptions.push({
                    value: operators[step].name,
                    text: operators[step].text
                });
            }
        }
        return operatorOptions;
    }

}

Activity.EXECUTION = {
    NONE: {
        name: `livenode.execution.none`,
        text: `none`,
        description: `No reporting sub-activities`
    },
    PARALLEL: {
        name: `livenode.execution.parallel`,
        text: `parallel`,
        description: `Sub-activities execute simultaneously`
    },
    SEQUENTIAL:
        {
            name: `livenode.execution.sequential`,
            text: `sequential`,
            description: `Sub-activities execute in order`
        },
    RETRY: {
        name: `livenode.execution.retry`,
        text: `sequential w/retry`,
        description: `Recover and retry all if one sub-activity fails`
    },
    LOOP: {
        name: `livenode.execution.loop`,
        text: `sequential loop`,
        description: `First sub-activity resumes after last finishes`
    },
    OVERLAP: {
        name: `livenode.execution.overlap`,
        text: `sequential w/overlap`,
        description: `Following sub-activity begins before the previous ends`
    },
    PARALLELX: {
        name: `livenode.execution.parallelx`,
        text: `parallel subset`,
        description: `Some sub-activities execute simultaneously`
    }
};


Activity.ONFAIL = {
    NONE: {
        name: `livenode.onfail.none`,
        text: `none`,
        description: `No action on fail notice`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`, `livenode.execution.parallelx`]
    },
    RETRY: {
        name: `livenode.onfail.retry`,
        text: `repeat this action`,
        description: `Continue to repeat this action`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`, `livenode.execution.parallelx`]
    },
    RESTART: {
        name: `livenode.onfail.restart`,
        text: `return to beginning`,
        description: `Start over from first step`,
        condition: [`livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`]
    },
    PREVIOUS: {
        name: `livenode.onfail.previous`,
        text: `return to previous`,
        description: `restart previous action`,
        condition: [`livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`]
    },
    SKIP: {
        name: `livenode.onfail.skip`,
        text: `skip next`,
        description: `Skip the next action`,
        condition: [`livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`]
    },
    RETURN: {
        name: `livenode.onfail.return`,
        text: `skip remaining`,
        description: `Skip the remaining actions`,
        condition: [`livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`]
    },
    RECOVER: {
        name: `livenode.onfail.recover`,
        text: `"Recover"`,
        description: `Run the "Recover" function`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`, `livenode.execution.parallelx`]
    },
    ABORT: {
        name: `livenode.onfail.abort`,
        text: `"Abort"`,
        description: `Run the "Abort" function`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.loop`, `livenode.execution.overlap`, `livenode.execution.parallelx`]
    }

};


Activity.RETURNS = {
    NONE: {
        name: `livenode.returns.none`,
        text: `none`,
        description: `No data is returned`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.retry`, `livenode.execution.loop`, `livenode.execution.overlap`, `livenode.execution.parallelx`]
    },
    ACTIVE: {
        name: `livenode.returns.active`,
        text: `active mode`,
        description: `All children in an ACTIVE mode`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.retry`, `livenode.execution.loop`, `livenode.execution.overlap`, `livenode.execution.parallelx`]
    },
    AVAILABLE: {
        name: `livenode.returns.available`,
        text: `all available`,
        description: `All children with currently available output`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.retry`, `livenode.execution.loop`, `livenode.execution.overlap`, `livenode.execution.parallelx`]
    },
    ALL: {
        name: `livenode.returns.all`,
        text: `all (or none)`,
        description: `All children data when all become available`,
        condition: [`livenode.execution.parallel`, `livenode.execution.parallelx`]
    },
    LATEST: {
        name: `livenode.returns.latest`,
        text: `most recent`,
        description: `Only data from most recently reporting child`,
        condition: [`livenode.execution.parallel`, `livenode.execution.sequential`, `livenode.execution.retry`, `livenode.execution.loop`, `livenode.execution.overlap`]
    },
    PRIORITY: {
        name: `livenode.returns.priority`,
        text: `highest priority`,
        description: `Child with highest priority available input`,
        condition: [`livenode.execution.parallel`]
    },
    FINAL: {
        name: `livenode.returns.final`,
        text: `final output`,
        description: `Final result from last child in sequence`,
        condition: [`livenode.execution.sequential`, `livenode.execution.retry`, `livenode.execution.loop`, `livenode.execution.overlap`]
    }
};


Activity.OPERATOR = {
    NONE: {
        name: `livenode.operator.none`,                  // does not return a value    (maybe just a state?) (maybe nada)
        text: `none`,
        symbol: ``,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`, `livenode.returns.latest`, `livenode.returns.priority`, `livenode.returns.final`]
    },
    AND: {
        name: `livenode.operator.and`,                    // AND(boolean,boolean,...)
        text: `and`,
        symbol: `and`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    OR: {
        name: `livenode.operator.or`,                      // OR(boolean,boolean,...)        @TODO  XOR?!    NAND NOR
        text: `or`,
        symbol: `or`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    FIRST: {
        name: `livenode.operator.first`,
        text: `first reporting`,
        symbol: `1st`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    LAST: {
        name: `livenode.operator.last`,
        text: `last reporting`,
        symbol: `nth`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    MAX: {
        name: `livenode.operator.max`,
        text: `largest`,
        symbol: `max`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    MIN: {
        name: `livenode.operator.min`,
        text: `smallest`,
        symbol: `min`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    SUM: {
        name: `livenode.operator.sum`,
        text: `sum`,
        symbol: `sum`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    AVG: {
        name: `livenode.operator.avg`,
        text: `average`,
        symbol: `avg`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    UNION: {
        name: `livenode.operator.union`,
        text: `union`,
        symbol: `U`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    INT: {
        name: `livenode.operator.intersection`,
        text: `intersection`,
        symbol: `\uD83D\uDE00`,
        condition: [`livenode.returns.active`, `livenode.returns.available`, `livenode.returns.all`]
    },
    CONVERT: {
        name: `livenode.operator.convert`,
        text: `convert`,
        symbol: `><`,
        condition: [`livenode.returns.active`, `livenode.returns.latest`, `livenode.returns.priority`, `livenode.returns.final`]
    },
    INVERSE: {
        name: `livenode.operator.inverse`,
        text: `inverse`,
        symbol: `1/x`,
        condition: [`livenode.returns.active`, `livenode.returns.latest`, `livenode.returns.priority`, `livenode.returns.final`]
    },
    NEGATE: {
        name: `livenode.operator.negate`,
        text: `negate`,
        symbol: `-x`,
        condition: [`livenode.returns.active`, `livenode.returns.latest`, `livenode.returns.priority`, `livenode.returns.final`]
    },
    ABS: {
        name: `livenode.operator.absolute`,
        text: `absolute`,
        symbol: `|x|`,
        condition: [`livenode.returns.active`, `livenode.returns.latest`, `livenode.returns.priority`, `livenode.returns.final`]
    },
    NOT: {
        name: `livenode.operator.not`,
        text: `not`,
        symbol: `!`,
        condition: [`livenode.returns.active`, `livenode.returns.latest`, `livenode.returns.priority`, `livenode.returns.final`]
    }

};
