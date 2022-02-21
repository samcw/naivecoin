import { NodeServer } from './node';
import { initP2PServer } from './p2p';
import { program } from 'commander';

program.option('-httpPort <port>').option('-p2pPort <port>');

program.parse();

const options = program.opts();
console.log(options);

const nodeServer = new NodeServer();

const httpPort: number = parseInt(options.HttpPort) ?? 3001;
const p2pPort: number = parseInt(options.P2pPort) ?? 6001;

nodeServer.initHttpServer(httpPort);
initP2PServer(p2pPort);
