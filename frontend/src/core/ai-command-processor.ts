/**
 * AI命令处理器
 * 将自然语言指令转换为系统可执行的命令序列
 */

import { EnhancedCommandSystem } from './enhanced-command-system';
import { 
  CreateNodeCommand, 
  CreateEdgeCommand, 
  UpdateNodeCommand,
  ReversibleCommand,
  CommandResult 
} from './reversible-commands';
import { NodeType, Position } from '../types/structure';

interface AIOperation {
  type: 'create_node' | 'update_node' | 'create_edge' | 'create_relation' | 'arrange_layout';
  params: {
    nodeType?: NodeType;
    title?: string;
    content?: string;
    position?: Position;
    sourceId?: string;
    targetId?: string;
    relationType?: string;
    participants?: string[];
  };
}

interface AIResponse {
  operations: AIOperation[];
  explanation?: string;
}

export class AICommandProcessor {
  constructor(
    private commandSystem: EnhancedCommandSystem,
    private aiApiKey: string
  ) {}

  /**
   * 核心方法：解析用户自然语言指令
   */
  async parseCommand(userInput: string): Promise<AIResponse> {
    // 构建AI提示词
    const prompt = this.buildPrompt(userInput);
    
    try {
      // 调用AI API（这里用OpenAI为例）
      const response = await this.callAIAPI(prompt);
      
      // 解析AI返回的JSON
      const aiResponse: AIResponse = JSON.parse(response);
      
      // 验证操作序列
      this.validateOperations(aiResponse.operations);
      
      return aiResponse;
    } catch (error) {
      console.error('AI解析失败:', error);
      throw new Error('无法理解该指令，请尝试重新表述');
    }
  }

  /**
   * 执行AI生成的操作序列
   */
  async executeOperations(operations: AIOperation[]): Promise<void> {
    const createdNodes = new Map<string, string>(); // 临时ID到实际ID的映射

    for (const operation of operations) {
      try {
        await this.executeOperation(operation, createdNodes);
      } catch (error) {
        console.error(`执行操作失败:`, operation, error);
        throw error;
      }
    }
  }

  /**
   * 执行单个AI操作
   */
  private async executeOperation(
    operation: AIOperation, 
    createdNodes: Map<string, string>
  ): Promise<void> {
    switch (operation.type) {
      case 'create_node':
        await this.executeCreateNode(operation, createdNodes);
        break;
        
      case 'create_edge':
        await this.executeCreateEdge(operation, createdNodes);
        break;
        
      case 'update_node':
        await this.executeUpdateNode(operation, createdNodes);
        break;
        
      default:
        console.warn('未支持的操作类型:', operation.type);
    }
  }

  /**
   * 执行创建节点操作
   */
  private async executeCreateNode(
    operation: AIOperation, 
    createdNodes: Map<string, string>
  ): Promise<void> {
    const { nodeType, title, content, position } = operation.params;
    
    const command = new CreateNodeCommand({
      type: nodeType || NodeType.CONTENT,
      title: title || '新节点',
      content: content || '',
      position: position || this.generateAutoPosition(),
    });

    const result = await this.commandSystem.execute(command);
    
    if (result.success && result.data) {
      // 记录临时ID到实际ID的映射（用于后续连线）
      if (title) {
        createdNodes.set(title, result.data.id);
      }
    }
  }

  /**
   * 执行创建边操作
   */
  private async executeCreateEdge(
    operation: AIOperation, 
    createdNodes: Map<string, string>
  ): Promise<void> {
    const { sourceId, targetId, relationType } = operation.params;
    
    if (!sourceId || !targetId) {
      throw new Error('创建边需要指定源节点和目标节点');
    }

    // 解析节点ID（可能是标题引用）
    const resolvedSourceId = createdNodes.get(sourceId) || sourceId;
    const resolvedTargetId = createdNodes.get(targetId) || targetId;

    const command = new CreateEdgeCommand({
      sourceId: resolvedSourceId,
      targetId: resolvedTargetId,
      type: relationType || 'related_to',
    });

    await this.commandSystem.execute(command);
  }

  /**
   * 执行更新节点操作
   */
  private async executeUpdateNode(
    operation: AIOperation, 
    createdNodes: Map<string, string>
  ): Promise<void> {
    // 这里可以实现节点内容更新逻辑
    console.log('更新节点操作暂未实现:', operation);
  }

  /**
   * 构建AI提示词
   */
  private buildPrompt(userInput: string): string {
    return `
你是一个知识图谱助手。用户会给你一个指令，你需要将其转换为具体的图谱操作。

可用的操作类型：
1. create_node - 创建节点
2. create_edge - 创建连接
3. update_node - 更新节点内容

节点类型：
- content: 内容节点，用于存储知识内容
- relation: 关系节点，用于表示复杂关系

请将以下用户指令转换为操作序列：
"${userInput}"

返回格式（必须是有效的JSON）：
{
  "operations": [
    {
      "type": "create_node",
      "params": {
        "nodeType": "content",
        "title": "节点标题",
        "content": "节点内容",
        "position": {"x": 100, "y": 100}
      }
    },
    {
      "type": "create_edge", 
      "params": {
        "sourceId": "源节点标题",
        "targetId": "目标节点标题",
        "relationType": "contains"
      }
    }
  ],
  "explanation": "我为你创建了..."
}

注意：
1. 自动计算合适的节点位置
2. 节点标题要简洁明确
3. 内容要有实际价值
4. 连接关系要合理
`;
  }

  /**
   * 调用AI API
   */
  private async callAIAPI(prompt: string): Promise<string> {
    // 这里实现实际的AI API调用
    // 可以用OpenAI、Claude或其他LLM服务
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`AI API调用失败: ${data.error?.message}`);
    }

    return data.choices[0].message.content;
  }

  /**
   * 验证AI操作序列
   */
  private validateOperations(operations: AIOperation[]): void {
    for (const operation of operations) {
      if (!operation.type || !operation.params) {
        throw new Error('操作格式无效');
      }
      
      // 可以添加更多验证逻辑
    }
  }

  /**
   * 自动生成节点位置
   */
  private generateAutoPosition(): Position {
    // 简单的自动布局算法
    return {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };
  }

  /**
   * 便捷方法：一键处理用户指令
   */
  async processUserCommand(userInput: string): Promise<string> {
    try {
      // 1. 解析指令
      const aiResponse = await this.parseCommand(userInput);
      
      // 2. 执行操作
      await this.executeOperations(aiResponse.operations);
      
      // 3. 返回执行结果
      return aiResponse.explanation || '操作已完成';
    } catch (error) {
      console.error('处理用户指令失败:', error);
      throw error;
    }
  }
}