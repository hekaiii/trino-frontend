import React, { useState, useCallback, useEffect, useRef } from 'react';

const ResizablePanel = ({ children, minRatio = 0.1, maxRatio = 0.9, defaultRatio = 0.2 }) => {
  const [leftRatio, setLeftRatio] = useState(defaultRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newRatio = (e.clientX - containerRect.left) / containerRect.width;
    
    // 限制比例在 minRatio 到 maxRatio 之间
    const clampedRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    setLeftRatio(clampedRatio);
  }, [isDragging, minRatio, maxRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="resizable-container"
      style={{
        height: '100vh',
        display: 'flex',
        position: 'relative'
      }}
    >
      {/* 左侧面板 */}
      <div 
        className="resizable-left-panel"
        style={{
          width: `${leftRatio * 100}%`,
          overflow: 'hidden',
          borderRight: '1px solid #d9d9d9'
        }}
      >
        {children[0]}
      </div>
      
      {/* 分割线 */}
      <div
        className="resizable-divider"
        style={{
          width: '4px',
          backgroundColor: isDragging ? '#1890ff' : '#d9d9d9',
          cursor: 'ew-resize',
          position: 'relative',
          zIndex: 1,
          transition: isDragging ? 'none' : 'background-color 0.2s ease'
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '40px',
            backgroundColor: isDragging ? '#1890ff' : '#bfbfbf',
            borderRadius: '2px',
            transition: isDragging ? 'none' : 'background-color 0.2s ease'
          }}
        />
      </div>
      
      {/* 右侧面板 */}
      <div 
        className="resizable-right-panel"
        style={{
          width: `${(1 - leftRatio) * 100}%`,
          overflow: 'hidden'
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};

export default ResizablePanel;