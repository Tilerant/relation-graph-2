# 技术实现细节

## 核心技术栈

### 前端框架与库
```json
{
  "react": "^19.1.0",              // 最新React版本，支持Concurrent特性
  "typescript": "~5.8.3",         // 严格类型检查
  "vite": "^7.0.4",              // 现代构建工具
  "zustand": "^5.0.7",           // 轻量级状态管理
  "@xyflow/react": "^12.8.2",    // 图形交互库
  "platejs": "^49.2.3",          // 富文本编辑框架
  "tailwindcss": "^4.1.11",      // 原子化CSS框架
  "react-dnd": "^16.0.1"         // 拖拽功能库
}
```

### 开发工具链
```json
{
  "eslint": "^9.30.1",           // 代码质量检查
  "typescript-eslint": "^8.35.1", // TS规则集
  "prettier": "配置中",           // 代码格式化
  "husky": "配置中",             // Git钩子
  "lint-staged": "配置中"        // 暂存区检查
}
```

## 状态管理架构

### Zustand Store 设计

#### 1. 状态结构
```typescript
interface GraphState {
  // 数据状态
  currentKnowledgeBase: KnowledgeBase | null;
  currentViewId: EntityId | null;
  openViewIds: EntityId[];
  
  // 选择状态  
  selectedNodeIds: Set<EntityId>;
  selectedEdgeIds: Set<EntityId>;
  selectedRelationIds: Set<EntityId>;
  
  // 视图配置
  nodeViewConfigs: Record<EntityId, NodeViewConfig>;
  edgeViewConfigs: Record<EntityId, EdgeViewConfig>;
  relationViewConfigs: Record<EntityId, RelationViewConfig>;
  
  // UI状态
  isLoading: boolean;
  error: string | null;
  rightPanelOpen: boolean;
  rightPanelContent: 'node' | 'edge' | 'relation' | null;
  rightPanelEntityId: EntityId | null;
}
```

#### 2. 动作定义
```typescript
interface GraphActions {
  // 知识库操作
  loadKnowledgeBase: (kb: KnowledgeBase) => void;
  updateKnowledgeBase: (updates: Partial<KnowledgeBase>) => void;
  
  // 视图操作
  setCurrentView: (viewId: EntityId) => void;
  openView: (viewId: EntityId) => void;
  closeView: (viewId: EntityId) => void;
  
  // 选择操作
  selectNode: (nodeId: EntityId) => void;
  selectMultipleNodes: (nodeIds: EntityId[]) => void;
  clearSelection: () => void;
  
  // UI操作
  openRightPanel: (type: 'node' | 'edge' | 'relation', entityId: EntityId) => void;
  closeRightPanel: () => void;
}
```

#### 3. 选择器优化
```typescript
// 细粒度状态订阅，避免不必要的重渲染
const useCurrentView = () => useGraphStore(state => {
  const kb = state.currentKnowledgeBase;
  const viewId = state.currentViewId;
  return kb && viewId ? kb.views[viewId] : null;
});

const useSelectedNodes = () => useGraphStore(state => {
  const kb = state.currentKnowledgeBase;
  const selectedIds = state.selectedNodeIds;
  return kb ? Array.from(selectedIds).map(id => kb.nodes[id]).filter(Boolean) : [];
});
```

## 命令系统实现

### 1. 命令模式架构

#### 命令接口定义
```typescript
interface Command<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  id: string;
}

interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  changes?: EntityChange[];
}

interface CommandHandler<T = any> {
  (payload: T): Promise<CommandResult>;
}
```

#### 命令注册与执行
```typescript
class CommandSystem {
  private registry = new CommandRegistry();
  private history: Command[] = [];
  private currentIndex = -1;
  
  async execute<T>(command: Command<T>): Promise<CommandResult> {
    const handler = this.registry.getHandler(command.type);
    if (!handler) {
      throw new Error(`No handler for command: ${command.type}`);
    }
    
    const result = await handler(command.payload);
    
    if (result.success) {
      // 成功执行，添加到历史
      this.addToHistory(command);
    }
    
    return result;
  }
  
  async undo(): Promise<void> {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      await this.executeUndo(command);
      this.currentIndex--;
    }
  }
  
  async redo(): Promise<void> {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      await this.executeRedo(command);
    }
  }
}
```

### 2. 命令处理器实现

