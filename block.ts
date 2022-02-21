const CryptoJS = require('crypto-js');

// 定义区块Block
class Block {
  public index: number;
  public hash: string;
  public previousHash: string | null;
  public timestamp: number;
  public data: string;

  constructor(
    index: number,
    hash: string,
    previousHash: string | null,
    timestamp: number,
    data: string
  ) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }

  // 计算区块的hash值
  static calculateHash(
    index: number,
    previousHash: string | null,
    timestamp: number,
    data: string
  ) {
    previousHash = previousHash || '';
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
  }

  static calculateHashForBlock(block: Block): string {
    return Block.calculateHash(
      block.index,
      block.previousHash,
      block.timestamp,
      block.data
    );
  }
}

class Blockchain {
  private chain: Block[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock(): Block {
    return new Block(
      0,
      Block.calculateHash(0, null, 1645424669, 'My Genesis Block'),
      null,
      1645424669,
      'My Genesis Block'
    );
  }

  // 取得最新的区块
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  // 获取完整区块链
  getBlockchain = (): Block[] => {
    return this.chain;
  };

  // 生成新的区块
  generateNextBlock = (blockData: string): Block => {
    const previousBlock: Block = this.getLatestBlock();
    const nextIndex: number = previousBlock.index + 1;
    const nextTimestamp: number = new Date().getTime() / 1000;
    const nextHash: string = Block.calculateHash(
      nextIndex,
      previousBlock.hash,
      nextTimestamp,
      blockData
    );
    return new Block(
      nextIndex,
      nextHash,
      previousBlock.hash,
      nextTimestamp,
      blockData
    );
  };

  /**
   * 选择最长的链
   * 不同的节点可能会生成同样index的区块，但他们的内容不同，此时需要解决冲突
   * 解决冲突的原则是，选择最长的链进行合并
   */
  replaceChain = (newBlocks: Block[]) => {
    if (
      Blockchain.isValidChain(newBlocks) &&
      newBlocks.length > this.getBlockchain().length
    ) {
      console.log(
        'Received blockchain is valid. Replacing current blockchain with received blockchain'
      );
      this.chain = newBlocks;
      // broadcastLatest();
    } else {
      console.log('Received blockchain invalid');
    }
  };

  /**
   * 验证区块。一个被验证的区块必须满足以下3个条件
   * 1. 当前区块的index等于上一个区块的index + 1
   * 2. 当前区块的previousHash等于上一个区块的hash
   * 3. 当前区块的hash值本身需要被验证
   */
  static isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
    const calculatedHash: string = Block.calculateHashForBlock(newBlock);

    if (previousBlock.index + 1 !== newBlock.index) {
      console.log('invalid index');
      return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
      console.log('invalid previoushash');
      return false;
    } else if (calculatedHash !== newBlock.hash) {
      console.log('invalid hash: ' + calculatedHash + ' ' + newBlock.hash);
      return false;
    }

    return true;
  };

  // 验证区块的结构
  static isValidBlockStructure = (block: Block): boolean => {
    return (
      typeof block.index === 'number' &&
      typeof block.hash === 'string' &&
      typeof block.previousHash === 'string' &&
      typeof block.timestamp === 'number' &&
      typeof block.data === 'string'
    );
  };

  // 验证完整的区块链
  static isValidChain = (blockchainToValidate: Block[]): boolean => {
    // 验证区块链中的每个区块
    for (let i = 1; i < blockchainToValidate.length; i++) {
      const block: Block = blockchainToValidate[i];
      const previousBlock: Block = blockchainToValidate[i - 1];
      if (!this.isValidNewBlock(block, previousBlock)) {
        return false;
      }
    }
    return true;
  };
}

module.exports = Blockchain;