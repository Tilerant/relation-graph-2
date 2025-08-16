// 视图和布局操作命令处理器

import { useGraphStore } from '../store/graph-store';
import { commandSystem } from './command-system';
import { COMMANDS } from '../types/commands';
import type { 
  UpdateNodePositionPayload,
  UpdateNodeStylePayload,
  UpdateViewPayload,
  CommandResult,
  EntityChange,
  View
} from '../types/commands';

// 更新节点位置命令处理器
export const updateNodePositionHandler = async (payload: UpdateNodePositionPayload): Promise<CommandResult> => {
  const { getView, updateView } = useGraphStore.getState();
  
  try {
    const existingView = getView(payload.viewId);
    if (!existingView) {
      return {
        success: false,
        error: `View ${payload.viewId} not found`
      };
    }

    // 获取当前位置
    const currentPosition = existingView.layout.nodePositions[payload.nodeId];
    
    if (currentPosition && 
        currentPosition.x === payload.position.x && 
        currentPosition.y === payload.position.y) {
      // 位置没有变化，不需要更新
      return {
        success: true,
        data: { nodeId: payload.nodeId, position: payload.position },
        changes: []
      };
    }

    // 创建更新后的视图
    const updatedView = {
      ...existingView,
      layout: {
        ...existingView.layout,
        nodePositions: {
          ...existingView.layout.nodePositions,
          [payload.nodeId]: payload.position
        }
      }
    };

    // 记录变更
    const changes: EntityChange[] = [{
      type: 'update',
      entityType: 'view',
      entityId: payload.viewId,
      before: existingView,
      after: updatedView
    }];

    // 执行更新
    updateView(payload.viewId, updatedView);

    return {
      success: true,
      data: { nodeId: payload.nodeId, position: payload.position },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 更新节点样式命令处理器
export const updateNodeStyleHandler = async (payload: UpdateNodeStylePayload): Promise<CommandResult> => {
  const { getView, updateView } = useGraphStore.getState();
  
  try {
    const existingView = getView(payload.viewId);
    if (!existingView) {
      return {
        success: false,
        error: `View ${payload.viewId} not found`
      };
    }

    // 创建更新后的视图
    const updatedView = {
      ...existingView,
      layout: {
        ...existingView.layout,
        nodeStyles: {
          ...existingView.layout.nodeStyles,
          [payload.nodeId]: payload.style
        }
      }
    };

    // 记录变更
    const changes: EntityChange[] = [{
      type: 'update',
      entityType: 'view',
      entityId: payload.viewId,
      before: existingView,
      after: updatedView
    }];

    // 执行更新
    updateView(payload.viewId, updatedView);

    return {
      success: true,
      data: { nodeId: payload.nodeId, style: payload.style },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 更新视图命令处理器
export const updateViewHandler = async (payload: UpdateViewPayload): Promise<CommandResult> => {
  const { getView, updateView } = useGraphStore.getState();
  
  try {
    const existingView = getView(payload.viewId);
    if (!existingView) {
      return {
        success: false,
        error: `View ${payload.viewId} not found`
      };
    }

    // 准备更新数据
    const updates: Partial<View> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.nodeIds !== undefined) updates.nodeIds = payload.nodeIds;
    if (payload.edgeIds !== undefined) updates.edgeIds = payload.edgeIds;
    if (payload.layout !== undefined) updates.layout = payload.layout;

    // 创建更新后的视图
    const updatedView = { ...existingView, ...updates };

    // 记录变更
    const changes: EntityChange[] = [{
      type: 'update',
      entityType: 'view',
      entityId: payload.viewId,
      before: existingView,
      after: updatedView
    }];

    // 执行更新
    updateView(payload.viewId, updatedView);

    return {
      success: true,
      data: { viewId: payload.viewId },
      changes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 注册所有视图和布局命令
export const registerViewCommands = () => {
  commandSystem.registerCommand(COMMANDS.UPDATE_NODE_POSITION, updateNodePositionHandler);
  commandSystem.registerCommand(COMMANDS.UPDATE_NODE_STYLE, updateNodeStyleHandler);
  commandSystem.registerCommand(COMMANDS.UPDATE_VIEW, updateViewHandler);
};

// 便捷函数
export const updateNodePositionCommand = async (
  viewId: string,
  nodeId: string,
  position: { x: number; y: number }
) => {
  return commandSystem.runCommand(COMMANDS.UPDATE_NODE_POSITION, {
    viewId,
    nodeId,
    position
  });
};

export const updateNodeStyleCommand = async (
  viewId: string,
  nodeId: string,
  style: any
) => {
  return commandSystem.runCommand(COMMANDS.UPDATE_NODE_STYLE, {
    viewId,
    nodeId,
    style
  });
};

export const updateViewCommand = async (
  viewId: string,
  updates: Partial<{ name: string; nodeIds: string[]; edgeIds: string[]; layout: any }>
) => {
  return commandSystem.runCommand(COMMANDS.UPDATE_VIEW, {
    viewId,
    ...updates
  });
};