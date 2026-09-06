// app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const meshRef = useRef<THREE.Mesh>();
  const controlsRef = useRef<OrbitControls>();
  const animationIdRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current!;
    
    // ============ RENDERER SETUP ============
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Important for video capture
    });
    
    renderer.setSize(800, 600);
    renderer.setPixelRatio(0.5);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    
    // ============ SCENE SETUP ============
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x142d4c); // Light gray background
    sceneRef.current = scene;
    
    // ============ CAMERA SETUP ============
    const camera = new THREE.PerspectiveCamera(45, 800/600, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // ============ ORBIT CONTROLS ============
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;
    
    // ============ LIGHTING SETUP (FIXED) ============
    setupCompleteLighting(scene);
    



// trying to make worker theard
// createWorker();

    // ============ ANIMATION LOOP ============
    let autoRotate = true;
    
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (meshRef.current && autoRotate) {
        // meshRef.current.rotation.z += 0.005;
        meshRef.current.rotation.x += 0.005;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // ============ COMPLETE LIGHTING SETUP ============
  const setupCompleteLighting = (scene: THREE.Scene) => {
    // Clear existing lights
    scene.children
      .filter(child => child instanceof THREE.Light)
      .forEach(light => scene.remove(light));
    
    // 1. Ambient Light - Base illumination (IMPORTANT for black fix)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // 2. Hemisphere Light - Natural sky/ground lighting
    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff, // Sky color
      0x444444, // Ground color
      0.8       // Intensity
    );
    scene.add(hemisphereLight);
    
    // 3. Main Directional Light (Front)
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontLight.position.set(0, 5, 10);
    frontLight.castShadow = true;
    frontLight.shadow.mapSize.width = 2048;
    frontLight.shadow.mapSize.height = 2048;
    scene.add(frontLight);
    
    // 4. Back Light (Fixes black back)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
    
    // 5. Left Light
    const leftLight = new THREE.DirectionalLight(0xffffff, 0.6);
    leftLight.position.set(-10, 5, 0);
    scene.add(leftLight);
    
    // 6. Right Light
    const rightLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rightLight.position.set(10, 5, 0);
    scene.add(rightLight);
    
    // 7. Top Light
    const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);
    
    // 8. Bottom Light (Fixes dark bottom)
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
    bottomLight.position.set(0, -5, 0);
    scene.add(bottomLight);
  };

  // ============ CREATE MATERIAL (FIXED) ============
  const createModelMaterial = () => {
    // Use MeshPhongMaterial for better lighting response
    return new THREE.MeshPhongMaterial({
      color: 0xc24d2c,        // Light gray
      specular: 0x333333,     // Subtle specular
      shininess: 30,          // Medium shininess
      side: THREE.DoubleSide, // Show both sides (FIXES BLACK BACK)
      flatShading: false,
      emissive: 0x000000      // No emission
    });
  };

  // ============ HANDLE FILE UPLOAD ============
  const handleFile = async (file: File) => {
    if (!file) return;
    
    console.log(`Loading: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    setStatus('parsing');
    setProgress(10);
    
    try {
      const buffer = await file.arrayBuffer();
      
      let geometry: THREE.BufferGeometry;
      
      if (file.name.toLowerCase().endsWith('.stl')) {
        console.log('Parsing STL...');
        const loader = new STLLoader();
        geometry = loader.parse(buffer);
      } else if (file.name.toLowerCase().endsWith('.obj')) {
        console.log('Parsing OBJ...');
        const loader = new OBJLoader();
        const obj = loader.parse(new TextDecoder().decode(buffer));
        geometry = obj.children[0].geometry;
      } else {
        throw new Error('Unsupported format');
      }
      
      // ============ GEOMETRY OPTIMIZATION ============
      console.log('Optimizing geometry...');
      geometry.center();
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      
      // Fix normals for better lighting
      geometry.normalizeNormals();
      
      console.log(`Vertices: ${geometry.getAttribute('position').count}`);
      
      // ============ REMOVE OLD MESH ============
      if (meshRef.current) {
        sceneRef.current!.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
      }
      
      // ============ CREATE NEW MESH ============
      const material = createModelMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      sceneRef.current!.add(mesh);
      meshRef.current = mesh;
      
      // ============ AUTO-FIT CAMERA ============
      if (geometry.boundingSphere) {
        const radius = geometry.boundingSphere.radius;
        const distance = radius * 2;
        
        cameraRef.current!.position.set(
          distance * 0.7,
          distance * 0.5,
          distance * 0.7
        );
        cameraRef.current!.lookAt(0, 0, 0);
        controlsRef.current!.target.set(0, 0, 0);
        controlsRef.current!.update();
      }
      
      setProgress(50);
      setStatus('ready');
      console.log('Model loaded successfully');
      
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      alert(error instanceof Error ? error.message : 'Failed to parse file');
    }
  };

  // ============ GENERATE VIDEO (FIXED) ============
  const generateVideo = async () => {
    if (!meshRef.current || !canvasRef.current) {
      alert('Load a model first');
      return;
    }
    
    console.log('Starting video generation...');
    setStatus('rendering');
    setProgress(50);
    
    const fps = 30;
    const duration = 10;
    const totalFrames = fps * duration;
    const canvas = canvasRef.current;
    
    // Disable auto-rotation during video generation
    const mesh = meshRef.current;
    
    try {
      // ============ SET VIDEO RESOLUTION ============
      const videoWidth = 1280;
      const videoHeight = 1280;
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      rendererRef.current!.setSize(videoWidth, videoHeight, false);
      cameraRef.current!.aspect = videoWidth / videoHeight;
      cameraRef.current!.updateProjectionMatrix();
      
      // ============ SETUP VIDEO RECORDING ============
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.start(100);
      
      // ============ RENDER FRAMES ============
      for (let i = 0; i < totalFrames; i++) {
        const angle = (i / totalFrames) * Math.PI * 2;
        mesh.rotation.y = angle;
        
        // Render frame
        rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
        
        // Force canvas update
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.flush?.();
        }
        
        // Update progress
        setProgress(50 + ((i + 1) / totalFrames) * 50);
        
        // Wait for next frame
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }
      
      // ============ STOP RECORDING ============
      recorder.stop();
      
      const videoBlob = await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video recording timeout'));
        }, 10000);
        
        recorder.onstop = () => {
          clearTimeout(timeout);
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
      });
      
      // ============ CREATE VIDEO URL ============
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setStatus('complete');
      setProgress(100);
      
      console.log(`Video generated: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);
      
    } catch (error) {
      console.error('Video generation error:', error);
      setStatus('error');
      alert('Failed to generate video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // ============ DOWNLOAD VIDEO ============
  const downloadVideo = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = 'model_360.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // ============ RENDER UI ============
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        STL/OBJ to 360° Video Converter
      </h1>
      
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="file"
          accept=".stl,.obj,.STL,.OBJ"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        />
        
        <button
          onClick={generateVideo}
          disabled={status !== 'ready' && status !== 'complete'}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: status === 'ready' ? 'pointer' : 'not-allowed',
            backgroundColor: status === 'ready' ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            opacity: status === 'ready' ? 1 : 0.5
          }}
        >
          Generate 360° Video
        </button>
      </div>
      
      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          Status: {status.toUpperCase()}
        </p>
        
        {status === 'parsing' || status === 'rendering' ? (
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#e0e0e0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Canvas */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            border: '2px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#f0f0f0',
            maxWidth: '100%'
          }}
        />
      </div>
      
      {/* Video Result */}
      {status === 'complete' && videoUrl && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>Generated Video</h2>
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            style={{
              maxWidth: '100%',
              borderRadius: '5px',
              marginBottom: '10px',
              backgroundColor: '#f0f0f0'
            }}
          />
          <br />
          <button
            onClick={downloadVideo}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Download Video
          </button>
        </div>
      )}
      
      {/* Model Info */}
      {meshRef.current && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <h3 style={{ marginTop: '0' }}>Model Information</h3>
          <p>
            <strong>Vertices:</strong>{' '}
            {meshRef.current.geometry.getAttribute('position').count.toLocaleString()}
          </p>
          <p>
            <strong>Triangles:</strong>{' '}
            {(meshRef.current.geometry.getAttribute('position').count / 3).toLocaleString()}
          </p>
          <p>
            <strong>Material:</strong> MeshPhongMaterial (DoubleSide)
          </p>
          <p>
            <strong>Lighting:</strong> 8-point setup (Ambient + Hemisphere + 6 Directional)
          </p>
        </div>
      )}
    </div>
  );
}