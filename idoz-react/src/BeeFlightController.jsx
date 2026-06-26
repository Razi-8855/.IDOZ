import React, { useRef, useLayoutEffect, useEffect, Suspense } from 'react';
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
  const modelRef = useRef();
  const { scene } = useGLTF(glbPath);

  // Deep clone the scene to allow multiple instances or safe mutation
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // ------------------------------------------
  // 1. SCENE SETUP & MATERIALS
  // ------------------------------------------
  useEffect(() => {
    // Traverse the model to tune PBR materials
    clonedScene.traverse((child) => {
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
  }, [clonedScene]);

  // ------------------------------------------
  // 2. SCROLL-DRIVEN FLIGHT PATH
  // ------------------------------------------
  useLayoutEffect(() => {
    if (!beeRef.current || !scrollContainerRef.current) return;

    // Define the flight path curve
    // Define responsive flight path curves
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    const desktopPath = [
      new THREE.Vector3(0, 2.5, 5),    
      new THREE.Vector3(3.5, 0, 2),   
      new THREE.Vector3(-3.5, -2, 0),   
      new THREE.Vector3(1.5, -4, -2), 
      new THREE.Vector3(0, 0.2, -2)   
    ];

    const mobilePath = [
      new THREE.Vector3(0, 2.5, 5),    
      new THREE.Vector3(-0.5, 0, 2),   
      new THREE.Vector3(0.5, -2, 0),   
      new THREE.Vector3(-0.5, -4, -2), 
      new THREE.Vector3(0, -5.5, -4)   
    ];

    const pathPoints = isMobile ? mobilePath : desktopPath;

    const flightCurve = new THREE.CatmullRomCurve3(pathPoints);
    const scrollObj = { progress: 0 };
    const dummy = new THREE.Object3D(); 

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollContainerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      }
    });

    let lastProgress = 0;
    let smoothedVelocity = 0;

    tl.to(scrollObj, {
      progress: 1,
      ease: 'none',
      onUpdate: () => {
        if (!beeRef.current) return;

        const position = flightCurve.getPointAt(scrollObj.progress);
        beeRef.current.position.copy(position);

        // Velocity-based Banking/Rotation
        const velocity = scrollObj.progress - lastProgress;
        lastProgress = scrollObj.progress;
        
        smoothedVelocity = THREE.MathUtils.lerp(smoothedVelocity, velocity, 0.05);
        
        let lookAheadAmount = 0.05; 
        if (Math.abs(smoothedVelocity) > 0.0001) {
            lookAheadAmount = smoothedVelocity > 0 ? 0.05 : -0.05;
        }

        const lookAtProgress = THREE.MathUtils.clamp(scrollObj.progress + lookAheadAmount, 0, 1);
        const lookAtPos = flightCurve.getPointAt(lookAtProgress);
        
        dummy.position.copy(position);
        dummy.lookAt(lookAtPos);
        
        beeRef.current.quaternion.slerp(dummy.quaternion, 0.04);

        // 3. Fade In/Out Logic
        if (scrollObj.progress < 0.15) {
          const fadeProgress = Math.max(0, (scrollObj.progress - 0.05) * 10);
          beeRef.current.scale.setScalar(1.5);
          beeRef.current.visible = fadeProgress > 0;
          clonedScene.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.transparent = true;
              let targetOpacity = fadeProgress;
              if (child.name.toLowerCase().includes('wing') || child.material.name.toLowerCase().includes('wing')) {
                targetOpacity = fadeProgress * 0.9;
              }
              child.material.opacity = Math.min(1, targetOpacity);
            }
          });
        } else if (scrollObj.progress > 0.9) {
          const fadeProgress = (scrollObj.progress - 0.9) * 10;
          beeRef.current.scale.setScalar(1.5); 
          beeRef.current.visible = fadeProgress < 0.95;
          clonedScene.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.transparent = true;
              child.material.opacity = Math.max(0, 1 - fadeProgress);
            }
          });
        } else {
          beeRef.current.visible = true;
          beeRef.current.scale.setScalar(1.5);
          clonedScene.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.opacity = 1;
              if (child.name.toLowerCase().includes('wing') || child.material.name.toLowerCase().includes('wing')) {
                child.material.opacity = 0.9;
              }
            }
          });
        }
      }
    });

    return () => {
      tl.kill();
    };
  }, [scrollContainerRef, clonedScene]);

  // Procedural Animation (Idle bobbing & wing flutter)
  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.elapsedTime;
      
      // Idle wandering animation (flies around here and there when not scrolling)
      // Using stacked sine waves for a smooth but dynamic realistic bee flight pattern
      const t1 = time * 2.0;
      const t2 = time * 3.2;
      modelRef.current.position.x = Math.sin(t1) * 1.5 + Math.cos(t2) * 0.8;
      modelRef.current.position.y = Math.cos(t1 * 0.8) * 1.0 + Math.sin(t2 * 1.1) * 0.6;
      modelRef.current.position.z = Math.sin(t1 * 1.3) * 0.5;
      
      // Add rapid idle rotation to match the darting movement
      modelRef.current.rotation.y = Math.sin(t1) * 0.5;
      modelRef.current.rotation.z = Math.cos(t1 * 0.8) * 0.3;
      modelRef.current.rotation.x = Math.sin(t2) * 0.2;

      // Fake procedural wing flutter
      const flutterSpeed = 30; 
      const flutterAmount = 0.02;
      modelRef.current.scale.z = 1 + Math.sin(time * flutterSpeed) * flutterAmount;
      modelRef.current.scale.x = 1 + Math.sin(time * flutterSpeed) * flutterAmount;
    }
  });

  return (
    <group ref={beeRef} scale={1.5} position={[0, 2.5, 5]}>
      <primitive ref={modelRef} object={clonedScene} />
    </group>
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
