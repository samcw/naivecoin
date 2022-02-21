"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
const nodeServer = new node_1.NodeServer();
nodeServer.initHttpServer(3000);
