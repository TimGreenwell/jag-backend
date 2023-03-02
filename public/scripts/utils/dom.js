/**
 * @fileOverview DOM Manipulation Utilities
 *
 * @author mvignati
 * @version 0.01
 */

'use strict';

export default class DOMUtils {


    static create(description) {
        const element = document.createElement(description.type);
        for (const attribute in description.attributes) {
            element.setAttribute(attribute, description.attributes[attribute]);
        }

        if (description.children) {
            for (const child of description.children) {
                const child_element = DOMUtils.create(child);
                element.appendChild(child_element);
            }
        }

        return element;
    }

    // Select the text in $node
    static selectNodeText($node) {
        const selection = window.getSelection();
        const range = document.createRange();
        selection.removeAllRanges();
        range.selectNodeContents($node);
        selection.addRange(range);      // <    dom.js:41 addRange(): The given range isn't in document.
    }

}
