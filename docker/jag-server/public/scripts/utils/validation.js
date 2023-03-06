/**
 * @file Validator for JAGAT models.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.07
 */

export default class JAGATValidation {

    static validateJAG(jagDescriptor) {
        JAGATValidation.validateURN(jagDescriptor.urn);
        JAGATValidation.validateName(jagDescriptor.name);
        JAGATValidation.validateDescription(jagDescriptor.description);
        if (jagDescriptor.connector) {
            JAGATValidation.validateConnector(jagDescriptor.connector);
        }
        if (jagDescriptor.endpoints) {
            JAGATValidation.validateEndpoints(jagDescriptor.endpoints);
        }
        if (jagDescriptor.children) {
            JAGATValidation.validateChildren(jagDescriptor.children);
        }
        if (jagDescriptor.bindings) {
            JAGATValidation.validateBindings(jagDescriptor.bindings);
        }
    }

    //
    // isValid() {
    //     const regex = new RegExp(`^[a-zA-Z0-9-:]+([a-zA-Z0-9])$`, `u`);
    //     return Boolean(this._urn.match(regex));
    // }

    static isNumeric(str) {
        if (typeof str != `string`) {
            return false;
        } // we only process strings!
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string
            !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
    }

    static isValidUrn(urn) {
        let isValid = true;
        try {
            if (!urn) {
                throw new Error(`Must have a defined URN string of valid format.`);
            }
            if (typeof urn !== `string`) {
                throw new Error(`URN must be a string of valid format.`);
            }
            const validUrnChars = new RegExp(`^[a-z0-9:-]*[a-z0-9]$`, `u`);
            if (urn.match(validUrnChars) == null) {
                throw new Error(`URN must be a valid format.`);
            }
        } catch (e) {
            // @TODO - Do we want to autofix? Alert?
            isValid = false;
        } finally {
            return isValid;
        }
    }


    static validateURN(urn) {
        if (!urn) {
            throw new Error(`Must have a URN string of valid format.`);
        }

        if (typeof urn !== `string`) {
            throw new Error(`URN must be a string of valid format.`);
        }
        const validUrnChars = new RegExp(`^[a-z0-9:-]*[a-z0-9]$`, `u`);
        if (urn.match(validUrnChars) == null) {
            throw new Error(`URN must be a valid format.`);
        }
    }

    static validateName(name) {
        if (!name) {
            throw new Error(`Must have a name string.`);
        }

        if (typeof name !== `string`) {
            throw new Error(`Name must be a string.`);
        }

        if (name.length === 0) {
            throw new Error(`Name must be at least 1 character.`);
        }
    }

    static validateDescription(description) {
        if (description !== undefined) {
            if (typeof description !== `string`) {
                throw new Error(`Description must be a string.`);
            }
        }
    }

    static validateConnector(connector) {
        if (connector.execution == undefined) {
            throw new Error(`Connector must have execution and operator types.`);
        }

        if (typeof connector.execution !== `string`) {
            throw new Error(`Connector must have an execution type which is a string.`);
        }

        if (connector.execution.length === 0) {
            throw new Error(`Connector execution type must be at least 1 character.`);
        }

        if (connector.operator == undefined) {
            throw new Error(`Connector must have operator type.`);
        }

        if (typeof connector.operator !== `string`) {
            throw new Error(`Connector must have an operator type which is a string.`);
        }

        if (connector.operator.length === 0) {
            throw new Error(`Connector execution type must be at least 1 character.`);
        }

        // if (Object.keys(connector).length !== 3)               ///  COMMENTED OUT SINCE ADDING 'RETURNS'
        //     throw new Error(`Connector contains unknown properties: only accepts execution and operator types.`);
    }

    static validateEndpoints(endpoints) {
        if (!(endpoints instanceof Array)) {
            throw new Error(`Expected endpoints to be an array of objects.`);
        }

        for (let i = 0; i < endpoints.length; ++i) {
            const endpoint = endpoints[i];

            try {
                JAGATValidation.validateEndpoint(endpoint);
            } catch (e) {
                throw new Error(`Failed to validate endpoint ${i}: ${e.message}`);
            }
        }
    }

    static validateEndpoint(endpoint) {
        let success = true;
        if (endpoint == undefined) {
            success = false;
            throw new Error(`Endpoint must be an object with name and type strings.`);
        }

        if (endpoint.exchangeName == undefined) {
            success = false;
            throw new Error(`Endpoint does not have a name.`);
        }

        if (typeof endpoint.exchangeName !== `string`) {
            success = false;
            throw new Error(`Endpoint must have a name which is a string.`);
        }

        if (endpoint.exchangeName.length === 0) {
            success = false;
            throw new Error(`Endpoint must have a name at least 1 character long.`);
        }

        if (endpoint.exchangeType == undefined) {
            success = false;
            throw new Error(`Endpoint (${endpoint.exchangeName}) does not have a type.`);
        }

        if (typeof endpoint.exchangeType !== `string`) {
            success = false;
            throw new Error(`Endpoint (${endpoint.exchangeName}) must have a type which is a string.`);
        }

        if (endpoint.exchangeType.length === 0) {
            success = false;
            throw new Error(`Endpoint (${endpoint.exchangeName}) must have a type at least 1 character long.`);
        }

        // if (Object.keys(endpoint).length !== 5) {
        //     success = false;
        //     throw new Error(`Endpoint (${endpoint.exchangeName}) contains unknown properties: only accepts name and type strings.`);
        // }
        return success;
    }



