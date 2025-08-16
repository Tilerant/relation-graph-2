// 命令系统类型定义

import type { EntityId, Node, Edge, Block, View, DynamicProperties } from './structure';

// 命令基础接口
export interface Command<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  source: 'user' | 'ai' | 'plugin' | 'workflow' | 'remote';
  id: string;
}

// 命令处理器类型
export type CommandHandler<T = any> = (payload: T) => Promise<CommandResult> | CommandResult;

// 命令执行结果
export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  changes?: EntityChange[];
}

// 实体变更记录（用于撤销/重做）
export interface EntityChange {
  type: 'create' | 'update' | 'delete';
  entityType: 'node' | 'edge' | 'block' | 'view';
  entityId: EntityId;
  before?: any;
  after?: any;
}

// === 节点相关命令 ===
export interface CreateNodePayload {
  title: string;
  entityLabel: string;
  properties?: DynamicProperties;
  viewId: EntityId;
  position?: { x: number; y: number };
}

export interface UpdateNodePayload {
  nodeId: EntityId;
  title?: string;
  properties?: DynamicProperties;
  entityLabel?: string;
  blocks?: Block[];
}

export interface DeleteNodePayload {
  nodeId: EntityId;
}

// === 边相关命令 ===
export interface CreateEdgePayload {
  sourceNodeId: EntityId;
  targetNodeId: EntityId;
  semanticLabel: string;
  properties?: DynamicProperties;
  isHyperEdge?: boolean;
}

export interface UpdateEdgePayload {
  edgeId: EntityId;
  properties?: DynamicProperties;
  semanticLabel?: string;
  blocks?: Block[];
}

export interface DeleteEdgePayload {
  edgeId: EntityId;
}

// === 块相关命令 ===
export interface CreateBlockPayload {
  parentId: EntityId; // 父节点或边的ID
  parentType: 'node' | 'edge';
  type: 'text' | 'image' | 'file' | 'code' | 'table' | 'embed';
  content: any;
  position?: number; // 插入位置
}

export interface UpdateBlockPayload {
  blockId: EntityId;
  content?: any;
  properties?: DynamicProperties;
}

export interface DeleteBlockPayload {
  blockId: EntityId;
}

export interface ReorderBlockPayload {
  blockId: EntityId;
  newPosition: number;
}

// === 视图相关命令 ===
export interface CreateViewPayload {
  name: string;
  type: 'whiteboard' | 'webpage' | 'hybrid';
  query?: string;
  nodeIds?: EntityId[];
  edgeIds?: EntityId[];
}

export interface UpdateViewPayload {
  viewId: EntityId;
  name?: string;
  nodeIds?: EntityId[];
  edgeIds?: EntityId[];
  layout?: any;
}

export interface DeleteViewPayload {
  viewId: EntityId;
}

// === 布局相关命令 ===
export interface UpdateNodePositionPayload {
  viewId: EntityId;
  nodeId: EntityId;
  position: { x: number; y: number };
}

export interface UpdateNodeStylePayload {
  viewId: EntityId;
  nodeId: EntityId;
  style: any;
}

// === 图操作命令 ===
export interface FindShortestPathPayload {
  fromNodeId: EntityId;
  toNodeId: EntityId;
}

export interface FindConnectedComponentsPayload {
  nodeIds?: EntityId[];
}

export interface DetectCyclesPayload {
  nodeIds?: EntityId[];
}

// === AI相关命令 ===
export interface AIGenerateStructurePayload {
  prompt: string;
  contextNodeIds?: EntityId[];
  targetViewId: EntityId;
}

export interface AISuggestConnectionsPayload {
  nodeId: EntityId;
  maxSuggestions?: number;
}

// 预定义命令类型常量
export const COMMANDS = {
  // 节点命令
  CREATE_NODE: 'structure.createNode',
  UPDATE_NODE: 'structure.updateNode',
  DELETE_NODE: 'structure.deleteNode',
  
  // 边命令
  CREATE_EDGE: 'structure.createEdge',
  UPDATE_EDGE: 'structure.updateEdge',
  DELETE_EDGE: 'structure.deleteEdge',
  
  // 块命令
  CREATE_BLOCK: 'structure.createBlock',
  UPDATE_BLOCK: 'structure.updateBlock',
  DELETE_BLOCK: 'structure.deleteBlock',
  REORDER_BLOCK: 'structure.reorderBlock',
  
  // 视图命令
  CREATE_VIEW: 'view.create',
  UPDATE_VIEW: 'view.update',
  DELETE_VIEW: 'view.delete',
  
  // 布局命令
  UPDATE_NODE_POSITION: 'layout.updateNodePosition',
  UPDATE_NODE_STYLE: 'layout.updateNodeStyle',
  
  // 图算法命令
  FIND_SHORTEST_PATH: 'graph.findShortestPath',
  FIND_CONNECTED_COMPONENTS: 'graph.findConnectedComponents',
  DETECT_CYCLES: 'graph.detectCycles',
  
  // AI命令
  AI_GENERATE_STRUCTURE: 'ai.generateStructure',
  AI_SUGGEST_CONNECTIONS: 'ai.suggestConnections',
} as const;

// 命令类型映射
export type CommandPayloadMap = {
  [COMMANDS.CREATE_NODE]: CreateNodePayload;
  [COMMANDS.UPDATE_NODE]: UpdateNodePayload;
  [COMMANDS.DELETE_NODE]: DeleteNodePayload;
  [COMMANDS.CREATE_EDGE]: CreateEdgePayload;
  [COMMANDS.UPDATE_EDGE]: UpdateEdgePayload;
  [COMMANDS.DELETE_EDGE]: DeleteEdgePayload;
  [COMMANDS.CREATE_BLOCK]: CreateBlockPayload;
  [COMMANDS.UPDATE_BLOCK]: UpdateBlockPayload;
  [COMMANDS.DELETE_BLOCK]: DeleteBlockPayload;
  [COMMANDS.REORDER_BLOCK]: ReorderBlockPayload;
  [COMMANDS.CREATE_VIEW]: CreateViewPayload;
  [COMMANDS.UPDATE_VIEW]: UpdateViewPayload;
  [COMMANDS.DELETE_VIEW]: DeleteViewPayload;
  [COMMANDS.UPDATE_NODE_POSITION]: UpdateNodePositionPayload;
  [COMMANDS.UPDATE_NODE_STYLE]: UpdateNodeStylePayload;
  [COMMANDS.FIND_SHORTEST_PATH]: FindShortestPathPayload;
  [COMMANDS.FIND_CONNECTED_COMPONENTS]: FindConnectedComponentsPayload;
  [COMMANDS.DETECT_CYCLES]: DetectCyclesPayload;
  [COMMANDS.AI_GENERATE_STRUCTURE]: AIGenerateStructurePayload;
  [COMMANDS.AI_SUGGEST_CONNECTIONS]: AISuggestConnectionsPayload;
};