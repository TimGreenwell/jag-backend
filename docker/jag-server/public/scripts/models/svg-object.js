/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

// noinspection JSUnusedGlobalSymbols
export default class SvgObject {

    constructor(id) {
        this._id = id;

        // Values determining the svg appearance.
        this._standardHue = 200;          // default color
        this._selectedHue = 150;          // color of selected items
        this._possibleHue = 50;           // color highlighting potential connect points
        this._warningHue = 5;
        this._horizontalLeftMargin = 10;      // margins for looks
        this._horizontalRightMargin = 10;
        this._verticalTopMargin = 10;
        this._verticalBottomMargin = 10;
        this._verticalInnerMargin = 10;
        this._horizontalInnerMargin = 10;

        this._lineWidth = 2;
        this._standardFontSize = 17;
        this._stepBrightness = 5;         // 3-d effect - changes in brightness
        this._initialBrightness = 50;     // average brightness (1-100)

        // derived svg appearances
        this._labelIndent = this.horizontalLeftMargin / 2;
        this._labelHeight = this.standardFontSize;
        this._standardBoxHeight = (this.verticalTopMargin + this.verticalBottomMargin) + this.labelHeight;
        this._verticalLabelShift = (this.verticalTopMargin) + this.labelHeight;
        this._buttonSize = this.standardFontSize / 2;

        this._customFilters = this.createCustomFilters();
        this._chosenFilter = ``;          // 3-d effect - chosen method (currently only one)
        this._chosenPattern = ``;          // diagonals - chosen method (currently only one)

        // convenience ID builders for svg elements
        this.SVG = `svg`;
        this.BACKGROUND = `background`;
        this.SUBGROUP = `subgroup`;
        this.NODEGROUP = `node`;
        this.RECTANGLE = `rect`;
        this.EDGE = `edge`;
        this.LINE = `line`;
        this.EXPAND = `expand`;
        this.ADD = `add`;
        this.INPUT = `input`;
        this.OUTPUT = `output`;
        this.ID_SEPARATOR = `_`;
        this.PATH_SEPARATOR = `___`;
        this.TEXT = `text`;
        this.CURSOR = `cursor`;

        this.SVGNS = `http://www.w3.org/2000/svg`;
    }

    get id() {
        return this._id;
    }

    get standardHue() {
        return this._standardHue;
    }

    set standardHue(value) {
        this._standardHue = value;
    }

    get selectedHue() {
        return this._selectedHue;
    }

    set selectedHue(value) {
        this._selectedHue = value;
    }

    get possibleHue() {
        return this._possibleHue;
    }

    set possibleHue(value) {
        this._possibleHue = value;
    }


    get horizontalLeftMargin() {
        return this._horizontalLeftMargin;
    }

    set horizontalLeftMargin(value) {
        this._horizontalLeftMargin = value;
    }

    get horizontalRightMargin() {
        return this._horizontalRightMargin;
    }

    set horizontalRightMargin(value) {
        this._horizontalRightMargin = value;
    }


    get verticalTopMargin() {
        return this._verticalTopMargin;
    }

    set verticalTopMargin(value) {
        this._verticalTopMargin = value;
    }

    get verticalBottomMargin() {
        return this._verticalBottomMargin;
    }

    set verticalBottomMargin(value) {
        this._verticalBottomMargin = value;
    }


    get verticalInnerMargin() {
        return this._verticalInnerMargin;
    }

    set verticalInnerMargin(value) {
        this._verticalInnerMargin = value;
    }

    get horizontalInnerMargin() {
        return this._horizontalInnerMargin;
    }

    set horizontalInnerMargin(value) {
        this._horizontalInnerMargin = value;
    }

    get lineWidth() {
        return this._lineWidth;
    }

    set lineWidth(value) {
        this._lineWidth = value;
    }

    get standardFontSize() {
        return this._standardFontSize;
    }

    set standardFontSize(value) {
        this._standardFontSize = value;
    }

    get stepBrightness() {
        return this._stepBrightness;
    }

    set stepBrightness(value) {
        this._stepBrightness = value;
    }

    get initialBrightness() {
        return this._initialBrightness;
    }

    set initialBrightness(value) {
        this._initialBrightness = value;
    }

    get labelIndent() {
        return this._labelIndent;
    }

    set labelIndent(value) {
        this._labelIndent = value;
    }

    get labelHeight() {
        return this._labelHeight;
    }

    set labelHeight(value) {
        this._labelHeight = value;
    }

    get standardBoxHeight() {
        return this._standardBoxHeight;
    }

    set standardBoxHeight(value) {
        this._standardBoxHeight = value;
    }


    get verticalLabelShift() {
        return this._verticalLabelShift;
    }

    set verticalLabelShift(value) {
        this._verticalLabelShift = value;
    }

    get buttonSize() {
        return this._buttonSize;
    }

    set buttonSize(value) {
        this._buttonSize = value;
    }

    get chosenFilter() {
        return this._chosenFilter;
    }

    set chosenFilter(value) {
        this._chosenFilter = value;
    }

    get customFilters() {
        return this._customFilters;
    }


    get chosenPattern() {
        return this._chosenPattern;
    }

    set chosenPattern(value) {
        this._chosenPattern = value;
    }


