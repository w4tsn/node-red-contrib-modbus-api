modbusIn = require('nodes/modbusIn');
modbusOut = require('nodes/modbusOut');
modbusServer = require('nodes/modbusServer');

module.exports = function (RED) {
    RED.nodes.registerType('modbus server', modbusServer.modbusServerNode);
    RED.nodes.registerType('modbus out', modbusOut.modbusOutNode);
    RED.nodes.registerType('modbus in', modbusIn.modbusInNode);
};
