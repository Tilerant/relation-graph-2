// 块操作命令处理器

import { useGraphStore } from '../store/graph-store';
import { commandSystem } from './command-system';
import { COMMANDS } from '../types/commands';
import type { 
  CreateBlockPayload, 
  UpdateBlockPayload, 
  DeleteBlockPayload,
  ReorderBlockPayload,
  CommandResult,
  EntityChange,
  Block
} from '../types/commands';

// 创建块命令处理器
export const createBlockHandler = async (payload: CreateBlockPayload): Promise<CommandResult> => {
  const { getNode, getEdge, updateNode, updateEdge, currentKnowledgeBase } = useGraphStore.getState();
  
  try {
    // 获取父实体
    let parentEntity;
    if (payload.parentType === 'node') {
      parentEntity = getNode(payload.parentId);
    } else {
      parentEntity = getEdge(payload.parentId);
    }

    if (!parentEntity) {
      return {
        success: false,
        error: `Parent ${payload.parentType} ${payload.parentId} not found`
      };
    }

    // 生成新块ID
    const newBlockId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 确定插入位置
    const insertPosition = payload.position !== undefined 
      ? payload.position 
      : parentEntity.blocks.length;

    // 创建新块
    const newBlock: Block = {
      id: newBlockId,
      type: payload.type,
      content: payload.content,
      properties: {},
      order: insertPosition
    };

    // 创建更新后的块列表
    const newBlocks = [...parentEntity.blocks];
    newBlocks.splice(insertPosition, 0, newBlock);
    
    // 重新排序
    newBlocks.forEach((block, index) => {
      block.order = index;
    });

    // 记录变更
    const changes: EntityChange[] = [
      {
        type: 'create',
        entityType: 'block',
        entityId: newBlockId,
        before: null,
        after: newBlock
      },
      {
        type: 'update',
        entityType: payload.parentType,
        entityId: payload.parentId,
        before: parentEntity,
        after: { ...parentEntity, blocks: newBlocks }
      }
    ];

    // 执行实际操作
    if (currentKnowledgeBase) {
      currentKnowledgeBase.blocks[newBlockId] = newBlock;
    }

    if (payload.parentType === 'node') {
      updateNode(payload.parentId, { blocks: newBlocks });
    } else {
      updateEdge(payload.parentId, { blocks: newBlocks });
    }

    return {
      success: true,
      data: { blockId: newBlockId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 更新块命令处理器
export const updateBlockHandler = async (payload: UpdateBlockPayload): Promise<CommandResult> => {
  const { currentKnowledgeBase, getNode, getEdge, updateNode, updateEdge } = useGraphStore.getState();
  
  try {
    if (!currentKnowledgeBase) {
      return {
        success: false,
        error: 'No current knowledge base'
      };
    }

    const existingBlock = currentKnowledgeBase.blocks[payload.blockId];
    if (!existingBlock) {
      return {
        success: false,
        error: `Block ${payload.blockId} not found`
      };
    }

    // 找到包含这个块的父实体
    let parentEntity;
    let parentType: 'node' | 'edge' | null = null;
    let parentId: string | null = null;

    // 在所有节点中查找
    for (const [nodeId, node] of Object.entries(currentKnowledgeBase.nodes)) {
      if (node.blocks.some(block => block.id === payload.blockId)) {
        parentEntity = node;
        parentType = 'node';
        parentId = nodeId;
        break;
      }
    }

    // 如果在节点中没找到，在边中查找
    if (!parentEntity) {
      for (const [edgeId, edge] of Object.entries(currentKnowledgeBase.edges)) {
        if (edge.blocks.some(block => block.id === payload.blockId)) {
          parentEntity = edge;
          parentType = 'edge';
          parentId = edgeId;
          break;
        }
      }
    }

    if (!parentEntity || !parentType || !parentId) {
      return {
        success: false,
        error: `Parent entity for block ${payload.blockId} not found`
      };
    }

    // 创建更新后的块
    const updatedBlock = { ...existingBlock };
    if (payload.content !== undefined) updatedBlock.content = payload.content;
    if (payload.properties !== undefined) updatedBlock.properties = payload.properties;

    // 更新父实体中的块列表
    const updatedBlocks = parentEntity.blocks.map(block => 
      block.id === payload.blockId ? updatedBlock : block
    );

    // 记录变更
    const changes: EntityChange[] = [
      {
        type: 'update',
        entityType: 'block',
        entityId: payload.blockId,
        before: existingBlock,
        after: updatedBlock
      },
      {
        type: 'update',
        entityType: parentType,
        entityId: parentId,
        before: parentEntity,
        after: { ...parentEntity, blocks: updatedBlocks }
      }
    ];

    // 执行更新
    currentKnowledgeBase.blocks[payload.blockId] = updatedBlock;
    
    if (parentType === 'node') {
      updateNode(parentId, { blocks: updatedBlocks });
    } else {
      updateEdge(parentId, { blocks: updatedBlocks });
    }

    return {
      success: true,
      data: { blockId: payload.blockId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 删除块命令处理器
export const deleteBlockHandler = async (payload: DeleteBlockPayload): Promise<CommandResult> => {
  const { currentKnowledgeBase, updateNode, updateEdge } = useGraphStore.getState();
  
  try {
    if (!currentKnowledgeBase) {
      return {
        success: false,
        error: 'No current knowledge base'
      };
    }

    const existingBlock = currentKnowledgeBase.blocks[payload.blockId];
    if (!existingBlock) {
      return {
        success: false,
        error: `Block ${payload.blockId} not found`
      };
    }

    // 找到包含这个块的父实体
    let parentEntity;
    let parentType: 'node' | 'edge' | null = null;
    let parentId: string | null = null;

    // 在所有节点中查找
    for (const [nodeId, node] of Object.entries(currentKnowledgeBase.nodes)) {
      if (node.blocks.some(block => block.id === payload.blockId)) {
        parentEntity = node;
        parentType = 'node';
        parentId = nodeId;
        break;
      }
    }

    // 如果在节点中没找到，在边中查找
    if (!parentEntity) {
      for (const [edgeId, edge] of Object.entries(currentKnowledgeBase.edges)) {
        if (edge.blocks.some(block => block.id === payload.blockId)) {
          parentEntity = edge;
          parentType = 'edge';
          parentId = edgeId;
          break;
        }
      }
    }

    if (!parentEntity || !parentType || !parentId) {
      return {
        success: false,
        error: `Parent entity for block ${payload.blockId} not found`
      };
    }

    // 创建删除块后的列表
    const updatedBlocks = parentEntity.blocks.filter(block => block.id !== payload.blockId);
    
    // 重新排序
    updatedBlocks.forEach((block, index) => {
      block.order = index;
    });

    // 记录变更
    const changes: EntityChange[] = [
      {
        type: 'delete',
        entityType: 'block',
        entityId: payload.blockId,
        before: existingBlock,
        after: null
      },
      {
        type: 'update',
        entityType: parentType,
        entityId: parentId,
        before: parentEntity,
        after: { ...parentEntity, blocks: updatedBlocks }
      }
    ];

    // 执行删除
    delete currentKnowledgeBase.blocks[payload.blockId];
    
    if (parentType === 'node') {
      updateNode(parentId, { blocks: updatedBlocks });
    } else {
      updateEdge(parentId, { blocks: updatedBlocks });
    }

    return {
      success: true,
      data: { blockId: payload.blockId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 重排块命令处理器
export const reorderBlockHandler = async (payload: ReorderBlockPayload): Promise<CommandResult> => {
  const { currentKnowledgeBase, updateNode, updateEdge } = useGraphStore.getState();
  
  try {
    if (!currentKnowledgeBase) {
      return {
        success: false,
        error: 'No current knowledge base'
      };
    }

    const existingBlock = currentKnowledgeBase.blocks[payload.blockId];
    if (!existingBlock) {
      return {
        success: false,
        error: `Block ${payload.blockId} not found`
      };
    }

    // 找到包含这个块的父实体
    let parentEntity;
    let parentType: 'node' | 'edge' | null = null;
    let parentId: string | null = null;

    // 在所有节点中查找
    for (const [nodeId, node] of Object.entries(currentKnowledgeBase.nodes)) {
      if (node.blocks.some(block => block.id === payload.blockId)) {
        parentEntity = node;
        parentType = 'node';
        parentId = nodeId;
        break;
      }
    }

    // 如果在节点中没找到，在边中查找
    if (!parentEntity) {
      for (const [edgeId, edge] of Object.entries(currentKnowledgeBase.edges)) {
        if (edge.blocks.some(block => block.id === payload.blockId)) {
          parentEntity = edge;
          parentType = 'edge';
          parentId = edgeId;
          break;
        }
      }
    }

    if (!parentEntity || !parentType || !parentId) {
      return {
        success: false,
        error: `Parent entity for block ${payload.blockId} not found`
      };
    }

    // 重新排列块
    const blocks = [...parentEntity.blocks];
    const currentIndex = blocks.findIndex(block => block.id === payload.blockId);
    const targetIndex = Math.max(0, Math.min(payload.newPosition, blocks.length - 1));

    if (currentIndex === targetIndex) {
      return {
        success: true,
        data: { blockId: payload.blockId },
        changes: [] // 没有实际变更
      };
    }

    // 移动块
    const [movedBlock] = blocks.splice(currentIndex, 1);
    blocks.splice(targetIndex, 0, movedBlock);

    // 重新设置order
    blocks.forEach((block, index) => {
      block.order = index;
    });

    // 记录变更
    const changes: EntityChange[] = [{
      type: 'update',
      entityType: parentType,
      entityId: parentId,
      before: parentEntity,
      after: { ...parentEntity, blocks }
    }];

    // 执行更新
    if (parentType === 'node') {
      updateNode(parentId, { blocks });
    } else {
      updateEdge(parentId, { blocks });
    }

    return {
      success: true,
      data: { blockId: payload.blockId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 注册所有块命令
export const registerBlockCommands = () => {
  commandSystem.registerCommand(COMMANDS.CREATE_BLOCK, createBlockHandler);
  commandSystem.registerCommand(COMMANDS.UPDATE_BLOCK, updateBlockHandler);
  commandSystem.registerCommand(COMMANDS.DELETE_BLOCK, deleteBlockHandler);
  commandSystem.registerCommand(COMMANDS.REORDER_BLOCK, reorderBlockHandler);
};

// 便捷函数
export const createBlockCommand = async (
  parentId: string,
  parentType: 'node' | 'edge',
  type: 'text' | 'image' | 'file' | 'code' | 'table' | 'embed',
  content: any,
  position?: number
) => {
  return commandSystem.runCommand(COMMANDS.CREATE_BLOCK, {
    parentId,
    parentType,
    type,
    content,
    position
  });
};

export const updateBlockCommand = async (
  blockId: string,
  updates: Partial<{ content: any; properties: any }>
) => {
  return commandSystem.runCommand(COMMANDS.UPDATE_BLOCK, {
    blockId,
    ...updates
  });
};

export const deleteBlockCommand = async (blockId: string) => {
  return commandSystem.runCommand(COMMANDS.DELETE_BLOCK, { blockId });
};

export const reorderBlockCommand = async (blockId: string, newPosition: number) => {
  return commandSystem.runCommand(COMMANDS.REORDER_BLOCK, { blockId, newPosition });
};