    /**
     Color and Shading Methods

     updateHSLA - modify current hsla
     updateHue  - adjust hue portion of current hsla (color wheel: 1-360)
     updateSaturation - adjust saturation portion of current hsla (0% = black)
     updateLightness - adjust lightness portion of current hsla (100% = white)
     updateAlpha - adjust alpha portion of current hsla (0% = invisible)
     addColor - @TODO future effort to use color instead of lightness for depth effect
     applyColorDepthEffect - color based on node depth in tree
     applyLightnessDepthEffect - adjust lightness based on depth in tree
     fillDepthLightness - apply effect to fill
     strokeDepthLightness - apply effect to stroke
     */

    updateHSLA(hslaString, hue, saturation, lightness, alpha) {
        const components = hslaString.replace(`hsla(`, ``).replace(`)`, ``);
        const hslaArray = components.split(`,`);
        if (hue) {
            hslaArray[0] = hue;
        }
        if (saturation) {
            hslaArray[1] = saturation;
        }
        if (lightness) {
            hslaArray[2] = lightness;
        }
        if (alpha) {
            hslaArray[3] = alpha;
        }
        return `hsla(${hslaArray.join(`,`)})`;
    }

    updateHue(oldHSLA, newHue) {
        return this.updateHSLA(oldHSLA, newHue, null, null, null);
    }

    updateSaturation(oldHSLA, newSaturation) {
        return this.updateHSLA(oldHSLA, null, newSaturation, null, null);
    }

    updateLightness(oldHSLA, newLightness) {
        return this.updateHSLA(oldHSLA, null, null, newLightness, null);
    }

    updateAlpha(oldHSLA, newAlpha) {
        return this.updateHSLA(oldHSLA, null, null, null, newAlpha);
    }

    addColor(item, fill = `black`, stroke = `black`) {
        item.setAttributeNS(null, `fill`, `hsla(${fill},100%,50%,1)`);
        item.setAttributeNS(null, `stroke`, `hsla(${stroke},100%,50%,1)`);
    }

    applyColorDepthEffect(item, depth, treeHeight) {
        const hue = Math.round(360 / treeHeight * depth);
        const hsla = item.getAttributeNS(null, `fill`);
        const newHsla = this.updateHue(hsla, hue);
        item.setAttributeNS(null, `fill`, newHsla);
        item.setAttributeNS(null, `stroke`, newHsla);
    }

    applyLightnessDepthEffect(item, depth, treeHeight) {
        const fillShading = this.fillDepthLightness(depth, treeHeight);
        const strokeShading = this.strokeDepthLightness(depth, treeHeight);
        const fill = `hsla(${this.standardHue},100%,${fillShading}%,1)`;
        const stroke = `hsla(${this.standardHue},100%,${strokeShading}%,1)`;
        item.setAttributeNS(null, `fill`, fill);
        item.setAttributeNS(null, `stroke`, stroke);
    }

    fillDepthLightness(depthOfNode, treeHeight) {
        return this.initialBrightness - (treeHeight * this.stepBrightness / 2) + (depthOfNode * this.stepBrightness);
    }

    strokeDepthLightness(depthOfNode, treeHeight) {
        const fillShading = this.fillDepthLightness(depthOfNode, treeHeight);
        const strokeShading = fillShading - (this.stepBrightness * 4);
        return strokeShading;
    }

    /**
     * Object creation
     *
     * buildSvg  - main svg container
     * createBackground - group to hold all subgroups
     * createSubGroup - group to hold node groups and edges (and sub-subgroups, if exist)
     * createNodeGroup - group to hold node rectangle, text, button groups
     * createTextElement - basic svg text components
     * createCircle - test circle for debugging points
     * createInputEndpoint
     * createOutputEndpoint
     * createAddButton - group holding svg components forming 'add button'
     * createExpandButton - group holding svg components forming `expand button`
     * createRectangle - Rectangle giving nodeGroup its form and size
     * resizeRectangle - Convenience function to set and change rectangle size
     * createEdge - basic edge components (path is defined with pathing methods)
     * createBinding - data flow representation between Activities
     */

    buildSvg() {
        const svg = document.createElementNS(this.SVGNS, `svg`);
        svg.id = `${this.SVG}${this.ID_SEPARATOR}${this._id}`;
        svg.setAttribute(`version`, `1.1`);
        svg.setAttribute(`xmlns`, this.SVGNS);
        svg.setAttribute(`pointer-events`, `none`);
        return svg;
    }

    createBackground() {
        const group = document.createElementNS(this.SVGNS, `g`);
        group.id = `${this.BACKGROUND}${this.ID_SEPARATOR}${this._id}`;
        group.setAttributeNS(null, `pointer-events`, `bounding-box`);
        group.setAttributeNS(null, `cursor`, `all-scroll`);
        return group;
    }

    createSubGroup(subgroupId) {
        const group = document.createElementNS(this.SVGNS, `g`);
        group.id = this.buildId(this.SUBGROUP, subgroupId);
        group.setAttributeNS(null, `pointer-events`, `none`);
        return group;
    }

    createNodeGroup(id) {
        const nodeGroup = document.createElementNS(this.SVGNS, `g`);
        nodeGroup.id = this.buildId(this.NODEGROUP, id);
        nodeGroup.setAttributeNS(null, `pointer-events`, `bounding-box`);   // handled by under rect -rethink
        return nodeGroup;
    }

