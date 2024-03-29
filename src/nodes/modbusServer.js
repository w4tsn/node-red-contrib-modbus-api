const ModbusRTU = require('modbus-serial');

module.exports = function (RED) {
    function modbusServerNode (config) {
        RED.nodes.createNode(this, config);
        let node = this;
        this.options = {
            host: config.host,
            port: config.port || 1502,
            debug: config.debug || false,
            unitID: parseInt(config.unitID, 10) || 1
        };
        this.routes = new Map();
        this.removeRoute = function (register, command) {
            node.routes.delete(`${command}.${register}`);
        };
        this.getRoute = function (register, command) {
            return node.routes.get(`${command}.${register}`);
        };
        this.addRoute = function (register, command, receive, errorHandler) {
            if (node.routes.has(`${command}.${register}`)) {
                errorHandler('The specified register is already bound under the selected command.');
                return;
            }
            node.routes.set(`${command}.${register}`, {
                receive: receive,
                errorHandler: errorHandler
            });
        };
        this.getInputRegister = function (register, receive, errorHandler) {
            node.addRoute(register, 'getInputRegister', receive, errorHandler);
        };
        this.getHoldingRegister = function (register, receive, errorHandler) {
            node.addRoute(register, 'getHoldingRegister', receive, errorHandler);
        };
        this.getCoil = function (register, receive, errorHandler) {
            node.addRoute(register, 'getCoil', receive, errorHandler);
        };
        this.getDiscreteInput = function (register, receive, errorHandler) {
            node.addRoute(register, 'getDiscreteInput', receive, errorHandler);
        };
        this.setRegister = function (register, receive, errorHandler) {
            node.addRoute(register, 'setRegister', receive, errorHandler);
        };
        this.setCoil = function (register, receive, errorHandler) {
            node.addRoute(register, 'setCoil', receive, errorHandler);
        };
        const apiMethods = {
            _apiReadHandler: function (addr, command, unitID, callback, defaultval) {
                let handler = node.routes.get(`${command}.${addr}`);
                    let req = {
                    register: addr,
                    unitID: unitID,
                    command: command
                };
                let res = {
                    callback: callback,
                };
                if (handler) {
                    handler.receive(req, res);
                } else {
                    callback({
                        modbusErrorCode: 0x02, // Illegal address
                        msg: "Invalid length"
                    },null);
                    //node.error({error:'A client attempted to read from invalid register',req:req});
                    node.error('A client attempted to read from invalid register '+ JSON.stringify(req,null,'\t'));
                }
            },
            _apiWriteHandler: function (addr, command, unitID, callback, value) {
                let handler = node.routes.get(`${command}.${addr}`);
                let req = {
                    register: addr,
                    unitID: unitID,
                    command: command,
                    value: value,
                };
                let res = {
                    callback: callback,
                };
                if (handler){
                    handler.receive(req, res);
                } else {
                    callback({
                        modbusErrorCode: 0x02, // Illegal address
                        msg: "Invalid length"
                    },null);
                    //node.error({error:'A client attempted to write to invalid register',req:req});
                    node.error('A client attempted to write to invalid register '+ JSON.stringify(req,null,'\t'));
                }
            },
            /**
             * FC 4 Read input status
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getInputRegister: function (addr, unitID, callback) {
                apiMethods._apiReadHandler(addr, 'getInputRegister', unitID, callback, 0);
            },
            /**
             * FC 3 Read holding registers
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getHoldingRegister: function (addr, unitID, callback) {
                apiMethods._apiReadHandler(addr, 'getHoldingRegister', unitID, callback, 0);
            },
            /**
             * FC 2 Read discrete inputs
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getDiscreteInput: function (addr, unitID, callback) {
                apiMethods._apiReadHandler(addr, 'getDiscreteInput', unitID, callback, false);
            },
            /**
             * FC 1 Read coil status
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getCoil: function (addr, unitID, callback) {
                apiMethods._apiReadHandler(addr, 'getCoil', unitID, callback, false);
            },
            /**
             * FC 5 Write coil
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            setCoil: function (addr, value, unitID, callback) {
                apiMethods._apiWriteHandler(addr, 'setCoil', unitID, callback, value);
            },
            /**
             * FC 6 Write register
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            setRegister: function (addr, value, unitID, callback) {
                apiMethods._apiWriteHandler(addr, 'setRegister', unitID, callback, value);
            },
        };
        try {
            node.modbusServerTCP = new ModbusRTU.ServerTCP(apiMethods, node.options);
            node.modbusServerTCP._server.on('error', err => {
                node.error(err);
            });
            node.modbusServerTCP.on('socketError', err => {
                node.error(err);
            });
            node.modbusServerTCP.on('error', err => {
                node.error(err);
            });
            if (RED.settings.verbose) {
                node.warn(`Modbus TCP Server listening on ${node.options.host}:${node.options.port}.`);
            } else {
                node.log(`Modbus TCP Server listening on ${node.options.host}:${node.options.port}.`);
            }
        } catch (error) {
            node.error(`Error while starting the Modbus TCP server: ${error}`);
        }
        node.on('close', (done) => {
            node.modbusServerTCP.close(() => done());
        });
    }
    RED.nodes.registerType('modbus server', modbusServerNode);
};
