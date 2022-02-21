"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./block');
const blockchian = new Blockchain();
class NodeServer {
    /**
     * 节点服务器可以实现一下基本功能：
     * 1. 获得完整区块链
     * 2. 创建新的区块
     * 3. 获得完整peers列表，并且添加新的peer
     * @param httpPort number
     */
    initHttpServer(httpPort) {
        const app = express();
        app.use(bodyParser.json());
        app.get('/blocks', (req, res) => {
            res.send(blockchian.getBlockchain());
        });
        app.get('/mineBlock', (req, res) => {
            const newBlock = blockchian.generateNextBlock(req.body.data);
            res.send(newBlock);
        });
        app.get('/peers', (req, res) => {
            res.send();
        });
        app.get('/addPeer', (req, res) => {
            res.send();
        });
        app.listen(httpPort, () => {
            console.log(`Listening http port on ${httpPort}`);
        });
    }
}
module.exports = NodeServer;
