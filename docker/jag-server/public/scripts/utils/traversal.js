/**
 * @fileOverview Simple Tree Traversal options
 *
 * @author IHMC
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.59
 */

export default class Traversal {

    static iterate(liveNode, callback) {
        const workStack = [];
        workStack.push(liveNode);
        const results = [];
        while (workStack.length > 0) {
            const currentLiveNode = workStack.pop();
            const result = callback(currentLiveNode);
            if (result) {
                results.push(result);
            }
            currentLiveNode.children.forEach((child) => {
                workStack.push(child);
            });
        }
        return results;
    }

    static recurseChildrenPreorder(liveNode, callback) {
        callback(liveNode);
        liveNode.children.forEach((child) => {
            return this.recurseChildrenPreorder(child, callback);
        });
    }

    static recurseChildrenPostorder(liveNode, callback) {
        liveNode.children.forEach((child) => {
            return this.recurseChildrenPostorder(child, callback);
        });
        callback(liveNode);
    }

    static recurseProvidesIOPostorder(liveNode, callback) {
        liveNode.providesOutputTo.forEach((child) => {
            return this.recurseProvidesIOPostorder(child, callback);
        });
        callback(liveNode);
    }


}

