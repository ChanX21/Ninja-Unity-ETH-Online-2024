"use client";

import React, { useState, useEffect } from 'react';

const UnityGameIframe = () => {
  const [iframeHeight, setIframeHeight] = useState('600px');

  useEffect(() => {
    const updateIframeSize = () => {
      const width = Math.min(960, window.innerWidth - 40); // 20px padding on each side
      const height = (width / 16) * 9; // Assuming a 16:9 aspect ratio
      setIframeHeight(`${height}px`);
    };

    window.addEventListener('resize', updateIframeSize);
    updateIframeSize();

    return () => window.removeEventListener('resize', updateIframeSize);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: '20px'
    }}>
      <iframe
        src="/UnityGame/index.html"
        width="100%"
        height={iframeHeight}
        style={{
          maxWidth: '960px',
          border: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        title="Unity WebGL Game"
        allowFullScreen
      />
    </div>
  );
};

export default UnityGameIframe;