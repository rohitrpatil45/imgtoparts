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
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true// Important for video capture
    });
    
    renderer.setSize(800, 600);
    renderer.setPixelRatio(0.5);
    renderer.shadowMap.enabled = false
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
    // const hemisphereLight = new THREE.HemisphereLight(
    //   0xffffff, // Sky color
    //   0x444444, // Ground color
    //   0.8       // Intensity
    // );
    // scene.add(hemisphereLight);
    
    // 3. Main Directional Light (Front)
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontLight.position.set(0, 5, 10);
    frontLight.castShadow = false;
    frontLight.shadow.mapSize.width = 2048; 
    frontLight.shadow.mapSize.height = 2048;
    scene.add(frontLight);
    
    // 4. Back Light (Fixes black back)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
    
    // 5. Left Light
    // const leftLight = new THREE.DirectionalLight(0xffffff, 0.6);
    // leftLight.position.set(-10, 5, 0);
    // scene.add(leftLight);
    
    // 6. Right Light
    // const rightLight = new THREE.DirectionalLight(0xffffff, 0.6);
    // rightLight.position.set(10, 5, 0);
    // scene.add(rightLight);
    
    // 7. Top Light
    // const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
    // topLight.position.set(0, 10, 0);
    // scene.add(topLight);
    
    // 8. Bottom Light (Fixes dark bottom)
    // const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
    // bottomLight.position.set(0, -5, 0);
    // scene.add(bottomLight);
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
      console.log(buffer)

      
      let geometry: THREE.BufferGeometry;
      
      if (file.name.toLowerCase().endsWith('.stl')) {
        console.log('Parsing STL...');
        const loader = new STLLoader();
        geometry = loader.parse(buffer);
      // } else if (file.name.toLowerCase().endsWith('.obj')) {
      //   console.log('Parsing OBJ...');
      //   const loader = new OBJLoader();
      //   const obj = loader.parse(new TextDecoder().decode(buffer));
      //   geometry = obj.children[0];
      } else {
        throw new Error('Unsupported format');
      }
      
      // ============ GEOMETRY OPTIMIZATION ============
   console.log('Optimizing geometry...');

geometry.center();

if (!geometry.getAttribute('normal')) {
  geometry.computeVertexNormals();
}

