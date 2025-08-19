// 图谱状态管理 - Zustand Store

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { 
  KnowledgeBase, 
  Node, 
  Edge, 
  RelationNode,
  Block, 
  View, 
  EntityId,
  NodeViewConfig,
  EdgeViewConfig,
  RelationViewConfig,
  ViewType,
  SpatialViewFormat,
  LinearViewFormat,
  MediaViewFormat
} from '../types/structure';
import { NodeDisplayMode, EdgeDisplayMode, createView } from '../types/structure';
import { commandSystem } from '../core/command-system';

// Store 状态接口
interface GraphState {
  // 当前知识库
  currentKnowledgeBase: KnowledgeBase | null;
  
  // 当前激活的视图
  currentViewId: EntityId | null;
  
  // 打开的视图标签列表（按打开顺序）
  openViewIds: EntityId[];
  
  // 当前选中的实体
  selectedNodeIds: Set<EntityId>;
  selectedEdgeIds: Set<EntityId>;
  selectedRelationIds: Set<EntityId>;
  
  // 视图配置
  nodeViewConfigs: Record<EntityId, NodeViewConfig>;
  edgeViewConfigs: Record<EntityId, EdgeViewConfig>;
  relationViewConfigs: Record<EntityId, RelationViewConfig>;
  
  // UI 状态
  isLoading: boolean;
  error: string | null;
  
  // 右侧面板状态
  rightPanelOpen: boolean;
  rightPanelContent: {
    type: 'node' | 'edge' | 'relation' | 'view' | null;
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
  openViewInTab: (viewId: EntityId) => void;
  closeViewTab: (viewId: EntityId) => void;
  getOpenViews: () => View[];
  createView: (name: string, viewType: ViewType, format: SpatialViewFormat | LinearViewFormat | MediaViewFormat, options?: Partial<View>) => View;
  createTemporaryView: (baseViewId?: EntityId) => View;
  makeViewPermanent: (viewId: EntityId, name: string) => boolean;
  cleanupTemporaryViews: () => number;
  duplicateView: (sourceViewId: EntityId, newName?: string) => View | null;
  deleteView: (viewId: EntityId) => boolean;
  updateView: (viewId: EntityId, updates: Partial<View>) => void;
  
  // 选择操作
  selectNode: (nodeId: EntityId) => void;
  selectEdge: (edgeId: EntityId) => void;
  selectRelation: (relationId: EntityId) => void;
  deselectNode: (nodeId: EntityId) => void;
  deselectEdge: (edgeId: EntityId) => void;
  deselectRelation: (relationId: EntityId) => void;
  clearSelection: () => void;
  toggleNodeSelection: (nodeId: EntityId) => void;
  
  // 实体获取
  getNode: (nodeId: EntityId) => Node | null;
  getEdge: (edgeId: EntityId) => Edge | null;
  getRelation: (relationId: EntityId) => RelationNode | null;
  getBlock: (blockId: EntityId) => Block | null;
  getView: (viewId: EntityId) => View | null;
  
  // 视图配置
  setNodeViewConfig: (nodeId: EntityId, config: Partial<NodeViewConfig>) => void;
  setEdgeViewConfig: (edgeId: EntityId, config: Partial<EdgeViewConfig>) => void;
  setRelationViewConfig: (relationId: EntityId, config: Partial<RelationViewConfig>) => void;
  getNodeViewConfig: (nodeId: EntityId) => NodeViewConfig;
  getEdgeViewConfig: (edgeId: EntityId) => EdgeViewConfig;
  getRelationViewConfig: (relationId: EntityId) => RelationViewConfig;
  
  // 右侧面板
  openRightPanel: (type: 'node' | 'edge' | 'relation' | 'view', entityId: EntityId) => void;
  closeRightPanel: () => void;
  
  // 错误处理
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // 数据更新（通过命令系统调用后更新状态）
  updateNode: (nodeId: EntityId, updates: Partial<Node>) => void;
  updateEdge: (edgeId: EntityId, updates: Partial<Edge>) => void;
  updateRelation: (relationId: EntityId, updates: Partial<RelationNode>) => void;
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
  showLabel: true,
};

// 默认关系节点视图配置
const defaultRelationViewConfig: RelationViewConfig = {
  displayMode: 'dot', // 默认圆点模式
  isCollapsed: false,
  showParticipants: true,
  containerLayout: 'horizontal',
};

// 创建初始状态
const createInitialState = (): GraphState => ({
  currentKnowledgeBase: null,
  currentViewId: null,
  openViewIds: [],
  selectedNodeIds: new Set(),
  selectedEdgeIds: new Set(),
  selectedRelationIds: new Set(),
  nodeViewConfigs: {},
  edgeViewConfigs: {},
  relationViewConfigs: {},
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
          openViewIds: [kb.mainViewId], // 默认打开主视图
          selectedNodeIds: new Set(),
          selectedEdgeIds: new Set(),
          selectedRelationIds: new Set(),
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
          // 如果视图不在打开列表中，添加它
          const { openViewIds } = get();
          if (!openViewIds.includes(viewId)) {
            get().openViewInTab(viewId);
          } else {
            set({ currentViewId: viewId });
          }
        }
      },

