// 媒体型视图渲染器 - 处理 PDF、图片、视频等媒体内容

import React from 'react';
import type { View, MediaViewFormat } from '../../types/structure';

interface MediaRendererProps {
  view: View;
  className?: string;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({ view, className }) => {
  // 获取具体的媒体视图格式
  const format = (view.format as MediaViewFormat) || 'pdf';
  
  switch (format) {
    case 'pdf':
      return <PdfView view={view} className={className} />;
    
    case 'image':
      return <ImageView view={view} className={className} />;
    
    case 'video':
      return <VideoView view={view} className={className} />;
    
    case 'audio':
      return <AudioView view={view} className={className} />;
    
    case 'web':
      return <WebView view={view} className={className} />;
    
    case '3d-model':
      return <Model3DView view={view} className={className} />;
    
    default:
      console.warn(`Unknown media view format: ${format}`);
      return <UnsupportedMediaView format={format} className={className} />;
  }
};

// 各种媒体视图组件的占位实现
const PdfView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">📄</p>
        <p>PDF 阅读器</p>
        <p className="text-sm mt-2">支持标注、高亮、批注功能</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const ImageView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">🖼️</p>
        <p>图片查看器</p>
        <p className="text-sm mt-2">支持缩放、标注、区域选择</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const VideoView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">🎥</p>
        <p>视频播放器</p>
        <p className="text-sm mt-2">支持时间轴标注、关键帧提取</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const AudioView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">🎵</p>
        <p>音频播放器</p>
        <p className="text-sm mt-2">支持波形显示、时间点标注</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const WebView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">🌐</p>
        <p>网页浏览器</p>
        <p className="text-sm mt-2">内嵌浏览器，支持网页标注</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const Model3DView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">🎲</p>
        <p>3D 模型查看器</p>
        <p className="text-sm mt-2">支持 WebGL 3D 模型展示</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const UnsupportedMediaView: React.FC<{ format: string; className?: string }> = ({ format, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">❓</p>
        <p>不支持的媒体格式</p>
        <p className="text-sm mt-2">格式: {format}</p>
        <p className="text-xs text-gray-400">请检查视图配置</p>
      </div>
    </div>
  );
};