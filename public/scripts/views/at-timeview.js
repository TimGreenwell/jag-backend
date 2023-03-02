/**
 * @file AtTimeview - Visual area for viewing JAGs in the time domain.  This is a view only.
 *
 * @author ihmc (tlg)
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 *
 *
 * @TODO --- When showing a large SVG and scrolling to bottom.   Then switching to small SVG will leave viewer far from viewing area and unable to return.
 */

import TimeviewBox from '../models/svg-box.js';
import SvgObject from "../models/svg-object.js";
import Point from "../models/point.js";
import Traversal from "../utils/traversal.js";
import Route from "../models/route.js";

class AtTimeview extends HTMLElement {

    constructor() {
        super();
        this.showTime = false;
        this.svgOriginPoint = new Point({x: 30,
            y: 30});
        this._timeContainerWrapperDiv = document.createElement(`div`);
        this._timeContainerWrapperDiv.id = `timeview-wrapper`;
        this.appendChild(this._timeContainerWrapperDiv);
        this.svg = new SvgObject(`timeview`);
        this.svg.standardHue = 200;
        this.svg.selectedHue = 150;
        this.svg.possibleHue = 50;
        this.svg.horizontalLeftMargin = 10;
        this.svg.horizontalRightMargin = 10;
        this.svg.verticalTopMargin = 7;
        this.svg.verticalBottomMargin = 7;
        this.svg.verticalInnerMargin = 6;
        this.svg.horizontalInnerMargin = 6;
        this.svg.lineWidth = 2;
        this.svg.standardFontSize = 17;
        this.svg.stepBrightness = 5;
        this.svg.chosenFilter = `blur`;
        this.svg.chosenPattern = `diagonals`;
        this.pixelsPerTimeUnit = 10;

        this._timeviewSvg = this.svg.buildSvg();
        this.$def = this.svg.createDefinitionContainer();
        this._timeviewSvg.appendChild(this.$def);
        this.filterMap = this.svg.createCustomFilters();
        this.$chosenFilter = this.filterMap.get(this.svg.chosenFilter);
        this.$def.appendChild(this.$chosenFilter);
        this.$background = this.svg.createBackground();
        this._timeviewSvg.appendChild(this.$background);
        this._timeContainerWrapperDiv.appendChild(this._timeviewSvg);

        this.currentNodeModel = null;
        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.windowSize = null;
        this.svgBox = null;
        this.panX = 0;
        this.panY = 0;
        this.zoomStep = 0;

        // this.boxMap = new Map();  // id, svg rectangle (id is copy of corresponding node id)
        this.zoomMap = new Map(); // id, zoom level (each node temporarily saves users zoom level)
        this.childNodeDescriptorsMap = new Map();

        this._timeviewSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));
        this._timeviewSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));
        this._boundDragView = this.dragView.bind(this);
        this._boundStopDragView = this.stopDragView.bind(this);
        this._treeHeight = null;
    }

    printSvg(name) {
        this.svg.saveSvg(this._timeviewSvg, name);
    }

    refreshTimeview(nodeModel = this.currentNodeModel) {
        if (this.currentNodeModel) {
            this.zoomMap.set(this.currentNodeModel.id, this.zoomStep);
        }
        this.currentNodeModel = nodeModel;

        this.svg.clearBackground(this.id);
        if (this.currentNodeModel) {
            if (this.zoomMap.has(this.currentNodeModel.id)) {
                this.zoomStep = this.zoomMap.get(this.currentNodeModel.id);
            } else {
                this.zoomStep = 0;
            }
            this.treeHeight = nodeModel.findTreeHeight();
            const expanded = true;
            this.svgBox = this.buildTimelineDiagram(this.svg.fetchBackground(this.id), nodeModel, this.svgOriginPoint);
            this.windowSize = this.getBoundingClientRect();
            this.redrawSvg();
            // this.boxMap.clear(); // ?
        }
    }

    tempGetRandomTime(estimatedTime) {
        const random = Math.floor(Math.random() * estimatedTime) + (estimatedTime / 2);
        return random;
    }

    createNodeDescriptor(nodeModel) {
        const nodeModelBox = new TimeviewBox();
        nodeModelBox.id = nodeModel.id;
        nodeModelBox.label = nodeModel.name;
        return nodeModelBox;
    }

    buildChildNodeDescriptorMap(nodeModel, parentGroup) {
        const boxMap = new Map();
        nodeModel.children.forEach((childNodeModel) => {
            const newBox = this.buildTimelineDiagram(parentGroup, childNodeModel, new Point());       // !!!
            boxMap.set(childNodeModel.id, newBox);
        });
        return boxMap;
    }


    getInnerLeafBox(nodeModel) {
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        const nodeDescriptor = this.createNodeDescriptor(nodeModel);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(nodeDescriptor.label, nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;
        nodeDescriptor.height = this.svg.standardBoxHeight;
        nodeDescriptor.totalLeafHeight = nodeDescriptor.height;
        nodeDescriptor.width = labelingWidth;
        this.svg.positionItem(labelElement, (nodeDescriptor.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return nodeDescriptor;
    }

    getInnerSequentialBox(nodeModel, boxMap) {
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        const nodeDescriptor = this.createNodeDescriptor(nodeModel);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(nodeDescriptor.label, nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;
        let tallestChild = 0;
        let growingBoxWidth = this.svg.horizontalLeftMargin;
        nodeModel.children.forEach((childNodeModel) => {
            const childBox = boxMap.get(childNodeModel.id);
            if (childBox.height > tallestChild) {
                tallestChild = childBox.height;
            }
            growingBoxWidth = growingBoxWidth + (Number(this.svg.horizontalInnerMargin) + childBox.width);
        });
        growingBoxWidth = growingBoxWidth + Number(this.svg.horizontalRightMargin - this.svg.horizontalInnerMargin);
        nodeDescriptor.height = this.svg.verticalLabelShift + tallestChild + this.svg.verticalBottomMargin;
        nodeDescriptor.width = Math.max(
            growingBoxWidth,
            labelingWidth
        );
        this.svg.positionItem(labelElement, (nodeDescriptor.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        let x = this.svg.horizontalLeftMargin;
        const y = this.svg.verticalLabelShift;
        nodeModel.children.forEach((childNodeModel) => {
            const childBox = boxMap.get(childNodeModel.id);
            childBox.x = x;
            childBox.y = y;
            childBox.height = tallestChild;
            const childNodeGroup = this.svg.fetchNodeGroup(childNodeModel.id);
            const childRectangle = this.svg.fetchRectangle(childNodeModel.id);
            this.svg.positionItem(childNodeGroup, childBox.x, childBox.y = y);
            this.svg.resizeRectangle(childRectangle, childBox.width, childBox.height);
            x = x + childBox.width + this.svg.horizontalInnerMargin;
        });

        return nodeDescriptor;
    }

    getInnerParallelBox(nodeModel, boxMap) {
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        const nodeDescriptor = this.createNodeDescriptor(nodeModel);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(nodeDescriptor.label, nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;

        let widestChild = 0;
        let growingBoxHeight = Number(this.svg.verticalLabelShift);


        nodeModel.children.forEach((childNodeModel) => {
            const childBox = boxMap.get(childNodeModel.id);
            if (childBox.width > widestChild) {
                widestChild = childBox.width;
            }
            growingBoxHeight = growingBoxHeight + (Number(this.svg.verticalInnerMargin)) + childBox.height;
        });
        nodeDescriptor.height = growingBoxHeight + Number(this.svg.verticalBottomMargin - this.svg.verticalInnerMargin);
        nodeDescriptor.width = Math.max(
            widestChild + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin),
            labelingWidth
        );
        const x = this.svg.horizontalLeftMargin;
        let y = this.svg.verticalLabelShift;
        nodeModel.children.forEach((childNodeModel) => {
            const childBox = boxMap.get(childNodeModel.id);
            childBox.x = x;
            childBox.y = y;
            childBox.width = widestChild;
            const childNodeGroup = this.svg.fetchNodeGroup(childNodeModel.id);
            const childRectangle = this.svg.fetchRectangle(childNodeModel.id);
            const childLabel = this.svg.fetchText(childNodeModel.id);
            this.svg.positionItem(childLabel, (childBox.width / 2) - (this.svg.labelWidth(childLabel) / 2), 0);
            this.svg.positionItem(childNodeGroup, childBox.x, childBox.y = y);
            this.svg.resizeRectangle(childRectangle, childBox.width, childBox.height);
            y = y + childBox.height + this.svg.verticalInnerMargin;
        });


        this.svg.positionItem(labelElement, (nodeDescriptor.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return nodeDescriptor;
    }

    produceDataLayout(childBoxCornerPoint, node, boxMap, parentBox) {
        const nodeGroup = this.svg.fetchNodeGroup(node.id);
        const box = boxMap.get(node.id);
        const rectangle = this.svg.fetchRectangle(node.id);
        let widthExtender = 0;
        const parentRightSide = parentBox.topLeftX + parentBox.width;
        const rightSideLimit = parentRightSide - this.svg.horizontalRightMargin;
        const childRightSide = childBoxCornerPoint.x + box.width;
        if ((node.providesOutputTo.length === 0) && ((childRightSide) < (rightSideLimit))) {
            widthExtender = (rightSideLimit) - (childRightSide);
        }
        this.svg.resizeRectangle(rectangle, box.width + widthExtender, box.height);
        this.svg.positionItem(nodeGroup, childBoxCornerPoint.x, childBoxCornerPoint.y);
        const nextPoint = new Point({x: childBoxCornerPoint.x + box.width + this.svg.horizontalInnerMargin,
            y: childBoxCornerPoint.y});
        node.providesOutputTo.forEach((dependant) => {
            this.produceDataLayout(nextPoint, dependant, boxMap, parentBox);
            nextPoint.y = nextPoint.y + boxMap.get(dependant.id).height + this.svg.verticalInnerMargin;
        });
    }

    dependencyShiftRight(routeArray, nodeModel, boxMap) {
        // routeArray.sort((a, b) => {
        //     return ((a.nodes.length > b.nodes.length) ? -1 : ((b.nodes.length > a.nodes.length) ? 1 : 0));
        // });
        routeArray.forEach((route) => {
            route.shiftedNodes = [];
            nodeModel.children.forEach((child) => {
                // const childBox = boxMap.get(child.id);
                if (route.nodes.includes(child)) {
                    // childBox.routeMembershipCount = childBox.routeMembershipCount + 1;
                    // const depth = route.nodes.indexOf(child);
                    // if (depth > childBox.maxDepth) {
                    //     childBox.maxDepth = depth;
                    // }
                    const maxDepth = this.getMaxDepth(child, routeArray);
                    route.shiftedNodes[maxDepth] = child;
                }
            });
        });
    }


    setChildrenMaxDepth(node, boxMap, routeArray) {
        node.children.forEach((child) => {
            const childBox = boxMap.get(child.id);
            childBox.maxDepth = this.getMaxDepth(child, routeArray);
        });
    }

    getMaxDepth(node, routeArray) {
        let maxDepth = 0;
        routeArray.forEach((route) => {
            if (route.nodes.includes(node)) {
                const depth = route.nodes.indexOf(node);
                if (depth > maxDepth) {
                    maxDepth = depth;
                }
            }
        });
        return maxDepth;
    }

    setChildrenMembershipCount(node, boxMap, routeArray) {
        node.children.forEach((child) => {
            const childBox = boxMap.get(child.id);
            childBox.routeMembershipCount = this.getMembershipCount(child, routeArray);
        });
    }

    getMembershipCount(node, routeArray) {
        let membershipCount = 0;
        routeArray.forEach((route) => {
            if (route.nodes.includes(node)) {
                membershipCount = membershipCount + 1;
            }
        });
        return membershipCount;
    }

    // this needs to be rewritten to grow appropriately  ex: 3>1 with margins within
    adjustHeights(routesArray, boxMap) {          // currently only grows the start and end to match their routes.

        const startPoints = [];
        const endPoints = [];
        routesArray.forEach((route) => {
            startPoints.push(route.shiftedNodes[0]);
            endPoints.push(route.shiftedNodes[route.shiftedNodes.length - 1]);
        });
        const startPointSet = new Set(startPoints);
        const endPointSet = new Set(endPoints);
        let lastStartPoint = null;
        let  lastEndPoint = null;
        startPointSet.forEach((routeStart) => {
            endPointSet.forEach((routeEnd) => {
                const routeNodesByDepth = [];
                const nullsAtDepth = [];
                routesArray.forEach((route) => {
                    if ((route.shiftedNodes[0] === routeStart) && (route.shiftedNodes[route.shiftedNodes.length - 1] === routeEnd)) {
                        for (let i = 0; i < route.shiftedNodes.length; i++) {
                            if (!(routeNodesByDepth[i])) {
                                routeNodesByDepth.push([]);
                            }
                            if (!(nullsAtDepth[i])) {
                                nullsAtDepth[i] = 0;
                            }
                            if (route.shiftedNodes[i]) {
                                routeNodesByDepth[i].push(route.shiftedNodes[i]);
                            } else {
                                nullsAtDepth[i] += 1;
                            }
                        }
                    }
                });
                const uniqueRouteNodesByDepth = routeNodesByDepth.map((routeNode) => {
                    return Array.from(new Set(routeNode));
                });
                // console.log(uniqueRouteNodesByDepth);  // as expected .. [] for the nulls
                const heightByDepth = uniqueRouteNodesByDepth.map((nodesAtDepth) => {
                    let height = 0;
                    nodesAtDepth.forEach((node) => {
                        const box = boxMap.get(node.id);
                        height = height + box.height;
                    });
                    return height;
                });
                for (let i = 0; i < heightByDepth.length; i++) {
                    heightByDepth[i] += nullsAtDepth[i] * this.svg.standardBoxHeight;
                }

                let tallest;
                if (heightByDepth.length === 0) {
                    tallest = 0;
                }
                else {
                    tallest = Math.max(...heightByDepth);
                }


                boxMap.get(routeStart.id).apparentHeight += tallest;
                if (routeStart === lastStartPoint) {
                    boxMap.get(routeStart.id).apparentHeight += this.svg.verticalInnerMargin;
                }

                boxMap.get(routeEnd.id).apparentHeight += tallest;
                if (routeEnd === lastEndPoint) {
                    boxMap.get(routeEnd.id).apparentHeight += this.svg.verticalInnerMargin;
                }
                lastStartPoint = routeStart;
                lastEndPoint = routeEnd;
            });
        });
    }


    // adjustHeights(routesArray, boxMap) {          // currently only grows the start and end to match their routes.
    //     let index = 0;
    //     while (index < routesArray.length) {
    //         let startPoint = routesArray[index].shiftedNodes[0];
    //         let endPoint = routesArray[index].shiftedNodes[routesArray[index].shiftedNodes.length -1];
    //         console.log(`start - ${startPoint.activity.urn}`);
    //         console.log(`end - ${endPoint.activity.urn}`);
    //         const routeNodesByDepth = [];
    //         const nullsAtDepth = [];
    //         routesArray.forEach((route) => {
    //             if ((route.shiftedNodes[0] === startPoint) && (route.shiftedNodes[route.shiftedNodes.length - 1] === endPoint)) {
    //                 for (let i = 0; i < route.shiftedNodes.length; i++) {
    //                     if (!(routeNodesByDepth[i])) {
    //                         routeNodesByDepth.push([]);
    //                     }
    //                     if (!(nullsAtDepth[i])) {
    //                         nullsAtDepth[i] = 0;
    //                     }
    //                     if (route.shiftedNodes[i]) {
    //                         routeNodesByDepth[i].push(route.shiftedNodes[i]);
    //                     } else {
    //                         nullsAtDepth[i] += 1;
    //                     }
    //                 }
    //             }
    //         });
    //         const uniqueRouteNodesByDepth = routeNodesByDepth.map((routeNode) => {
    //             return Array.from(new Set(routeNode));
    //         });
    //         // console.log(uniqueRouteNodesByDepth);  // as expected .. [] for the nulls
    //         const heightByDepth = uniqueRouteNodesByDepth.map((nodesAtDepth) => {
    //             let height = 0;
    //             nodesAtDepth.forEach((node) => {
    //                 const box = boxMap.get(node.id);
    //                 height = height + box.height;
    //             });
    //             return height;
    //         });
    //         for (let i = 0; i < heightByDepth.length; i++) {
    //             heightByDepth[i] += nullsAtDepth[i] * this.svg.standardBoxHeight;
    //         }
    //         console.log(heightByDepth);
    //         console.log(heightByDepth.length);
    //         const tallest = Math.max(...heightByDepth);
    //         boxMap.get(routeStart.id).apparentHeight += tallest;
    //         boxMap.get(routeEnd.id).apparentHeight += tallest;
    //         console.log(boxMap.get(routeStart.id).apparentHeight);
    //         console.log(boxMap.get(routeEnd.id).apparentHeight);
    //         console.log();
    //         while (index < routesArray.length) &&
    //
    //
    //
    //     }
    //
    //
    //         });
    //     });
    // }


    setEarliestX(routesArray, boxMap) {             // All seems to work good
        routesArray.forEach((route) => {
            let nextEarliestX = 0;
            for (let i = 0; i < route.nodes.length; i++) {
                const box = boxMap.get(route.nodes[i].id);
                if (nextEarliestX > box.earliestPossibleX) {
                    box.earliestPossibleX = nextEarliestX;
                }
                nextEarliestX = nextEarliestX + box.width + this.svg.horizontalInnerMargin;
            }
        });
    }

    getDepth(routesArray) {
        let deepest = 0;
        routesArray.forEach((route) => {
            if (route.shiftedNodes.length > deepest) {
                deepest = route.shiftedNodes.length;
            }
        });
        return deepest;
    }

    getWidestRouteWidth(routesArray, boxMap) {             // Not fully checked but could be right
        let widestRouteLength = 0;
        routesArray.forEach((route) => {
            const box = boxMap.get(route.nodes[route.nodes.length - 1].id);
            if (widestRouteLength < box.earliestPossibleX + box.width) {
                widestRouteLength = box.earliestPossibleX + box.width;
            }
        });
        //   widestRouteLength = widestRouteLength + (this.svg.horizontalInnerMargin * (this.getDepth(routesArray) - 1));
        return widestRouteLength;
    }


    // The way we size boxes for visual display, the starting nodes and the ending nodes grow with their respective intermediate modes.
    // Therefore, either the first or the last item will be the tallest.
    getTallestDepth(routesArray, boxMap) {
        const routeNodesByDepth = [];
        let overallTallest = 0;
        routesArray.forEach((route) => {
            for (let i = 0; i < route.shiftedNodes.length; i++) {
                if (!(routeNodesByDepth[i])) {
                    routeNodesByDepth.push([]);
                }
                if (route.shiftedNodes[i]) {
                    routeNodesByDepth[i].push(route.shiftedNodes[i]);
                }
            }
        });
        const uniqueRoutesArray = routeNodesByDepth.map((nodesAtDepth) => {
            return Array.from(new Set(nodesAtDepth));
        });
        uniqueRoutesArray.forEach((nodesAtDepth) => {
            let heightAtDepth = 0;
            for (let i = 0; i < nodesAtDepth.length; i++) {
                const box = boxMap.get(nodesAtDepth[i].id);
                heightAtDepth = heightAtDepth + box.apparentHeight + this.svg.verticalInnerMargin;
            }
            heightAtDepth = heightAtDepth - this.svg.verticalInnerMargin; // 1 too many
            if (heightAtDepth > overallTallest) {
                overallTallest = heightAtDepth;
            }
        });

        return overallTallest;
    }


    getInnerNoneBox(nodeModel, boxMap) {
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        const nodeDescriptor = this.createNodeDescriptor(nodeModel);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(nodeDescriptor.label, nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;
        nodeDescriptor.width = labelingWidth;  // The width is the maximum of the non-sibling-dependent node's total widths  max(child1.totalWidth... childn.totalwidth)
        const routesArray = this.getRoutesFromBinding(nodeModel);

        this.setChildrenMaxDepth(nodeModel, boxMap, routesArray);   // maybe stick routesArray in node descriptor
        this.setChildrenMembershipCount(nodeModel, boxMap, routesArray);
        this.adjustHeights(routesArray, boxMap);         // artsy component
        // this.adjustVerticalStart(routesArray, boxMap)    // artsy component
        this.setEarliestX(routesArray, boxMap);         // appears to work great
        nodeDescriptor.height = this.svg.verticalLabelShift + this.getTallestDepth(routesArray, boxMap) + this.svg.verticalBottomMargin;            // one of the depths (columns) takes the most space
        nodeDescriptor.width = this.svg.horizontalLeftMargin + this.getWidestRouteWidth(routesArray, boxMap) + this.svg.horizontalRightMargin;

        //
        // nodeModel.children.forEach((childNodeModel) => {
        //     const childBox = boxMap.get(childNodeModel.id);
        //     const widestAtDepth = 0;
        //     if (childNodeModel.isTopProducerSibling()) {
        //         // I never go down more than one level here ... oops
        //         this.repopulateLeafSize(childNodeModel, boxMap);// leaf Size gives the height of dependent sibling leaf's boxHeights totaled
        //
        //         nodeDescriptor.totalLeafHeight = nodeDescriptor.totalLeafHeight + Math.max(childBox.totalLeafHeight, childBox.height) + this.svg.horizontalInnerMargin;
        //
        //         nodeDescriptor.width = Math.max(nodeDescriptor.width, widestAtDepth, childBox.width);
        //         nodeDescriptor.height = Math.max(nodeDescriptor.height, nodeDescriptor.totalLeafHeight, childBox.height);
        //     }
        // });
        // nodeDescriptor.width = nodeDescriptor.width + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin - this.svg.horizontalInnerMargin);
        // nodeDescriptor.height = this.svg.verticalLabelShift + nodeDescriptor.height + (this.svg.verticalBottomMargin - this.svg.verticalInnerMargin);
        this.svg.positionItem(labelElement, (nodeDescriptor.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);

        // const boxCornerPoint = new Point({x: this.svg.horizontalLeftMargin,
        //     y: this.svg.verticalTopMargin + this.svg.verticalLabelShift});

        const childCornerPoint = new Point({
            x: this.svg.horizontalLeftMargin,
            y: this.svg.verticalLabelShift
        });


        const whereYatDepth = [];
        const lastVisitedAtDepth = [];
        routesArray.forEach((route) => {
            for (let i = 0; i < route.shiftedNodes.length; i++) {
                if (!(whereYatDepth[i])) {
                    whereYatDepth[i] = this.svg.verticalLabelShift;
                }
                if ((route.shiftedNodes[i]) && (route.shiftedNodes[i] !== lastVisitedAtDepth[i])) {
                    const box = boxMap.get(route.shiftedNodes[i].id);

                    const x = this.svg.horizontalLeftMargin + box.earliestPossibleX;
                    const y = whereYatDepth[i];
                    const nodeRectangle = this.svg.fetchRectangle(box.id);
                    const nodeGroup = this.svg.fetchNodeGroup(box.id);
                    if (box.apparentHeight === 0) {
                        box.apparentHeight = box.height;
                    }
                    this.svg.resizeRectangle(nodeRectangle, box.width, box.apparentHeight);

                    this.svg.positionItem(nodeGroup, x, y);
                    // this.svg.positionItem(childLabel, (childBox.width / 2) - (this.svg.labelWidth(childLabel) / 2), 0);
                    whereYatDepth[i] = y + box.apparentHeight + this.svg.verticalInnerMargin;
                    lastVisitedAtDepth[i] = route.shiftedNodes[i];
                }
            }
        });


        // nodeModel.children.forEach((childNodeModel) => {
        //     if (childNodeModel.isTopProducerSibling()) {
        //         this.produceDataLayout(childCornerPoint, childNodeModel, boxMap, nodeDescriptor);
        //         const box = boxMap.get(childNodeModel.id);
        //         childCornerPoint.y = childCornerPoint.y + box.height + this.svg.verticalInnerMargin;
        //     }
        // });

        return nodeDescriptor;
    }

    buildTimelineDiagram(parentGroup, nodeModel, boxCornerPoint) {
        const nodeGroup = this.svg.createNodeGroup(nodeModel.id);          // nodeGroup for this nodeModel
        parentGroup.appendChild(nodeGroup);
        this.svg.positionItem(nodeGroup, boxCornerPoint.x, boxCornerPoint.y);


        let nodeDescriptor;
        // const childOriginPoint = new Point({x: boxCornerPoint.x + this.svg.horizontalLeftMargin,
        //     y: boxCornerPoint.y + this.svg.verticalLabelShift});
        if (nodeModel.isExpanded) {
            if ((nodeModel.hasChildren())) {
                nodeModel.children.forEach((childNodeModel) => {
                    const newBox = this.buildTimelineDiagram(nodeGroup, childNodeModel, new Point());       // !!!
                    this.childNodeDescriptorsMap.set(childNodeModel.id, newBox);
                });

                //  const childNodeDescriptorsMap = this.buildChildNodeDescriptorMap(nodeModel, nodeGroup);  // at this point i have all children and heading up the recursion

                if (nodeModel._activity.connector.execution === `node.execution.parallel`) {               // Catch-all @TODO -> need smarter control
                    nodeDescriptor = this.getInnerParallelBox(nodeModel, this.childNodeDescriptorsMap);
                }
                if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                    nodeDescriptor = this.getInnerSequentialBox(nodeModel, this.childNodeDescriptorsMap);
                }
                if (nodeModel._activity.connector.execution === `node.execution.none`) {
                    nodeDescriptor = this.getInnerNoneBox(nodeModel, this.childNodeDescriptorsMap);
                }
            } else {
                nodeDescriptor = this.getInnerLeafBox(nodeModel);  // Actual leaf
            }
        } else {
            nodeDescriptor = this.getInnerLeafBox(nodeModel);  // Virtual leaf (isExpanded)
        }
        // this.svg.positionItem(nodeGroup, nodeDescriptor.topLeftX, nodeDescriptor.topLeftY);
        // this.boxMap.set(nodeDescriptor.id, nodeDescriptor);
        const svgBox = this.svg.createRectangle(nodeDescriptor.width, nodeDescriptor.height, nodeModel.id);
        this.svg.applyFilter(svgBox, this.svg.chosenFilter);
        this.svg.applyLightnessDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        }
        nodeGroup.insertBefore(svgBox, nodeGroup.firstChild);

        return nodeDescriptor;
    }

    svgWheelZoomEvent(event) {
        event.preventDefault();
        if (event.deltaY > 0) {
            this.zoomStep = this.zoomStep + 1;
        } else {
            this.zoomStep = this.zoomStep - 1;
        }
        this.redrawSvg();
    }

    applyZoom(num) {
        const zoomedNum = num + (num * this.zoomStep * 0.05);
        return zoomedNum;
    }

    redrawSvg() {
        const zoomedBoxWidth = this.applyZoom(this.windowSize.width);
        const zoomedBoxHeight = this.applyZoom(this.windowSize.height);
        if ((zoomedBoxWidth > 0) && (zoomedBoxHeight > 0)) {
            this._timeviewSvg.setAttribute(
                `viewBox`,
                `${this.panX} ${this.panY}  ${zoomedBoxWidth}  ${zoomedBoxHeight}`
            );
        }
    }

    dragView(e) {
        const zoomedBoxWidth = this.applyZoom(this.windowSize.width);
        const zoomedBoxHeight = this.applyZoom(this.windowSize.height);
        const svgViewSizeX = this.svgBox.width + this.svgOriginPoint.x + this.svg.horizontalLeftMargin;
        const svgViewSizeY = this.svgBox.height + this.svgOriginPoint.y + this.svg.verticalTopMargin;

        if (zoomedBoxWidth > svgViewSizeX) {
            this.panX = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.x - e.clientX);
            this.panX = Math.min(
                this.svgLocationX + delta,
                svgViewSizeX - zoomedBoxWidth
            );
        }
        if (zoomedBoxHeight > svgViewSizeY) {
            this.panY = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.y - e.clientY);
            this.panY = Math.min(
                this.svgLocationY + delta,
                svgViewSizeY - zoomedBoxHeight
            );
        }
        if (this.panX < 0) {
            this.panX = 0;
        }
        if (this.panY < 0) {
            this.panY = 0;
        }
        this.redrawSvg();
    }

    stopDragView() {
        this.removeEventListener(`mousemove`, this._boundDragView);
        this.svgLocationX = this.panX;
        this.svgLocationY = this.panY;
    }

    svgMouseDownEvent(e) {
        // The background clicker
        this.windowSize = this.getBoundingClientRect();
        this._initialMouse = {
            x: e.clientX,
            y: e.clientY
        };
        this.addEventListener(`mousemove`, this._boundDragView);
        this.addEventListener(`mouseup`, this._boundStopDragView);
    }


    logMapElements(value, key, map) {
        //  to use:              boxMap.forEach(this.logMapElements);
        console.log(`m[${key}] = ${value}`);
        console.log(JSON.stringify(value));
    }

    buildRouteHeightArray(routes, nodeModel, boxMap) {
        const longest = routes.reduce((a, b) => {            // seems to report ok
            return (a.length > b.length ? a : b);
        }, []).length;

        const maxRouteHeight = [];
    }

    findWidestAtDepth2(routes, nodeModel, boxMap) {
        const longest = routes.reduce((a, b) => {            // seems to report ok
            return (a.length > b.length ? a : b);
        }, []).length;

        console.log([...boxMap.entries()]);         // id, label, maxDepth

        const maxWidthAtDepth = [];
        routes.forEach((route) => {
            const routeWidthAtDepth = route.map((x) => {
                return boxMap.get(x.id).width;
            });
            console.log(routeWidthAtDepth);       //    -- >  [13, 42, 12]  looks good
            for (let i = 0; i < longest; i++) {
                if (maxWidthAtDepth[i]) {
                    if (routeWidthAtDepth[i] > maxWidthAtDepth[i]) {
                        maxWidthAtDepth[i] = routeWidthAtDepth[i];
                    }
                } else {
                    maxWidthAtDepth[i] = routeWidthAtDepth[i];
                }
            }
        });
        console.log(maxWidthAtDepth);


        // console.log(`kkkk`)
        // console.log(routes)
        // console.log(`ooo`)
        // routes.forEach((route) => {
        //     console.log(route.length);
        //     for (let i = 0; i < route.length; i++) {
        //         if (route[i]) {
        //             console.log(route[i]);
        //         } else {
        //             console.log(`bloop`);
        //         }
        //     };
        //     console.log(`---`);
        // });
    }


    findWidestAtDepth(sibling, boxMap, widestAtDepth) {
        const fetchActivitiesCallback = (sibling) => {
            const depth = sibling.dependencySlot;
            const box = boxMap.get(sibling.id);
            if ((widestAtDepth[depth] == undefined) || (widestAtDepth[depth] < box.width)) {
                widestAtDepth[depth] = box.width;
            }
        };
        Traversal.recurseProvidesIOPostorder(sibling, fetchActivitiesCallback);
        return widestAtDepth;
    }

    repopulateLeafSize(node, boxMap) {
        const fetchActivitiesCallback = (node) => {
            const nodeBox = boxMap.get(node.id);
            if (node.providesOutputTo.length > 0) {
                nodeBox.totalLeafHeight = 0;
                let marginSizeSum = 0;
                node.providesOutputTo.forEach((child) => {
                    const childNodeBox = boxMap.get(child.id);
                    nodeBox.totalLeafHeight = nodeBox.totalLeafHeight + childNodeBox.totalLeafHeight;
                    marginSizeSum = marginSizeSum + this.svg.verticalInnerMargin;
                });
                marginSizeSum = marginSizeSum - this.svg.verticalInnerMargin;
                nodeBox.height = Math.max(nodeBox.totalLeafHeight + marginSizeSum, nodeBox.height);
            }
        };
        Traversal.recurseProvidesIOPostorder(node, fetchActivitiesCallback);
    }


    getRoutesFromBinding(node) {
        const routeList = [];
        node.children.forEach((child) => {
            const routeIndex = [];
            if (!node.activity.isDependentSibling(child.activity.urn)) {                // if not dependant on a sibling...(its a starting point)
                this.findRoutes(node, child, routeIndex, routeList);
            }
        });
        this.dependencyShiftRight(routeList, node);
        return routeList;
    }

    findRoutes(node, child, routeIndex, routeList) {

        if (node.activity.hasConsumingSiblings(child.activity.urn)) {
            node.activity.bindings.forEach((bind) => {
                if (bind.from.exchangeSourceUrn === child.activity.urn) {
                    node.children.forEach((childSibling) => {
                        if (childSibling.activity.urn === bind.to.exchangeSourceUrn) {
                            routeIndex.push(child);
                            this.findRoutes(node, childSibling, routeIndex, routeList);
                            routeIndex.pop(); // current producerUrn (it gets re-added if another binding found)
                        }
                    });
                }
            });
        } else {
            routeIndex.push(child);
            const newRoute = new Route({nodes: [...routeIndex]});
            routeList.push(newRoute);
            routeIndex.pop(); // the end consumer
        }
    }

}

customElements.define(`jag-timeview`, AtTimeview);
export default customElements.get(`jag-timeview`);

// console.log(`------- Print array of arrays ----------------------`);
// array.forEach((route) => {
//     console.log(route.length);
//     for (let i = 0; i < route.length; i++) {
//         if (route[i]) {
//             console.log(route[i]);
//         } else {
//             console.log(`bloop`);
//         }
//     };
//     console.log(`---`);
// });

// console.log(`------- Print Map ----------------------`)
// console.log([...this.childNodeDescriptorsMap.entries()]);
