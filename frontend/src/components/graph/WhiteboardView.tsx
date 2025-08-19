// 白板视图组件 - React Flow 实现

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { Connection, Edge as FlowEdge, Node as FlowNode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '../../store/graph-store';
import { UnifiedNode } from './nodes/UnifiedNode';
import { GraphEdge } from './edges/GraphEdge';
import { FloatingToolbar } from './FloatingToolbar';
import { EdgeFloatingToolbar } from './EdgeFloatingToolbar';
import { createNodeCommand } from '../../core/node-commands';
import { createEdgeCommand } from '../../core/edge-commands';
import { updateNodePositionCommand } from '../../core/view-commands';
import type { Node, Edge, RelationNode, Block, EntityId } from '../../types/structure';

// 自定义节点类型
const nodeTypes = {
  graphNode: UnifiedNode,
};

// 自定义边类型
const edgeTypes = {
  graphEdge: GraphEdge,
};

// 将内部节点转换为React Flow节点
const convertToFlowNode = (node: Node, viewConfig: any): FlowNode => {
  return {
    id: node.meta.id,
    type: 'graphNode',
    position: { x: 0, y: 0 }, // 从视图布局中获取
    data: {
      node,
      viewConfig,
      isRelation: false,
    },
  };
};

// 将内部边转换为React Flow边
const convertToFlowEdge = (edge: Edge, viewConfig: any): FlowEdge => {
  return {
    id: edge.meta.id,
    type: 'graphEdge',
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    data: {
      edge,
      viewConfig,
    },
  };
};

// 将关系节点转换为React Flow节点（复用GraphNode组件）
const convertRelationToFlowNode = (relation: RelationNode, viewConfig: any): FlowNode => {
  return {
    id: relation.meta.id,
    type: 'graphNode', // 复用GraphNode组件
    position: { x: 0, y: 0 }, // 从视图布局中获取
    data: {
      relation, // 传入relation而不是node
      viewConfig,
      isRelation: true, // 标记为关系节点
    },
  };
};

interface WhiteboardViewProps {
  className?: string;
}

const WhiteboardViewContent: React.FC<WhiteboardViewProps> = ({ className }) => {
  const {
    currentKnowledgeBase,
    getCurrentView,
    getNodeViewConfig,
    getEdgeViewConfig,
    getRelationViewConfig,
    selectNode,
    selectEdge,
    selectRelation,
    clearSelection,
    openRightPanel,
    selectedNodeIds,
  } = useGraphStore();

  const { screenToFlowPosition } = useReactFlow();

  const currentView = getCurrentView();
  
  // 漂浮工具栏状态
  const [floatingToolbar, setFloatingToolbar] = React.useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);

  // 边漂浮工具栏状态
  const [edgeFloatingToolbar, setEdgeFloatingToolbar] = React.useState<{
    edgeId: string;
    position: { x: number; y: number };
  } | null>(null);

  // 双击检测状态
  const [lastClickTime, setLastClickTime] = React.useState(0);
  const [lastClickPosition, setLastClickPosition] = React.useState({ x: 0, y: 0 });

  // 转换数据为React Flow格式
  const { nodes, edges } = useMemo(() => {
    if (!currentKnowledgeBase || !currentView) {
      return { nodes: [], edges: [] };
    }

    // 处理普通节点
    const flowNodes = currentView.nodeIds
      .map(nodeId => {
        const node = currentKnowledgeBase.nodes[nodeId];
        if (!node) return null;
        
        const viewConfig = getNodeViewConfig(nodeId);
        const position = currentView.layout.nodePositions[nodeId] || { x: 0, y: 0 };
        
        return {
          ...convertToFlowNode(node, viewConfig),
          position,
        };
      })
      .filter(Boolean) as FlowNode[];

    // 处理关系节点
    const relationNodes = (currentView.relationIds || [])
      .map(relationId => {
        const relation = currentKnowledgeBase.relations?.[relationId];
        if (!relation) return null;
        
        const viewConfig = getRelationViewConfig(relationId);
        const position = currentView.layout.relationPositions?.[relationId] || { x: 0, y: 0 };
        
        return {
          ...convertRelationToFlowNode(relation, viewConfig),
          position,
        };
      })
      .filter(Boolean) as FlowNode[];

    // 合并所有节点
    const allNodes = [...flowNodes, ...relationNodes];

    // 收集所有被引用的丢失节点ID
    const referencedMissingNodeIds = new Set<string>();
    
    // 处理普通边，为丢失的节点创建占位符
    const flowEdges: FlowEdge[] = [];
    
    currentView.edgeIds.forEach(edgeId => {
      const edge = currentKnowledgeBase.edges[edgeId];
      if (!edge) return;
      
      // 检查源节点和目标节点是否存在
      const sourceExists = !!(currentKnowledgeBase.nodes[edge.sourceNodeId] || currentKnowledgeBase.relations?.[edge.sourceNodeId]);
      const targetExists = !!(currentKnowledgeBase.nodes[edge.targetNodeId] || currentKnowledgeBase.relations?.[edge.targetNodeId]);
      
      // 记录被引用的丢失节点
      if (!sourceExists) {
        referencedMissingNodeIds.add(edge.sourceNodeId);
      }
      if (!targetExists) {
        referencedMissingNodeIds.add(edge.targetNodeId);
      }
      
      // 创建边，目标可能是占位符节点
      const actualSourceId = sourceExists ? edge.sourceNodeId : `missing-${edge.sourceNodeId}`;
      const actualTargetId = targetExists ? edge.targetNodeId : `missing-${edge.targetNodeId}`;
      const hasProblem = !sourceExists || !targetExists;
      
      const viewConfig = getEdgeViewConfig(edgeId);
      const flowEdge = convertToFlowEdge(edge, viewConfig);
      
      // 修改边的属性以反映问题状态
      flowEdges.push({
        ...flowEdge,
        source: actualSourceId,
        target: actualTargetId,
        data: {
          ...flowEdge.data,
          edge: {
            ...flowEdge.data.edge,
            sourceNodeId: actualSourceId,
            targetNodeId: actualTargetId,
            meta: {
              ...flowEdge.data.edge.meta,
              semanticLabel: hasProblem ? `⚠️ ${flowEdge.data.edge.meta.semanticLabel}` : flowEdge.data.edge.meta.semanticLabel,
              tags: hasProblem ? [...flowEdge.data.edge.meta.tags, 'problem'] : flowEdge.data.edge.meta.tags
            },
            attributes: {
              ...flowEdge.data.edge.attributes,
              hasProblem: hasProblem,
              originalSourceId: edge.sourceNodeId,
              originalTargetId: edge.targetNodeId
            }
          }
        },
        style: hasProblem ? {
          stroke: '#f97316', // 橙色表示普通边有问题
          strokeWidth: 2,
          strokeDasharray: '8,4'
        } : undefined
      });
    });

    // 检查关系节点的参与者引用
    (currentView.relationIds || []).forEach(relationId => {
      const relation = currentKnowledgeBase.relations?.[relationId];
      if (!relation || !relation.participants) return;

      relation.participants.forEach((participantId) => {
        // 检查参与者是否存在于知识库中
        const participantExists = !!(currentKnowledgeBase.nodes[participantId] || currentKnowledgeBase.relations?.[participantId]);
        
        // 记录被引用的丢失节点
        if (!participantExists) {
          referencedMissingNodeIds.add(participantId);
        }
      });
    });

    // 创建所有被引用的丢失节点的占位符
    const missingNodes: FlowNode[] = [];
    referencedMissingNodeIds.forEach(originalNodeId => {
      const missingNodeId = `missing-${originalNodeId}`;
      const position = currentView.layout.nodePositions[originalNodeId] || 
                      currentView.layout.relationPositions?.[originalNodeId] || 
                      { x: Math.random() * 400 + 200, y: Math.random() * 400 + 200 };
      
      missingNodes.push({
        id: missingNodeId,
        type: 'graphNode',
        position: position,
        data: {
          node: {
            meta: {
              id: missingNodeId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              version: 1,
              tags: ['missing'],
              entityLabel: '丢失节点'
            },
            title: '❓ 丢失的节点',
            content: `原节点 ID: ${originalNodeId}`,
            attributes: {
              isMissing: true,
              originalId: originalNodeId
            },
            blocks: [
              {
                id: `missing-block-${originalNodeId}`,
                type: 'text',
                content: `原节点 ${originalNodeId} 已被删除`,
                properties: {},
                order: 0
              }
            ]
          },
          viewConfig: {
            displayMode: 'BOX',
            isCollapsed: false,
            showTitle: true,
            showBlocks: true
          },
          isRelation: false
        }
      });
    });

    // 生成关系节点到参与者的连线
    const relationEdges: FlowEdge[] = [];
    
    (currentView.relationIds || []).forEach(relationId => {
      const relation = currentKnowledgeBase.relations?.[relationId];
      if (!relation || !relation.participants) return;

      relation.participants.forEach((participantId, index) => {
        // 检查参与者是否存在于知识库中
        const participantExists = !!(currentKnowledgeBase.nodes[participantId] || currentKnowledgeBase.relations?.[participantId]);
        
        
        // 为所有参与者创建连线，无论它们是否存在
        const targetId = participantExists ? participantId : `missing-${participantId}`;
        const hasProblem = !participantExists;
        
        relationEdges.push({
          id: `${relationId}-participant-${index}`,
          type: 'graphEdge',
          source: relationId,
          target: targetId,
          selectable: true,
          focusable: true,
          data: {
            edge: {
              meta: {
                id: `${relationId}-participant-${index}`,
                semanticLabel: hasProblem ? '丢失参与' : '参与',
                tags: hasProblem ? ['problem'] : [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                version: 1
              },
              sourceNodeId: relationId,
              targetNodeId: targetId,
              blocks: [],
              attributes: {
                isRelationParticipant: true,
                relationId: relationId,
                hasProblem: hasProblem,
                originalTargetId: participantId
              }
            },
            viewConfig: {
              displayMode: 'LINE',
              showLabel: false
            }
          },
          style: {
            stroke: hasProblem ? '#ef4444' : '#a855f7', // 红色表示有问题，紫色正常
            strokeWidth: 2,
            strokeDasharray: hasProblem ? '10,5' : '5,5' // 不同虚线样式
          }
        });
      });
    });

    const allEdges = [...flowEdges, ...relationEdges];
    const allNodesWithMissing = [...allNodes, ...missingNodes];

    return { nodes: allNodesWithMissing, edges: allEdges };
  }, [currentKnowledgeBase, currentView, getNodeViewConfig, getEdgeViewConfig, getRelationViewConfig]);

  // 使用React Flow的状态管理
  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // 更新节点和边
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  // 连接处理
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target || !currentView) return;
      
      try {
        // 使用命令模式创建边
        const result = await createEdgeCommand(params.source, params.target, '关联');
        
        if (result.success) {
          console.log('✅ 边创建成功:', result.data?.edgeId);
          
          // 同时更新React Flow的边状态
          setEdges((eds) => addEdge({
            id: result.data.edgeId,
            source: params.source,
            target: params.target,
            type: 'graphEdge'
          }, eds));
        } else {
          console.error('❌ 边创建失败:', result.error);
        }
      } catch (error) {
        console.error('❌ 边创建失败:', error);
      }
    },
    [currentView, setEdges]
  );

  // 节点点击处理
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      selectNode(node.id);
      
      // 右键点击显示工具栏
      if (event.button === 2 || event.ctrlKey) {
        event.preventDefault();
        setFloatingToolbar({
          nodeId: node.id,
          position: { x: event.clientX, y: event.clientY }
        });
      }
    },
    [selectNode]
  );

  // 节点右键菜单处理
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      event.preventDefault();
      
      // 所有节点（包括关系节点）都显示FloatingToolbar
      setFloatingToolbar({
        nodeId: node.id,
        position: { x: event.clientX, y: event.clientY }
      });
    },
    []
  );

  // 节点双击处理 - 打开详情面板
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      // 检查是否为关系节点
      const isRelationNode = node.data && node.data.isRelation;
      if (isRelationNode) {
        openRightPanel('relation', node.id);
      } else {
        openRightPanel('node', node.id);
      }
    },
    [openRightPanel]
  );

  // 边点击处理
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: FlowEdge) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  // 边右键菜单处理
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: FlowEdge) => {
      event.preventDefault();
      
      // 显示边的FloatingToolbar
      setEdgeFloatingToolbar({
        edgeId: edge.id,
        position: { x: event.clientX, y: event.clientY }
      });
    },
    []
  );

  // 画布点击处理 - 清除选择或双击创建节点
  const onPaneClick = useCallback(async (event: React.MouseEvent) => {
    const currentTime = Date.now();
    const currentPosition = { x: event.clientX, y: event.clientY };
    
    // 检测双击：两次点击间隔小于300ms且位置接近
    const timeDiff = currentTime - lastClickTime;
    const positionDiff = Math.abs(currentPosition.x - lastClickPosition.x) + 
                        Math.abs(currentPosition.y - lastClickPosition.y);
    
    const isDoubleClick = timeDiff < 300 && positionDiff < 10;
    
    if (isDoubleClick && currentView) {
      console.log('🎯 检测到双击!');
      
      try {
        // 使用React Flow的API获取正确的坐标
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        console.log('📍 双击位置:', position);

        // 使用命令模式创建节点
        const result = await createNodeCommand('新节点', position, '新概念');
        
        if (result.success) {
          console.log('✅ 节点创建成功:', result.data?.nodeId);
          // 选中新创建的节点
          selectNode(result.data.nodeId);
        } else {
          console.error('❌ 创建节点失败:', result.error);
        }
        
        // 重置双击检测
        setLastClickTime(0);
        return;
      } catch (error) {
        console.error('❌ 创建节点失败:', error);
      }
    }
    
    // 更新点击状态
    setLastClickTime(currentTime);
    setLastClickPosition(currentPosition);
    
    // 普通点击：清除选择
    clearSelection();
    setFloatingToolbar(null);
    setEdgeFloatingToolbar(null);
  }, [clearSelection, currentView, selectNode, screenToFlowPosition, lastClickTime, lastClickPosition]);


  // 节点拖拽结束处理 - 支持节点和关系节点
  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: FlowNode) => {
      if (!currentView) return;
      
      try {
        // 检查是否为关系节点
        const isRelationNode = node.data && node.data.isRelation;
        
        if (isRelationNode) {
          // 直接更新关系节点位置（暂时不通过命令系统）
          const { updateView } = useGraphStore.getState();
          const updatedView = {
            ...currentView,
            layout: {
              ...currentView.layout,
              relationPositions: {
                ...currentView.layout.relationPositions,
                [node.id]: node.position
              }
            },
            updatedAt: Date.now()
          };
          
          updateView(currentView.id, updatedView);
          console.log('📍 关系节点位置更新成功:', node.id, node.position);
        } else {
          // 使用命令模式更新普通节点位置
          const result = await updateNodePositionCommand(
            currentView.id,
            node.id,
            node.position
          );
          
          if (result.success) {
            console.log('📍 节点位置更新成功:', node.id, node.position);
          } else {
            console.error('❌ 节点位置更新失败:', result.error);
          }
        }
      } catch (error) {
        console.error('❌ 位置更新失败:', error);
      }
    },
    [currentView]
  );

  if (!currentKnowledgeBase || !currentView) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-gray-500">请选择一个知识库和视图</p>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.style?.background) return n.style.background as string;
            return '#eee';
          }}
          nodeColor={(n) => {
            if (n.style?.background) return n.style.background as string;
            return '#fff';
          }}
          nodeBorderRadius={2}
        />
      </ReactFlow>

      {/* 节点漂浮工具栏 */}
      {floatingToolbar && (
        <FloatingToolbar
          nodeId={floatingToolbar.nodeId}
          position={floatingToolbar.position}
          onClose={() => setFloatingToolbar(null)}
        />
      )}

      {/* 边漂浮工具栏 */}
      {edgeFloatingToolbar && (
        <EdgeFloatingToolbar
          edgeId={edgeFloatingToolbar.edgeId}
          position={edgeFloatingToolbar.position}
          onClose={() => setEdgeFloatingToolbar(null)}
        />
      )}
    </div>
  );
};

// 主要导出组件，包装ReactFlowProvider
export const WhiteboardView: React.FC<WhiteboardViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WhiteboardViewContent {...props} />
    </ReactFlowProvider>
  );
};