    createTextElement(text, id) {
        const svgText = document.createElementNS(this.SVGNS, `text`);
        svgText.id = this.buildId(this.TEXT, id);
        svgText.setAttributeNS(null, `font-size`, this.standardFontSize.toString());
        svgText.setAttributeNS(null, `dominant-baseline`, `text-before-edge`);
        svgText.setAttributeNS(null, `pointer-events`, `none`);
        const textNode = document.createTextNode(text);
        svgText.appendChild(textNode);
        return svgText;
    }

    createCircle(id, radius) {
        const circle = document.createElementNS(this.SVGNS, `circle`);
        if (id.length > 0) {
            circle.id = id;
        }
        circle.setAttributeNS(null, `r`, radius);
        return circle;
    }

    createInputEndpoint(nodeId, inputId) {         // id = nodeId - endpointId(name)
        const endpointId = `${nodeId}:${inputId}`;
        const newId = this.buildId(this.INPUT, endpointId);
        const inputEndpoint = this.createCircle(newId, 5);
        inputEndpoint.classList.add(`input-endpoint`);
        inputEndpoint.setAttributeNS(null, `fill-opacity`, `1`);
        inputEndpoint.setAttributeNS(null, `stroke-width`, `${this.lineWidth}`);
        this.addColor(inputEndpoint, 240, 60);
        return inputEndpoint;
    }

    createOutputEndpoint(nodeId, outputId) {         // id = nodeId - endpointId(name)
        const endpointId = `${nodeId}:${outputId}`;
        const newId = this.buildId(this.OUTPUT, endpointId);
        const outputEndpoint = this.createCircle(newId, 5);
        outputEndpoint.classList.add(`output-endpoint`);
        outputEndpoint.setAttributeNS(null, `fill-opacity`, `1`);
        outputEndpoint.setAttributeNS(null, `stroke-width`, `${this.lineWidth}`);
        this.addColor(outputEndpoint, 120, 0);
        return outputEndpoint;
    }


    createAddButton(id, width, height) {
        const halfFont = this.standardFontSize / 2;

        const addButton = document.createElementNS(this.SVGNS, `g`);
        addButton.id = this.buildId(this.ADD, id);
        // const circle = this.createCircle(width - halfFont, height - halfFont, halfFont);
        const circle = this.createCircle(``, halfFont);
        this.positionItem(circle, width - halfFont, height - halfFont);
        circle.setAttributeNS(null, `fill-opacity`, `1`);
        circle.setAttributeNS(null, `stroke-width`, `${this.lineWidth}`);
        const horizLine = document.createElementNS(this.SVGNS, `path`);

        horizLine.setAttributeNS(null, `d`, `M ${width - this.standardFontSize},${height - halfFont} L ${width},${height - halfFont}`);
        horizLine.setAttributeNS(null, `stroke-width`, `${this.lineWidth}`);
        const vertLine = document.createElementNS(this.SVGNS, `path`);

        vertLine.setAttributeNS(null, `d`, `M ${width - halfFont},${height - this.standardFontSize} L ${width - halfFont},${height}`);
        vertLine.setAttributeNS(null, `stroke-width`, `${this.lineWidth}`);
        addButton.appendChild(circle);
        addButton.appendChild(horizLine);
        addButton.appendChild(vertLine);
        addButton.setAttributeNS(null, `cursor`, `pointer`);
        addButton.setAttributeNS(null, `pointer-events`, `bounding-box`);   // handled with classList?
        return addButton;
    }

    createExpandButton(id, width, height, isExpanded) {
        let path;
        const expandButton = document.createElementNS(this.SVGNS, `g`);
        expandButton.id = this.buildId(this.EXPAND, id);
        if (isExpanded) {
            const x1 = width - this.labelIndent;
            const y1 = 3;
            const x2 = x1;
            const y2 = y1 + this.standardFontSize;
            const x3 = x2 - (this.standardFontSize / 2);
            const y3 = y2 - (this.standardFontSize / 2);
            path = `M ${x1}, ${y1} L ${x2},${y2} ${x3},${y3} Z`;
        } else {
            const x1 = width - this.labelIndent;
            const y1 = (this.standardFontSize / 2) + 3;
            const x2 = x1 - (this.standardFontSize / 2);
            const y2 = y1 - (this.standardFontSize / 2);
            const x3 = x2;
            const y3 = y2 + (this.standardFontSize);
            path = `M ${x1}, ${y1} L ${x2},${y2} ${x3},${y3} Z`;
        }
        const triangle = document.createElementNS(this.SVGNS, `path`);
        triangle.setAttributeNS(null, `d`, path);
        expandButton.appendChild(triangle);
        expandButton.setAttributeNS(null, `cursor`, `pointer`);
        expandButton.setAttributeNS(null, `pointer-events`, `bounding-box`);    // handled with classlist?
        return expandButton;
    }

    createRectangle(width, height, id) {
        let rectangle = document.createElementNS(this.SVGNS, `rect`);
        rectangle.id = this.buildId(this.RECTANGLE, id);
        rectangle = this.resizeRectangle(rectangle, width, height);
        rectangle.setAttributeNS(null, `rx`, `7`);
        rectangle.setAttributeNS(null, `cursor`, `grab`);
        // rectangle.setAttributeNS(null, `pointer-events`, `bounding-box`);
        return rectangle;
    }

    resizeRectangle(rectangle, width, height) {
        rectangle.setAttributeNS(null, `width`, width);
        rectangle.setAttributeNS(null, `height`, height);
        return rectangle;
    }


