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

        this.currentLiveNode = null;
        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.windowSize = null;
        this.svgBox = null;
        this.panX = 0;
        this.panY = 0;
        this.zoomStep = 0;

        // this.liveNodeSvgBoxMap = new Map();  // id, svg rectangle (id is copy of corresponding liveNodeId)
        this.zoomMap = new Map(); // id, zoom level (each liveNode temporarily saves users zoom level)
        this.childLiveNodeSvgBoxsMap = new Map();

        this._timeviewSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));
        this._timeviewSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));
        this._boundDragView = this.dragView.bind(this);
        this._boundStopDragView = this.stopDragView.bind(this);
        this._treeHeight = null;
    }

    printSvg(name) {
        this.svg.saveSvg(this._timeviewSvg, name);
    }

    refreshTimeview(liveNode = this.currentLiveNode) {
        if (this.currentLiveNode) {
            this.zoomMap.set(this.currentLiveNode.id, this.zoomStep);
        }
        this.currentLiveNode = liveNode;

        this.svg.clearBackground(this.id);
        if (this.currentLiveNode) {
            if (this.zoomMap.has(this.currentLiveNode.id)) {
                this.zoomStep = this.zoomMap.get(this.currentLiveNode.id);
            } else {
                this.zoomStep = 0;
            }
            this.treeHeight = liveNode.findTreeHeight();
            const expanded = true;
            this.svgBox = this.buildTimelineDiagram(this.svg.fetchBackground(this.id), liveNode, this.svgOriginPoint);
            this.windowSize = this.getBoundingClientRect();
            this.redrawSvg();
            // this.liveNodeSvgBoxMap.clear(); // ?
        }
    }

    tempGetRandomTime(estimatedTime) {
        const random = Math.floor(Math.random() * estimatedTime) + (estimatedTime / 2);
        return random;
    }

    createLiveNodeSvgBox(liveNode) {
        const liveNodeSvgBox = new TimeviewBox();
        liveNodeSvgBox.id = liveNode.id;
        liveNodeSvgBox.label = liveNode.name;
        return liveNodeSvgBox;
    }

    buildChildLiveNodeSvgBoxMap(liveNode, parentGroup) {
        const childLiveNodeSvgBoxMap = new Map();
        liveNode.children.forEach((childLiveNode) => {
            const newBox = this.buildTimelineDiagram(parentGroup, childLiveNode, new Point());       // !!!
            childLiveNodeSvgBoxMap.set(childLiveNode.id, newBox);
        });
        return childLiveNodeSvgBoxMap;
    }


    getInnerLeafBox(liveNode) {
        const svgNodeGroup = this.svg.fetchSvgNodeGroup(liveNode.id);
        const liveNodeSvgBox = this.createLiveNodeSvgBox(liveNode);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(liveNodeSvgBox.label, liveNode.id);
        svgNodeGroup.insertBefore(labelElement, svgNodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;
        liveNodeSvgBox.height = this.svg.standardBoxHeight;
        liveNodeSvgBox.totalLeafHeight = liveNodeSvgBox.height;
        liveNodeSvgBox.width = labelingWidth;
        this.svg.positionItem(labelElement, (liveNodeSvgBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return liveNodeSvgBox;
    }

    getInnerSequentialBox(liveNode, liveNodeSvgBoxMap) {
        const svgNodeGroup = this.svg.fetchSvgNodeGroup(liveNode.id);
        const liveNodeSvgBox = this.createLiveNodeSvgBox(liveNode);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(liveNodeSvgBox.label, liveNode.id);
        svgNodeGroup.insertBefore(labelElement, svgNodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;
        let tallestChild = 0;
        let growingBoxWidth = this.svg.horizontalLeftMargin;
        liveNode.children.forEach((childLiveNode) => {
            const childBox = liveNodeSvgBoxMap.get(childLiveNode.id);
            if (childBox.height > tallestChild) {
                tallestChild = childBox.height;
            }
            growingBoxWidth = growingBoxWidth + (Number(this.svg.horizontalInnerMargin) + childBox.width);
        });
        growingBoxWidth = growingBoxWidth + Number(this.svg.horizontalRightMargin - this.svg.horizontalInnerMargin);
        liveNodeSvgBox.height = this.svg.verticalLabelShift + tallestChild + this.svg.verticalBottomMargin;
        liveNodeSvgBox.width = Math.max(
            growingBoxWidth,
            labelingWidth
        );
        this.svg.positionItem(labelElement, (liveNodeSvgBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        let x = this.svg.horizontalLeftMargin;
        const y = this.svg.verticalLabelShift;
        liveNode.children.forEach((childLiveNode) => {
            const childBox = liveNodeSvgBoxMap.get(childLiveNode.id);
            childBox.x = x;
            childBox.y = y;
            childBox.height = tallestChild;
            const childNodeGroup = this.svg.fetchSvgNodeGroup(childLiveNode.id);
            const childRectangle = this.svg.fetchRectangle(childLiveNode.id);
            this.svg.positionItem(childNodeGroup, childBox.x, childBox.y = y);
            this.svg.resizeRectangle(childRectangle, childBox.width, childBox.height);
            x = x + childBox.width + this.svg.horizontalInnerMargin;
        });

        return liveNodeSvgBox;
    }

    getInnerParallelBox(liveNode, liveNodeSvgBoxMap) {
        const svgNodeGroup = this.svg.fetchSvgNodeGroup(liveNode.id);
        const liveNodeSvgBox = this.createLiveNodeSvgBox(liveNode);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(liveNodeSvgBox.label, liveNode.id);
        svgNodeGroup.insertBefore(labelElement, svgNodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;

        let widestChild = 0;
        let growingBoxHeight = Number(this.svg.verticalLabelShift);


        liveNode.children.forEach((childLiveNode) => {
            const childBox = liveNodeSvgBoxMap.get(childLiveNode.id);
            if (childBox.width > widestChild) {
                widestChild = childBox.width;
            }
            growingBoxHeight = growingBoxHeight + (Number(this.svg.verticalInnerMargin)) + childBox.height;
        });
        liveNodeSvgBox.height = growingBoxHeight + Number(this.svg.verticalBottomMargin - this.svg.verticalInnerMargin);
        liveNodeSvgBox.width = Math.max(
            widestChild + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin),
            labelingWidth
        );
        const x = this.svg.horizontalLeftMargin;
        let y = this.svg.verticalLabelShift;
        liveNode.children.forEach((childLiveNode) => {
            const childBox = liveNodeSvgBoxMap.get(childLiveNode.id);
            childBox.x = x;
            childBox.y = y;
            childBox.width = widestChild;
            const childSvgNodeGroup = this.svg.fetchSvgNodeGroup(childLiveNode.id);
            const childRectangle = this.svg.fetchRectangle(childLiveNode.id);
            const childLabel = this.svg.fetchText(childLiveNode.id);
            this.svg.positionItem(childLabel, (childBox.width / 2) - (this.svg.labelWidth(childLabel) / 2), 0);
            this.svg.positionItem(childSvgNodeGroup, childBox.x, childBox.y = y);
            this.svg.resizeRectangle(childRectangle, childBox.width, childBox.height);
            y = y + childBox.height + this.svg.verticalInnerMargin;
        });


        this.svg.positionItem(labelElement, (liveNodeSvgBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return liveNodeSvgBox;
    }

    produceDataLayout(childBoxCornerPoint, liveNode, liveNodeSvgBoxMap, parentBox) {
        const svgNodeGroup = this.svg.fetchSvgNodeGroup(liveNode.id);
        const box = liveNodeSvgBoxMap.get(liveNode.id);
        const rectangle = this.svg.fetchRectangle(liveNode.id);
        let widthExtender = 0;
        const parentRightSide = parentBox.topLeftX + parentBox.width;
        const rightSideLimit = parentRightSide - this.svg.horizontalRightMargin;
        const childRightSide = childBoxCornerPoint.x + box.width;
        if ((liveNode.providesOutputTo.length === 0) && ((childRightSide) < (rightSideLimit))) {
            widthExtender = (rightSideLimit) - (childRightSide);
        }
        this.svg.resizeRectangle(rectangle, box.width + widthExtender, box.height);
        this.svg.positionItem(svgNodeGroup, childBoxCornerPoint.x, childBoxCornerPoint.y);
        const nextPoint = new Point({x: childBoxCornerPoint.x + box.width + this.svg.horizontalInnerMargin,
            y: childBoxCornerPoint.y});
        liveNode.providesOutputTo.forEach((dependant) => {
            this.produceDataLayout(nextPoint, dependant, liveNodeSvgBoxMap, parentBox);
            nextPoint.y = nextPoint.y + liveNodeSvgBoxMap.get(dependant.id).height + this.svg.verticalInnerMargin;
        });
    }

    dependencyShiftRight(routeArray, liveNode, liveNodeSvgBoxMap) {
        // routeArray.sort((a, b) => {
        //     return ((a.liveNodes.length > b.liveNodes.length) ? -1 : ((b.liveNodes.length > a.liveNodes.length) ? 1 : 0));
        // });
        routeArray.forEach((route) => {
            route.shiftedLiveNodes = [];
            liveNode.children.forEach((childLiveNode) => {
                // const childBox = liveNodeSvgBoxMap.get(child.id);
                if (route.liveNodes.includes(childLiveNode)) {
                    // childBox.routeMembershipCount = childBox.routeMembershipCount + 1;
                    // const depth = route.liveNodes.indexOf(child);
                    // if (depth > childBox.maxDepth) {
                    //     childBox.maxDepth = depth;
                    // }
                    const maxDepth = this.getMaxDepth(childLiveNode, routeArray);
                    route.shiftedLiveNodes[maxDepth] = childLiveNode;
                }
            });
        });
    }


    setChildrenMaxDepth(liveNode, liveNodeSvgBoxMap, routeArray) {
        liveNode.children.forEach((childLiveNode) => {
            const childBox = liveNodeSvgBoxMap.get(childLiveNode.id);
            childBox.maxDepth = this.getMaxDepth(childLiveNode, routeArray);
        });
    }

    getMaxDepth(liveNode, routeArray) {
        let maxDepth = 0;
        routeArray.forEach((route) => {
            if (route.liveNodes.includes(liveNode)) {
                const depth = route.liveNodes.indexOf(liveNode);
                if (depth > maxDepth) {
                    maxDepth = depth;
                }
            }
        });
        return maxDepth;
    }

    setChildrenMembershipCount(liveNode, liveNodeSvgBoxMap, routeArray) {
        liveNode.children.forEach((child) => {
            const childBox = liveNodeSvgBoxMap.get(child.id);
            childBox.routeMembershipCount = this.getMembershipCount(child, routeArray);
        });
    }

    getMembershipCount(liveNode, routeArray) {
        let membershipCount = 0;
        routeArray.forEach((route) => {
            if (route.liveNodes.includes(liveNode)) {
                membershipCount = membershipCount + 1;
            }
        });
        return membershipCount;
    }

    // this needs to be rewritten to grow appropriately  ex: 3>1 with margins within
    adjustHeights(routesArray, liveNodeSvgBoxMap) {          // currently only grows the start and end to match their routes.

        const startPoints = [];
        const endPoints = [];
        routesArray.forEach((route) => {
            startPoints.push(route.shiftedLiveNodes[0]);
            endPoints.push(route.shiftedLiveNodes[route.shiftedLiveNodes.length - 1]);
        });
        const startPointSet = new Set(startPoints);
        const endPointSet = new Set(endPoints);
        let lastStartPoint = null;
        let  lastEndPoint = null;
        startPointSet.forEach((routeStart) => {
            endPointSet.forEach((routeEnd) => {
                const routedLiveNodesByDepth = [];
                const nullsAtDepth = [];
                routesArray.forEach((route) => {
                    if ((route.shiftedLiveNodes[0] === routeStart) && (route.shiftedLiveNodes[route.shiftedLiveNodes.length - 1] === routeEnd)) {
                        for (let i = 0; i < route.shiftedLiveNodes.length; i++) {
                            if (!(routedLiveNodesByDepth[i])) {
                                routedLiveNodesByDepth.push([]);
                            }
                            if (!(nullsAtDepth[i])) {
                                nullsAtDepth[i] = 0;
                            }
                            if (route.shiftedLiveNodes[i]) {
                                routedLiveNodesByDepth[i].push(route.shiftedLiveNodes[i]);
                            } else {
                                nullsAtDepth[i] += 1;
                            }
                        }
                    }
                });
                const uniqueRoutedLiveNodesByDepth = routedLiveNodesByDepth.map((routeLiveNode) => {
                    return Array.from(new Set(routeLiveNode));
                });
                // console.log(uniqueRoutedLiveNodesByDepth);  // as expected .. [] for the nulls
                const heightByDepth = uniqueRoutedLiveNodesByDepth.map((liveNodesAtDepth) => {
                    let height = 0;
                    liveNodesAtDepth.forEach((liveNodeAtDepth) => {
                        const box = liveNodeSvgBoxMap.get(liveNodeAtDepth.id);
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


                liveNodeSvgBoxMap.get(routeStart.id).apparentHeight += tallest;
                if (routeStart === lastStartPoint) {
                    liveNodeSvgBoxMap.get(routeStart.id).apparentHeight += this.svg.verticalInnerMargin;
                }

                liveNodeSvgBoxMap.get(routeEnd.id).apparentHeight += tallest;
                if (routeEnd === lastEndPoint) {
                    liveNodeSvgBoxMap.get(routeEnd.id).apparentHeight += this.svg.verticalInnerMargin;
                }
                lastStartPoint = routeStart;
                lastEndPoint = routeEnd;
            });
        });
    }


    // adjustHeights(routesArray, liveNodeSvgBoxMap) {          // currently only grows the start and end to match their routes.
    //     let index = 0;
    //     while (index < routesArray.length) {
    //         let startPoint = routesArray[index].shiftedLiveNodes[0];
    //         let endPoint = routesArray[index].shiftedLiveNodes[routesArray[index].shiftedLiveNodes.length -1];
    //         console.log(`start - ${startPoint.activity.urn}`);
    //         console.log(`end - ${endPoint.activity.urn}`);
    //         const routedLiveNodesByDepth = [];
    //         const nullsAtDepth = [];
    //         routesArray.forEach((route) => {
    //             if ((route.shiftedLiveNodes[0] === startPoint) && (route.shiftedLiveNodes[route.shiftedLiveNodes.length - 1] === endPoint)) {
    //                 for (let i = 0; i < route.shiftedLiveNodes.length; i++) {
    //                     if (!(routedLiveNodesByDepth[i])) {
    //                         routedLiveNodesByDepth.push([]);
    //                     }
    //                     if (!(nullsAtDepth[i])) {
    //                         nullsAtDepth[i] = 0;
    //                     }
    //                     if (route.shiftedLiveNodes[i]) {
    //                         routedLiveNodesByDepth[i].push(route.shiftedLiveNodes[i]);
    //                     } else {
    //                         nullsAtDepth[i] += 1;
    //                     }
    //                 }
    //             }
    //         });
    //         const uniqueRoutedLiveNodesByDepth = routedLiveNodesByDepth.map((routeLiveNode) => {
    //             return Array.from(new Set(routeLiveNode));
    //         });
    //         // console.log(uniqueRoutedLiveNodesByDepth);  // as expected .. [] for the nulls
    //         const heightByDepth = uniqueRoutedLiveNodesByDepth.map((liveNodesAtDepth) => {
    //             let height = 0;
    //             liveNodesAtDepth.forEach((liveNodeAtDepth) => {
    //                 const box = liveNodeSvgBoxMap.get(liveNodeAtDepth.id);
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
    //         liveNodeSvgBoxMap.get(routeStart.id).apparentHeight += tallest;
    //         liveNodeSvgBoxMap.get(routeEnd.id).apparentHeight += tallest;
    //         console.log(liveNodeSvgBoxMap.get(routeStart.id).apparentHeight);
    //         console.log(liveNodeSvgBoxMap.get(routeEnd.id).apparentHeight);
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


    setEarliestX(routesArray, liveNodeSvgBoxMap) {             // All seems to work good
        routesArray.forEach((route) => {
            let nextEarliestX = 0;
            for (let i = 0; i < route.liveNodes.length; i++) {
                const box = liveNodeSvgBoxMap.get(route.liveNodes[i].id);
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
            if (route.shiftedLiveNodes.length > deepest) {
                deepest = route.shiftedLiveNodes.length;
            }
        });
        return deepest;
    }

    getWidestRouteWidth(routesArray, liveNodeSvgBoxMap) {             // Not fully checked but could be right
        let widestRouteLength = 0;
        routesArray.forEach((route) => {
            const box = liveNodeSvgBoxMap.get(route.liveNodes[route.liveNodes.length - 1].id);
            if (widestRouteLength < box.earliestPossibleX + box.width) {
                widestRouteLength = box.earliestPossibleX + box.width;
            }
        });
        //   widestRouteLength = widestRouteLength + (this.svg.horizontalInnerMargin * (this.getDepth(routesArray) - 1));
        return widestRouteLength;
    }


    // The way we size boxes for visual display, the starting liveNodes and the ending liveNodes grow with their respective intermediate modes.
    // Therefore, either the first or the last item will be the tallest.
    getTallestDepth(routesArray, liveNodeSvgBoxMap) {
        const routedLiveNodesByDepth = [];
        let overallTallest = 0;
        routesArray.forEach((route) => {
            for (let i = 0; i < route.shiftedLiveNodes.length; i++) {
                if (!(routedLiveNodesByDepth[i])) {
                    routedLiveNodesByDepth.push([]);
                }
                if (route.shiftedLiveNodes[i]) {
                    routedLiveNodesByDepth[i].push(route.shiftedLiveNodes[i]);
                }
            }
        });
        const uniqueRoutesArray = routedLiveNodesByDepth.map((liveNodesAtDepth) => {
            return Array.from(new Set(liveNodesAtDepth));
        });
        uniqueRoutesArray.forEach((liveNodesAtDepth) => {
            let heightAtDepth = 0;
            for (let i = 0; i < liveNodesAtDepth.length; i++) {
                const box = liveNodeSvgBoxMap.get(liveNodesAtDepth[i].id);
                heightAtDepth = heightAtDepth + box.apparentHeight + this.svg.verticalInnerMargin;
            }
            heightAtDepth = heightAtDepth - this.svg.verticalInnerMargin; // 1 too many
            if (heightAtDepth > overallTallest) {
                overallTallest = heightAtDepth;
            }
        });

        return overallTallest;
    }


    getInnerNoneBox(liveNode, liveNodeSvgBoxMap) {
        const svgNodeGroup = this.svg.fetchSvgNodeGroup(liveNode.id);
        const liveNodeSvgBox = this.createLiveNodeSvgBox(liveNode);            // * just returning a box -- not hooking it up.
        const labelElement = this.svg.createTextElement(liveNodeSvgBox.label, liveNode.id);
        svgNodeGroup.insertBefore(labelElement, svgNodeGroup.firstChild);
        const labelingWidth = this.svg.horizontalLeftMargin + this.svg.labelWidth(labelElement) + this.svg.horizontalRightMargin;
        liveNodeSvgBox.width = labelingWidth;  // The width is the maximum of the non-sibling-dependent liveNode's total widths  max(child1.totalWidth... childn.totalwidth)
        const routesArray = this.getRoutesFromBinding(liveNode);

        this.setChildrenMaxDepth(liveNode, liveNodeSvgBoxMap, routesArray);   // maybe stick routesArray in liveNode descriptor
        this.setChildrenMembershipCount(liveNode, liveNodeSvgBoxMap, routesArray);
        this.adjustHeights(routesArray, liveNodeSvgBoxMap);         // artsy component
        // this.adjustVerticalStart(routesArray, liveNodeSvgBoxMap)    // artsy component
        this.setEarliestX(routesArray, liveNodeSvgBoxMap);         // appears to work great
        liveNodeSvgBox.height = this.svg.verticalLabelShift + this.getTallestDepth(routesArray, liveNodeSvgBoxMap) + this.svg.verticalBottomMargin;            // one of the depths (columns) takes the most space
        liveNodeSvgBox.width = this.svg.horizontalLeftMargin + this.getWidestRouteWidth(routesArray, liveNodeSvgBoxMap) + this.svg.horizontalRightMargin;

        //
        // liveNode.children.forEach((childLiveNode) => {
        //     const childBox = liveNodeSvgBoxMap.get(childLiveNode.id);
        //     const widestAtDepth = 0;
        //     if (childLiveNode.isTopProducerSibling()) {
        //         // I never go down more than one level here ... oops
        //         this.repopulateLeafSize(childLiveNode, liveNodeSvgBoxMap);// leaf Size gives the height of dependent sibling leaf's boxHeights totaled
        //
        //         liveNodeSvgBox.totalLeafHeight = liveNodeSvgBox.totalLeafHeight + Math.max(childBox.totalLeafHeight, childBox.height) + this.svg.horizontalInnerMargin;
        //
        //         liveNodeSvgBox.width = Math.max(liveNodeSvgBox.width, widestAtDepth, childBox.width);
        //         liveNodeSvgBox.height = Math.max(liveNodeSvgBox.height, liveNodeSvgBox.totalLeafHeight, childBox.height);
        //     }
        // });
        // liveNodeSvgBox.width = liveNodeSvgBox.width + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin - this.svg.horizontalInnerMargin);
        // liveNodeSvgBox.height = this.svg.verticalLabelShift + liveNodeSvgBox.height + (this.svg.verticalBottomMargin - this.svg.verticalInnerMargin);
        this.svg.positionItem(labelElement, (liveNodeSvgBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);

        // const boxCornerPoint = new Point({x: this.svg.horizontalLeftMargin,
        //     y: this.svg.verticalTopMargin + this.svg.verticalLabelShift});

        const childCornerPoint = new Point({
            x: this.svg.horizontalLeftMargin,
            y: this.svg.verticalLabelShift
        });


        const whereYatDepth = [];
        const lastVisitedAtDepth = [];
        routesArray.forEach((route) => {
            for (let i = 0; i < route.shiftedLiveNodes.length; i++) {
                if (!(whereYatDepth[i])) {
                    whereYatDepth[i] = this.svg.verticalLabelShift;
                }
                if ((route.shiftedLiveNodes[i]) && (route.shiftedLiveNodes[i] !== lastVisitedAtDepth[i])) {
                    const box = liveNodeSvgBoxMap.get(route.shiftedLiveNodes[i].id);

                    const x = this.svg.horizontalLeftMargin + box.earliestPossibleX;
                    const y = whereYatDepth[i];
                    const svgRectangle = this.svg.fetchRectangle(box.id);
                    const svgNodeGroup = this.svg.fetchSvgNodeGroup(box.id);
                    if (box.apparentHeight === 0) {
                        box.apparentHeight = box.height;
                    }
                    this.svg.resizeRectangle(svgRectangle, box.width, box.apparentHeight);

                    this.svg.positionItem(svgNodeGroup, x, y);
                    // this.svg.positionItem(childLabel, (childBox.width / 2) - (this.svg.labelWidth(childLabel) / 2), 0);
                    whereYatDepth[i] = y + box.apparentHeight + this.svg.verticalInnerMargin;
                    lastVisitedAtDepth[i] = route.shiftedLiveNodes[i];
                }
            }
        });


        // liveNode.children.forEach((childLiveNode) => {
        //     if (childLiveNode.isTopProducerSibling()) {
        //         this.produceDataLayout(childCornerPoint, childLiveNode, liveNodeSvgBoxMap, liveNodeSvgBox);
        //         const box = liveNodeSvgBoxMap.get(childLiveNode.id);
        //         childCornerPoint.y = childCornerPoint.y + box.height + this.svg.verticalInnerMargin;
        //     }
        // });

        return liveNodeSvgBox;
    }

    buildTimelineDiagram(parentGroup, liveNode, boxCornerPoint) {
        const svgNodeGroup = this.svg.createSvgNodeGroup(liveNode.id);          // svgNodeGroup for this liveNode
        parentGroup.appendChild(svgNodeGroup);
        this.svg.positionItem(svgNodeGroup, boxCornerPoint.x, boxCornerPoint.y);


        let liveNodeSvgBox;
        // const childOriginPoint = new Point({x: boxCornerPoint.x + this.svg.horizontalLeftMargin,
        //     y: boxCornerPoint.y + this.svg.verticalLabelShift});
        if (liveNode.isExpanded) {
            if ((liveNode.hasChildren())) {
                liveNode.children.forEach((childLiveNode) => {
                    const newBox = this.buildTimelineDiagram(svgNodeGroup, childLiveNode, new Point());       // !!!
                    this.childLiveNodeSvgBoxsMap.set(childLiveNode.id, newBox);
                });

                //  const childLiveNodeSvgBoxsMap = this.buildChildNodeDescriptorMap(liveNode, svgNodeGroup);  // at this point i have all children and heading up the recursion

                if (liveNode._activity.connector.execution === `livenode.execution.parallel`) {               // Catch-all @TODO -> need smarter control
                    liveNodeSvgBox = this.getInnerParallelBox(liveNode, this.childLiveNodeSvgBoxsMap);
                }
                if (liveNode._activity.connector.execution === `livenode.execution.sequential`) {
                    liveNodeSvgBox = this.getInnerSequentialBox(liveNode, this.childLiveNodeSvgBoxsMap);
                }
                if (liveNode._activity.connector.execution === `livenode.execution.none`) {
                    liveNodeSvgBox = this.getInnerNoneBox(liveNode, this.childLiveNodeSvgBoxsMap);
                }
            } else {
                liveNodeSvgBox = this.getInnerLeafBox(liveNode);  // Actual leaf
            }
        } else {
            liveNodeSvgBox = this.getInnerLeafBox(liveNode);  // Virtual leaf (isExpanded)
        }
        // this.svg.positionItem(svgNodeGroup, liveNodeSvgBox.topLeftX, liveNodeSvgBox.topLeftY);
        // this.liveNodeSvgBoxMap.set(liveNodeSvgBox.id, liveNodeSvgBox);
        const svgBox = this.svg.createRectangle(liveNodeSvgBox.width, liveNodeSvgBox.height, liveNode.id);
        this.svg.applyFilter(svgBox, this.svg.chosenFilter);
        this.svg.applyLightnessDepthEffect(svgBox, liveNode.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgBox, liveNode.treeDepth, this.treeHeight);
        }
        svgNodeGroup.insertBefore(svgBox, svgNodeGroup.firstChild);

        return liveNodeSvgBox;
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
        //  to use:              liveNodeSvgBoxMap.forEach(this.logMapElements);
        console.log(`m[${key}] = ${value}`);
        console.log(JSON.stringify(value));
    }

    buildRouteHeightArray(routes, liveNode, liveNodeSvgBoxMap) {
        const longest = routes.reduce((a, b) => {            // seems to report ok
            return (a.length > b.length ? a : b);
        }, []).length;

        const maxRouteHeight = [];
    }

    findWidestAtDepth2(routes, liveNode, liveNodeSvgBoxMap) {
        const longest = routes.reduce((a, b) => {            // seems to report ok
            return (a.length > b.length ? a : b);
        }, []).length;

        console.log([...liveNodeSvgBoxMap.entries()]);         // id, label, maxDepth

        const maxWidthAtDepth = [];
        routes.forEach((route) => {
            const routeWidthAtDepth = route.map((x) => {
                return liveNodeSvgBoxMap.get(x.id).width;
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


    findWidestAtDepth(sibling, liveNodeSvgBoxMap, widestAtDepth) {
        const fetchActivitiesCallback = (sibling) => {
            const depth = sibling.dependencySlot;
            const box = liveNodeSvgBoxMap.get(sibling.id);
            if ((widestAtDepth[depth] == undefined) || (widestAtDepth[depth] < box.width)) {
                widestAtDepth[depth] = box.width;
            }
        };
        Traversal.recurseProvidesIOPostorder(sibling, fetchActivitiesCallback);
        return widestAtDepth;
    }

    repopulateLeafSize(liveNode, liveNodeSvgBoxMap) {
        const fetchActivitiesCallback = (liveNode) => {
            const liveNodeSvgBox = liveNodeSvgBoxMap.get(liveNode.id);
            if (liveNode.providesOutputTo.length > 0) {
                liveNodeSvgBox.totalLeafHeight = 0;
                let marginSizeSum = 0;
                liveNode.providesOutputTo.forEach((child) => {
                    const childLiveNodeBox = liveNodeSvgBoxMap.get(child.id);
                    liveNodeSvgBox.totalLeafHeight = liveNodeSvgBox.totalLeafHeight + childLiveNodeBox.totalLeafHeight;
                    marginSizeSum = marginSizeSum + this.svg.verticalInnerMargin;
                });
                marginSizeSum = marginSizeSum - this.svg.verticalInnerMargin;
                liveNodeSvgBox.height = Math.max(liveNodeSvgBox.totalLeafHeight + marginSizeSum, liveNodeSvgBox.height);
            }
        };
        Traversal.recurseProvidesIOPostorder(liveNode, fetchActivitiesCallback);
    }


    getRoutesFromBinding(liveNode) {
        const routeList = [];
        liveNode.children.forEach((childLiveNode) => {
            const routeIndex = [];
            if (!liveNode.activity.isDependentSibling(childLiveNode.activity.urn)) {                // if not dependant on a sibling...(its a starting point)
                this.findRoutes(liveNode, childLiveNode, routeIndex, routeList);
            }
        });
        this.dependencyShiftRight(routeList, liveNode);
        return routeList;
    }

    findRoutes(liveNode, childLiveNode, routeIndex, routeList) {

        if (liveNode.activity.hasConsumingSiblings(childLiveNode.activity.urn)) {
            liveNode.activity.bindings.forEach((bind) => {
                if (bind.from.exchangeSourceUrn === childLiveNode.activity.urn) {
                    liveNode.children.forEach((childSibling) => {
                        if (childSibling.activity.urn === bind.to.exchangeSourceUrn) {
                            routeIndex.push(childLiveNode);
                            this.findRoutes(liveNode, childSibling, routeIndex, routeList);
                            routeIndex.pop(); // current producerUrn (it gets re-added if another binding found)
                        }
                    });
                }
            });
        } else {
            routeIndex.push(childLiveNode);
            const newRoute = new Route({liveNodes: [...routeIndex]});
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
// console.log([...this.childLiveNodeSvgBoxsMap.entries()]);
