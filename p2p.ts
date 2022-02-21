import WebSocket from 'ws';
import { Server } from 'ws';
import { Block, Blockchain, blockchian } from './block';

// 链接列表
const sockets: WebSocket[] = [];

enum MessageType {
  QUERY_LATEST = 0,
  QUERY_ALL = 1,
  RESPONSE_BLOCKCHAIN = 2,
}

interface Message {
  type: MessageType;
  data: any;
}

// 初始化链接
const initConnection = (ws: WebSocket) => {
  sockets.push(ws);
  initMessageHandler(ws);
  initErrorHandler(ws);
  write(ws, queryChainLengthMsg());
};

// 初始化错误处理
const initErrorHandler = (ws: WebSocket) => {
  const closeConnection = (ws: WebSocket) => {
    console.log('connection failed to peer: ' + ws.url);
    sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on('close', () => closeConnection(ws));
  ws.on('error', () => closeConnection(ws));
};

// 初始化消息发送
const initMessageHandler = (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    const message: Message = JSON.parse(data);
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
        const receivedBlocks: Block[] = JSON.parse(message.data);
        handleBlockchainResponse(receivedBlocks);
        break;
    }
  });
};

// 发送消息
const write = (ws: WebSocket, message: Message) =>
  ws.send(JSON.stringify(message));

// 广播消息
const broadcast = (message: Message) =>
  sockets.forEach((socket) => write(socket, message));

const queryChainLengthMsg = (): Message => ({
  type: MessageType.QUERY_LATEST,
  data: null,
});

const queryAllMsg = (): Message => ({
  type: MessageType.QUERY_ALL,
  data: null,
});

// 返回最新区块
const responseLatestMsg = (): Message => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: JSON.stringify([blockchian.getLatestBlock()]),
});

// 返回整个区块链
const responseChainMsg = (): Message => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: JSON.stringify(blockchian.getBlockchain()),
});

const handleBlockchainResponse = (receivedBlocks: Block[]) => {
  // 如果接受的区块链为空，则返回
  if (receivedBlocks.length === 0) {
    console.log('received block chain size of 0');
    return;
  }
  // 取得接受的区块链的最新区块
  const latestBlockReceived: Block = receivedBlocks[receivedBlocks.length - 1];
  // 验证最新区块
  if (!Blockchain.isValidChain(receivedBlocks)) {
    console.log('blockchain invalid');
    return;
  }
  console.log('blockchain valid');
  const latestBlockHeld: Block = blockchian.getLatestBlock();
  if (latestBlockReceived.index > latestBlockHeld.index) {
    console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
    // 如果最新区块的高度大于当前链的高度，则替换当前链
    if (blockchian.getLatestBlock().hash === latestBlockReceived.previousHash) {
      if (blockchian.addBlock(latestBlockReceived)) {
        broadcast(responseLatestMsg());
      }
    } else if (receivedBlocks.length === 1) {
      console.log('We have to query the chain from our peer');
      broadcast(queryAllMsg());
    } else {
      console.log('Received blockchain is longer than current blockchain');
      blockchian.replaceChain(receivedBlocks);
    }
  } else {
    console.log('received blockchain is not longer than received blockchain. Do nothing');
  }
};

// 初始化服务器
const initP2PServer = (p2pPort: number) => {
  const server: Server = new WebSocket.Server({ port: p2pPort });
  server.on('connection', (ws: WebSocket) => {
    initConnection(ws);
  });
  console.log('listening websocket p2p port on: ' + p2pPort);
};

// 链接到其他节点
const connectToPeers = (newPeer: string): void => {
  const ws: WebSocket = new WebSocket(newPeer);
  ws.on('open', () => initConnection(ws));
  ws.on('error', () => {
    console.log('connection failed');
  });
};

// 广播最新消息
const boardcastLatest = (): void => {
  broadcast(responseLatestMsg());
};

// 获得链接列表
const getSocket = () => sockets;

export { connectToPeers, boardcastLatest, initP2PServer, getSocket };
