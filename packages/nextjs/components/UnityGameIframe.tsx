"use client";

import React, { useState } from 'react';

const UnityGameIframe = () => {
  const [iframeSrc, setIframeSrc] = useState('/NinjaStrike/index.html');

  const handleWeb3AuthConnect = () => {
    // Open Web3Auth login page in a new window
    window.open('https://auth.web3auth.io', '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: '20px'
    }}>
      <iframe
        src={iframeSrc}
        width="1280px"
        height="666"
        style={{
          border: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        title="Unity WebGL Game"
        allowFullScreen
      />
      <button onClick={handleWeb3AuthConnect} style={{ position: 'absolute', top: '20px', right: '20px' }}>
        Connect with Web3Auth
      </button>
    </div>
  );
};

export default UnityGameIframe;