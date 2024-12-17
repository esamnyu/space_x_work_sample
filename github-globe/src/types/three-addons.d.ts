declare module 'three/addons/controls/OrbitControls.js' {
    import { Camera, EventDispatcher } from 'three';
    export class OrbitControls extends EventDispatcher {
      constructor(camera: Camera, domElement?: HTMLElement);
      enabled: boolean;
      target: THREE.Vector3;
      enableDamping: boolean;
      dampingFactor: number;
      rotateSpeed: number;
      autoRotate: boolean;
      autoRotateSpeed: number;
      minDistance: number;
      maxDistance: number;
      update(): void;
      dispose(): void;
    }
  }