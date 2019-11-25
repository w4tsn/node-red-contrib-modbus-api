const should = require('should');
const helper = require('node-red-node-test-helper');
const modbusIn = require('../src/nodes/modbusIn');
const modbusServer = require('../src/nodes/modbusServer');
const ModbusRTU = require('modbus-serial');

helper.init(require.resolve('node-red'));
const testFlow = [
    {
        'id': 'modbusserver',
        'type': 'modbus server',
        'name': 'modbus test server',
        'port': 8502
    },
    {
        'id': 'modbusin',
        'type': 'modbus in',
        'name': '[getCoil:0x0] modbus in',
        'command': 'getCoil',
        'register': 0x0,
        'modbusServer': 'modbusserver',
        'wires': [
            [
                'helper-node'
            ]
        ]
    },
    {
        'id': 'modbusin_getInputRegister',
        'type': 'modbus in',
        'command': 'getInputRegister',
        'register': 0x0,
        'modbusServer': 'modbusserver',
        'wires': [
            [
                'helper-node'
            ]
        ]
    },
    {
        'id': 'modbusin_getHoldingRegister',
        'type': 'modbus in',
        'command': 'getHoldingRegister',
        'register': 0x0,
        'modbusServer': 'modbusserver',
        'wires': [
            [
                'helper-node'
            ]
        ]
    },
    {
        'id': 'modbusin_getDiscreteInput',
        'type': 'modbus in',
        'command': 'getDiscreteInput',
        'register': 0x0,
        'modbusServer': 'modbusserver',
        'wires': [
            [
                'helper-node'
            ]
        ]
    },
    {
        'id': 'helper-node',
        'type': 'helper',
        'inputs': 1,
        'noerr': 0
    }
];
const nodesUnderTest = [
    modbusIn,
    modbusServer
];

// ModbusRTU client
let client = null;

describe('modbus in node', function () {

    beforeEach((done) => {
        client = new ModbusRTU();
        helper.startServer(done);
    });

    afterEach((done) => {
        client.close(() => {
            helper.unload();
            helper.stopServer(done);
        });
    });

    it('should be loaded', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let modbusInNode = helper.getNode('modbusin');
            modbusInNode.should.have.property('name', '[getCoil:0x0] modbus in');
            modbusInNode.should.have.property('register', 0x0);
            modbusInNode.should.have.property('command', 'getCoil');
            modbusInNode.should.have.property('modbusServer').which.is.a.Object();
            done();
        });
    });

    it('should register defaults at modbusServerNode', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            let modbusInNode = helper.getNode('modbusin');
            should.exist(modbusServerNode.routes);
            should.exist(modbusServerNode.routes.get('getCoil.0'));
            let route = modbusServerNode.routes.get('getCoil.0');
            route.receive.should.be.equal(modbusInNode.callback);
            route.errorHandler.should.be.equal(modbusInNode.errorHandler);
            done();
        });
    });

    it('should remove route on close', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let modbusServerNode = helper.getNode('modbusserver');
            let modbusInNode = helper.getNode('modbusin');
            modbusInNode.close();
            should.not.exist(modbusServerNode.routes.get('getCoil.0'));
            done();
        });
    });

    it('should output a sane modbus input message (FC1)', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let helperNode = helper.getNode('helper-node');
            let test = function () {
                client.setID(1);
                client.readCoils(0, 10).catch(err => {
                    should.not.exist(err);
                    done();
                });
            };
            helperNode.on('input', (msg) => {
                should.exist(msg);
                should.exist(msg._msgid);
                msg.should.have.property('req');
                msg.req.should.have.property('register', 0);
                msg.req.should.have.property('unitID', 1);
                msg.req.should.have.property('command', 'getCoil');
                msg.should.have.property('res');
                msg.res.should.have.property('callback');
                done();
            });
            client.connectTCP('127.0.0.1', { port: 8502 }, test);
        });
    });

    it('should output a sane modbus input message (FC2)', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let helperNode = helper.getNode('helper-node');
            let test = function () {
                client.setID(1);
                client.readDiscreteInputs(0, 10).catch(err => {
                    should.not.exist(err);
                    done();
                });
            };
            helperNode.on('input', (msg) => {
                should.exist(msg);
                msg.should.have.property('req');
                msg.req.should.have.property('command', 'getDiscreteInput');
                done();
            });
            client.connectTCP('127.0.0.1', { port: 8502 }, test);
        });
    });

    it('should output a sane modbus input message (FC3)', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let helperNode = helper.getNode('helper-node');
            let test = function () {
                client.setID(1);
                client.readHoldingRegisters(0, 10).catch(err => {
                    should.not.exist(err);
                    done();
                });
            };
            helperNode.on('input', (msg) => {
                should.exist(msg);
                msg.should.have.property('req');
                msg.req.should.have.property('command', 'getHoldingRegister');
                done();
            });
            client.connectTCP('127.0.0.1', { port: 8502 }, test);
        });
    });

    it('should output a sane modbus input message (FC4)', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let helperNode = helper.getNode('helper-node');
            let test = function () {
                client.setID(1);
                client.readInputRegisters(0, 10).catch(err => {
                    should.not.exist(err);
                    done();
                });
            };
            helperNode.on('input', (msg) => {
                should.exist(msg);
                should.exist(msg._msgid);
                msg.should.have.property('req');
                msg.req.should.have.property('register', 0);
                msg.req.should.have.property('unitID', 1);
                msg.req.should.have.property('command', 'getInputRegister');
                msg.should.have.property('res');
                msg.res.should.have.property('callback');
                done();
            });
            client.connectTCP('127.0.0.1', { port: 8502 }, test);
        });
    });
});
