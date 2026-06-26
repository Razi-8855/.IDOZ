import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// COMPONENT: GLB Loading & Scene Setup
// ==========================================
function BeeModel({ scrollContainerRef, glbPath }) {
  const beeRef = useRef();
  const { scene, materials } = useGLTF(glbPath);
  
  // ------------------------------------------
  // 1. SCENE SETUP & MATERIALS
  // ------------------------------------------
  useEffect(() => {
    // Traverse the model to tune PBR materials
    scene.traverse((child) => {
      if (child.isMesh) {
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;

        // Tune the bronze/copper metallic body
        if (child.name.toLowerCase().includes('body') || child.material.name.toLowerCase().includes('body')) {
          child.material.metalness = 0.8;
          child.material.roughness = 0.3;
          child.material.color.set('#c17b5f'); // Copper/Bronze tone
        }
        
        // Tune matte blush-pink floral wings
        if (child.name.toLowerCase().includes('wing') || child.material.name.toLowerCase().includes('wing')) {
          child.material.metalness = 0.1;
          child.material.roughness = 0.8; // Matte finish
          child.material.color.set('#f5d6d6'); // Blush pink
          child.material.transparent = true;
          child.material.opacity = 0.9;
        }
      }
    });
  }, [scene]);

  // ------------------------------------------
  // 2. ANIMATION CONTROL (Procedural Wing Flap / Hover)
  // ------------------------------------------
  useFrame((state, delta) => {
    if (!beeRef.current) return;

    // A. Suble Bobbing/Idle Motion (keeps the bee alive)
    // Uses the clock to create a smooth sine wave on the Y axis
    const time = state.clock.getElapsedTime();
    beeRef.current.position.y += Math.sin(time * 2) * 0.002; 
    
    // B. Procedural Wing Flap (Simulated)
    // Since wings aren't separated, we oscillate the scale slightly on the Z axis 
    // to give a "flutter" illusion, or rotate the entire body slightly.
    // NOTE: Swap this for AnimationMixer when a rigged GLB is available.
    const flutterSpeed = 30; // High speed for flutter
    const flutterAmount = 0.02;
    // Compress and expand slightly to simulate rapid wing movement
    beeRef.current.scale.z = 1 + Math.sin(time * flutterSpeed) * flutterAmount;
    beeRef.current.scale.x = 1 + Math.sin(time * flutterSpeed) * flutterAmount;
  });

  // ------------------------------------------
  // 3. SCROLL-DRIVEN FLIGHT PATH
  // ------------------------------------------
  useLayoutEffect(() => {
    if (!beeRef.current || !scrollContainerRef.current) return;

    // Define the flight path curve (Bezier or CatmullRom)
    // These coordinates represent (x, y, z) waypoints through the scene.
    // TUNE THESE: Match these points to the physical layout of your HTML sections.
    const pathPoints = [
      new THREE.Vector3(0, 2, 5),    // Start: High and close
      new THREE.Vector3(-3, 0, 2),   // Section 1: Sweeping left
      new THREE.Vector3(2, -2, 0),   // Section 2: Sweeping right
      new THREE.Vector3(-1, -4, -2), // Section 3: Lower left
      new THREE.Vector3(0, -5, -4)   // End: Landing on the jacket
    ];

    const flightCurve = new THREE.CatmullRomCurve3(pathPoints);
    
    // Create an object to hold our tweened scroll progress (0 to 1)
    const scrollObj = { progress: 0 };
    const dummy = new THREE.Object3D(); // Used to calculate lookAt banking

    // Setup ScrollTrigger for the flight path
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollContainerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5, // Damped interpolation: smooths out the scroll (1.5s lag)
        onUpdate: (self) => {
          // You could pause the useFrame loop here if off-screen to save performance
        }
      }
    });

    tl.to(scrollObj, {
      progress: 1,
      ease: 'power1.inOut', // Ease-out deceleration at the end
      onUpdate: () => {
        if (!beeRef.current) return;

        // 1. Position along the curve
        const position = flightCurve.getPointAt(scrollObj.progress);
        beeRef.current.position.copy(position);

        // 2. Banking / Rotation (Look ahead on the curve)
        // Get a point slightly ahead to point the bee towards
        const lookAtProgress = Math.min(scrollObj.progress + 0.05, 1);
        const lookAtPos = flightCurve.getPointAt(lookAtProgress);
        
        dummy.position.copy(position);
        dummy.lookAt(lookAtPos);
        
        // Smoothly interpolate rotation to avoid snapping
        beeRef.current.quaternion.slerp(dummy.quaternion, 0.1);

        // 3. Final Landing / Fade Out
        // If we are in the last 10% of the scroll, scale down and fade out
        if (scrollObj.progress > 0.9) {
          const fadeProgress = (scrollObj.progress - 0.9) * 10; // 0 to 1
          beeRef.current.scale.setScalar(1 - (fadeProgress * 0.9)); // Scale down to 10%
          
          // Optionally fade opacity (requires material.transparent = true)
          scene.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.transparent = true;
              child.material.opacity = 1 - fadeProgress;
            }
          });
        } else {
          // Reset scale and opacity if scrolling back up
          beeRef.current.scale.setScalar(1);
          scene.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.opacity = 1;
            }
          });
        }
      }
    });

    return () => {
      tl.kill();
    };
  }, [scrollContainerRef, scene]);

  return (
    <primitive 
      ref={beeRef} 
      object={scene} 
      position={[0, 2, 5]} 
      scale={[1, 1, 1]}
    />
  );
}

// Preload the GLB file
// Note: See optimization guide for Draco/KTX2 compression
useGLTF.preload('/assets/Hitem3d-1781946782368.glb');

// ==========================================
// LOADER COMPONENT
// ==========================================
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: '#c17b5f', fontFamily: 'Cinzel', letterSpacing: '2px' }}>
        {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

// ==========================================
// MAIN CONTROLLER COMPONENT
// ==========================================
export default function BeeFlightController({ scrollContainerRef }) {
  return (
    <div 
      className="bee-canvas-container" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        pointerEvents: 'none', // Let clicks pass through to HTML beneath
        zIndex: 10 // Adjust based on your layout
      }}
    >
      {/* 
        PERFORMANCE: 
        - dpr: limit pixel ratio to prevent lag on retina displays
        - camera: near/far optimized for the scene size
      */}
      <Canvas 
        dpr={[1, 1.5]} 
        camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<Loader />}>
          {/* 
            LIGHTING SETUP FOR PBR
            TUNE THESE: Adjust intensity and colors to match the luxury aesthetic
          */}
          <ambientLight intensity={0.5} />
          
          {/* Key Light: soft warm light from top-right */}
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1.5} 
            color="#fff0e6" 
            castShadow
          />
          
          {/* Rim Light: cool light from behind to highlight metallic edges */}
          <spotLight 
            position={[-5, 5, -5]} 
            intensity={2} 
            color="#e6f0ff" 
            angle={0.5} 
            penumbra={1}
          />

          {/* Environment Map (HDRI) for realistic metallic reflections */}
          <Environment preset="city" />

          {/* The Bee Model */}
          <BeeModel 
            scrollContainerRef={scrollContainerRef} 
            glbPath="/assets/Hitem3d-1781946782368.glb" 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
