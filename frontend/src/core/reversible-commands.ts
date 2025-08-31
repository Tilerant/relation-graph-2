/**
 * 可撤销命令类
 * 实现基于命令模式的撤销/重做机制
 */

import { useGraphStore } from '../store/graph-store';
import { NodeType, Position, EntityId } from '../types/structure';
import type { Node, Edge, Block } from '../types/commands';

// 可撤销命令接口
export interface ReversibleCommand {
  id: string;
  type: string;
  timestamp: number;
  
  // 执行命令
  execute(): Promise<CommandResult>;
  
  // 撤销命令（命令知道如何撤销自己）
  undo(): Promise<void>;
  
  // 执行前捕获撤销所需的数据
  captureUndoData(): void;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  events?: DomainEvent[];
}

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: number;
  data: any;
}

// 生成唯一ID的工具函数
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * 创建节点命令
 */
export class CreateNodeCommand implements ReversibleCommand {
  id: string;
  type = 'node:create';
  timestamp: number;
  
  private payload: {
    nodeType: NodeType;
    title: string;
    content?: string;
    position: Position;
  };
  private createdNodeId?: string;

  constructor(payload: {
    nodeType: NodeType;
    title: string;
    content?: string;
    position: Position;
  }) {
    this.id = generateId();
    this.timestamp = Date.now();
    this.payload = payload;
  }

  captureUndoData(): void {
    // 创建命令不需要捕获执行前的数据
  }

