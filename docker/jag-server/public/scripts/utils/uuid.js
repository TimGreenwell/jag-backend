/**
 * @file UUID utils.
 *
 * @author Noodep
 * @version 0.06
 */

export function uuidV4() {
    // rfc4122 version 4 compliant UUID
    // return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    //     const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    //     return v.toString(16);
    // });
    return `xxxxxxxx`.replace(/[xy]/gu, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === `x` ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}
