import * as THREE from 'three';

export function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Creates a spherical dot matrix for the globe surface.
 */
export function createDotMatrix(): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const sphericalPoints: [number, number][] = [];
  
  for (let lat = -90; lat <= 90; lat += 15) {
    const radius = Math.cos(Math.abs(lat) * Math.PI / 180);
    const circumference = radius * Math.PI * 2;
    const dotsAtLatitude = Math.floor(circumference * 2);
    
    if (dotsAtLatitude > 0) {
      const deg = 360 / dotsAtLatitude;
      for (let long = 0; long < 360; long += deg) {
        sphericalPoints.push([lat, long]);
      }
    }
  }

  sphericalPoints.forEach(([lat, long]) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (long + 180) * (Math.PI / 180);

    const x = -Math.sin(phi) * Math.cos(theta);
    const z = Math.sin(phi) * Math.sin(theta);
    const y = Math.cos(phi);
    points.push(new THREE.Vector3(x, y, z));
  });

  return points;
}
