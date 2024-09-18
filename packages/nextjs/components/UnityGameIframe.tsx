"use client";

import React, { useState } from 'react';
import { Unity, useUnityContext } from "react-unity-webgl";

const NinjaStrike = () => {
  const { unityProvider, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: "/NinjaStrike/Build/NinjaStrike.loader.js",
    dataUrl: "/NinjaStrike/Build/NinjaStrike.data",
    frameworkUrl: "/NinjaStrike/Build/NinjaStrike.framework.js",
    codeUrl: "/NinjaStrike/Build/NinjaStrike.wasm",
  });

  const handleWeb3AuthConnect = () => {
    window.open('https://auth.web3auth.io', '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh',
      padding: '40px',
      position: 'relative'
    }}>
      {!isLoaded && (
        <p>Loading Application... {Math.round(loadingProgression * 100)}%</p>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{
          width: '1280px',
          height: '666px',
          border: 'none',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      />
      <button
        onClick={handleWeb3AuthConnect}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Connect with Web3Auth
      </button>
    </div>
  );
};

export default NinjaStrike;