geometry.computeBoundingBox();
geometry.computeBoundingSphere();
      
      // Fix normals for better lighting
      // geometry.normalizeNormals();
      
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
        // const ctx = canvas.getContext('2d');
        // if (ctx) {
        //   console.log(ctx, "rohit")
        //   // ctx.flush?.();
        // }
        
        // Update progress
        if (i % 20 === 0) {
    setProgress(
      50 + ((i + 1) / totalFrames) * 50
    );
  }
        
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
  <main
    style={{
      minHeight: '100vh',
      background:
        'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)',
      color: '#0f172a',
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '32px 20px',
    }}
  >
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      {/* ================= HEADER ================= */}

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
          
           

            <div>
             

              <h2
                style={{
                  margin: '2px 0 0',
                  color: '#e7dc40',
                  fontSize: '19px',
                  fontWeight: 700,
                  stroke: '1px #000',
                  strokeWidth: '1px',
                }}
              >
                Turn your 3D models into smooth 360° videos
              </h2>
            </div>
          </div>
        </div>



        

        {/* STATUS BADGE */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '999px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                status === 'ready'
                  ? '#22c55e'
                  : status === 'error'
                  ? '#ef4444'
                  : status === 'rendering' || status === 'parsing'
                  ? '#f59e0b'
                  : '#94a3b8',
              boxShadow:
                status === 'ready'
                  ? '0 0 0 4px rgba(34, 197, 94, 0.12)'
                  : 'none',
            }}
          />

          {status === 'ready'
            ? 'Ready'
            : status === 'parsing'
            ? 'Processing Model'
            : status === 'rendering'
            ? 'Generating Video'
            : status === 'complete'
            ? 'Completed'
            : status === 'error'
            ? 'Error'
            : 'Waiting for Model'}
        </div>
      </header>



   <div
            style={{
              marginTop: '18px',
              marginBottom: '18px',

              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              padding: '14px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow:
                '0 8px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            {/* UPLOAD */}

            <label
              style={{
                padding: '11px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: '#334155',
                background: '#f8fafc',
              }}
            >
              ↑ Upload Model

              <input
                type="file"
                accept=".stl,.STL,.obj,.OBJ"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleFile(file);
                  }
                }}
                style={{
                  display: 'none',
                }}
              />
            </label>

            {/* GENERATE */}

            <button
              onClick={generateVideo}
              disabled={
                status !== 'ready' &&
                status !== 'complete'
              }
              style={{
                padding: '12px 22px',
                border: 'none',
                borderRadius: '10px',
                cursor:
                  status === 'ready' ||
                  status === 'complete'
                    ? 'pointer'
                    : 'not-allowed',
                background:
                  status === 'ready' ||
                  status === 'complete'
                    ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                    : '#cbd5e1',
                color: 'white',
                fontSize: '14px',
                fontWeight: 700,
                boxShadow:
                  status === 'ready' ||
                  status === 'complete'
                    ? '0 8px 20px rgba(37, 99, 235, 0.25)'
                    : 'none',
                opacity:
                  status === 'ready' ||
                  status === 'complete'
                    ? 1
                    : 0.7,
              }}
            >
              ▶ Generate 360° Video
            </button>
          </div>



      {/* ================= MAIN WORKSPACE ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 330px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ================= LEFT SIDE ================= */}

        <section>
          {/* WORKSPACE */}

          <div
            style={{
              background: '#0f172a',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid #1e293b',
              boxShadow:
                '0 20px 50px rgba(15, 23, 42, 0.15)',
            }}
          >
            {/* WORKSPACE HEADER */}

            <div
              style={{
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 18px',
                borderBottom: '1px solid #1e293b',
                background: 'rgba(15, 23, 42, 0.9)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    color: '#f8fafc',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  3D Preview
                </span>

                {meshRef.current && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      padding: '4px 8px',
                      background: '#1e293b',
                      borderRadius: '999px',
                    }}
                  >
                    MODEL LOADED
                  </span>
                )}
              </div>

              <span
                style={{
                  color: '#64748b',
                  fontSize: '12px',
                }}
              >
                Drag to rotate · Scroll to zoom
              </span>
            </div>

            {/* CANVAS AREA */}

            <div
              style={{
                position: 'relative',
                minHeight: '520px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'radial-gradient(circle at center, #1e293b 0%, #0f172a 70%)',
              }}
            >
              {/* EMPTY STATE */}

              {!meshRef.current && status !== 'parsing' && (
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 2,
                    textAlign: 'center',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '70px',
                      height: '70px',
                      margin: '0 auto 16px',
                      borderRadius: '20px',
                      background: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                    }}
                  >
                    ◇
                  </div>

                  <h3
                    style={{
                      margin: '0 0 8px',
                      color: '#e2e8f0',
                      fontSize: '18px',
                    }}
                  >
                    Upload a 3D model
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                    }}
                  >
                    Your STL model will appear here
                  </p>
                </div>
              )}

              {/* LOADING OVERLAY */}

              {(status === 'parsing' ||
                status === 'rendering') && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div
                    style={{
                      width: 'min(420px, 80%)',
                      padding: '28px',
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid #334155',
                      borderRadius: '18px',
                      boxShadow:
                        '0 20px 60px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            color: 'white',
                            fontWeight: 600,
                          }}
                        >
                          {status === 'parsing'
                            ? 'Processing model'
                            : 'Rendering video'}
                        </p>

                        <p
                          style={{
                            margin: '5px 0 0',
                            color: '#94a3b8',
                            fontSize: '13px',
                          }}
                        >
                          {status === 'parsing'
                            ? 'Optimizing 3D geometry...'
                            : 'Creating your 360° animation...'}
                        </p>
                      </div>

                      <span
                        style={{
                          color: '#60a5fa',
                          fontWeight: 700,
                        }}
                      >
                        {Math.round(progress)}%
                      </span>
                    </div>

                    <div
                      style={{
                        height: '8px',
                        background: '#334155',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background:
                            'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* THREE CANVAS */}

              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* ================= ACTION BAR ================= */}

       
        </section>

        {/* ================= RIGHT SIDEBAR ================= */}

        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* MODEL DETAILS */}

          <div
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              padding: '20px',
              boxShadow:
                '0 8px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 700,
                  }}
                >
                  Model Details
                </h3>

                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  Geometry information
                </p>
              </div>

              <span
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                STL
              </span>
            </div>

            {meshRef.current ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
              >
                {/* VERTICES */}

                <div>
                  <p
                    style={{
                      margin: '0 0 5px',
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    Vertices
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '22px',
                      fontWeight: 700,
                    }}
                  >
                    {meshRef.current.geometry
                      .getAttribute('position')
                      .count.toLocaleString()}
                  </p>
                </div>

                {/* TRIANGLES */}

                <div>
                  <p
                    style={{
                      margin: '0 0 5px',
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    Triangles
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '22px',
                      fontWeight: 700,
                    }}
                  >
                    {Math.floor(
                      meshRef.current.geometry.getAttribute(
                        'position'
                      ).count / 3
                    ).toLocaleString()}
                  </p>
                </div>

                <div
                  style={{
                    height: '1px',
                    background: '#e2e8f0',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>
                    Material
                  </span>

                  <span
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    Phong
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>
                    Renderer
                  </span>

                  <span
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    WebGL
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '35px 10px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}
              >
                No model loaded yet
              </div>
            )}
          </div>

          {/* RENDER SETTINGS */}

          <div
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              padding: '20px',
              boxShadow:
                '0 8px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <h3
              style={{
                margin: '0 0 18px',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              Video Settings
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  Resolution
                </span>

                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  800 × 600
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  Rotation
                </span>

                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  360°
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  Animation
                </span>

                <span
                  style={{
                    padding: '4px 8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  SMOOTH
                </span>
              </div>
            </div>
          </div>

          {/* TIP */}

          <div
            style={{
              padding: '18px',
              borderRadius: '18px',
              background:
                'linear-gradient(135deg, #eff6ff, #f5f3ff)',
              border: '1px solid #dbeafe',
            }}
          >
            <p
              style={{
                margin: '0 0 6px',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              💡 Tip
            </p>

            <p
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.6,
                color: '#475569',
              }}
            >
              Large models with millions of vertices may take
              longer to process and render.
            </p>
          </div>
        </aside>
      </div>

      {/* ================= VIDEO RESULT ================= */}

      {status === 'complete' && videoUrl && (
        <section
          style={{
            marginTop: '28px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '24px',
            boxShadow:
              '0 12px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                }}
              >
                Your video is ready 🎉
              </h2>

              <p
                style={{
                  margin: '6px 0 0',
                  color: '#64748b',
                  fontSize: '13px',
                }}
              >
                Preview and download your generated 360° video.
              </p>
            </div>

            <button
              onClick={downloadVideo}
              style={{
                padding: '11px 18px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                background: '#0f172a',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ↓ Download Video
            </button>
          </div>

          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            style={{
              width: '100%',
              maxHeight: '650px',
              display: 'block',
              borderRadius: '14px',
              background: '#020617',
            }}
          />
        </section>
      )}
    </div>

    {/* ================= RESPONSIVE ================= */}

    <style>{`
      @media (max-width: 1000px) {
        main > div > div {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 600px) {
        main {
          padding: 18px 12px !important;
        }

        h1 {
          font-size: 22px !important;
        }
      }
    `}</style>
  </main>
);
}