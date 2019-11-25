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
        const apiMethods = {
            _apiHandler: function (addr, command, unitID, callback, defaultval) {
                let handler = node.routes.get(`${command}.${addr}`);
                let req = {
                    register: addr,
                    unitID: unitID,
                    command: command
                };
                let res = {
                    callback: callback,
                };
                if (handler) handler.receive(req, res);
                else {
                    return callback(null, defaultval);
                }
            },
            /**
             * FC 4 Read input status
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getInputRegister: function (addr, unitID, callback) {
                apiMethods._apiHandler(addr, 'getInputRegister', unitID, callback, 0);
            },
            /**
             * FC 3 Read holding registers
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getHoldingRegister: function (addr, unitID, callback) {
                apiMethods._apiHandler(addr, 'getHoldingRegister', unitID, callback, 0);
            },
            /**
             * FC 2 Read discrete inputs
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getDiscreteInput: function (addr, unitID, callback) {
                apiMethods._apiHandler(addr, 'getDiscreteInput', unitID, callback, false);
            },
            /**
             * FC 1 Read coil status
             * @param {number} addr hex/Numerical address of a register
             * @param {number} unitID filter for a specific unit/server
             * @param {function} callback function to delegate result control
             */
            getCoil: function (addr, unitID, callback) {
                apiMethods._apiHandler(addr, 'getCoil', unitID, callback, false);
            }
        };
        try {
            node.modbusServerTCP = new ModbusRTU.ServerTCP(apiMethods, node.options);
            node.modbusServerTCP.on('socketError', err => {
                node.error(err);
            });
            node.modbusServerTCP.on('error', err => {
                node.error(err);
            });
            if (RED.settings.verbose) {
                node.warn(`Modbus TCP Server listening on ${node.options.host}:${node.options.port}.`);
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
