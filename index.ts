import { NodeServer } from './node';

const nodeServer = new NodeServer();

nodeServer.initHttpServer(3000);