# node-red-contrib-modbus-api

Create your own modbus-server graphically in node-red as you would create an http API. Configure `modbus-in` nodes for every possible address you want to supply, gather and prepare a response in the flow and conclude with a `modbus-out` node to transmit the respose back to the client.

A request consists of a `modbus register` and a `modbus function code (FC)`

## Installation

To install run

```bash
npm install node-red-contrib-modbus-api --production
```

Omit the `--production` flag, in order to install the development dependencies for testing and coverage.

This node depends on `modbus-serial` as the main package and will install it along with it.

## Usage

After a first `modbus in` node is placed a `modbus server` has to be created and assigned to it. This server will be the source for the node of any requests a client will send to the bound address and port.

The `modbus in` node will then spawn messages on it's node output whenever a request on the `modbus server` matches the configured register, command and unitID of the `modbus in` node.

Within the flow you may retrieve any data from within node-red. Be aware, that the default timeout for some of the modbus clients is gracefully chosen to be around 2000ms. In most cases this may be much shorter, so pay attantion to the round-trip time of you messages and request handling.

After you placed some data into the `payload` of your flows message you may send it to a `modbus out` node. Currently this node just takes care of validating the input message and invokes the modbus response. In future versions of this node it may be possible to also specify modbus response propertie like error or exception codes.

## Details of Implementation

For a detailed overview of the modbus protocol see [the modbus specification document (v1_1b3)](http://www.modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf).

Currently only read functions are implemented. Specifically those are:

* FC 1 Read Input Register
* FC 2 Read Descrete Value
* FC 3 Read Holding Register
* FC 4 Read Coil

This is also coupled to the implementation status of the [modbus-serial package](https://www.npmjs.com/package/modbus-serial).

### Modbus Responses and Exceptions

There are basic exceptions provided by the `node-modbus-serial` package. Currently there are no exceptions provided on the request/response scope like 0x01, 0x02, 0x3 for situations like unimplemented/unprovided registers or invalid data.

### Request size

Currently it is not possible to request more than 128 registers at a time. This will cause node-red to crash. I'm on it to implement a fix in the underlying library. It will not be possible to request more than that though.

## Contribution

To setup your local development environment first clone this repository and then use docker to get your node-red environment up and running like this:

```bash
sudo docker run -p 1880:1880 -v $PWD:/tmp/node-red-contrib-modbus-api:Z -d --name nodered nodered/node-red-docker
```

After you saved your changes to the code update the installation within the container with this command:

```bash
sudo docker exec -it nodered npm install /tmp/node-red-contrib-modbus-api/ && sudo docker restart nodered
```

*Note on `--privileged` and `-u root`*: This could be required on linux machines with SELinux to avoid permission errors. Keep in mind that this is insecure and considered real bad practice. Alternativly configure your SELinux to allow access from the container to the local mounted volume in order to install the npm dependencies. This should be avoidable with the `:Z` flag behind volume definition.

### Testing and Coverage-Report

First `npm install` for the dev dependencies. Tests, linting and code coverage are then available through:

```bash
npm test
npm run coverage
npm run lint
```

## License

The BSD 3-Clause License

[Alexander Wellbrock](https://w4tsn.github.io/blog)

## Roadmap

* Implementation of write functions
* Automatically create a modbus server if there is none
* Hook into the `modbus-serial` debug function and get it out to node-red
* Implement modbus exceptions for the `modbus out` node
