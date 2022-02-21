"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocket = exports.initP2PServer = exports.boardcastLatest = exports.connectToPeers = void 0;
const ws_1 = __importDefault(require("ws"));
const block_1 = require("./block");
// 链接列表
const sockets = [];
var MessageType;
(function (MessageType) {
    MessageType[MessageType["QUERY_LATEST"] = 0] = "QUERY_LATEST";
    MessageType[MessageType["QUERY_ALL"] = 1] = "QUERY_ALL";
    MessageType[MessageType["RESPONSE_BLOCKCHAIN"] = 2] = "RESPONSE_BLOCKCHAIN";
})(MessageType || (MessageType = {}));
// 初始化链接
const initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};
// 初始化错误处理
const initErrorHandler = (ws) => {
    const closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};
// 初始化消息发送
const initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message === null) {
            console.log('could not parse received JSON message');
            return;
        }
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            // 返回最新的区块
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            // 返回区块链
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            // 接收区块链
            case MessageType.RESPONSE_BLOCKCHAIN:
                const receivedBlocks = JSON.parse(message.data);
                handleBlockchainResponse(receivedBlocks);
                break;
        }
    });
};
// 发送消息
const write = (ws, message) => ws.send(JSON.stringify(message));
// 广播消息
const broadcast = (message) => sockets.forEach((socket) => write(socket, message));
const queryChainLengthMsg = () => ({
    type: MessageType.QUERY_LATEST,
    data: null,
});
const queryAllMsg = () => ({
    type: MessageType.QUERY_ALL,
    data: null,
});
// 返回最新区块
const responseLatestMsg = () => ({
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify([block_1.blockchian.getLatestBlock()]),
});
// 返回整个区块链
const responseChainMsg = () => ({
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify(block_1.blockchian.getBlockchain()),
});
const handleBlockchainResponse = (receivedBlocks) => {
    // 如果接受的区块链为空，则返回
    if (receivedBlocks.length === 0) {
        console.log('received block chain size of 0');
        return;
    }
    // 取得接受的区块链的最新区块
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    // 验证最新区块
    if (!block_1.Blockchain.isValidChain(receivedBlocks)) {
        console.log('blockchain invalid');
        return;
    }
    console.log('blockchain valid');
    const latestBlockHeld = block_1.blockchian.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        // 如果最新区块的高度大于当前链的高度，则替换当前链
        if (block_1.blockchian.getLatestBlock().hash === latestBlockReceived.previousHash) {
            if (block_1.blockchian.addBlock(latestBlockReceived)) {
                broadcast(responseLatestMsg());
            }
        }
        else if (receivedBlocks.length === 1) {
            console.log('We have to query the chain from our peer');
            broadcast(queryAllMsg());
        }
        else {
            console.log('Received blockchain is longer than current blockchain');
            block_1.blockchian.replaceChain(receivedBlocks);
        }
    }
    else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};
// 初始化服务器
const initP2PServer = (p2pPort) => {
    const server = new ws_1.default.Server({ port: p2pPort });
    server.on('connection', (ws) => {
        initConnection(ws);
    });
    console.log('listening websocket p2p port on: ' + p2pPort);
};
exports.initP2PServer = initP2PServer;
// 链接到其他节点
const connectToPeers = (newPeer) => {
    const ws = new ws_1.default(newPeer);
    ws.on('open', () => initConnection(ws));
    ws.on('error', () => {
        console.log('connection failed');
    });
};
exports.connectToPeers = connectToPeers;
// 广播最新消息
const boardcastLatest = () => {
    broadcast(responseLatestMsg());
};
exports.boardcastLatest = boardcastLatest;
// 获得链接列表
const getSocket = () => sockets;
exports.getSocket = getSocket;