    createEdge(sourceId, destId, sourceBox, destBox) {
        const edge = document.createElementNS(this.SVGNS, `path`);
        const sourceNodeId = this.buildId(this.NODEGROUP, sourceId);
        const destNodeId = this.buildId(this.NODEGROUP, destId);
        const edgeIdentifier = `${sourceNodeId}${this.PATH_SEPARATOR}${destNodeId}`;
        edge.id = edgeIdentifier;
        edge.setAttributeNS(null, `stroke`, `hsla(${this.standardHue},100%,0%,1)`);
        edge.setAttributeNS(null, `fill`, `transparent`);
        edge.setAttributeNS(null, `stroke-width`, this.lineWidth);
        const cubicCurve = this.buildPath(sourceBox, destBox);
        edge.setAttributeNS(null, `d`, cubicCurve);
        edge.setAttributeNS(null, `cursor`, `pointer`);
        edge.setAttributeNS(null, `pointer-events`, `visibleStroke`);
        return edge;
    }


    buildPath3(fromX, fromY, toX, toY, fromProp, toProp) {
        const delta_y = this.standardBoxHeight * 1.5;
        const fromPullX = fromX;
        const fromPullY = (fromProp === `in`) ? fromY - delta_y : fromY + delta_y;
        const toPullX = toX;
        const toPullY = (toProp === `in`) ? toY - delta_y : toY + delta_y;
        const cubicCurve = `M ${fromX} ${fromY} C ${fromPullX} ${fromPullY}, ${toPullX} ${toPullY}, ${toX} ${toY}`;
        return cubicCurve;
    }

    createBinding(fromNode, fromEndpoint, toNode, toEndpoint) {
        let fromElement;
        let toElement;
        if (fromEndpoint.direction === `input`) {
            fromElement = this.fetchInputEndpoint(fromNode.id, fromEndpoint.exchangeName);
        } else {
            fromElement = this.fetchOutputEndpoint(fromNode.id, fromEndpoint.exchangeName);
        }
        if (toEndpoint.direction === `input`) {
            toElement = this.fetchInputEndpoint(toNode.id, toEndpoint.exchangeName);
        } else {
            toElement = this.fetchOutputEndpoint(toNode.id, toEndpoint.exchangeName);
        }

        const fromNodeGroup = this.fetchNodeGroup(fromNode.id);
        const fromTranslateString = fromNodeGroup.getAttributeNS(null, `transform`);
        const fromTransformComponents = this.parse(fromTranslateString);
        const fromTransformX = Number(fromTransformComponents.translate[0]);
        const fromTransformY = Number(fromTransformComponents.translate[1]);
        const fromX = Number(fromElement.getAttributeNS(null, `cx`)) + fromTransformX;
        const fromY = Number(fromElement.getAttributeNS(null, `cy`)) + fromTransformY;

        const toNodeGroup = this.fetchNodeGroup(toNode.id);
        const toTranslateString = toNodeGroup.getAttributeNS(null, `transform`);
        const toTransformComponents = this.parse(toTranslateString);
        const toTransformX = Number(toTransformComponents.translate[0]);
        const toTransformY = Number(toTransformComponents.translate[1]);
        const toX = Number(toElement.getAttributeNS(null, `cx`)) + toTransformX;
        const toY = Number(toElement.getAttributeNS(null, `cy`)) + toTransformY;

        const delta_y = this.standardBoxHeight * 1.5;
        const fromPullX = fromX;
        const fromPullY = (fromEndpoint.direction === `input`) ? fromY - delta_y : fromY + delta_y;
        const toPullX = toX;
        const toPullY = (toEndpoint.direction === `input`) ? toY - delta_y : toY + delta_y;
        const cubicCurve = `M ${fromX} ${fromY} C ${fromPullX} ${fromPullY}, ${toPullX} ${toPullY}, ${toX} ${toY}`;

        const binding = document.createElementNS(this.SVGNS, `path`);
        binding.id = `${fromElement.id}${this.PATH_SEPARATOR}${toElement.id}`;
        binding.classList.add(`binding`);
        binding.classList.add(`hidden`);
        binding.setAttributeNS(null, `stroke`, `hsla(${this.standardHue},100%,50%,1)`);
        binding.setAttributeNS(null, `fill`, `transparent`);
        binding.setAttributeNS(null, `stroke-width`, this.lineWidth);
        binding.setAttributeNS(null, `d`, cubicCurve);
        binding.setAttributeNS(null, `cursor`, `pointer`);
        binding.setAttributeNS(null, `pointer-events`, `visibleStroke`);
        return binding;
    }

    createLine(id, startPoint, endPoint) {
        const line = document.createElementNS(this.SVGNS, `line`);
        line.id = id;
        line.setAttributeNS(null, `x1`, `${startPoint.x}`);
        line.setAttributeNS(null, `y1`, `${startPoint.y}`);
        line.setAttributeNS(null, `x2`, `${endPoint.x}`);
        line.setAttributeNS(null, `y2`, `${endPoint.y}`);
        line.setAttributeNS(null, `stroke`, `hsla(78,100%,50%,1)`);
        line.setAttributeNS(null, `fill`, `transparent`);
        line.setAttributeNS(null, `stroke-width`, `3`);
        return line;
    }

