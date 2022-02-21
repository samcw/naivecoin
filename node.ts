import { Request, Response } from "express";
import express from 'express';
import bodyParser from 'body-parser';
import { blockchian, Block } from './block';

export class NodeServer {
  /**
   * 节点服务器可以实现一下基本功能：
   * 1. 获得完整区块链
   * 2. 创建新的区块
   * 3. 获得完整peers列表，并且添加新的peer
   * @param httpPort number
   */
  initHttpServer(httpPort: number) {
    const app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req: Request, res: Response) => {
      res.send(blockchian.getBlockchain());
    });
    app.get('/mineBlock', (req: Request, res: Response) => {
      const newBlock: Block = blockchian.generateNextBlock(req.body.data);
      res.send(newBlock);
    });
    app.get('/peers', (req: Request, res: Response) => {
      res.send();
    });
    app.get('/addPeer', (req: Request, res: Response) => {
      res.send();
    });

    app.listen(httpPort, () => {
      console.log(`Listening http port on ${httpPort}`);
    });
  }
}