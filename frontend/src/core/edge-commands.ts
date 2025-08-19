// 边操作命令处理器

import { useGraphStore } from '../store/graph-store';
import { commandSystem } from './command-system';
import { COMMANDS } from '../types/commands';
import type { 
  CreateEdgePayload, 
  UpdateEdgePayload, 
  DeleteEdgePayload,
  CommandResult,
  EntityChange,
  Edge,
  Block
} from '../types/commands';

// 创建边命令处理器
export const createEdgeHandler = async (payload: CreateEdgePayload): Promise<CommandResult> => {
  const { addEdge, updateView, getCurrentView } = useGraphStore.getState();
  
  try {
    const currentView = getCurrentView();
    if (!currentView) {
      return {
        success: false,
        error: 'No current view available'
      };
    }

    // 生成ID和时间戳
    const newEdgeId = `edge_${Date.now()}`;
    const now = Date.now();
    
    // 创建新边
    const newEdge: Edge = {
      meta: {
        id: newEdgeId,
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: [],
        semanticLabel: payload.semanticLabel,
        isHyperEdge: payload.isHyperEdge || false
      },
      properties: payload.properties || {},
      sourceNodeId: payload.sourceNodeId,
      targetNodeId: payload.targetNodeId,
      blocks: []
    };

    // 记录变更（用于撤销）
    const changes: EntityChange[] = [
      {
        type: 'create',
        entityType: 'edge',
        entityId: newEdgeId,
        before: null,
        after: newEdge
      }
    ];

    // 更新视图，添加边到当前视图
    const oldView = { ...currentView };
    const updatedView = {
      ...currentView,
      edgeIds: [...currentView.edgeIds, newEdgeId]
    };
    
    changes.push({
      type: 'update',
      entityType: 'view',
      entityId: currentView.id,
      before: oldView,
      after: updatedView
    });

    // 执行实际操作
    addEdge(newEdge);
    updateView(currentView.id, updatedView);

    return {
      success: true,
      data: { edgeId: newEdgeId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 更新边命令处理器
export const updateEdgeHandler = async (payload: UpdateEdgePayload): Promise<CommandResult> => {
  const { getEdge, updateEdge } = useGraphStore.getState();
  
  try {
    const existingEdge = getEdge(payload.edgeId);
    if (!existingEdge) {
      return {
        success: false,
        error: `Edge ${payload.edgeId} not found`
      };
    }

    // 准备更新数据
    const updates: Partial<Edge> = {};
    if (payload.properties !== undefined) updates.properties = payload.properties;
    if (payload.blocks !== undefined) updates.blocks = payload.blocks;
    if (payload.semanticLabel !== undefined) {
      updates.meta = { ...existingEdge.meta, semanticLabel: payload.semanticLabel };
    }

    // 创建更新后的边
    const updatedEdge = { ...existingEdge, ...updates };

    // 记录变更
    const changes: EntityChange[] = [{
      type: 'update',
      entityType: 'edge',
      entityId: payload.edgeId,
      before: existingEdge,
      after: updatedEdge
    }];

    // 执行更新
    updateEdge(payload.edgeId, updates);

    return {
      success: true,
      data: { edgeId: payload.edgeId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 删除边命令处理器
export const deleteEdgeHandler = async (payload: DeleteEdgePayload): Promise<CommandResult> => {
  const { getEdge, removeEdge, getCurrentView, updateView, getRelation, updateRelation } = useGraphStore.getState();
  
  try {
    const existingEdge = getEdge(payload.edgeId);
    if (!existingEdge) {
      return {
        success: false,
        error: `Edge ${payload.edgeId} not found`
      };
    }

    const currentView = getCurrentView();
    if (!currentView) {
      return {
        success: false,
        error: 'No current view available'
      };
    }

    // 检查是否为关系连线
    const isRelationEdge = existingEdge.attributes?.isRelationParticipant === true;
    const relationId = existingEdge.attributes?.relationId;
    
    if (isRelationEdge && relationId) {
      // 处理关系连线删除 - 从关系节点的参与者列表中移除
      const relation = getRelation(relationId);
      if (relation) {
        // 获取原始目标ID，可能是占位符节点
        const originalTargetId = existingEdge.attributes?.originalTargetId || existingEdge.targetNodeId;
        const actualTargetId = originalTargetId.startsWith('missing-') ? 
                              originalTargetId.substring('missing-'.length) : 
                              originalTargetId;
        
        const updatedParticipants = relation.participants?.filter(p => p !== actualTargetId) || [];
        
        const updatedRelation = {
          ...relation,
          participants: updatedParticipants,
          meta: {
            ...relation.meta,
            updatedAt: Date.now(),
            version: relation.meta.version + 1
          }
        };

        // 记录关系节点变更
        const changes: EntityChange[] = [
          {
            type: 'update',
            entityType: 'relation',
            entityId: relationId,
            before: relation,
            after: updatedRelation
          }
        ];

        // 更新关系节点
        updateRelation(relationId, {
          participants: updatedParticipants,
          meta: updatedRelation.meta
        });

        return {
          success: true,
          data: { edgeId: payload.edgeId, relationId: relationId },
          changes
        };
      }
    } else {
      // 处理普通边删除
      const changes: EntityChange[] = [
        {
          type: 'delete',
          entityType: 'edge',
          entityId: payload.edgeId,
          before: existingEdge,
          after: null
        }
      ];

      // 如果边在当前视图中，也要记录视图变更
      if (currentView.edgeIds.includes(payload.edgeId)) {
        const oldView = { ...currentView };
        const updatedView = {
          ...currentView,
          edgeIds: currentView.edgeIds.filter(id => id !== payload.edgeId)
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
      removeEdge(payload.edgeId);
      
      // 从视图中移除
      if (currentView.edgeIds.includes(payload.edgeId)) {
        const updatedView = {
          ...currentView,
          edgeIds: currentView.edgeIds.filter(id => id !== payload.edgeId)
        };
        updateView(currentView.id, updatedView);
      }

      return {
        success: true,
        data: { edgeId: payload.edgeId },
        changes
      };
    }

    return {
      success: false,
      error: 'Failed to delete edge'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 注册所有边命令
export const registerEdgeCommands = () => {
  commandSystem.registerCommand(COMMANDS.CREATE_EDGE, createEdgeHandler);
  commandSystem.registerCommand(COMMANDS.UPDATE_EDGE, updateEdgeHandler);
  commandSystem.registerCommand(COMMANDS.DELETE_EDGE, deleteEdgeHandler);
};

// 便捷函数
export const createEdgeCommand = async (
  sourceNodeId: string,
  targetNodeId: string,
  semanticLabel: string = '关联'
) => {
  return commandSystem.runCommand(COMMANDS.CREATE_EDGE, {
    sourceNodeId,
    targetNodeId,
    semanticLabel
  });
};

export const updateEdgeCommand = async (
  edgeId: string,
  updates: Partial<{ properties: any; semanticLabel: string; blocks: Block[] }>
) => {
  return commandSystem.runCommand(COMMANDS.UPDATE_EDGE, {
    edgeId,
    ...updates
  });
};

export const deleteEdgeCommand = async (edgeId: string) => {
  return commandSystem.runCommand(COMMANDS.DELETE_EDGE, { edgeId });
};