    createEdgeToCursor(sourceId, sourceBox) {
        const edge = document.createElementNS(this.SVGNS, `path`);
        const edgeSourceId = this.buildId(this.EDGE, sourceId);
        const edgeDestId = `${this.CURSOR}`;
        edge.id = `${edgeSourceId}${this.PATH_SEPARATOR}${edgeDestId}`;
        edge.setAttributeNS(null, `stroke`, `hsla(${this.possibleHue},100%,0%,1)`);
        edge.setAttributeNS(null, `fill`, `transparent`);
        edge.setAttributeNS(null, `stroke-width`, this.lineWidth);
        const cubicCurve = this.buildPath(sourceBox, sourceBox);
        edge.setAttributeNS(null, `d`, cubicCurve);
        edge.setAttributeNS(null, `pointer-events`, `none`);
        return edge;
    }


    /**
     * Positioning
     *
     * modifyTransform - changing location of a group of components
     * positionItem - changing location of item in respect to its group
     */

    modifyTransform(nodeGroup, nodeModel, diffX, diffY) {
        const groupTransformX = nodeModel.x + diffX;
        const groupTransformY = nodeModel.y + diffY;
        const newTransform = `translate(${groupTransformX},${groupTransformY})`;
        nodeGroup.setAttributeNS(null, `transform`, `${newTransform}`);
    }

    positionItem(item, x, y) {
        if (item.tagName.toLowerCase() === `g`) {
            item.setAttributeNS(null, `transform`, `translate(${x},${y})`);
        } else if (item.tagName.toLowerCase() === `circle`) {
            item.setAttributeNS(null, `cx`, x);
            item.setAttributeNS(null, `cy`, y);
        } else {
            item.setAttributeNS(null, `x`, x);
            item.setAttributeNS(null, `y`, y);
        }
        return item;
    }

    /**
     * Object State Change
     *
     * selectNode - update appearance of node to being selected
     * signalPossibleChild - update appearance of node to being possible added child
     * unselectNode - reset appearance to normal
     */


    selectNode(node) {  // Apply 'select' effect (highlight)
        const rectangle = this.fetchRectangle(node.id);
        const hsla = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hsla.split(`,`)[2];
        rectangle.setAttributeNS(null, `fill`, `hsla(${this.selectedHue},100%,${shadeFill},1)`);
        rectangle.setAttributeNS(null, `cursor`, `grabbing`);
    }

    selectEdge(edge) {  // Apply 'select' effect (highlight)
        edge.setAttributeNS(null, `stroke`, `orange`);
        edge.setAttributeNS(null, `cursor`, `grabbing`);
    }

    signalPossibleChild(node) {  // Apply 'select' effect (highlight)
        const rectangle = this.fetchRectangle(node.id);
        const hslaFill = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hslaFill.split(`,`)[2];
        rectangle.setAttributeNS(null, `fill`, `hsla(${this.possibleHue},100%,${shadeFill},1)`);
        const hslaStroke = rectangle.getAttributeNS(null, `stroke`);
        const shadeStroke = hslaStroke.split(`,`)[2];
        rectangle.setAttributeNS(null, `stroke`, `hsla(${this.possibleHue},100%,${shadeStroke},1)`);
    }

    signalWarning(node) {  // Apply 'select' effect (highlight)
        const $rectangle = this.fetchRectangle(node.id);
        if ($rectangle) {
            // const hslaStroke = rectangle.getAttributeNS(null, `stroke`);
            // const shadeStroke = hslaStroke.split(`,`)[2];
            // rectangle.setAttributeNS(null, `stroke`, `hsla(${this._warningHue},100%,${shadeStroke},1)`);
            this.applyPattern($rectangle, `diagonals`);
        } else {
            console.log(`couldnt find that rect`);
        }
    }

    unselectNode(node) {   // Remove 'select' effect (highlight)
        const rectangle = this.fetchRectangle(node.id);
        const hslaFill = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hslaFill.split(`,`)[2];
        rectangle.setAttributeNS(null, `fill`, `hsla(${this.standardHue},100%,${shadeFill},1)`);
        const hslaStroke = rectangle.getAttributeNS(null, `stroke`);
        const shadeStroke = hslaStroke.split(`,`)[2];
        rectangle.setAttributeNS(null, `stroke`, `hsla(${this.standardHue},100%,${shadeStroke},1)`);
    }

    unselectEdge(edge) {
        edge.setAttributeNS(null, `stroke`, `hsla(${this.standardHue},100%,0%,1)`);
    }

    /**
     * Pathing
     *
     * followCursor - destination end of edge attached to cursor position
     * changeDestination - destination end of edge attached to moving object
     * changeSource - source end of edge attached to moving object
     * buildPath - use source and destination positions to form cubic pathing
     *
     */
    // svgElement;

    followCursor(edge, cursor) {
        const origPath = edge.getAttributeNS(null, `d`);
        const splitOrigPath = origPath.split(` `);
        const ox = Math.round(Number(splitOrigPath[1]));
        const oy = Math.round(Number(splitOrigPath[2]));
        const ex = cursor.x;
        const ey = cursor.y;

        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        edge.setAttributeNS(null, `d`, cubicCurve);
    }

