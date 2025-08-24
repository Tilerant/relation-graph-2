import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MainLayout } from './components/layout/MainLayout';
import { useGraphStore } from './store/graph-store';
import { registerNodeCommands } from './core/node-commands';
import { registerEdgeCommands } from './core/edge-commands';
import { registerBlockCommands } from './core/block-commands';
import { registerViewCommands } from './core/view-commands';
import { keyboardHandler } from './core/keyboard-handler';
import type { KnowledgeBase, Node, Edge, RelationNode, Block, View } from './types/structure';
import { createView } from './types/structure';
import './App.css';

// 创建示例数据
const createSampleKnowledgeBase = (): KnowledgeBase => {
  const now = Date.now();
  
  // 创建示例节点
  const node1: Node = {
    meta: {
      id: 'node_1',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: ['概念'],
      entityLabel: '核心概念'
    },
    title: '图谱系统',
    content: '这是一个以结构为核心的图谱笔记系统，支持节点、边、块的结构化表达。',
    attributes: {
      category: '核心系统',
      priority: 'high'
    },
    blocks: [
      {
        id: 'block_1',
        type: 'text',
        content: '这是一个以结构为核心的图谱笔记系统，支持节点、边、块的结构化表达。',
        properties: {},
        order: 0
      }
    ]
  };

  const node2: Node = {
    meta: {
      id: 'node_2',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: ['组件'],
      entityLabel: '技术组件'
    },
    title: 'React Flow',
    content: '用于构建白板视图的React组件库，支持节点拖拽和连接。',
    attributes: {
      type: 'library',
      language: 'React'
    },
    blocks: [
      {
        id: 'block_2',
        type: 'text',
        content: '支持节点拖拽、连接线、缩放等交互功能。',
        properties: {},
        order: 0
      }
    ]
  };


  // 创建示例边（轻量边）
  const edge1: Edge = {
    meta: {
      id: 'edge_1',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: [],
      semanticLabel: '依赖于'
    },
    sourceNodeId: 'node_1',
    targetNodeId: 'node_2',
    attributes: {
      strength: 'strong',
      note: '系统依赖于React Flow进行图形展示'
    }
  };


  // 创建示例关系节点（超边）
  const relation1: RelationNode = {
    meta: {
      id: 'relation_1',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: ['技术栈'],
      relationType: '集合'
    },
    title: '前端技术栈',
    content: '构成图谱系统前端的核心技术组件',
    blocks: [
      {
        id: 'block_r1',
        type: 'text',
        content: '这个关系节点包含了前端开发的核心技术组件，用于构建图谱的可视化界面。',
        properties: {},
        order: 0
      }
    ],
    participants: ['node_2'], // 参与者：React Flow
    attributes: {
      category: 'frontend',
      importance: 'high',
      containerLayout: 'horizontal'
    }
  };

  // 创建主视图 - 使用新的视图创建函数
  const mainView: View = createView(
    'view_main',
    '主视图',
    'spatial',
    'whiteboard',
    {
      nodeIds: ['node_1', 'node_2'],
      edgeIds: ['edge_1'],
      relationIds: ['relation_1'],
      layout: {
        nodePositions: {
          'node_1': { x: 100, y: 100 },
          'node_2': { x: 300, y: 50 }
        },
        relationPositions: {
          'relation_1': { x: 300, y: 250 }
        },
        nodeStyles: {},
        edgeStyles: {},
        relationStyles: {}
      },
      isTemporary: false
    }
  );

  // 创建知识库
  const knowledgeBase: KnowledgeBase = {
    id: 'kb_sample',
    name: '示例知识库',
    description: '演示图谱系统功能的示例知识库',
    mainViewId: 'view_main',
    nodes: {
      'node_1': node1,
      'node_2': node2
    },
    edges: {
      'edge_1': edge1
    },
    relations: {
      'relation_1': relation1
    },
    views: {
      'view_main': mainView
    },
    blocks: {
      'block_1': node1.blocks[0],
      'block_2': node2.blocks[0],
      'block_r1': relation1.blocks[0]
    },
    createdAt: now,
    updatedAt: now
  };

  return knowledgeBase;
};

function App() {
  const { loadKnowledgeBase, currentKnowledgeBase } = useGraphStore();

  // 应用启动时初始化
  useEffect(() => {
    // 注册所有命令处理器
    registerNodeCommands();
    registerEdgeCommands();
    registerBlockCommands();
    registerViewCommands();
    
    // 初始化键盘处理器（已在模块加载时初始化）
    console.log('⌨️ 键盘快捷键已启用: Ctrl+Z(撤销), Ctrl+Y(重做)');
    console.log('🎯 命令系统已初始化: 所有增删改操作支持撤销/重做');
    
    // 加载示例数据
    if (!currentKnowledgeBase) {
      const sampleKB = createSampleKnowledgeBase();
      loadKnowledgeBase(sampleKB);
    }

    // 清理函数
    return () => {
      keyboardHandler.destroy();
    };
  }, [loadKnowledgeBase, currentKnowledgeBase]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <MainLayout />
      </div>
    </DndProvider>
  );
}

export default App;
