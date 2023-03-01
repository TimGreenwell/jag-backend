import FormUtils from "../utils/forms.js";
import Activity from "../models/activity.js";




export default function _buildUI() {
    const elementMap = new Map();
    const $propertyDiv = FormUtils.createEmptyInputContainer(`property-container`);
    elementMap.set($propertyDiv.id, $propertyDiv);


    const $activityPropertiesDiv = FormUtils.createEmptyInputContainer(`activity-container`);
    $propertyDiv.appendChild($activityPropertiesDiv);

    const $nodePropertiesDiv = FormUtils.createEmptyInputContainer(`node-container`);
    $propertyDiv.appendChild($nodePropertiesDiv);

    const $urnDiv = FormUtils.createPropertyElement(`urn-input`, `URN`);
    $urnDiv.className = `padded activity`;
    const $urnInput = FormUtils.createTextInput(`urn-input`);
    $urnInput.setAttribute(`tabIndex`, `0`);
    //$urnInput.className = `direct-property`;
    elementMap.set($urnInput.id, $urnInput);
    $urnDiv.appendChild($urnInput);
    $activityPropertiesDiv.appendChild($urnDiv);

    const $activityNameDiv = FormUtils.createPropertyElement(`name-input`, `Name`);
    $activityNameDiv.className = `padded activity`;
    const $activityNameInput = FormUtils.createTextInput(`name-input`);
    $activityNameInput.setAttribute(`placeholder`, `display name`);
    $activityNameInput.setAttribute(`tabIndex`, `1`);
    //$activityNameInput.className = `direct-property`;
    elementMap.set($activityNameInput.id, $activityNameInput);
    $activityNameDiv.appendChild($activityNameInput);
    $activityPropertiesDiv.appendChild($activityNameDiv);

    const $activityTimeDiv = FormUtils.createPropertyElement(`duration-input`, `Expected Duration`);
    $activityTimeDiv.className = `padded activity leaf-only`;
    const $activityExpectedDurationInput = FormUtils.createTextInput(`duration-input`);
    $activityExpectedDurationInput.setAttribute(`placeholder`, `expected duration (seconds)`);
    $activityExpectedDurationInput.setAttribute(`tabIndex`, `2`);
    //$activityExpectedDurationInput.className = `direct-property`;
    elementMap.set($activityExpectedDurationInput.id, $activityExpectedDurationInput);
    $activityTimeDiv.appendChild($activityExpectedDurationInput);
    $activityPropertiesDiv.appendChild($activityTimeDiv);

    const $activityDescDiv = FormUtils.createPropertyElement(`desc-input`, `Description`);
    $activityDescDiv.className = `padded activity`;
    const $activityDescInput = document.createElement(`textarea`);
    $activityDescInput.setAttribute(`id`, `desc-input`);
    $activityDescInput.setAttribute(`placeholder`, `...`);
    $activityDescInput.setAttribute(`tabIndex`, `3`);
    //$activityDescInput.className = `direct-property`;
    elementMap.set($activityDescInput.id, $activityDescInput);
    $activityDescDiv.appendChild($activityDescInput);
    $activityPropertiesDiv.appendChild($activityDescDiv);

    const executionOptions = [];
    const execution = Activity.EXECUTION;
    for (const step in execution) {
        executionOptions.push({
            value: execution[step].name,
            text: execution[step].text
        });
    }
    const $executionDiv = FormUtils.createPropertyElement(`execution-select`, `Execution`);
    $executionDiv.className = `padded activity`;
    const $executionSelect = FormUtils.createSelect(`execution-select`, executionOptions);
    elementMap.set($executionSelect.id, $executionSelect);
    $executionDiv.appendChild($executionSelect);
    $activityPropertiesDiv.appendChild($executionDiv);


    const operatorOptions = [];
    const operator = Activity.OPERATOR;
    for (const step in operator) {
        operatorOptions.push({
            value: operator[step].name,
            text: operator[step].text
        });
    }
    const $operatorDiv = FormUtils.createPropertyElement(`operator-select`, `Operator`);             // @TODO Map this from original structure
    $operatorDiv.className = `padded activity`;
    const $operatorSelect = FormUtils.createSelect(`operator-select`, operatorOptions);
    elementMap.set($operatorSelect.id, $operatorSelect);
    $operatorDiv.appendChild($operatorSelect);
    $activityPropertiesDiv.appendChild($operatorDiv);



    const $bindingAddersDiv = FormUtils.createEmptyInputContainer(`add-endpoint-buttons`);
    $bindingAddersDiv.className = `row-stretch`;
    $activityPropertiesDiv.appendChild($bindingAddersDiv);

    const $endpointInAddButton = FormUtils.createButton(`input-button`, `Add Input`);
    elementMap.set($endpointInAddButton.id, $endpointInAddButton);
    $bindingAddersDiv.appendChild($endpointInAddButton);

    const $endpointOutAddButton = FormUtils.createButton(`output-button`, `Add Output`);
    elementMap.set($endpointOutAddButton.id, $endpointOutAddButton);
    $bindingAddersDiv.appendChild($endpointOutAddButton);

    const $startEndpointSelect = FormUtils.createSelect(`binding-from-select`);
    $startEndpointSelect.multiple = true;
    elementMap.set($startEndpointSelect.id, $startEndpointSelect);
    $activityPropertiesDiv.appendChild($startEndpointSelect);

    const $destinationEndpointSelect = FormUtils.createSelect(`binding-to-select`);
    $destinationEndpointSelect.multiple = true;
    $destinationEndpointSelect.classList.add(`hidden`);
    elementMap.set($destinationEndpointSelect.id, $destinationEndpointSelect);
    $activityPropertiesDiv.appendChild($destinationEndpointSelect);

    const $bindingButtonsDiv = FormUtils.createEmptyInputContainer(`binding-buttons`);
    $bindingButtonsDiv.className = `row-stretch`;
    $activityPropertiesDiv.appendChild($bindingButtonsDiv);

    const $bindButton = FormUtils.createButton(`bind-button`, `Bind`);
    $bindButton.disabled = true;
    elementMap.set($bindButton.id, $bindButton);
    $bindingButtonsDiv.appendChild($bindButton);

    const $unbindButton = FormUtils.createButton(`unbind-button`, `Unbind`);
    $unbindButton.disabled = true;
    elementMap.set($unbindButton.id, $unbindButton);
    $bindingButtonsDiv.appendChild($unbindButton);

    const $removeButton = FormUtils.createButton(`remove-button`, `Remove`);
    $removeButton.disabled = true;
    elementMap.set($removeButton.id, $removeButton);
    $bindingButtonsDiv.appendChild($removeButton);

    const $annotationsDiv = FormUtils.createPropertyElement(`annotations-property`, `Annotations`);
    $activityPropertiesDiv.appendChild($annotationsDiv);

    const $annotations = FormUtils.createEmptyInputContainer(`annotations-property`);
    //$annotations.className = `directProperty`;
    elementMap.set($annotations.id, $annotations);
    $annotationsDiv.appendChild($annotations);

    const $nodeNameDiv = FormUtils.createPropertyElement(`node-name-input`, `Contextual Name`);
    $nodeNameDiv.className = `padded node`;
    const $nodeNameInput = FormUtils.createTextInput(`node-name-input`);
    elementMap.set($nodeNameInput.id, $nodeNameInput);
    $nodeNameDiv.appendChild($nodeNameInput);
    $nodePropertiesDiv.appendChild($nodeNameDiv);

    const $nodeExpectedDurationDiv = FormUtils.createPropertyElement(`node-expected-duration-input`, `Expected Duration`);
    $nodeExpectedDurationDiv.className = `padded node leaf-only`;
    const $nodeExpectedDurationInput = FormUtils.createTextInput(`node-expected-duration-input`);
    $nodeExpectedDurationInput.setAttribute(`placeholder`, `expected duration (seconds)`);
    //$nodeExpectedDurationInput.className = `direct-property`;
    elementMap.set($nodeExpectedDurationInput.id, $nodeExpectedDurationInput);
    $nodeExpectedDurationDiv.appendChild($nodeExpectedDurationInput);
    $nodePropertiesDiv.appendChild($nodeExpectedDurationDiv);

    // const $nodeTimeAllowanceDiv = FormUtils.createPropertyElement(`node-time-allowance-input`, `Time Allowance`);
    // $nodeTimeAllowanceDiv.className = `padded node `;
    // const $nodeTimeAllowanceInput = FormUtils.createTextInput(`node-time-allowance-input`);
    // $nodeTimeAllowanceInput.setAttribute(`placeholder`, `time allowance`);
    // //$nodeTimeAllowanceInput.className = `direct-property`;
    // elementMap.set($nodeTimeAllowanceInput.id, $nodeTimeAllowanceInput);
    // $nodeTimeAllowanceDiv.appendChild($nodeTimeAllowanceInput);
    // $nodePropertiesDiv.appendChild($nodeTimeAllowanceDiv);

    const $nodeDescDiv = FormUtils.createPropertyElement(`node-desc-input`, `Contextual Description`);
    $nodeDescDiv.className = `padded node`;
    $nodePropertiesDiv.appendChild($nodeDescDiv);
    const $nodeDescInput = FormUtils.createTextInput(`node-desc-input`);
    elementMap.set($nodeDescInput.id, $nodeDescInput);
    $nodeDescDiv.appendChild($nodeDescInput);


    // Create JSON export area
    const $exportButtonsDiv = FormUtils.createEmptyInputContainer(`export-buttons`);
    $exportButtonsDiv.className = `row-stretch`;
    $nodePropertiesDiv.appendChild($exportButtonsDiv);
    const $exportJsonButton = FormUtils.createButton(`export-json-button`, `Export to JSON`);
    elementMap.set($exportJsonButton.id, $exportJsonButton);
    $exportButtonsDiv.appendChild($exportJsonButton);

    const $exportSvgButton = FormUtils.createButton(`export-svg-button`, `Export to SVG`);
    elementMap.set($exportSvgButton.id, $exportSvgButton);
    $exportButtonsDiv.appendChild($exportSvgButton);
    return elementMap;
}


/**
 *  property-container               (div)
 *       activity-container          (div)
 *            urn-property           (div)
 *                 urn-input         (text)
 *            name-property          (div)
 *                 name-input        (text)
 *            time-property          (div)
 *                 duration-input    (text)
 *            desc-property          (div)
 *                 desc-input        (textarea)
 *            execution-property
 *                 execution-select
 *            operator-property
 *                 operator-select
 *            add-endpoint-buttons
 *                 input-button
 *                 output-button
 *            binding-from-select
 *            binding-to-select
 *            binding-buttons
 *                 bind-button
 *                 unbind-button
 *                 remove-button
 *
 *
 *       node-container
 */