#### 节点命令处理器
```typescript
// 创建节点命令
export const createNodeHandler = async (payload: CreateNodePayload): Promise<CommandResult> => {
  const { getKnowledgeBase, updateKnowledgeBase } = useGraphStore.getState();
  
  try {
    const kb = getKnowledgeBase();
    if (!kb) throw new Error('No knowledge base loaded');
    
    const newNode: Node = {
      meta: {
        id: payload.id || generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        tags: payload.tags || [],
        entityLabel: payload.entityLabel || 'default'
      },
      title: payload.title,
      content: payload.content || '',
      blocks: payload.blocks || [],
      attributes: payload.attributes || {}
    };
    
    const updatedKb = {
      ...kb,
      nodes: { ...kb.nodes, [newNode.meta.id]: newNode },
      updatedAt: Date.now()
    };
    
    updateKnowledgeBase(updatedKb);
    
    return {
      success: true,
      data: { nodeId: newNode.meta.id },
      changes: [{
        type: 'create',
        entityType: 'node',
        entityId: newNode.meta.id,
        newValue: newNode
      }]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 3. 撤销/重做机制

#### 变更追踪
```typescript
interface EntityChange {
  type: 'create' | 'update' | 'delete';
  entityType: 'node' | 'edge' | 'relation' | 'view';
  entityId: EntityId;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}

// 撤销操作实现
const undoChange = async (change: EntityChange): Promise<void> => {
  const { updateKnowledgeBase } = useGraphStore.getState();
  
  switch (change.type) {
    case 'create':
      // 撤销创建 = 删除实体
      await deleteEntity(change.entityType, change.entityId);
      break;
      
    case 'update':
      // 撤销更新 = 恢复旧值
      await updateEntity(change.entityType, change.entityId, change.oldValue);
      break;
      
    case 'delete':
      // 撤销删除 = 重新创建
      await createEntity(change.entityType, change.entityId, change.oldValue);
      break;
  }
};
```

## 坐标系统实现

### 1. 中心点坐标系统

#### 设计原理
```typescript
// 存储：中心点坐标
interface StoredPosition {
  x: number;  // 节点中心的X坐标
  y: number;  // 节点中心的Y坐标
}

// 渲染：左上角坐标  
interface RenderPosition {
  x: number;  // 节点左上角的X坐标
  y: number;  // 节点左上角的Y坐标
}

// 转换函数
const centerToTopLeft = (center: StoredPosition, size: {width: number, height: number}): RenderPosition => ({
  x: center.x - size.width / 2,
  y: center.y - size.height / 2
});

const topLeftToCenter = (topLeft: RenderPosition, size: {width: number, height: number}): StoredPosition => ({
  x: topLeft.x + size.width / 2,
  y: topLeft.y + size.height / 2
});
```

#### 节点尺寸管理
```typescript
const getNodeSize = (displayMode: NodeDisplayMode, customSize?: {width: number, height: number}) => {
  switch (displayMode) {
    case 'DOT':
      return { width: 12, height: 12 };
    case 'BOX':
      return { width: 120, height: 80 };
    case 'CARD':
      return customSize || { width: 280, height: 120 };
    default:
      return { width: 280, height: 120 };
  }
};
```

### 2. React Flow 集成

#### 节点数据转换
```typescript
const convertToFlowNode = (node: Node, viewConfig: NodeViewConfig): FlowNode => {
  const centerPosition = getCurrentView().layout.nodePositions[node.meta.id] || { x: 0, y: 0 };
  const nodeSize = getNodeSize(viewConfig.displayMode, getCurrentView().layout.nodeSizes?.[node.meta.id]);
  
  // 计算左上角位置用于React Flow渲染
  const position = centerToTopLeft(centerPosition, nodeSize);
  
  return {
    id: node.meta.id,
    type: 'graphNode',
    position,
    data: { node, viewConfig },
    style: {
      width: nodeSize.width,
      height: nodeSize.height
    }
  };
};
```

#### 位置更新处理
```typescript
const onNodeDragStop = useCallback(async (event: React.MouseEvent, flowNode: FlowNode) => {
  const nodeSize = getNodeSize(flowNode.data.viewConfig.displayMode, flowNode.style);
  
  // 将左上角位置转换为中心位置进行存储
  const centerPosition = topLeftToCenter(flowNode.position, nodeSize);
  
  // 通过命令系统更新位置
  await updateNodePositionCommand(
    getCurrentView().id,
    flowNode.id,
    centerPosition
  );
}, []);
```

## PlateJS 集成实现

### 1. 编辑器配置

#### 插件系统
```typescript
import { Plate, PlateContent, ParagraphPlugin, PlateElement } from 'platejs/react';

