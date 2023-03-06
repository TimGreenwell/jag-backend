/**
 * SharedWorker.
 * Single port with no processing or filtering.
 */


const browserInstances = [];

onconnect = (e) => {
    const port = e.ports[0];
    browserInstances.push(port);

    port.onmessage = function (event) {
        browserInstances.forEach((instance) => {
            instance.postMessage(event.data);
        });
    };
};
