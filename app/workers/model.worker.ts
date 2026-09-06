// app/workers/model.worker.ts

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

type ParseRequest = {
  type: 'parse';
  buffer: ArrayBuffer;
  fileName: string;
};

type ProgressMessage = {
  type: 'progress';
  stage: 'parsing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
};

type CompleteMessage = {
  type: 'complete';
  position: ArrayBuffer;
  normal: ArrayBuffer | null;
  index: ArrayBuffer | null;
  positionCount: number;
  triangleCount: number;
  originalTriangleCount: number;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
    radius: number;
  };
};

type ErrorMessage = {
  type: 'error';
  message: string;
};

function progress(
  stage: ProgressMessage['stage'],
  percent: number,
  message: string
) {
  self.postMessage({
    type: 'progress',
    stage,
    progress: percent,
    message,
  } satisfies ProgressMessage);
}

function getTriangleCount(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute('position');

  if (!position) {
    return 0;
  }

  if (geometry.index) {
    return Math.floor(geometry.index.count / 3);
  }

  return Math.floor(position.count / 3);
}

function getBounds(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const box = geometry.boundingBox;
  const sphere = geometry.boundingSphere;

  if (!box || !sphere) {
    throw new Error('Could not calculate model bounds.');
  }

  return {
    min: [box.min.x, box.min.y, box.min.z] as [number, number, number],
    max: [box.max.x, box.max.y, box.max.z] as [number, number, number],
    center: [
      sphere.center.x,
      sphere.center.y,
      sphere.center.z,
    ] as [number, number, number],
    radius: sphere.radius,
  };
}

function extractOBJGeometry(object: THREE.Group): THREE.BufferGeometry {
  let geometry: THREE.BufferGeometry | null = null;

  object.traverse((child) => {
    if (geometry) return;

    if (child instanceof THREE.Mesh) {
      if (child.geometry instanceof THREE.BufferGeometry) {
        geometry = child.geometry;
      }
    }
  });

  if (!geometry) {
    throw new Error('OBJ file does not contain a renderable mesh.');
  }

  return geometry;
}

async function parseModel(buffer: ArrayBuffer, fileName: string) {
  const extension = fileName.toLowerCase().split('.').pop();

  progress('parsing', 0, `Parsing ${fileName}...`);

  let geometry: THREE.BufferGeometry;

  if (extension === 'stl') {
    const loader = new STLLoader();
    geometry = loader.parse(buffer);
  } else if (extension === 'obj') {
    const loader = new OBJLoader();

    const text = new TextDecoder().decode(buffer);
    const object = loader.parse(text);

    geometry = extractOBJGeometry(object);
  } else {
    throw new Error('Unsupported file. Please upload STL or OBJ.');
  }

  progress('parsing', 100, 'Model parsed.');

  const position = geometry.getAttribute('position');

  if (!position || position.count === 0) {
    throw new Error('The model contains no vertices.');
  }

  const originalTriangleCount = getTriangleCount(geometry);

  progress(
    'analyzing',
    15,
    `${originalTriangleCount.toLocaleString()} triangles detected.`
  );

  /*
   * Keep your current centering behavior.
   */
  geometry.center();

  progress('analyzing', 40, 'Calculating model bounds...');

  /*
   * IMPORTANT:
   * Do not always call computeVertexNormals().
   *
   * Your previous code did this for every model:
   *
   * geometry.computeVertexNormals();
   *
   * For a huge STL this can be extremely expensive.
   *
   * Only generate normals if the loader did not already provide them.
   */
  if (!geometry.getAttribute('normal')) {
    progress('analyzing', 60, 'Generating missing normals...');
    geometry.computeVertexNormals();
  }

  /*
   * Your old code also called:
   *
   * geometry.normalizeNormals();
   *
   * Remove that unnecessary extra pass.
   */

  const bounds = getBounds(geometry);

  progress('analyzing', 100, 'Geometry analysis complete.');

  /*
   * For now we intentionally do NOT aggressively simplify the mesh.
   *
   * We first want to know the actual triangle count and processing time
   * of your large files.
   */
  const finalTriangleCount = getTriangleCount(geometry);

  const finalPosition =
    geometry.getAttribute('position') as THREE.BufferAttribute;

  const finalNormal =
    geometry.getAttribute('normal') as THREE.BufferAttribute | undefined;

  /*
   * Copy arrays so we can safely transfer their underlying buffers.
   */
  const positionData = new Float32Array(
    finalPosition.array as Float32Array
  );

  const normalData = finalNormal
    ? new Float32Array(finalNormal.array as Float32Array)
    : null;

  let indexData: Uint32Array | null = null;

  if (geometry.index) {
    const source = geometry.index.array;

    if (source instanceof Uint32Array) {
      indexData = new Uint32Array(source);
    } else if (source instanceof Uint16Array) {
      indexData = new Uint32Array(source);
    } else {
      throw new Error('Unsupported geometry index format.');
    }
  }

  progress('complete', 100, 'Model is ready for Three.js rendering.');

  const transferables: Transferable[] = [
    positionData.buffer,
  ];

  if (normalData) {
    transferables.push(normalData.buffer);
  }

  if (indexData) {
    transferables.push(indexData.buffer);
  }

  const message: CompleteMessage = {
    type: 'complete',

    position: positionData.buffer,

    normal: normalData
      ? normalData.buffer
      : null,

    index: indexData
      ? indexData.buffer
      : null,

    positionCount: finalPosition.count,

    triangleCount: finalTriangleCount,

    originalTriangleCount,

    bounds,
  };

  self.postMessage(message, transferables);

  geometry.dispose();
}

self.onmessage = async (
  event: MessageEvent<ParseRequest>
) => {
  try {
    if (!event.data || event.data.type !== 'parse') {
      throw new Error('Invalid Worker message.');
    }

    await parseModel(
      event.data.buffer,
      event.data.fileName
    );
  } catch (error) {
    const message: ErrorMessage = {
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : String(error),
    };

    self.postMessage(message);
  }
};