    changeDestination(svgSelectedItems, edge) {
        const origPath = edge.getAttributeNS(null, `d`);
        const splitOrigPath = origPath.split(` `);
        const ox = Math.round(Number(splitOrigPath[1]));
        const oy = Math.round(Number(splitOrigPath[2]));
        const destinationNodeId = this.fetchEdgeDestinationId(edge);
        const destinationNode = svgSelectedItems.nodes.get(destinationNodeId);

        const transformString = destinationNode.getAttributeNS(null, `transform`);
        const transformComponents = this.parse(transformString);
        const ex = Number(transformComponents.translate[0]);
        const boxAdjustment = (this.standardBoxHeight / 2);
        const ey = Number(transformComponents.translate[1]) + boxAdjustment;

        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        edge.setAttributeNS(null, `d`, cubicCurve);
    }

    changeSource(svgSelectedItems, edge) {
        const origPath = edge.getAttributeNS(null, `d`);
        const sourceNodeId = this.fetchEdgeSourceId(edge);
        const sourceNode = svgSelectedItems.nodes.get(sourceNodeId);
        const id = this.fetchTargetId(sourceNode);
        const rect = this.fetchRectangle(id);
        const width = rect.getAttributeNS(null, `width`);

        const splitOrigPath = origPath.split(` `);

        const transformString = sourceNode.getAttributeNS(null, `transform`);
        const transformComponents = this.parse(transformString);
        let boxAdjustment = width;
        const ox = Number(transformComponents.translate[0]) + Number(boxAdjustment);
        boxAdjustment = (this.standardBoxHeight / 2);
        const oy = Number(transformComponents.translate[1]) + boxAdjustment;

        const ex = Math.round(Number(splitOrigPath[8]));
        const ey = Math.round(Number(splitOrigPath[9]));

        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        edge.setAttributeNS(null, `d`, cubicCurve);
    }


    buildPath(sourceBox, destBox) {
        const ox = sourceBox.x + sourceBox.width;
        const oy = sourceBox.y + (sourceBox.height / 2);
        const ex = destBox.x;
        const ey = destBox.y + (destBox.height / 2);

        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        // const mx = (ox + ex) / 2.0;
        // const my = (oy + ey) / 2.0;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        return cubicCurve;
    }

    buildPath2(sourceCircle, destCircle) {
        const ox = sourceCircle.x + sourceCircle.rad;
        const oy = sourceCircle.y + (sourceCircle.height / 2);
        const ex = destCircle.x;
        const ey = destCircle.y + (destCircle.height / 2);
        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        // const mx = (ox + ex) / 2.0;
        // const my = (oy + ey) / 2.0;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        return cubicCurve;
    }

    /**
     * Fetching - getter/setters
     *
     * fetchBackground - retrieve outer group (best highest level of background pointer events)
     * fetchNodeGroup - retrieve collection of items forming node
     * fetchExpandButton - retrieve collection of items forming Expand Button
     * fetchAddButton - retrieve collection of items forming add Button
     * fetchRectangle - retrieve nodeGroup's rectangle
     * fetchTargetId - retrieve pointer target's id
     * fetchTargetElementType - retrieve pointer target's element
     * fetchEdgeSourceId - retrieve edge's source element id
     * fetchEdgeDestinationId - retrieve edge's destination element id
     * fetchEdgeToCursor - retrieve the edge attached to the cursor during node linkage
     * fetchEdgeTo - retrieve the edge leading into a given node
     * fetchEdgesFrom - retrieve the edges leaving a given node
     */

    fetchBackground() {
        return document.getElementById(`${this.BACKGROUND}${this.ID_SEPARATOR}${this._id}`);
    }

    fetchSubGroup(id) {
        return document.getElementById(this.buildId(this.SUBGROUP, id));
    }

    fetchNodeGroup(id) {
        return document.getElementById(this.buildId(this.NODEGROUP, id));
    }

    fetchInputEndpoint(fromNodeId, fromEndpointId) {
        const fromId = `${fromNodeId}:${fromEndpointId}`;
        return document.getElementById(this.buildId(this.INPUT, fromId));
    }

    fetchOutputEndpoint(toNodeId, toEndpointId) {
        const toId = `${toNodeId}:${toEndpointId}`;
        return document.getElementById(this.buildId(this.OUTPUT, toId));
    }

    fetchSvgObjectFromId(id) {
        return document.getElementById(id);
    }

    fetchBinding(id) {
        return document.getElementById(this.buildId(this.BINDING, id));
    }

    fetchExpandButton(id) {
        return document.getElementById(this.buildId(this.EXPAND, id));
    }

    fetchAddButton(id) {
        return document.getElementById(this.buildId(this.ADD, id));
    }

    fetchRectangle(id) {
        return document.getElementById(this.buildId(this.RECTANGLE, id));
    }

    fetchText(id) {
        return document.getElementById(this.buildId(this.TEXT, id));
    }

    fetchTargetId(svgElement) {
        let id;
        if (svgElement.id) {
            id = svgElement.id.split(this.ID_SEPARATOR)[1];
        } else {
            id = this.fetchTargetId(svgElement.parentNode);
        }
        return id;
    }

    fetchTargetElementType(svgElement) {
        let elementType;
        if (svgElement.id) {
            if (svgElement.id.includes(this.PATH_SEPARATOR)) {
                if (svgElement.id.split(this.ID_SEPARATOR)[0] === this.NODEGROUP) {
                    elementType = this.EDGE;
                } else if ((svgElement.id.split(this.ID_SEPARATOR)[0] === this.INPUT) || (svgElement.id.split(this.ID_SEPARATOR)[0] === this.INPUT)) {
                    elementType = this.BINDING;
                }
            } else {
                elementType = svgElement.id.split(this.ID_SEPARATOR)[0];
            }
        } else {
            elementType = this.fetchTargetElementType(svgElement.parentNode);
        }
        return elementType;
    }

