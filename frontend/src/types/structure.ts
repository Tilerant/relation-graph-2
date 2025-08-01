// 核心数据结构定义

// 基础类型定义
export type EntityId = string;
export type Timestamp = number;

// 可变属性 - 用户可以自行添加的字段
export interface DynamicProperties {
  [key: string]: any;
}

// 元属性 - 系统级属性
export interface MetaProperties {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
  tags: string[];
}

// 节点元属性扩展
export interface NodeMetaProperties extends MetaProperties {
  entityLabel: string; // 实体标签，用于模板系统
}

// 边元属性扩展
export interface EdgeMetaProperties extends MetaProperties {
  semanticLabel: string; // 语义标签，用于模板系统
  isHyperEdge: boolean; // 是否为超边
}

// 内容块类型
export interface Block {
  id: EntityId;
  type: 'text' | 'image' | 'file' | 'code' | 'table' | 'embed';
  content: any; // 根据类型而定的内容
  properties: DynamicProperties;
  order: number; // 块的显示顺序
}

// 节点定义
export interface Node {
  meta: NodeMetaProperties;
  properties: DynamicProperties;
  title: string;
  blocks: Block[]; // 内容块索引
}

// 边定义
export interface Edge {
  meta: EdgeMetaProperties;
  properties: DynamicProperties;
  sourceNodeId: EntityId;
  targetNodeId: EntityId;
  blocks: Block[]; // 边也可以包含内容块
}

// 视图布局信息
export interface LayoutInfo {
  nodePositions: Record<EntityId, { x: number; y: number }>;
  nodeStyles: Record<EntityId, any>;
  edgeStyles: Record<EntityId, any>;
  viewBox?: { x: number; y: number; width: number; height: number };
}

// 视图定义
export interface View {
  id: EntityId;
  name: string;
  type: 'whiteboard' | 'webpage' | 'hybrid';
  nodeIds: EntityId[]; // 视图中包含的节点
  edgeIds: EntityId[]; // 视图中包含的边
  layout: LayoutInfo; // 布局信息
  query?: string; // 生成视图的查询条件（可选）
  isTemporary: boolean; // 是否为临时视图
  properties: DynamicProperties;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 节点显示模式
export enum NodeDisplayMode {
  DOT = 'dot',           // 圆点模式
  BOX = 'box',           // 框模式  
  CARD = 'card'          // 卡片模式
}

// 边显示模式
export enum EdgeDisplayMode {
  LINE = 'line',         // 纯连线
  BOX = 'box',           // 框模式
  DOT = 'dot',           // 圆点模式
  CARD = 'card'          // 卡片模式
}

// 节点视图配置
export interface NodeViewConfig {
  displayMode: NodeDisplayMode;
  isCollapsed: boolean;
  width?: number;
  height?: number;
  showTitle: boolean;
  showBlocks: boolean;
}

// 边视图配置
export interface EdgeViewConfig {
  displayMode: EdgeDisplayMode;
  showBlocks: boolean;
}

// 知识库定义
export interface KnowledgeBase {
  id: EntityId;
  name: string;
  description: string;
  mainViewId: EntityId; // 主视图ID
  nodes: Record<EntityId, Node>;
  edges: Record<EntityId, Edge>;
  views: Record<EntityId, View>;
  blocks: Record<EntityId, Block>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}