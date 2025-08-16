// 节点操作命令处理器

import { useGraphStore } from '../store/graph-store';
import { commandSystem } from './command-system';
import { COMMANDS } from '../types/commands';
import type { 
  CreateNodePayload, 
  UpdateNodePayload, 
  DeleteNodePayload,
  CommandResult,
  EntityChange,
  Node,
  Block
} from '../types/commands';

// 创建节点命令处理器
export const createNodeHandler = async (payload: CreateNodePayload): Promise<CommandResult> => {
  const { addNode, updateView, getCurrentView, currentKnowledgeBase } = useGraphStore.getState();
  
  try {
    const currentView = getCurrentView();
    if (!currentView) {
      return {
        success: false,
        error: 'No current view available'
      };
    }

    // 生成ID和时间戳
    const newNodeId = `node_${Date.now()}`;
    const newBlockId = `block_${Date.now()}`;
    const now = Date.now();
    
    // 创建初始内容块
    const initialBlock: Block = {
      id: newBlockId,
      type: 'text',
      content: '点击编辑内容...',
      properties: {},
      order: 0
    };
    
    // 创建新节点
    const newNode: Node = {
      meta: {
        id: newNodeId,
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: [],
        entityLabel: payload.entityLabel
      },
      properties: payload.properties || {},
      title: payload.title,
      blocks: [initialBlock]
    };

    // 记录变更（用于撤销）
    const changes: EntityChange[] = [
      {
        type: 'create',
        entityType: 'node',
        entityId: newNodeId,
        before: null,
        after: newNode
      },
      {
        type: 'create',
        entityType: 'block',
        entityId: newBlockId,
        before: null,
        after: initialBlock
      }
    ];

    // 如果有位置信息，记录视图变更
    if (payload.position) {
      const oldView = { ...currentView };
      const newLayout = {
        ...currentView.layout,
        nodePositions: {
          ...currentView.layout.nodePositions,
          [newNodeId]: payload.position
        }
      };
      const updatedView = {
        ...currentView,
        nodeIds: [...currentView.nodeIds, newNodeId],
        layout: newLayout
      };
      
      changes.push({
        type: 'update',
        entityType: 'view',
        entityId: currentView.id,
        before: oldView,
        after: updatedView
      });
    }

    // 执行实际操作
    if (currentKnowledgeBase) {
      currentKnowledgeBase.blocks[newBlockId] = initialBlock;
    }
    addNode(newNode);
    
    if (payload.position) {
      const updatedView = {
        ...currentView,
        nodeIds: [...currentView.nodeIds, newNodeId],
        layout: {
          ...currentView.layout,
          nodePositions: {
            ...currentView.layout.nodePositions,
            [newNodeId]: payload.position
          }
        }
      };
      updateView(currentView.id, updatedView);
    }

    return {
      success: true,
      data: { nodeId: newNodeId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 更新节点命令处理器
export const updateNodeHandler = async (payload: UpdateNodePayload): Promise<CommandResult> => {
  const { getNode, updateNode } = useGraphStore.getState();
  
  try {
    const existingNode = getNode(payload.nodeId);
    if (!existingNode) {
      return {
        success: false,
        error: `Node ${payload.nodeId} not found`
      };
    }

    // 准备更新数据
    const updates: Partial<Node> = {};
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.properties !== undefined) updates.properties = payload.properties;
    if (payload.blocks !== undefined) updates.blocks = payload.blocks;
    if (payload.entityLabel !== undefined) {
      updates.meta = { ...existingNode.meta, entityLabel: payload.entityLabel };
    }

    // 创建更新后的节点
    const updatedNode = { ...existingNode, ...updates };

    // 记录变更
    const changes: EntityChange[] = [{
      type: 'update',
      entityType: 'node',
      entityId: payload.nodeId,
      before: existingNode,
      after: updatedNode
    }];

    // 执行更新
    updateNode(payload.nodeId, updates);

    return {
      success: true,
      data: { nodeId: payload.nodeId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 删除节点命令处理器
export const deleteNodeHandler = async (payload: DeleteNodePayload): Promise<CommandResult> => {
  const { getNode, removeNode, getCurrentView, updateView } = useGraphStore.getState();
  
  try {
    const existingNode = getNode(payload.nodeId);
    if (!existingNode) {
      return {
        success: false,
        error: `Node ${payload.nodeId} not found`
      };
    }

    const currentView = getCurrentView();
    if (!currentView) {
      return {
        success: false,
        error: 'No current view available'
      };
    }

    // 记录变更
    const changes: EntityChange[] = [
      {
        type: 'delete',
        entityType: 'node',
        entityId: payload.nodeId,
        before: existingNode,
        after: null
      }
    ];

    // 如果节点在当前视图中，也要记录视图变更
    if (currentView.nodeIds.includes(payload.nodeId)) {
      const oldView = { ...currentView };
      const updatedView = {
        ...currentView,
        nodeIds: currentView.nodeIds.filter(id => id !== payload.nodeId)
      };
      
      changes.push({
        type: 'update',
        entityType: 'view',
        entityId: currentView.id,
        before: oldView,
        after: updatedView
      });
    }

    // 执行删除
    removeNode(payload.nodeId);
    
    // 从视图中移除
    if (currentView.nodeIds.includes(payload.nodeId)) {
      const updatedView = {
        ...currentView,
        nodeIds: currentView.nodeIds.filter(id => id !== payload.nodeId)
      };
      updateView(currentView.id, updatedView);
    }

    return {
      success: true,
      data: { nodeId: payload.nodeId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 注册所有节点命令
export const registerNodeCommands = () => {
  commandSystem.registerCommand(COMMANDS.CREATE_NODE, createNodeHandler);
  commandSystem.registerCommand(COMMANDS.UPDATE_NODE, updateNodeHandler);
  commandSystem.registerCommand(COMMANDS.DELETE_NODE, deleteNodeHandler);
};

// 便捷函数
export const createNodeCommand = async (
  title: string,
  position: { x: number; y: number },
  entityLabel: string = '概念'
) => {
  return commandSystem.runCommand(COMMANDS.CREATE_NODE, {
    title,
    entityLabel,
    position,
    viewId: useGraphStore.getState().getCurrentView()?.id || ''
  });
};

export const updateNodeCommand = async (
  nodeId: string,
  updates: Partial<{ title: string; properties: any; entityLabel: string; blocks: Block[] }>
) => {
  return commandSystem.runCommand(COMMANDS.UPDATE_NODE, {
    nodeId,
    ...updates
  });
};

export const deleteNodeCommand = async (nodeId: string) => {
  return commandSystem.runCommand(COMMANDS.DELETE_NODE, { nodeId });
};

// 复制节点命令（组合命令）
export const copyNodeCommand = async (
  sourceNodeId: string,
  position: { x: number; y: number },
  titleSuffix: string = ' - 副本'
): Promise<CommandResult> => {
  const { getNode } = useGraphStore.getState();
  
  try {
    const sourceNode = getNode(sourceNodeId);
    if (!sourceNode) {
      return {
        success: false,
        error: `Source node ${sourceNodeId} not found`
      };
    }

    // 使用创建节点命令来复制
    const result = await createNodeCommand(
      sourceNode.title + titleSuffix,
      position,
      sourceNode.meta.entityLabel
    );

    if (result.success && result.data?.nodeId) {
      // 复制所有属性和内容块
      const copyResult = await updateNodeCommand(result.data.nodeId, {
        properties: { ...sourceNode.properties }
      });

      // TODO: 复制内容块（需要块命令系统）
      
      return {
        success: true,
        data: { 
          nodeId: result.data.nodeId,
          sourceNodeId 
        },
        changes: result.changes
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};