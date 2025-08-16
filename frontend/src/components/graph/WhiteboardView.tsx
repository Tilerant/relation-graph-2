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
import { GraphNode } from './nodes/GraphNode';
import { GraphEdge } from './edges/GraphEdge';
import { FloatingToolbar } from './FloatingToolbar';
import { createNodeCommand } from '../../core/node-commands';
import { createEdgeCommand } from '../../core/edge-commands';
import { updateNodePositionCommand } from '../../core/view-commands';
import type { Node, Edge, Block, EntityId } from '../../types/structure';

// 自定义节点类型
const nodeTypes = {
  graphNode: GraphNode,
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

interface WhiteboardViewProps {
  className?: string;
}

const WhiteboardViewContent: React.FC<WhiteboardViewProps> = ({ className }) => {
  const {
    currentKnowledgeBase,
    getCurrentView,
    getNodeViewConfig,
    getEdgeViewConfig,
    selectNode,
    selectEdge,
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

  // 双击检测状态
  const [lastClickTime, setLastClickTime] = React.useState(0);
  const [lastClickPosition, setLastClickPosition] = React.useState({ x: 0, y: 0 });

  // 转换数据为React Flow格式
  const { nodes, edges } = useMemo(() => {
    if (!currentKnowledgeBase || !currentView) {
      return { nodes: [], edges: [] };
    }

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

    const flowEdges = currentView.edgeIds
      .map(edgeId => {
        const edge = currentKnowledgeBase.edges[edgeId];
        if (!edge) return null;
        
        const viewConfig = getEdgeViewConfig(edgeId);
        return convertToFlowEdge(edge, viewConfig);
      })
      .filter(Boolean) as FlowEdge[];

    return { nodes: flowNodes, edges: flowEdges };
  }, [currentKnowledgeBase, currentView, getNodeViewConfig, getEdgeViewConfig]);

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
      openRightPanel('node', node.id);
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
  }, [clearSelection, currentView, selectNode, screenToFlowPosition, lastClickTime, lastClickPosition]);


  // 节点拖拽结束处理
  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: FlowNode) => {
      if (!currentView) return;
      
      try {
        // 使用命令模式更新节点位置
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
      } catch (error) {
        console.error('❌ 节点位置更新失败:', error);
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

      {/* 漂浮工具栏 */}
      {floatingToolbar && (
        <FloatingToolbar
          nodeId={floatingToolbar.nodeId}
          position={floatingToolbar.position}
          onClose={() => setFloatingToolbar(null)}
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