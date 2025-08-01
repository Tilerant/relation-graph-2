// 图谱状态管理 - Zustand Store

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { 
  KnowledgeBase, 
  Node, 
  Edge, 
  Block, 
  View, 
  EntityId,
  NodeDisplayMode,
  EdgeDisplayMode,
  NodeViewConfig,
  EdgeViewConfig
} from '../types/structure';
import { commandSystem } from '../core/command-system';

// Store 状态接口
interface GraphState {
  // 当前知识库
  currentKnowledgeBase: KnowledgeBase | null;
  
  // 当前激活的视图
  currentViewId: EntityId | null;
  
  // 当前选中的实体
  selectedNodeIds: Set<EntityId>;
  selectedEdgeIds: Set<EntityId>;
  
  // 视图配置
  nodeViewConfigs: Record<EntityId, NodeViewConfig>;
  edgeViewConfigs: Record<EntityId, EdgeViewConfig>;
  
  // UI 状态
  isLoading: boolean;
  error: string | null;
  
  // 右侧面板状态
  rightPanelOpen: boolean;
  rightPanelContent: {
    type: 'node' | 'edge' | 'view' | null;
    entityId: EntityId | null;
  };
}

// Store Actions 接口
interface GraphActions {
  // 知识库操作
  loadKnowledgeBase: (kb: KnowledgeBase) => void;
  createNewKnowledgeBase: (name: string) => Promise<void>;
  
  // 视图操作
  setCurrentView: (viewId: EntityId) => void;
  getCurrentView: () => View | null;
  
  // 选择操作
  selectNode: (nodeId: EntityId) => void;
  selectEdge: (edgeId: EntityId) => void;
  deselectNode: (nodeId: EntityId) => void;
  deselectEdge: (edgeId: EntityId) => void;
  clearSelection: () => void;
  toggleNodeSelection: (nodeId: EntityId) => void;
  
  // 实体获取
  getNode: (nodeId: EntityId) => Node | null;
  getEdge: (edgeId: EntityId) => Edge | null;
  getBlock: (blockId: EntityId) => Block | null;
  getView: (viewId: EntityId) => View | null;
  
  // 视图配置
  setNodeViewConfig: (nodeId: EntityId, config: Partial<NodeViewConfig>) => void;
  setEdgeViewConfig: (edgeId: EntityId, config: Partial<EdgeViewConfig>) => void;
  getNodeViewConfig: (nodeId: EntityId) => NodeViewConfig;
  getEdgeViewConfig: (edgeId: EntityId) => EdgeViewConfig;
  
  // 右侧面板
  openRightPanel: (type: 'node' | 'edge' | 'view', entityId: EntityId) => void;
  closeRightPanel: () => void;
  
  // 错误处理
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // 数据更新（通过命令系统调用后更新状态）
  updateNode: (nodeId: EntityId, updates: Partial<Node>) => void;
  updateEdge: (edgeId: EntityId, updates: Partial<Edge>) => void;
  updateView: (viewId: EntityId, updates: Partial<View>) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  removeNode: (nodeId: EntityId) => void;
  removeEdge: (edgeId: EntityId) => void;
}

// 默认节点视图配置
const defaultNodeViewConfig: NodeViewConfig = {
  displayMode: NodeDisplayMode.CARD,
  isCollapsed: false,
  showTitle: true,
  showBlocks: true,
};

// 默认边视图配置
const defaultEdgeViewConfig: EdgeViewConfig = {
  displayMode: EdgeDisplayMode.LINE,
  showBlocks: false,
};

// 创建初始状态
const createInitialState = (): GraphState => ({
  currentKnowledgeBase: null,
  currentViewId: null,
  selectedNodeIds: new Set(),
  selectedEdgeIds: new Set(),
  nodeViewConfigs: {},
  edgeViewConfigs: {},
  isLoading: false,
  error: null,
  rightPanelOpen: false,
  rightPanelContent: {
    type: null,
    entityId: null,
  },
});

