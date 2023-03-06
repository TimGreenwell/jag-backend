/**
 * @fileOverview Simple Tree Traversal options
 *
 * @author IHMC
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.59
 */

export default class Traversal {

    static iterate(node, callback) {
        const workStack = [];
        workStack.push(node);
        const results = [];
        while (workStack.length > 0) {
            const currentNode = workStack.pop();
            const result = callback(currentNode);
            if (result) {
                results.push(result);
            }
            currentNode.children.forEach((child) => {
                workStack.push(child);
            });
        }
        return results;
    }

    static recurseChildrenPreorder(node, callback) {
        callback(node);
        node.children.forEach((child) => {
            return this.recurseChildrenPreorder(child, callback);
        });
    }

    static recurseChildrenPostorder(node, callback) {
        node.children.forEach((child) => {
            return this.recurseChildrenPostorder(child, callback);
        });
        callback(node);
    }

    static recurseProvidesIOPostorder(node, callback) {
        node.providesOutputTo.forEach((child) => {
            return this.recurseProvidesIOPostorder(child, callback);
        });
        callback(node);
    }


}

