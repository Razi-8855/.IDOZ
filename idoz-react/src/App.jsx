import React, { useRef } from 'react';
import BeeFlightController from './BeeFlightController';
import './App.css';

function App() {
  const containerRef = useRef();

  return (
    <div className="app-container" ref={containerRef}>
      {/* 3D Scene Controller */}
      <BeeFlightController scrollContainerRef={containerRef} />

      {/* Scrollable Content Layers */}
      <section className="story-section">
        <div className="content-box">
          <h1>IDOZ</h1>
          <p>Scroll down to begin the journey of the Bee.</p>
        </div>
      </section>

      <section className="story-section" style={{justifyContent: 'flex-end', paddingRight: '10vw'}}>
        <div className="content-box">
          <h2>The Heritage</h2>
          <p>Watch as the bee sweeps from the top left.</p>
        </div>
      </section>

      <section className="story-section">
        <div className="content-box">
          <h2>The Thread</h2>
          <p>Navigating through the rich textiles.</p>
        </div>
      </section>

      <section className="story-section" style={{justifyContent: 'flex-end', paddingRight: '10vw'}}>
        <div className="content-box">
          <h2>The Construction</h2>
          <p>Swooping lower towards the garment layout.</p>
        </div>
      </section>

      <section className="story-section" style={{justifyContent: 'center', textAlign: 'center'}}>
        <div className="content-box" style={{maxWidth: '600px'}}>
          <h2>The Masterpiece</h2>
          <p>The bee settles into its final resting place.</p>
        </div>
      </section>
      
      <div style={{ height: '50vh' }}></div>
    </div>
  );
}

export default App;
