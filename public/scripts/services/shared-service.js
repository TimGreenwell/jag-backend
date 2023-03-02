/**
 * @file JAG Model services
 *
 * @author IHMC-tg
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.02
 *
 * SharedService provides the extendable basic structure for a SharedWorker
 * @TODO Will other workers be needed for processing or connection to core?
 */

export default class SharedService {

    static {
        this._senderId = undefined;
        this._sharedWorker = undefined;
    }

    static set sharedWorker(newWorker) {
        this._sharedWorker = newWorker;
    }

    static get sharedWorker() {
        return this._sharedWorker;
    }

    /**
     * SenderId could be sent to provide message origin or prevent feedback.
     * @TODO not used or tested
     */
    static set senderId(newSenderId) {
        this._senderId = newSenderId;
    }

    static get senderId() {
        return this._senderId;
    }

}