// 创建 Zustand Store
export const useGraphStore = create<GraphState & GraphActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...createInitialState(),

      // 知识库操作
      loadKnowledgeBase: (kb) => {
        set({ 
          currentKnowledgeBase: kb,
          currentViewId: kb.mainViewId,
          selectedNodeIds: new Set(),
          selectedEdgeIds: new Set(),
          error: null
        });
      },

      createNewKnowledgeBase: async (name) => {
        set({ isLoading: true });
        try {
          // TODO: 通过命令系统创建新知识库
          const newKb: KnowledgeBase = {
            id: `kb_${Date.now()}`,
            name,
            description: '',
            mainViewId: `view_${Date.now()}`,
            nodes: {},
            edges: {},
            views: {},
            blocks: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          set({ 
            currentKnowledgeBase: newKb,
            currentViewId: newKb.mainViewId,
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : String(error),
            isLoading: false
          });
        }
      },

      // 视图操作
      setCurrentView: (viewId) => {
        const kb = get().currentKnowledgeBase;
        if (kb && kb.views[viewId]) {
          set({ currentViewId: viewId });
        }
      },

      getCurrentView: () => {
        const { currentKnowledgeBase, currentViewId } = get();
        if (currentKnowledgeBase && currentViewId) {
          return currentKnowledgeBase.views[currentViewId] || null;
        }
        return null;
      },

      // 选择操作
      selectNode: (nodeId) => {
        set((state) => ({
          selectedNodeIds: new Set([...state.selectedNodeIds, nodeId])
        }));
      },

      selectEdge: (edgeId) => {
        set((state) => ({
          selectedEdgeIds: new Set([...state.selectedEdgeIds, edgeId])
        }));
      },

      deselectNode: (nodeId) => {
        set((state) => {
          const newSet = new Set(state.selectedNodeIds);
          newSet.delete(nodeId);
          return { selectedNodeIds: newSet };
        });
      },

      deselectEdge: (edgeId) => {
        set((state) => {
          const newSet = new Set(state.selectedEdgeIds);
          newSet.delete(edgeId);
          return { selectedEdgeIds: newSet };
        });
      },

      clearSelection: () => {
        set({
          selectedNodeIds: new Set(),
          selectedEdgeIds: new Set()
        });
      },

      toggleNodeSelection: (nodeId) => {
        const { selectedNodeIds } = get();
        if (selectedNodeIds.has(nodeId)) {
          get().deselectNode(nodeId);
        } else {
          get().selectNode(nodeId);
        }
      },

      // 实体获取
      getNode: (nodeId) => {
        const kb = get().currentKnowledgeBase;
        return kb?.nodes[nodeId] || null;
      },

      getEdge: (edgeId) => {
        const kb = get().currentKnowledgeBase;
        return kb?.edges[edgeId] || null;
      },

      getBlock: (blockId) => {
        const kb = get().currentKnowledgeBase;
        return kb?.blocks[blockId] || null;
      },

      getView: (viewId) => {
        const kb = get().currentKnowledgeBase;
        return kb?.views[viewId] || null;
      },

      // 视图配置
      setNodeViewConfig: (nodeId, config) => {
        set((state) => ({
          nodeViewConfigs: {
            ...state.nodeViewConfigs,
            [nodeId]: {
              ...get().getNodeViewConfig(nodeId),
              ...config
            }
          }
        }));
      },

      setEdgeViewConfig: (edgeId, config) => {
        set((state) => ({
          edgeViewConfigs: {
            ...state.edgeViewConfigs,
            [edgeId]: {
              ...get().getEdgeViewConfig(edgeId),
              ...config
            }
          }
        }));
      },

      getNodeViewConfig: (nodeId) => {
        const config = get().nodeViewConfigs[nodeId];
        return config || defaultNodeViewConfig;
      },

      getEdgeViewConfig: (edgeId) => {
        const config = get().edgeViewConfigs[edgeId];
        return config || defaultEdgeViewConfig;
      },

      // 右侧面板
      openRightPanel: (type, entityId) => {
        set({
          rightPanelOpen: true,
          rightPanelContent: { type, entityId }
        });
      },

      closeRightPanel: () => {
        set({
          rightPanelOpen: false,
          rightPanelContent: { type: null, entityId: null }
        });
      },

      // 错误处理
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      // 数据更新方法
      updateNode: (nodeId, updates) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              nodes: {
                ...state.currentKnowledgeBase.nodes,
                [nodeId]: {
                  ...state.currentKnowledgeBase.nodes[nodeId],
                  ...updates
                }
              },
              updatedAt: Date.now()
            }
          };
        });
      },

      updateEdge: (edgeId, updates) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              edges: {
                ...state.currentKnowledgeBase.edges,
                [edgeId]: {
                  ...state.currentKnowledgeBase.edges[edgeId],
                  ...updates
                }
              },
              updatedAt: Date.now()
            }
          };
        });
      },

      updateView: (viewId, updates) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              views: {
                ...state.currentKnowledgeBase.views,
                [viewId]: {
                  ...state.currentKnowledgeBase.views[viewId],
                  ...updates
                }
              },
              updatedAt: Date.now()
            }
          };
        });
      },

      addNode: (node) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              nodes: {
                ...state.currentKnowledgeBase.nodes,
                [node.meta.id]: node
              },
              updatedAt: Date.now()
            }
          };
        });
      },

      addEdge: (edge) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              edges: {
                ...state.currentKnowledgeBase.edges,
                [edge.meta.id]: edge
              },
              updatedAt: Date.now()
            }
          };
        });
      },

      removeNode: (nodeId) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          const newNodes = { ...state.currentKnowledgeBase.nodes };
          delete newNodes[nodeId];
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              nodes: newNodes,
              updatedAt: Date.now()
            }
          };
        });
      },

      removeEdge: (edgeId) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          const newEdges = { ...state.currentKnowledgeBase.edges };
          delete newEdges[edgeId];
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              edges: newEdges,
              updatedAt: Date.now()
            }
          };
        });
      },
    })),
    {
      name: 'graph-store',
    }
  )
);