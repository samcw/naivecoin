const NodeServer = require('./node');

const nodeServer = new NodeServer();

nodeServer.initHttpServer(3000);