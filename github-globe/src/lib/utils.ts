import * as THREE from 'three';

export function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export function createDotMatrix(): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const radius = 1;

  for (let lat = -90; lat <= 90; lat += 2) {
    for (let lon = -180; lon <= 180; lon += 2) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      points.push(new THREE.Vector3(x, y, z));
    }
  }

  return points;
}