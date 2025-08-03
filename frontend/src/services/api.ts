// API 服务层 - 与后端通信

import type { KnowledgeBase, Node, Edge } from '../types/structure';

// 自动检测后端端口
const POSSIBLE_PORTS = [3014, 3001, 3002, 3003, 3004, 3005, 8000, 8001];
let API_BASE_URL = 'http://localhost:3014/api'; // 默认端口

// API 错误处理
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// 通用 API 请求函数
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }

  return response.json();
}

// 知识库相关 API
export const knowledgeBaseApi = {
  // 获取所有知识库列表
  async getList(): Promise<Record<string, any>> {
    return apiRequest('/knowledge-bases');
  },

  // 获取指定知识库
  async get(kbId: string): Promise<KnowledgeBase> {
    return apiRequest(`/knowledge-bases/${kbId}`);
  },

  // 创建新知识库
  async create(name: string, description: string = ''): Promise<KnowledgeBase> {
    return apiRequest('/knowledge-bases', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  // 更新知识库
  async update(kbId: string, kb: KnowledgeBase): Promise<KnowledgeBase> {
    return apiRequest(`/knowledge-bases/${kbId}`, {
      method: 'PUT',
      body: JSON.stringify(kb),
    });
  },

  // 删除知识库
  async delete(kbId: string): Promise<{ message: string }> {
    return apiRequest(`/knowledge-bases/${kbId}`, {
      method: 'DELETE',
    });
  },
};

// 节点相关 API
export const nodeApi = {
  // 创建节点
  async create(
    kbId: string, 
    title: string, 
    entityLabel: string, 
    properties: Record<string, any> = {}
  ): Promise<Node> {
    return apiRequest(`/knowledge-bases/${kbId}/nodes`, {
      method: 'POST',
      body: JSON.stringify({ title, entityLabel, properties }),
    });
  },

  // 更新节点
  async update(kbId: string, nodeId: string, node: Node): Promise<Node> {
    return apiRequest(`/knowledge-bases/${kbId}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(node),
    });
  },

  // 删除节点
  async delete(kbId: string, nodeId: string): Promise<{ message: string }> {
    return apiRequest(`/knowledge-bases/${kbId}/nodes/${nodeId}`, {
      method: 'DELETE',
    });
  },
};

// 后端端口检测和健康检查
export const healthCheck = {
  // 检测可用的后端端口
  async detectBackendPort(): Promise<number | null> {
    for (const port of POSSIBLE_PORTS) {
      try {
        const response = await fetch(`http://localhost:${port}/`, { 
          method: 'GET',
          signal: AbortSignal.timeout(2000) // 2秒超时
        });
        if (response.ok) {
          const data = await response.json();
          if (data.message && data.message.includes('图谱系统')) {
            console.log(`✅ 检测到后端服务运行在端口 ${port}`);
            API_BASE_URL = `http://localhost:${port}/api`;
            return port;
          }
        }
      } catch (error) {
        // 继续尝试下一个端口
        continue;
      }
    }
    return null;
  },

  async check(): Promise<{ message: string; status: string }> {
    // 首先尝试检测端口
    const detectedPort = await this.detectBackendPort();
    
    if (!detectedPort) {
      throw new Error('无法连接到后端服务，请确保后端已启动');
    }

    try {
      const response = await fetch(`http://localhost:${detectedPort}/`);
      return response.json();
    } catch (error) {
      throw new Error('后端服务连接失败');
    }
  },
};