      getCurrentView: () => {
        const { currentKnowledgeBase, currentViewId } = get();
        if (currentKnowledgeBase && currentViewId) {
          return currentKnowledgeBase.views[currentViewId] || null;
        }
        return null;
      },

      openViewInTab: (viewId) => {
        const kb = get().currentKnowledgeBase;
        if (!kb || !kb.views[viewId]) return;

        const { openViewIds } = get();
        if (!openViewIds.includes(viewId)) {
          set({
            openViewIds: [...openViewIds, viewId],
            currentViewId: viewId
          });
        } else {
          set({ currentViewId: viewId });
        }
      },

      closeViewTab: (viewId) => {
        const { openViewIds, currentViewId, currentKnowledgeBase } = get();
        
        if (!currentKnowledgeBase) return;
        
        // 不能关闭主视图
        if (viewId === currentKnowledgeBase.mainViewId) {
          console.warn('Cannot close main view');
          return;
        }

        const newOpenViewIds = openViewIds.filter(id => id !== viewId);
        
        // 如果关闭的是当前视图，需要切换到其他视图
        let newCurrentViewId = currentViewId;
        if (currentViewId === viewId) {
          if (newOpenViewIds.length > 0) {
            // 切换到最后一个打开的视图
            newCurrentViewId = newOpenViewIds[newOpenViewIds.length - 1];
          } else {
            // 如果没有其他打开的视图，打开主视图
            newOpenViewIds.push(currentKnowledgeBase.mainViewId);
            newCurrentViewId = currentKnowledgeBase.mainViewId;
          }
        }

        set({
          openViewIds: newOpenViewIds,
          currentViewId: newCurrentViewId
        });
      },

      getOpenViews: () => {
        const { currentKnowledgeBase, openViewIds } = get();
        if (!currentKnowledgeBase) return [];
        
        return openViewIds
          .map(viewId => currentKnowledgeBase.views[viewId])
          .filter(view => view !== undefined);
      },

      createView: (name, viewType, format, options = {}) => {
        const kb = get().currentKnowledgeBase;
        if (!kb) {
          throw new Error('No knowledge base available');
        }

        const viewId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newView = createView(viewId, name, viewType, format, options);

        set((state) => ({
          currentKnowledgeBase: {
            ...state.currentKnowledgeBase!,
            views: {
              ...state.currentKnowledgeBase!.views,
              [viewId]: newView
            },
            updatedAt: Date.now()
          }
        }));

        return newView;
      },

      createTemporaryView: (baseViewId) => {
        const kb = get().currentKnowledgeBase;
        if (!kb) {
          throw new Error('No knowledge base available');
        }

        const baseView = baseViewId ? kb.views[baseViewId] : null;
        const tempName = `临时视图_${new Date().toLocaleTimeString()}`;
        
        // 如果有基础视图，复制其内容，否则创建空白白板视图
        if (baseView) {
          return get().createView(
            tempName,
            baseView.viewType,
            baseView.format,
            {
              nodeIds: [...baseView.nodeIds],
              edgeIds: [...baseView.edgeIds],
              layout: JSON.parse(JSON.stringify(baseView.layout)),
              isTemporary: true,
              properties: { ...baseView.properties }
            }
          );
        } else {
          return get().createView(
            tempName,
            'spatial',
            'whiteboard',
            { isTemporary: true }
          );
        }
      },

      makeViewPermanent: (viewId, name) => {
        const kb = get().currentKnowledgeBase;
        if (!kb || !kb.views[viewId]) {
          return false;
        }

        const view = kb.views[viewId];
        if (!view.isTemporary) {
          return false; // 已经是永久视图
        }

        set((state) => ({
          currentKnowledgeBase: {
            ...state.currentKnowledgeBase!,
            views: {
              ...state.currentKnowledgeBase!.views,
              [viewId]: {
                ...view,
                name: name.trim(),
                isTemporary: false,
                updatedAt: Date.now()
              }
            },
            updatedAt: Date.now()
          }
        }));

        return true;
      },

