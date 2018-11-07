module.exports = function (RED) {
    function modbusOutNode (config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        let node = this;
        node.on('input', msg => {
            if (msg.res === undefined) {
                node.error('Malformed input! Input msg has no property res!');
                return;
            }
            if (msg.res.callback === undefined) {
                node.error('Malformed input! Input msg has no property res.callback!');
                return;
            }
            if (msg.payload === null) {
                let errorMsg = 'Malformed input! Input msg has no payload to provide!';
                node.error(errorMsg);
                return msg.res.callback(errorMsg);
            }
            return msg.res.callback(null, msg.payload);
        });
    }
    RED.nodes.registerType('modbus out', modbusOutNode);
};