    fetchBindingSourceId(binding) {
        const bindingSourceId = binding.id.split(this.PATH_SEPARATOR)[0];
        return bindingSourceId;
    }

    fetchBindingDestinationId(binding) {
        const bindingDestinationId = binding.id.split(this.PATH_SEPARATOR)[1];
        return bindingDestinationId;
    }


    fetchEdgeSourceId(edge) {  // @todo this returns the id of the node of the edge source... might be cleaner to break this into two pieces - (more like the binding)
        const edgeSourceId = edge.id.split(this.PATH_SEPARATOR)[0];
        const sourceId = edgeSourceId.split(this.ID_SEPARATOR)[1];
        return sourceId;
    }

    fetchEdgeDestinationId(edge) {
        const edgeDestinationId = edge.id.split(this.PATH_SEPARATOR)[1];
        const destinationId = edgeDestinationId.split(this.ID_SEPARATOR)[1];
        return destinationId;
    }

    fetchEdgeToCursor() {
        const cursorEdge = document.querySelector(`[id$=${this.CURSOR}]`);
        return cursorEdge;
    }

    fetchEdgeTo(nodeId) {
        const incomingEdge = document.querySelector(`[id$=${this.PATH_SEPARATOR}${this.buildId(this.NODEGROUP, nodeId)}]`);
        return incomingEdge;
    }

    fetchEdgesFrom(nodeId) {
        const outgoingEdges = Array.from(document.querySelectorAll(`[id^=${this.buildId(this.NODEGROUP, nodeId)}${this.PATH_SEPARATOR}]`));
        return outgoingEdges;
    }

    fetchBindingsTo(endpointId) {
        const incomingBinds = Array.from(document.querySelectorAll(`[id$="${this.PATH_SEPARATOR}${endpointId}"]`));
        return incomingBinds;
    }

    fetchBindingsFrom(endpointId) {
        const searchString = `${endpointId}${this.PATH_SEPARATOR}`;
        //  const outgoingEdges = Array.from(document.querySelectorAll(`[id^="${searchString}"]`));
        const outgoingEdges = Array.from(document.querySelectorAll(`[id^="${endpointId}${this.PATH_SEPARATOR}"]`));
        return outgoingEdges;
    }

    /**
     * Utilities
     *
     * buildId - construct the element id -- 'elementType:elementId:svgId'
     * labelWidth - return actual pixel width - based on string length and font and text attributes
     * parse - converts a group's transform string into an object (orig author:chernjie from stackoverflow)
     * clearBackground - completely wipe all elements from background
     * saveSvg - downloads text version of the SVG object
     */

    buildId(itemType, itemId) {
        return `${itemType}${this.ID_SEPARATOR}${itemId}${this.ID_SEPARATOR}${this._id}`;
    }

    labelWidth(svgText) {
        const bbox = svgText.getBBox();
        const {width} = bbox;
        return Math.round(width);
    }