    static validateChildren(children) {
        if (!(children instanceof Array)) {
            throw new Error(`Expected children to be an array of objects.`);
        }

        for (let i = 0; i < children.length; ++i) {
            const child = children[i];

            try {
                JAGATValidation.validateChild(child);
            } catch (e) {
                throw new Error(`Failed to validate child ${i}: ${e.message}`);
            }
        }
    }

    static validateChild(child) {
        if (child == undefined) {
            throw new Error(`Child must be an object with URN, UUID, and optional contextual name and description strings.`);
        }

        if (child.urn == undefined) {
            throw new Error(`Child must have a URN string.`);
        }

        if (typeof child.urn !== `string`) {
            throw new Error(`Child must have a URN which is a string.`);
        }

        if (child.urn.length === 0) {
            throw new Error(`Child must have a URN string with at least 1 character.`);
        }

        if (child.id == undefined) {
            throw new Error(`Chil does not have a UUID specified.`);
        }

        if (typeof child.id !== `string`) {
            throw new Error(`Child must have a UUID which is a string.`);
        }

        // if (!child.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/))
        //     throw new Error(`Child must have an id which is a v4 UUID conforming string.`);

        let opt_params = 0;

        if (child.iterable !== undefined) {
            if (typeof child.iterable !== `boolean`) {
                throw new Error(`Child iterable property must be a boolean.`);
            }

            opt_params = opt_params + 1;
        }

        if (child.annotations !== undefined) {
            if (child.annotations.constructor != Object) {
                throw new Error(`Child may only have an annotations which is an object.`);
            }

            opt_params = opt_params + 1;
        }

        if (child.name !== undefined) {
            if (typeof child.name !== `string`) {
                throw new Error(`Child may only have a name which is a string.`);
            }

            if (child.name.length === 0) {
                throw new Error(`Child may only have a name string with at least 1 character.`);
            }

            opt_params = opt_params + 1;
        }

        if (child.description !== undefined) {
            if (typeof child.description !== `string`) {
                throw new Error(`Child may only have a description which is a string.`);
            }

            if (child.description.length === 0) {
                throw new Error(`Child may only have a description string with at least 1 character.`);
            }

            opt_params = opt_params + 1;
        }

        // if (Object.keys(child).length !== 2 + opt_params) {
        //     throw new Error(`Child contains unknown properties: only accepts URN, UUID, optional annotations, and optional contextual name and description strings.`);
        // }
    }

    static validateBindings(bindings) {
        if (!(bindings instanceof Array)) {
            throw new Error(`Expected bindings to be an array of objects.`);
        }

        for (let i = 0; i < bindings.length; ++i) {
            const binding = bindings[i];
            try {
                JAGATValidation.validateBinding(binding);
            } catch (e) {
                throw new Error(`Failed to validate binding ${i}: ${e.message}`);
            }
        }
    }

    static validateBinding(binding) {
        // rewrite these to make sense

        // bindings-> binding-> to endpoints  and from endpoints   endpoints -> id,type,name



        // if (binding == undefined) {
        //     throw new Error(`Binding must be an object with provider and consumer ID and property strings.`);
        // }
        //
        // if (binding.from == undefined) {
        //     throw new Error(`Binding must have a consumer with ID and property strings.`);
        // }
        //
        // if (binding.to.id == undefined) {
        //     throw new Error(`Binding must have a ID string for its consumer.`);
        // }
        //
        // if (typeof binding.to.id !== `string`) {
        //     throw new Error(`Binding must have a ID for its consumer which is a string.`);
        // }
        //
        // // if (!binding.consumer.id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|any|this)$/))
        // //     throw new Error(`Binding must have an id for its consumer which is a v4 UUID conforming string, "any" or "this".`);
        //
        // if (binding.consumer.property == undefined) {
        //     throw new Error(`Binding must have a property string for its consumer.`);
        // }
        //
        // if (typeof binding.consumer.property !== `string`) {
        //     throw new Error(`Binding must have a property for its consumer which is a string.`);
        // }
        //
        // if (binding.consumer.property.length === 0) {
        //     throw new Error(`Binding must have a property string for its consumer which is at least 1 character.`);
        // }
        //
        // if (Object.keys(binding.consumer).length !== 2) {
        //     throw new Error(`Binding has a consumer with unknown properties: only accepts ID and property strings.`);
        // }
        //
        // if (binding.provider == undefined) {
        //     throw new Error(`Binding must have a provider with ID and property strings.`);
        // }
        //
        // if (binding.provider.id == undefined) {
        //     throw new Error(`Binding must have a ID string for its provider.`);
        // }
        //
        // if (typeof binding.provider.id !== `string`) {
        //     throw new Error(`Binding must have a ID for its provider which is a string.`);
        // }
        //
        // // if (!binding.provider.id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|any|this)$/))
        // //     throw new Error(`Binding must have an id for its provider which is a v4 UUID conforming string, "any" or "this".`);
        //
        // if (binding.provider.property == undefined) {
        //     throw new Error(`Binding must have a property string for its provider.`);
        // }
        //
        // if (typeof binding.provider.property !== `string`) {
        //     throw new Error(`Binding must have a property for its provider which is a string.`);
        // }
        //
        // if (binding.provider.property.length === 0) {
        //     throw new Error(`Binding must have a property string for its provider which is at least 1 character.`);
        // }
        //
        // if (Object.keys(binding.provider).length !== 2) {
        //     throw new Error(`Binding has a provider with unknown properties: only accepts ID and property strings.`);
        // }
        //
        // if (Object.keys(binding).length !== 2) {
        //     throw new Error(`Binding has unknown properties: only accepts provider and consumer with ID and property strings.`);
        // }
    }


}
