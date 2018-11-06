const should = require('should');
const helper = require('node-red-node-test-helper');
const modbusServer = require('../src/nodes/modbusServer');
const ModbusRTU = require('modbus-serial');
let client = new ModbusRTU();

helper.init(require.resolve('node-red'));

let receiveFactory = function (client, values = 10, errCallback, done) {
    return function receive () {
        client.setID(1);
        let readInputsPromise = client.readInputRegisters(0, values).then(data => {
            should.exist(data);
            data.should.have.property('data');
            data.should.have.property('buffer');
            should(data.buffer instanceof Buffer).equal(true);
        }).catch(err => {
            errCallback(err);
        });
        let readHoldingsPromise = client.readHoldingRegisters(0, values).then(data => {
            should.exist(data);
            data.should.have.property('data');
            data.should.have.property('buffer');
            should(data.buffer instanceof Buffer).equal(true);
        }).catch(err => {
            errCallback(err);
        });
        let readCoilsPromise = client.readCoils(0, values).then(data => {
            should.exist(data);
            data.should.have.property('data');
            data.should.have.property('buffer');
            should(data.data instanceof Array).equal(true);
            should(data.buffer instanceof Buffer).equal(true);
        }).catch(err => {
            errCallback(err);
        });
        let readDiscreteInputPromise = client.readDiscreteInputs(0, values).then(data => {
            should.exist(data);
            data.should.have.property('data');
            data.should.have.property('buffer');
            should(data.buffer instanceof Buffer).equal(true);
        }).catch(err => {
            errCallback(err);
        });
        Promise.all([
            readInputsPromise,
            readHoldingsPromise,
            readCoilsPromise,
            readDiscreteInputPromise
        ]).then(() => done());
    };
};

describe('modbus server node', function () {

    afterEach(() => {
        client.close();
        helper.unload();
        should();
    });

    it('should be loaded', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            modbusServerNode.should.have.property('name', 'modbus test server');
            modbusServerNode.should.have.property('options').which.is.a.Object();
            modbusServerNode.should.have.property('modbusServerTCP').which.is.a.Object();
            done();
        });
    });

    it('should be accessible through client', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            client.connectTCP('127.0.0.1', { port: 8502 }, receiveFactory(client, 11, err => {
                should.not.exist(err);
            }, done));
        });
    });

    it('should register a route for getCoil (FC1)', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            should.exist(modbusServerNode.routes);
            let handler = modbusServerNode.getRoute(0x0, 'getCoil');
            should.not.exist(handler);
            modbusServerNode.getCoil(0x0, (addr, callback) => {
                callback(null, (addr % 2) === 0);
            }, error => {
                should.not.exist(error);
            });
            handler = modbusServerNode.getRoute(0x0, 'getCoil');
            should.exist(handler);
            done();
        });
    });

    it('should register a route for getDiscreteInput (FC2)', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            should.exist(modbusServerNode.routes);
            let handler = modbusServerNode.getRoute(0x0, 'getDiscreteInput');
            should.not.exist(handler);
            modbusServerNode.getDiscreteInput(0x0, (addr, callback) => {
                callback(null, (addr % 2) === 0);
            }, error => {
                should.not.exist(error);
            });
            handler = modbusServerNode.getRoute(0x0, 'getDiscreteInput');
            should.exist(handler);
            done();
        });
    });

    it('should register a route for getHoldingRegister (FC3)', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            should.exist(modbusServerNode.routes);
            let handler = modbusServerNode.getRoute(0x0, 'getHoldingRegister');
            should.not.exist(handler);
            modbusServerNode.getHoldingRegister(0x0, (addr, callback) => {
                callback(null, addr + 2);
            }, error => {
                should.not.exist(error);
            });
            handler = modbusServerNode.getRoute(0x0, 'getHoldingRegister');
            should.exist(handler);
            done();
        });
    });

    it('should register a route for getInputRegister (FC4)', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            should.exist(modbusServerNode.routes);
            let handler = modbusServerNode.getRoute(0x0, 'getInputRegister');
            should.not.exist(handler);
            modbusServerNode.getInputRegister(0x0, (addr, callback) => {
                callback(null, addr + 2);
            }, error => {
                should.not.exist(error);
            });
            handler = modbusServerNode.getRoute(0x0, 'getInputRegister');
            should.exist(handler);
            done();
        });
    });

    it('should deregister a route correctly', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            should.exist(modbusServerNode.routes);
            let handler = modbusServerNode.getRoute(0x0, 'getInputRegister');
            should.not.exist(handler);
            modbusServerNode.getInputRegister(0x0, (addr, callback) => {
                callback(null, addr + 2);
            }, error => {
                should.not.exist(error);
            });
            handler = modbusServerNode.getRoute(0x0, 'getInputRegister');
            should.exist(handler);
            modbusServerNode.removeRoute(0x0, 'getInputRegister');
            handler = modbusServerNode.getRoute(0x0, 'getInputRegister');
            should.not.exist(handler);
            done();
        });
    });

    it('should call the errorHandler if a register/command is already in use by another node.', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            should.exist(modbusServerNode.routes);
            let handler = modbusServerNode.getRoute(0x0, 'getInputRegister');
            should.not.exist(handler);
            modbusServerNode.getInputRegister(0x0, (addr, callback) => {
                callback(null, addr + 2);
            }, error => {
                should.not.exist(error);
            });
            handler = modbusServerNode.getRoute(0x0, 'getInputRegister');
            should.exist(handler);
            modbusServerNode.getInputRegister(0x0, (addr, callback) => {
                callback(null, addr + 2);
            }, error => {
                should.exist(error);
            });
            done();
        });
    });

    it('should handle a huge request', function (done) {
        let flow = [{
            id: 'modbusserver',
            type: 'modbus server',
            name: 'modbus test server',
            port: 8502
        }];
        helper.load(modbusServer, flow, () => {
            // should be 200 requested registers, but this causes a uncaught out of bounds
            // exception within modbus-serial package.
            client.connectTCP('127.0.0.1', { port: 8502 }, receiveFactory(client, 100, err => {
                should.exist(err);
            }, done));
        });
    });

});