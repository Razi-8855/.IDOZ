# IDOZ 3D Bee Asset Optimization Guide

The provided 3D Bee asset (`Hitem3d-1781946782368.glb`) is currently a single fused mesh (~2M triangles, 92MB unoptimized). Loading a 92MB file on the web will severely impact initial page load and time-to-interactive, especially for mobile users. 

Since this is a luxury editorial experience, visual quality must be maintained while ensuring smooth performance. Implement the following optimizations:

## 1. Geometry Compression (Draco)
Draco compression significantly reduces the file size of the geometry (vertex data, normals, indices). For a 2M triangle mesh, this is the most critical step.

**Tools:**
- Use the open-source CLI tool `gltf-pipeline`:
  ```bash
  npm install -g gltf-pipeline
  gltf-pipeline -i Hitem3d-1781946782368.glb -o bee-draco.glb -d
  ```

**Implementation in React Three Fiber:**
You must provide the Draco decoder to `useGLTF`.
```jsx
import { useGLTF } from '@react-three/drei';

function BeeModel() {
  const { scene } = useGLTF('/assets/bee-draco.glb', true, true, dracoLoader => {
    // Drei automatically uses a CDN for the decoder, but you can host it locally
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  });
  // ...
}
```

## 2. Texture Compression (KTX2 / Basis Universal)
If the GLB contains embedded PBR textures (albedo, normal, roughness, metallic), converting them to KTX2 format will reduce the GPU VRAM footprint and load time.

**Tools:**
- Use `gltf-transform`:
  ```bash
  npm install -g @gltf-transform/cli
  gltf-transform optimize Hitem3d-1781946782368.glb bee-optimized.glb --compress draco --texture-compress basis
  ```

## 3. Poly Reduction / Decimation (Blender)
Even with compression, 2M triangles is extremely heavy for WebGL and will cause low FPS on older devices or mobile phones.
1. Import the GLB into Blender.
2. Apply a **Decimate Modifier** to the mesh.
3. Reduce the ratio (e.g., to 0.1 or 0.2) until visual fidelity starts to degrade.
4. Export as `.glb` again.
*Goal:* Aim for under 100,000 triangles for a hero web asset.

## 4. Lazy Loading Strategy
Never block the initial HTML page render waiting for the 3D asset.
1. The `BeeFlightController` component uses React `Suspense`. 
2. Ensure the canvas is conditionally rendered or imported dynamically (e.g., using Next.js `next/dynamic` or standard React `lazy`) so the main bundle isn't bloated.
3. The `<Loader />` component provides a graceful percentage fallback.

## 5. Separation of Mesh (Future Proofing)
As noted, the current asset is a single fused mesh. For the procedural wing flap, we are faking it via uniform scaling.
For the final asset, ask the 3D artist to:
1. Separate the left and right wings into their own objects/nodes within the GLB.
2. Set the origin (pivot point) of each wing at the base where it attaches to the body.
3. (Optional) Bake a simple looping wing-flap animation clip into the GLB, which can then be played via Three.js `AnimationMixer` instead of procedural code.
