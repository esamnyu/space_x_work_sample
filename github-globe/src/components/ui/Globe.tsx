import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';
import { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

interface Arc {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
}

interface Satellite {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  color: string;
}

interface GlobeConfig {
  pointSize: number;
  globeColor: string;
  showAtmosphere: boolean;
  atmosphereColor: string;
  atmosphereAltitude: number;
  emissive: string;
  emissiveIntensity: number;
  shininess: number;
  polygonColor: string;
  ambientLight: string;
  directionalLeftLight: string;
  directionalTopLight: string;
  pointLight: string;
  arcTime: number;
  arcLength: number;
  rings: number;
  maxRings: number;
  initialPosition: { lat: number; lng: number };
  autoRotate: boolean;
  autoRotateSpeed: number;
}

interface WorldProps {
  data: Arc[];
  globeConfig: GlobeConfig;
  satellites?: Satellite[];
}

function createDotMatrix() {
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

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const World: React.FC<WorldProps> = ({ data, globeConfig, satellites = [] }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const arcsRef = useRef<THREE.Group>(new THREE.Group());
  const countriesRef = useRef<THREE.Group>(new THREE.Group());
  const satellitesRef = useRef<THREE.Group>(new THREE.Group());
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const [countriesData, setCountriesData] = React.useState<FeatureCollection | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get<FeatureCollection>('/data/ne_110m_admin_0_countries.geojson');
        setCountriesData(response.data);
      } catch (error) {
        console.error('Error fetching countries GeoJSON:', error);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;
    camera.lookAt(new THREE.Vector3(0,0,0));
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const radius = 1;

    // Globe
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: globeConfig.globeColor,
      emissive: new THREE.Color(globeConfig.emissive),
      emissiveIntensity: globeConfig.emissiveIntensity,
      shininess: globeConfig.shininess,
      transparent: true,
      opacity: 0.9,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Dot matrix
    const points = createDotMatrix();
    const dotGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const dotMaterial = new THREE.PointsMaterial({
      color: globeConfig.polygonColor,
      size: globeConfig.pointSize * 0.005,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.6,
      alphaTest: 0.5,
      map: new THREE.TextureLoader().load('/dot-texture.svg'),
    });
    const dotMatrix = new THREE.Points(dotGeometry, dotMaterial);
    dotMatrix.scale.set(1.001, 1.001, 1.001);
    scene.add(dotMatrix);

    // Atmosphere
    if (globeConfig.showAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(
        radius + globeConfig.atmosphereAltitude,
        64,
        64
      );
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: globeConfig.atmosphereColor,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(globeConfig.ambientLight, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(globeConfig.directionalLeftLight, 0.5);
    directionalLight1.position.set(-10, 0, 0);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(globeConfig.directionalTopLight, 0.5);
    directionalLight2.position.set(0, 10, 0);
    scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(globeConfig.pointLight, 1);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    // Arcs
    scene.add(arcsRef.current);
    data.forEach((arc) => {
      const start = latLongToVector3(arc.startLat, arc.startLng, radius);
      const end = latLongToVector3(arc.endLat, arc.endLng, radius);
      
      const arcCurve = new THREE.QuadraticBezierCurve3(
        start,
        new THREE.Vector3(
          (start.x + end.x) * 0.5,
          (start.y + end.y) * 0.5 + radius * arc.arcAlt,
          (start.z + end.z) * 0.5
        ),
        end
      );

      const arcPoints = arcCurve.getPoints(50);
      const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMaterial = new THREE.LineBasicMaterial({ 
        color: arc.color,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });

      const arcLine = new THREE.Line(arcGeometry, arcMaterial);
      arcsRef.current.add(arcLine);
    });

    // Countries
    scene.add(countriesRef.current);

    function processPolygon(polygon: Polygon, group: THREE.Group, radius: number, color: THREE.Color) {
      const polyPoints: THREE.Vector3[] = [];
      polygon.coordinates[0].forEach(([lon, lat]) => {
        const vec = latLongToVector3(lat, lon, radius * 1.001);
        polyPoints.push(vec);
      });

      const countryGeometry = new THREE.BufferGeometry().setFromPoints(polyPoints);
      const countryMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
      });

      const countryLine = new THREE.LineLoop(countryGeometry, countryMaterial);
      group.add(countryLine);
    }

    if (countriesData) {
      countriesData.features.forEach((feature) => {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
          processPolygon(geometry as Polygon, countriesRef.current, radius, new THREE.Color(globeConfig.polygonColor));
        } else if (geometry.type === 'MultiPolygon') {
          (geometry as MultiPolygon).coordinates.forEach((polygonCoords) => {
            processPolygon({ type: 'Polygon', coordinates: polygonCoords }, countriesRef.current, radius, new THREE.Color(globeConfig.polygonColor));
          });
        }
      });
    }

    // Satellites
    const satelliteGroup = satellitesRef.current;
    scene.add(satelliteGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 4;
    controls.autoRotate = globeConfig.autoRotate;
    controls.autoRotateSpeed = globeConfig.autoRotateSpeed;
    controlsRef.current = controls;

    // Add a small random drift function to simulate satellites getting pushed
    const driftSatellite = (satMesh: THREE.Object3D) => {
      // Add a tiny random offset to position
      satMesh.position.x += (Math.random() - 0.5) * 0.0005;
      satMesh.position.y += (Math.random() - 0.5) * 0.0005;
      satMesh.position.z += (Math.random() - 0.5) * 0.0005;
    };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (globeConfig.autoRotate) {
        dotMatrix.rotation.y += globeConfig.autoRotateSpeed * 0.001;
        countriesRef.current.rotation.y += globeConfig.autoRotateSpeed * 0.001;
        satelliteGroup.rotation.y += globeConfig.autoRotateSpeed * 0.001;
      }

      // Gently move satellites back towards their target orbit
      satelliteGroup.children.forEach(satMesh => {
        const userData = satMesh.userData;
        if (userData && userData.targetLat !== undefined) {
          const targetPos = latLongToVector3(userData.targetLat, userData.targetLng, 1 + userData.targetAlt);

          // Interpolate current position towards target
          satMesh.position.lerp(targetPos, 0.05);

          // Occasionally drift satellites to simulate them being pushed out
          if (Math.random() < 0.001) {
            driftSatellite(satMesh);
          }
        }
      });

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [data, globeConfig, countriesData]);

  // Update satellites when props change
  useEffect(() => {
    if (!sceneRef.current || !satellitesRef.current) return;
    const satelliteGroup = satellitesRef.current;

    // Clear old satellites
    satelliteGroup.clear();

    // Create a satellite-like mesh:
    // A small box (main body) and a small stick/antenna
    const createSatelliteMesh = (color: string) => {
      const bodyGeometry = new THREE.BoxGeometry(0.02, 0.01, 0.01);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      const antennaGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.02, 8);
      const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(0, 0.01, 0);
      body.add(antenna);

      return body;
    };

    satellites.forEach(sat => {
      const satMesh = createSatelliteMesh(sat.color);

      const position = latLongToVector3(sat.lat, sat.lng, 1 + sat.alt);
      satMesh.position.copy(position);

      // Store the target orbit position in userData so we can restore it after drift
      satMesh.userData.targetLat = sat.lat;
      satMesh.userData.targetLng = sat.lng;
      satMesh.userData.targetAlt = sat.alt;

      // Animate scale from 0 to 1 for a smooth appearance
      satMesh.scale.set(0,0,0);
      let scaleFactor = 0;
      const grow = () => {
        scaleFactor += 0.05;
        satMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        if (scaleFactor < 1) requestAnimationFrame(grow);
      };
      grow();

      satelliteGroup.add(satMesh);
    });
  }, [satellites]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};
