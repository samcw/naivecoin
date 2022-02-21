"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeServer = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const block_1 = require("./block");
const p2p_1 = require("./p2p");
class NodeServer {
    /**
     * 节点服务器可以实现一下基本功能：
     * 1. 获得完整区块链
     * 2. 创建新的区块
     * 3. 获得完整peers列表，并且添加新的peer
     * @param httpPort number
     */
    initHttpServer(httpPort) {
        const app = (0, express_1.default)();
        app.use(body_parser_1.default.json());
        app.use(body_parser_1.default.urlencoded({ extended: true }));
        app.get('/blocks', (req, res) => {
            res.send(block_1.blockchian.getBlockchain());
        });
        app.post('/mineBlock', (req, res) => {
            console.log(req.body);
            const newBlock = block_1.blockchian.generateNextBlock(req.body.data);
            res.send(newBlock);
        });
        app.get('/peers', (req, res) => {
            res.send((0, p2p_1.getSocket)().map((s) => s._socket.remoteAddress + ':' + s._socket.remotePort));
        });
        app.post('/addPeer', (req, res) => {
            (0, p2p_1.connectToPeers)(req.body.peer);
            res.send();
        });
        app.listen(httpPort, () => {
            console.log(`Listening http port on ${httpPort}`);
        });
    }
}
exports.NodeServer = NodeServer;
