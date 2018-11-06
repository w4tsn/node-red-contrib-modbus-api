const should = require('should');
const helper = require('node-red-node-test-helper');
const modbusOut = require('../src/nodes/modbusOut');
const modbusIn = require('../src/nodes/modbusIn');
const modbusServer = require('../src/nodes/modbusServer');
const ModbusRTU = require('modbus-serial');
let client = new ModbusRTU();

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

describe('modbus out node', function () {

    afterEach(() => {
        client.close();
        helper.unload();
        should();
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
                client.setID(1);
                client.readCoils(0, 10).then(data => {
                    should.exist(data);
                    data.should.have.property('data');
                    data.should.have.property('buffer');
                    should(data.data instanceof Array).equal(true);
                    should(data.buffer instanceof Buffer).equal(true);
                    data.data[0].should.be.equal(true);
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
                msg.payload = true;
                helperNode.send(msg);
            });
            client.connectTCP('127.0.0.1', { port: 8502 }, test);
        });
    });

    it('should reject malformed input messages and log error messages', function (done) {
        helper.load(nodesUnderTest, testFlow, () => {
            let helperNode = helper.getNode('helper-node');
            let test = function () {
                client.setID(1);
                client.readCoils(0, 10).catch(err => {
                    should.not.exist(err);
                });
            };
            helperNode.on('input', (msg) => {
                // Populate some data to write back to the client
                msg = {};
                helperNode.send(msg);
            });
            client.connectTCP('127.0.0.1', { port: 8502 }, test);
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

});