const PlateEditor: React.FC<PlateEditorProps> = ({ value, onChange, onBlur, onKeyDown, placeholder, autoFocus }) => {
  const plugins = useMemo(() => [
    ParagraphPlugin.withComponent(PlateElement)
  ], []);
  
  // 字符串到Plate格式的转换
  const plateValue = useMemo(() => {
    if (!value || value.trim() === '') {
      return [{ type: 'p', children: [{ text: '' }] }];
    }
    
    if (!value.includes('\n')) {
      return [{ type: 'p', children: [{ text: value }] }];
    }
    
    const lines = value.split('\n');
    return lines.map(line => ({
      type: 'p',
      children: [{ text: line }]
    }));
  }, [value]);
  
  // Plate格式到字符串的转换
  const handlePlateChange = (newValue: Array<{ type: string; children: Array<{ text: string }> }>) => {
    const textValue = newValue
      .map((node) => node.children.map((child) => child.text || '').join(''))
      .join('\n')
      .replace(/\n+$/, ''); // 移除末尾换行符
    onChange(textValue);
  };
  
  return (
    <Plate plugins={plugins} value={plateValue} onChange={handlePlateChange}>
      <PlateContent
        className="block-input nodrag"
        placeholder={placeholder}
        autoFocus={autoFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={{ 
          minHeight: '32px',
          outline: 'none',
          border: 'none',
          padding: '6px 12px',
          fontSize: '14px',
          fontFamily: 'inherit'
        }}
      />
    </Plate>
  );
};
```

### 2. 数据格式转换

#### 双向转换逻辑
```typescript
// 字符串转Plate格式
const stringToPlate = (text: string): PlateValue => {
  if (!text) return [{ type: 'p', children: [{ text: '' }] }];
  
  // 处理单行文本
  if (!text.includes('\n')) {
    return [{ type: 'p', children: [{ text }] }];
  }
  
  // 处理多行文本
  return text.split('\n').map(line => ({
    type: 'p',
    children: [{ text: line }]
  }));
};

// Plate格式转字符串
const plateToString = (value: PlateValue): string => {
  return value
    .map(node => node.children.map(child => child.text || '').join(''))
    .join('\n')
    .replace(/\n+$/, ''); // 清理末尾换行
};
```

## 性能优化实现

### 1. 组件级优化

#### React.memo 使用
```typescript
export const UnifiedNode = React.memo<NodeProps>(({ data, selected }) => {
  // 组件实现
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.data.node.meta.id === nextProps.data.node.meta.id &&
    prevProps.data.node.meta.updatedAt === nextProps.data.node.meta.updatedAt &&
    prevProps.selected === nextProps.selected
  );
});
```

#### useMemo 缓存
```typescript
const DraggableBlock: React.FC<DraggableBlockProps> = ({ content, isEditing, onChange }) => {
  // 缓存Plate值转换
  const plateValue = useMemo(() => stringToPlate(content), [content]);
  
  // 缓存拖拽配置
  const dragConfig = useMemo(() => ({
    type: 'block',
    item: { id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [id, index]);
  
  return (
    // 组件JSX
  );
};
```

### 2. 状态订阅优化

#### 选择器模式
```typescript
// 只订阅需要的状态片段
const useNodeData = (nodeId: EntityId) => useGraphStore(
  useCallback(state => state.currentKnowledgeBase?.nodes[nodeId], [nodeId])
);

const useViewConfig = (entityId: EntityId, entityType: 'node' | 'edge' | 'relation') => useGraphStore(
  useCallback(state => {
    switch (entityType) {
      case 'node': return state.nodeViewConfigs[entityId];
      case 'edge': return state.edgeViewConfigs[entityId];
      case 'relation': return state.relationViewConfigs[entityId];
    }
  }, [entityId, entityType])
);
```

### 3. 虚拟化渲染

#### 大规模图谱优化
```typescript
const WhiteboardView: React.FC = () => {
  const viewportBounds = useViewport();
  
  // 只渲染视口内的节点
  const visibleNodes = useMemo(() => {
    return allNodes.filter(node => {
      const nodePos = node.position;
      const nodeSize = getNodeSize(node.data.viewConfig.displayMode);
      
      return isInViewport(nodePos, nodeSize, viewportBounds);
    });
  }, [allNodes, viewportBounds]);
  
  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={visibleEdges}
      // ... 其他配置
    />
  );
};
```

## 错误处理与调试

### 1. 错误边界
```typescript
class GraphErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Graph component error:', error, errorInfo);
    // 发送错误报告
    this.reportError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### 2. 开发工具集成
```typescript
// Zustand DevTools
const useGraphStore = create<GraphState & GraphActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 状态和动作定义
    })),
    {
      name: 'graph-store',
      serialize: true
    }
  )
);

// 命令系统调试
const commandMiddleware: CommandMiddleware = {
  before: (command) => {
    console.log('Executing command:', command);
  },
  after: (command, result) => {
    console.log('Command result:', result);
  },
  error: (command, error) => {
    console.error('Command error:', command, error);
  }
};
```

### 3. 性能监控
```typescript
// React DevTools Profiler
const ProfiledComponent = React.forwardRef<HTMLDivElement, ComponentProps>((props, ref) => {
  return (
    <React.Profiler id="GraphComponent" onRender={onRenderCallback}>
      <Component {...props} ref={ref} />
    </React.Profiler>
  );
});

const onRenderCallback = (id: string, phase: string, actualDuration: number) => {
  if (actualDuration > 16) { // 超过16ms记录
    console.warn(`Slow render: ${id} took ${actualDuration}ms in ${phase} phase`);
  }
};
```