  async execute(): Promise<CommandResult> {
    try {
      const { addNode, getCurrentView } = useGraphStore.getState();
      
      const currentView = getCurrentView();
      if (!currentView) {
        return {
          success: false,
          error: 'No current view available'
        };
      }

      // 生成节点ID
      this.createdNodeId = generateId();
      const now = this.timestamp;

      // 创建初始内容块
      const initialBlock: Block = {
        id: generateId(),
        type: 'text',
        content: this.payload.content || '点击编辑内容...',
        properties: {},
        order: 0
      };

      // 创建新节点
      const newNode: Node = {
        meta: {
          id: this.createdNodeId,
          createdAt: now,
          updatedAt: now,
          version: 1,
          tags: [],
          entityLabel: 'default'
        },
        title: this.payload.title,
        content: this.payload.content || '',
        blocks: [initialBlock],
        attributes: {},
        type: this.payload.nodeType,
        position: this.payload.position
      };

      // 添加到store
      addNode(newNode);

      return {
        success: true,
        data: { id: this.createdNodeId, node: newNode },
        events: [{
          id: generateId(),
          type: 'node:created',
          aggregateId: this.createdNodeId,
          timestamp: now,
          data: newNode
        }]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async undo(): Promise<void> {
    if (!this.createdNodeId) {
      throw new Error('Cannot undo: no node was created');
    }

    const { removeNode } = useGraphStore.getState();
    removeNode(this.createdNodeId);
  }
}

/**
 * 更新节点命令
 */
export class UpdateNodeCommand implements ReversibleCommand {
  id: string;
  type = 'node:update';
  timestamp: number;
  
  private nodeId: string;
  private newData: Partial<Node>;
  private originalData?: Partial<Node>;

  constructor(nodeId: string, newData: Partial<Node>) {
    this.id = generateId();
    this.timestamp = Date.now();
    this.nodeId = nodeId;
    this.newData = newData;
  }

  captureUndoData(): void {
    const { currentKnowledgeBase } = useGraphStore.getState();
    if (!currentKnowledgeBase) {
      throw new Error('No knowledge base available');
    }

    const node = currentKnowledgeBase.nodes[this.nodeId];
    if (!node) {
      throw new Error(`Node not found: ${this.nodeId}`);
    }

    // 保存将要修改的字段的原始值
    this.originalData = {};
    Object.keys(this.newData).forEach(key => {
      this.originalData![key] = (node as any)[key];
    });
  }

  async execute(): Promise<CommandResult> {
    try {
      const { updateNode } = useGraphStore.getState();
      
      // 更新节点数据
      const updatedData = {
        ...this.newData,
        meta: {
          ...this.newData.meta,
          updatedAt: this.timestamp
        }
      };

      updateNode(this.nodeId, updatedData);

      return {
        success: true,
        data: { nodeId: this.nodeId, changes: this.newData },
        events: [{
          id: generateId(),
          type: 'node:updated',
          aggregateId: this.nodeId,
          timestamp: this.timestamp,
          data: { nodeId: this.nodeId, changes: this.newData }
        }]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async undo(): Promise<void> {
    if (!this.originalData) {
      throw new Error('Cannot undo: no original data captured');
    }

    const { updateNode } = useGraphStore.getState();
    updateNode(this.nodeId, this.originalData);
  }
}

/**
 * 创建边命令
 */
export class CreateEdgeCommand implements ReversibleCommand {
  id: string;
  type = 'edge:create';
  timestamp: number;
  
  private payload: {
    sourceId: string;
    targetId: string;
    type: string;
  };
  private createdEdgeId?: string;

  constructor(payload: {
    sourceId: string;
    targetId: string;
    type: string;
  }) {
    this.id = generateId();
    this.timestamp = Date.now();
    this.payload = payload;
  }

  captureUndoData(): void {
    // 验证源节点和目标节点存在
    const { currentKnowledgeBase } = useGraphStore.getState();
    if (!currentKnowledgeBase) {
      throw new Error('No knowledge base available');
    }

    if (!currentKnowledgeBase.nodes[this.payload.sourceId]) {
      throw new Error(`Source node not found: ${this.payload.sourceId}`);
    }

    if (!currentKnowledgeBase.nodes[this.payload.targetId]) {
      throw new Error(`Target node not found: ${this.payload.targetId}`);
    }
  }

  async execute(): Promise<CommandResult> {
    try {
      const { addEdge } = useGraphStore.getState();
      
      this.createdEdgeId = generateId();
      
      const newEdge: Edge = {
        meta: {
          id: this.createdEdgeId,
          createdAt: this.timestamp,
          updatedAt: this.timestamp,
          version: 1,
          tags: [],
          entityLabel: 'default'
        },
        sourceId: this.payload.sourceId,
        targetId: this.payload.targetId,
        type: this.payload.type,
        attributes: {}
      };

      addEdge(newEdge);

      return {
        success: true,
        data: { id: this.createdEdgeId, edge: newEdge },
        events: [{
          id: generateId(),
          type: 'edge:created',
          aggregateId: this.createdEdgeId,
          timestamp: this.timestamp,
          data: newEdge
        }]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async undo(): Promise<void> {
    if (!this.createdEdgeId) {
      throw new Error('Cannot undo: no edge was created');
    }

    const { removeEdge } = useGraphStore.getState();
    removeEdge(this.createdEdgeId);
  }
}

/**
 * 删除节点命令
 */
export class DeleteNodeCommand implements ReversibleCommand {
  id: string;
  type = 'node:delete';
  timestamp: number;
  
  private nodeId: string;
  private deletedNode?: Node;
  private deletedEdges?: Edge[];

  constructor(nodeId: string) {
    this.id = generateId();
    this.timestamp = Date.now();
    this.nodeId = nodeId;
  }

  captureUndoData(): void {
    const { currentKnowledgeBase } = useGraphStore.getState();
    if (!currentKnowledgeBase) {
      throw new Error('No knowledge base available');
    }

    // 保存要删除的节点
    this.deletedNode = currentKnowledgeBase.nodes[this.nodeId];
    if (!this.deletedNode) {
      throw new Error(`Node not found: ${this.nodeId}`);
    }

    // 保存相关的边
    this.deletedEdges = Object.values(currentKnowledgeBase.edges).filter(
      edge => edge.sourceId === this.nodeId || edge.targetId === this.nodeId
    );
  }

  async execute(): Promise<CommandResult> {
    try {
      const { removeNode, removeEdge } = useGraphStore.getState();
      
      // 删除相关的边
      if (this.deletedEdges) {
        this.deletedEdges.forEach(edge => {
          removeEdge(edge.meta.id);
        });
      }

      // 删除节点
      removeNode(this.nodeId);

      return {
        success: true,
        data: { nodeId: this.nodeId },
        events: [{
          id: generateId(),
          type: 'node:deleted',
          aggregateId: this.nodeId,
          timestamp: this.timestamp,
          data: { nodeId: this.nodeId }
        }]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async undo(): Promise<void> {
    if (!this.deletedNode) {
      throw new Error('Cannot undo: no node data saved');
    }

    const { addNode, addEdge } = useGraphStore.getState();
    
    // 恢复节点
    addNode(this.deletedNode);

    // 恢复相关的边
    if (this.deletedEdges) {
      this.deletedEdges.forEach(edge => {
        addEdge(edge);
      });
    }
  }
}