    parse(a) {    // shamelessly stolen from chernjie - stackoverflow
        const b = {};
        // eslint-disable-next-line require-unicode-regexp
        for (const i in a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g)) {
            const c = a[i].match(/[\w\.\-]+/g);
            b[c.shift()] = c;
        }
        return b;
    }

    clearBackground(id) {
        const background = this.fetchBackground(id);
        background.childNodes.forEach((gNode) => {
            while (background.firstChild) {
                // The list is LIVE so it will re-index each call
                background.removeChild(background.firstChild);
            }
        });
    }

    hideAllInputEndpoints() {
        const $inputEndpoints = document.getElementsByClassName(`input-endpoint`);
        Array.from($inputEndpoints).forEach(($inputEndpoint) => {
            $inputEndpoint.classList.add(`hidden`);
        });
    }

    hideAllOutputEndpoints() {
        const $outputEndpoints = document.getElementsByClassName(`output-endpoint`);
        Array.from($outputEndpoints).forEach(($outputEndpoint) => {
            $outputEndpoint.classList.add(`hidden`);
        });
    }

    hideAllBindings() {
        const $bindings = document.getElementsByClassName(`binding`);
        Array.from($bindings).forEach(($binding) => {
            $binding.classList.add(`hidden`);
        });
    }

    saveSvg(svgEl, name = `jag`) {
        const svgData = svgEl.outerHTML;
        const preface = `<?xml version="1.0" standalone="no"?>\r\n`;
        const svgBlob = new Blob([preface, svgData], {type: `image/svg+xml;charset=utf-8`});
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement(`a`);
        downloadLink.href = svgUrl;
        downloadLink.download = name;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    createDefinitionContainer() {
        const defs = document.createElementNS(this.SVGNS, `defs`);
        return defs;
    }

    createCustomPatterns() {
        const customPatternMap = new Map();
        const diagonalPattern = document.createElementNS(this.SVGNS, `pattern`);
        diagonalPattern.id = `diagonals`;
        diagonalPattern.setAttributeNS(null, `width`, `4`);
        diagonalPattern.setAttributeNS(null, `height`, `4`);
        diagonalPattern.setAttribute(`patternUnits`, `userSpaceOnUse`);
        const diagonalPath = document.createElementNS(this.SVGNS, `path`);
        diagonalPath.setAttributeNS(null, `d`, `M-1,1 l2,-2  M0,4 l4,-4  M3,5 l2,-2`);
        diagonalPath.setAttribute(`patternUnits`, `userSpaceOnUse`);
        diagonalPath.setAttributeNS(null, `stroke`, `red`);
        diagonalPath.setAttributeNS(null, `stroke-width`, `1`);
        diagonalPattern.appendChild(diagonalPath);
        customPatternMap.set(diagonalPattern.id, diagonalPattern);
        return customPatternMap;
    }

    createCustomFilters() {
        const customFilterMap = new Map();
        // 3d extrude // //////////////////////////////////////////////////////////////
        const feConvolveMatrix = document.createElementNS(this.SVGNS, `feConvolveMatrix`);
        feConvolveMatrix.setAttributeNS(null, `in`, `SourceAlpha`);
        feConvolveMatrix.setAttributeNS(null, `result`, `Convolved`);
        feConvolveMatrix.setAttributeNS(null, `order`, `4,4`);
        feConvolveMatrix.setAttributeNS(
            null, `kernelMatrix`,
            `1 0 0 0
          0 1 0 0
          0 0 1 0
          0 0 0 1`
        );
        // //////////////////////////////////////////////////////////////////////////
        const feOffset = document.createElementNS(this.SVGNS, `feOffset`);
        feOffset.setAttributeNS(null, `in`, `Convolved`);
        feOffset.setAttributeNS(null, `dx`, `-2`);
        feOffset.setAttributeNS(null, `dy`, `-2`);
        feOffset.setAttributeNS(null, `result`, `ConvolvedAndOffset`);
        // //////////////////////////////////////////////////////////////////////////
        const feComposite = document.createElementNS(this.SVGNS, `feComposite`);
        feComposite.setAttributeNS(null, `operator`, `over`);
        feComposite.setAttributeNS(null, `in`, `SourceGraphic`);
        feComposite.setAttributeNS(null, `in2`, `ConvolvedAndOffset`);
        feComposite.setAttributeNS(null, `result`, `outout`);
        // //////////////////////////////////////////////////////////////////////////
        const filter3dEffect = document.createElementNS(this.SVGNS, `filter`);
        filter3dEffect.setAttributeNS(null, `id`, `blur`);
        filter3dEffect.setAttributeNS(null, `x`, `-20%`);
        filter3dEffect.setAttributeNS(null, `y`, `-20%`);
        filter3dEffect.setAttributeNS(null, `width`, `150%`);
        filter3dEffect.setAttributeNS(null, `height`, `180%`);
        filter3dEffect.appendChild(feConvolveMatrix);
        filter3dEffect.appendChild(feOffset);
        filter3dEffect.appendChild(feComposite);

        customFilterMap.set(filter3dEffect.id, filter3dEffect);
        return customFilterMap;
        // return filter3dEffect;
    }

    applyFilter(svgItem, filterId) {
        svgItem.setAttributeNS(null, `filter`, `url(#${filterId})`);
    }

    applyPattern(svgItem, patternId) {
        svgItem.setAttributeNS(null, `fill`, `url(#${patternId})`);
    }

}

//  applyColorEffect(nodeModel) {
//     const numberOfLeaves = nodeModel.leafCount;
//     const colorDelta = Math.max(360 / numberOfLeaves, 5);
//     this.colorTree(nodeModel, 0, colorDelta);
// }
//
//  colorTree(node, currentStep, colorDelta) {
//     let colorValue;
//     if (node.hasChildren()) {
//         let colorTotal = 0;
//         node.children.forEach((child) => {
//             const returns = this.colorTree(child, currentStep, colorDelta);
//             colorTotal = colorTotal + returns.colorValue;
//             currentStep = returns.currentStep;
//         });
//         colorValue = colorTotal / node.children.length;
//         const rectangle = this.fetchRectangle(node.id);
//         const hsla = rectangle.getAttributeNS(null, `fill`);
//         const newHsla = this.updateHue(hsla, colorValue);
//         rectangle.setAttributeNS(null, `fill`, newHsla);
//     } else {
//         colorValue = currentStep * colorDelta;
//         const rectangle = this.fetchRectangle(node.id);
//         const hsla = rectangle.getAttributeNS(null, `fill`);
//         const newHsla = this.updateHue(hsla, colorValue);
//         rectangle.setAttributeNS(null, `fill`, newHsla);
//         currentStep = currentStep + 1;
//     }
//     const changes = {colorValue,
//         currentStep};
//     return changes;
// }

// ///////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////
// const feGaussianBlur = document.createElementNS(this.SVGNS, `feGaussianBlur`);
// feGaussianBlur.setAttributeNS(null, `in`, `offOut`);
// feGaussianBlur.setAttributeNS(null, `result`, `blurOut`);
// feGaussianBlur.setAttributeNS(null, `stdDeviation`, `2`);
// //////////////////////////////////////////////////////////////////////////
// const feBlend = document.createElementNS(this.SVGNS, `feBlend`);
// feBlend.setAttributeNS(null, `in`, `SourceGraphic`);
// feBlend.setAttributeNS(null, `in2`, `blurOut`);
// feBlend.setAttributeNS(null, `mode`, `normal`);

// filter.appendChild(feGaussianBlur);
// filter.appendChild(feBlend);
