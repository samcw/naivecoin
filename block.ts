const CryptoJS = require('crypto-js');
const hexToBinary = require('hex-to-binary');

// 定义区块Block
export class Block {
  public index: number;
  public hash: string;
  public previousHash: string | null;
  public timestamp: number;
  public data: string;
  public difficulty: number;
  public nonce: number;

  constructor(
    index: number,
    hash: string,
    previousHash: string | null,
    timestamp: number,
    data: string,
    difficulty: number,
    nonce: number
  ) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }

  // 计算区块的hash值
  static calculateHash(
    index: number,
    previousHash: string | null,
    timestamp: number,
    data: string,
    difficulty: number,
    nonce: number
  ) {
    previousHash = previousHash || '';
    return CryptoJS.SHA256(
      index + previousHash + timestamp + data + difficulty + nonce
    ).toString();
  }

  static calculateHashForBlock(block: Block): string {
    return Block.calculateHash(
      block.index,
      block.previousHash,
      block.timestamp,
      block.data,
      block.difficulty,
      block.nonce
    );
  }
}

export class Blockchain {
  private chain: Block[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock(): Block {
    return new Block(
      0,
      Block.calculateHash(0, null, 1645424669, 'My Genesis Block', 0, 0),
      null,
      1645424669,
      'My Genesis Block',
      0,
      0
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
    const difficulty: number = Blockchain.getDifficulty(this.chain);

    const newBlock: Block = Blockchain.findBlock(
      nextIndex,
      previousBlock.hash,
      nextTimestamp,
      blockData,
      difficulty
    );
    this.addBlock(newBlock);

    return newBlock;
  };

  // 向区块链中添加区块
  addBlock = (newBlock: Block): boolean => {
    if (Blockchain.isValidNewBlock(newBlock, this.getLatestBlock())) {
      this.chain.push(newBlock);
      return true;
    }
    return false;
  };

  /**
   * 选择生成代价最大的区块
   * 不同的节点可能会生成同样index的区块，但他们的内容不同，此时需要解决冲突
   * 解决冲突的原则是将计算当前链每个区块的2^difficulty并进行累加
   * difficulty值非常重要，矿工在选择将资源分配给哪条区块链时会考虑，由于涉及矿工的利益，最终选使得他们选择同一条链
   */
  replaceChain = (newBlocks: Block[]) => {
    if (
      Blockchain.isValidChain(newBlocks) &&
      Blockchain.getAccumulatedDifficulty(newBlocks) >
        Blockchain.getAccumulatedDifficulty(this.chain)
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

  // 计算区块代价
  static getAccumulatedDifficulty(blockchain: Block[]): number {
    return blockchain
      .map((block: Block) => block.difficulty)
      .map((difficulty) => Math.pow(2, difficulty))
      .reduce((a, b) => a + b);
  }

  // 验证区块的结构
  static isValidBlockStructure(block: Block): boolean {
    return (
      typeof block.index === 'number' &&
      typeof block.hash === 'string' &&
      typeof block.previousHash === 'string' &&
      typeof block.timestamp === 'number' &&
      typeof block.data === 'string'
    );
  }

  /**
   * 验证区块。一个被验证的区块必须满足以下3个条件
   * 1. 当前区块的index等于上一个区块的index + 1
   * 2. 当前区块的previousHash等于上一个区块的hash
   * 3. 当前区块的hash值本身需要被验证
   * 4. 区块的结构是否正确
   * 5. 区块的时间戳是否正确
   */
  static isValidNewBlock(newBlock: Block, previousBlock: Block): boolean {
    if (!Blockchain.isValidBlockStructure(newBlock)) {
      console.log('invalid structure');
      return false;
    } else if (previousBlock.index + 1 !== newBlock.index) {
      console.log('invalid index');
      return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
      console.log('invalid previoushash');
      return false;
    } else if (!Blockchain.isValidTimestamp(newBlock, previousBlock)) {
      console.log('invalid timestamp');
      return false;
    } else if (!Blockchain.isValidHash(newBlock)) {
      console.log('invalid hash');
      return false;
    }

    return true;
  }

  // 验证完整的区块链
  static isValidChain(blockchainToValidate: Block[]): boolean {
    // 验证区块链中的每个区块
    for (let i = 1; i < blockchainToValidate.length; i++) {
      const block: Block = blockchainToValidate[i];
      const previousBlock: Block = blockchainToValidate[i - 1];
      if (!this.isValidNewBlock(block, previousBlock)) {
        return false;
      }
    }
    return true;
  }
  /**
   * 验证时间戳
   * 验证规则：
   * 1. 新的时间戳须加1分钟 大于 上一个区块时间戳
   * 2. 新的时间戳须减1分钟 小于 当前时间戳
   */
  static isValidTimestamp(newBlock: Block, previousBlock: Block): boolean {
    return (
      previousBlock.timestamp - 60 < newBlock.timestamp &&
      newBlock.timestamp - 60 < new Date().getTime() / 1000
    );
  }

  // 验证hash
  static isValidHash(block: Block): boolean {
    const blockHash: string = Block.calculateHashForBlock(block);
    if (blockHash !== block.hash) {
      console.log('invalid hash: ' + blockHash);
      return false;
    }

    if (!Blockchain.isMatchesDifficulty(block.hash, block.difficulty)) {
      console.log(
        'block difficulty not satisfied. Expected: ' +
          block.difficulty +
          ' Received: ' +
          block.hash
      );
    }

    return true;
  }

  // 获取调整后的难度
  static getAdjustedDifficulty(
    latestBlock: Block,
    blockchain: Block[]
  ): number {
    const prevAdjustmentBlock: Block =
      blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    // 预期消耗时间
    const timeExpected: number =
      BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    // 实际消耗时间
    const timeTaken: number =
      latestBlock.timestamp - prevAdjustmentBlock.timestamp;

    if (timeTaken < timeExpected / 2) {
      return prevAdjustmentBlock.difficulty + 1;
    } else if (timeTaken > timeExpected * 2) {
      return prevAdjustmentBlock.difficulty - 1;
    } else {
      return prevAdjustmentBlock.difficulty;
    }
  }

  // 获取难度参数
  static getDifficulty(blockchain: Block[]): number {
    const latestBlock: Block = blockchain[blockchain.length - 1];
    if (
      latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
      latestBlock.index !== 0
    ) {
      return Blockchain.getAdjustedDifficulty(latestBlock, blockchain);
    } else {
      return latestBlock.difficulty;
    }
  }

  // 验证hash值是否匹配难度
  static isMatchesDifficulty(hash: string, difficulty: number): boolean {
    const hashInBinary: string = hexToBinary(hash);
    const requiredPrefix: string = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
  }

  // 模拟工作量证明
  static findBlock(
    index: number,
    previousHash: string,
    timestamp: number,
    data: string,
    difficulty: number
  ): Block {
    let nonce = 0;
    while (true) {
      const hash = Block.calculateHash(
        index,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce
      );
      if (Blockchain.isMatchesDifficulty(hash, difficulty)) {
        return new Block(
          index,
          hash,
          previousHash,
          timestamp,
          data,
          difficulty,
          nonce
        );
      }
      nonce++;
    }
  }
}

export const blockchian = new Blockchain();