      cleanupTemporaryViews: () => {
        const kb = get().currentKnowledgeBase;
        if (!kb) {
          return 0;
        }

        const temporaryViewIds = Object.keys(kb.views).filter(
          viewId => kb.views[viewId].isTemporary
        );

        if (temporaryViewIds.length === 0) {
          return 0;
        }

        set((state) => {
          const newViews = { ...state.currentKnowledgeBase!.views };
          temporaryViewIds.forEach(viewId => {
            delete newViews[viewId];
          });

          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase!,
              views: newViews,
              updatedAt: Date.now()
            },
            // 如果当前视图被删除，切换到主视图
            currentViewId: temporaryViewIds.includes(state.currentViewId || '') 
              ? kb.mainViewId 
              : state.currentViewId
          };
        });

        console.log(`🧹 已清理 ${temporaryViewIds.length} 个临时视图`);
        return temporaryViewIds.length;
      },

      duplicateView: (sourceViewId, newName) => {
        const kb = get().currentKnowledgeBase;
        if (!kb || !kb.views[sourceViewId]) {
          return null;
        }

        const sourceView = kb.views[sourceViewId];
        const duplicatedName = newName || `${sourceView.name} - 副本`;
        
        const newView = get().createView(
          duplicatedName,
          sourceView.viewType,
          sourceView.format,
          {
            nodeIds: [...sourceView.nodeIds],
            edgeIds: [...sourceView.edgeIds],
            layout: JSON.parse(JSON.stringify(sourceView.layout)), // 深拷贝
            isTemporary: sourceView.isTemporary,
            properties: { ...sourceView.properties }
          }
        );

        return newView;
      },

      deleteView: (viewId) => {
        const kb = get().currentKnowledgeBase;
        if (!kb || !kb.views[viewId]) {
          return false;
        }

        // 不能删除主视图
        if (kb.mainViewId === viewId) {
          console.warn('Cannot delete main view');
          return false;
        }

        set((state) => {
          const newViews = { ...state.currentKnowledgeBase!.views };
          delete newViews[viewId];
          
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase!,
              views: newViews,
              updatedAt: Date.now()
            },
            // 如果删除的是当前视图，切换到主视图
            currentViewId: state.currentViewId === viewId ? kb.mainViewId : state.currentViewId
          };
        });

        return true;
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

      selectRelation: (relationId) => {
        set((state) => ({
          selectedRelationIds: new Set([...state.selectedRelationIds, relationId])
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

      deselectRelation: (relationId) => {
        set((state) => {
          const newSet = new Set(state.selectedRelationIds);
          newSet.delete(relationId);
          return { selectedRelationIds: newSet };
        });
      },

      clearSelection: () => {
        set({
          selectedNodeIds: new Set(),
          selectedEdgeIds: new Set(),
          selectedRelationIds: new Set()
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
        
        // 先检查普通边
        if (kb?.edges[edgeId]) {
          return kb.edges[edgeId];
        }
        
        // 检查是否为关系连线（格式：relationId-participant-index）
        const relationParticipantMatch = edgeId.match(/^(.+)-participant-(\d+)$/);
        if (relationParticipantMatch && kb?.relations) {
          const [, relationId, indexStr] = relationParticipantMatch;
          const relation = kb.relations[relationId];
          const index = parseInt(indexStr);
          
          if (relation && relation.participants && relation.participants[index]) {
            const participantId = relation.participants[index];
            const participantExists = !!(kb.nodes[participantId] || kb.relations?.[participantId]);
            
            // 动态创建关系连线边对象
            return {
              meta: {
                id: edgeId,
                semanticLabel: participantExists ? '参与' : '丢失参与',
                tags: participantExists ? [] : ['problem'],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                version: 1
              },
              sourceNodeId: relationId,
              targetNodeId: participantExists ? participantId : `missing-${participantId}`,
              blocks: [],
              attributes: {
                isRelationParticipant: true,
                relationId: relationId,
                hasProblem: !participantExists,
                originalTargetId: participantId
              }
            };
          }
        }
        
        return null;
      },

      getRelation: (relationId) => {
        const kb = get().currentKnowledgeBase;
        return kb?.relations[relationId] || null;
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

      setRelationViewConfig: (relationId, config) => {
        set((state) => ({
          relationViewConfigs: {
            ...state.relationViewConfigs,
            [relationId]: {
              ...get().getRelationViewConfig(relationId),
              ...config
            }
          }
        }));
      },

      getRelationViewConfig: (relationId) => {
        const config = get().relationViewConfigs[relationId];
        return config || defaultRelationViewConfig;
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

      updateRelation: (relationId, updates) => {
        set((state) => {
          if (!state.currentKnowledgeBase) return state;
          return {
            currentKnowledgeBase: {
              ...state.currentKnowledgeBase,
              relations: {
                ...state.currentKnowledgeBase.relations,
                [relationId]: {
                  ...state.currentKnowledgeBase.relations?.[relationId],
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