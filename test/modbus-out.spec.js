const should = require('should');
const helper = require('node-red-node-test-helper');
const modbusOut = require('../src/nodes/modbusOut');
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
        'id': 'modbusin2',
        'type': 'modbus in',
        'name': '[getCoil:0x1] modbus in',
        'command': 'getCoil',
        'register': 0x1,
        'modbusServer': 'modbusserver',
        'wires': [
            [
                'helper-node'
            ]
        ]
    },

    {
        'id': 'modbusin3',
        'type': 'modbus in',
        'name': '[getInputRegister:0x0] modbus in',
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
        'id': 'modbusin4',
        'type': 'modbus in',
        'name': '[getInputRegister:0x1] modbus in',
        'command': 'getInputRegister',
        'register': 0x1,
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
        'outputs': 1,
        'noerr': 0,
        'wires': [
            [
                'modbusout'
            ]
        ]
    },
    {
        'id': 'modbusout',
        'type': 'modbus out',
        'name': 'modbus out test'
    }
];
const nodesUnderTest = [
    modbusOut,
    modbusIn,
    modbusServer
];

// ModbusRTU client
let client = new ModbusRTU();
const options = { port: 8502 };
let clientOpen = false;

describe('modbus out node', function () {

    beforeEach((done) => {
        clientOpen = false;
        helper.startServer(done);
    });

    afterEach((done) => {
        if (clientOpen) {
            client.close(() => {
                helper.unload();
                helper.stopServer(done);
            });
        } else {
            helper.unload();
            helper.stopServer(done);
        }
    });

    it('should be loaded', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let modbusOutNode = helper.getNode('modbusout');
            modbusOutNode.should.have.property('name', 'modbus out test');
            done();
        });
    });

    it('should answer a modbus request successfully', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let helperNode = helper.getNode('helper-node');
            let test = function () {
                clientOpen = true;
                client.setID(1);
                client.readCoils(0, 2).then(data => {
                    should.exist(data);
                    data.should.have.property('data');
                    data.should.have.property('buffer');
                    should(data.data instanceof Array).equal(true);
                    should(data.buffer instanceof Buffer).equal(true);
                    data.data[0].should.be.equal(false);
                    data.data[1].should.be.equal(true);
                    let logEvents = helper.log().args.filter(evt => {
                        return evt[0].type === 'modbus out';
                    });
                    logEvents.should.be.empty();
                    done();
                }).catch(err => {
                    should.not.exist(err);
                    done();
                });
            };
            helperNode.on('input', (msg) => {
                // Populate some data to write back to the client
                if ( msg.req.register === 1) {
                    msg.payload = true;
                }
                else {
                    msg.payload = false;
                }
                helperNode.send(msg);
            });
            client.connectTCP('127.0.0.1', options, test);
        });
    });

    it('should reject malformed input messages and log error messages', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let modbusOutNode = helper.getNode('modbusout');
            modbusOutNode.receive({});
            modbusOutNode.receive({ res: {} });
            modbusOutNode.receive({ res: { callback: () => true }});
            modbusOutNode.receive({ payload: {} });
            setTimeout(() => {
                let logEvents = helper.log().args.filter(evt => {
                    return evt[0].type === 'modbus out';
                });
                logEvents.should.not.be.empty();
                logEvents.should.have.length(3);
                done();
            }, 20);
        });
    });

    it('should answer a modbus request successfully (with negative response)', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let helperNode = helper.getNode('helper-node');
            let test = function () {
                clientOpen = true;
                client.setID(1);
                client.readInputRegisters(0, 2).then(data => {
                    should.exist(data);
                    data.data[0].should.be.equal(0);
                    data.data[1].should.be.equal(200);
                    let logEvents = helper.log().args.filter(evt => {
                        return evt[0].type === 'modbus out' && evt[0].msg === 'Payload invalid! Provided payload is negative!';
                    });
                    logEvents.should.not.be.empty();
                    logEvents.should.have.length(1);
                    done();
                }).catch(err => {
                    should.not.exist(err);
                    done();
                });
            };
            helperNode.on('input', (msg) => {
                // Populate some data to write back to the client
                if ( msg.req.register === 1) {
                    msg.payload = 200;
                }
                else {
                    msg.payload = -1;
                }
                helperNode.send(msg);
            });
            client.connectTCP('127.0.0.1', options, test);
        });
    });
});
