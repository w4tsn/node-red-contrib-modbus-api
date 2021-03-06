module.exports = function (RED) {
    function modbusInNode (config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.modbusServer = RED.nodes.getNode(config.modbusServer);
        this.command = config.command;
        this.register = config.register;
        this.name = config.name;
        let node = this;
        // for delegation of error handling to the modbus server
        this.errorHandler = function (error) {
            node.error(error);
        };
        // for delegatation of control of node msg output to the modbus server
        this.readCallback = function (req, res) {
            let msgid = RED.util.generateId();
            res._msgid = msgid;
            node.send({
                _msgid: msgid,
                req:req,
                res:res
            });
        };
        this.writeCallback = function (req, res) {
            let msgid = RED.util.generateId();
            res._msgid = msgid;
            node.send({
                _msgid: msgid,
                payload: req.value,
                req:req,
                res:res
            });
        };
        this.on('close', () => {
            this.modbusServer.removeRoute(this.register, this.command);
        });
        if (this.modbusServer) {
            node.status({shape:"dot",fill:"green",text:"Ready"});
            if (RED.settings.verbose) {
                node.warn(`${this.command}:${this.register} is ready`);
            }
        }
        if (this.command === 'getInputRegister') {
            this.modbusServer.getInputRegister(this.register, this.readCallback, this.errorHandler);
        }
        else if (this.command === 'getHoldingRegister') {
            this.modbusServer.getHoldingRegister(this.register, this.readCallback, this.errorHandler);
        }
        else if (this.command === 'getCoil') {
            this.modbusServer.getCoil(this.register, this.readCallback, this.errorHandler);
        }
        else if (this.command === 'getDiscreteInput') {
            this.modbusServer.getDiscreteInput(this.register, this.readCallback, this.errorHandler);
        }
        else if (this.command === 'setRegister') {
            this.modbusServer.setRegister(this.register, this.writeCallback, this.errorHandler);
        }
        else if (this.command === 'setCoil') {
            this.modbusServer.setCoil(this.register, this.writeCallback, this.errorHandler);
        }
    }
    RED.nodes.registerType('modbus in', modbusInNode);
};
