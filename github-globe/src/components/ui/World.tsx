"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import axios from 'axios';
import type { Feature, Geometry, Position, MultiPolygon as GeoJSONMultiPolygon, Polygon as GeoJSONPolygon } from 'geojson';

import { latLongToVector3, createDotMatrix } from '../../lib/utils';
import { WorldProps, CountriesData } from '@/types';

interface GeoProcessing {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export const World: React.FC<WorldProps> = ({ data, globeConfig, satellites = [] }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const arcsRef = useRef<THREE.Group>(new THREE.Group());
  const countriesRef = useRef<THREE.Group>(new THREE.Group());
  const satellitesRef = useRef<THREE.Group>(new THREE.Group());
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  const [countriesData, setCountriesData] = useState<CountriesData | null>(null);

  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get<CountriesData>('/data/ne_110m_admin_0_countries.geojson');
        setCountriesData(response.data);
      } catch (error) {
        console.error('Error fetching countries GeoJSON:', error);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!mountRef.current || !isClient) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.z = 2.5;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const radius = 1;

    // Globe
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: globeConfig.globeColor,
      emissive: new THREE.Color(globeConfig.emissive),
      emissiveIntensity: globeConfig.emissiveIntensity,
      shininess: globeConfig.shininess,
      transparent: true,
      opacity: 0.9,
    });
    const globeGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Dot matrix
    const points = createDotMatrix();
    const dotGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const dotTexture = new THREE.TextureLoader().load('/dot-texture.svg');
    const dotMaterial = new THREE.PointsMaterial({
      color: globeConfig.polygonColor,
      size: globeConfig.pointSize * 0.005,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.6,
      alphaTest: 0.5,
      map: dotTexture,
    });
    const dotMatrix = new THREE.Points(dotGeometry, dotMaterial);
    dotMatrix.scale.setScalar(1.001);
    scene.add(dotMatrix);

    // Atmosphere
    if (globeConfig.showAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(
        radius + globeConfig.atmosphereAltitude, 64, 64
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

    // Lighting
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

      const mid = new THREE.Vector3(
        (start.x + end.x) * 0.5,
        (start.y + end.y) * 0.5 + radius * arc.arcAlt,
        (start.z + end.z) * 0.5
      );

      const arcCurve = new THREE.QuadraticBezierCurve3(start, mid, end);
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

    const processPolygon = (
      polygon: GeoJSONPolygon | GeoProcessing,
      group: THREE.Group,
      radius: number,
      color: THREE.Color
    ) => {
      const polyPoints: THREE.Vector3[] = [];

      // Ensure we're working with the correct coordinate type
      const coordinates = polygon.coordinates[0] as Position[];

      coordinates.forEach((coord) => {
        const lon = Number(coord[0]);
        const lat = Number(coord[1]);
        const vec = latLongToVector3(lat, lon, radius * 1.001);
        polyPoints.push(vec);
      });

      const countryGeometry = new THREE.BufferGeometry().setFromPoints(polyPoints);
      const countryMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.3,
      });

      const countryLine = new THREE.LineLoop(countryGeometry, countryMaterial);
      group.add(countryLine);
    };

    if (countriesData) {
      countriesData.features.forEach((feature: Feature) => {
        const geometry = feature.geometry as GeoJSONPolygon | GeoJSONMultiPolygon;
        
        if (geometry.type === 'Polygon') {
          processPolygon(geometry, countriesRef.current, radius, new THREE.Color(globeConfig.polygonColor));
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach((polygonCoords) => {
            processPolygon(
              { type: 'Polygon', coordinates: polygonCoords },
              countriesRef.current,
              radius,
              new THREE.Color(globeConfig.polygonColor)
            );
          });
        }
      });
    }

    // Satellites
    scene.add(satellitesRef.current);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 4;
    controls.autoRotate = globeConfig.autoRotate;
    controls.autoRotateSpeed = globeConfig.autoRotateSpeed;
    controlsRef.current = controls;

    const driftSatellite = (satMesh: THREE.Object3D) => {
      satMesh.position.x += (Math.random() - 0.5) * 0.0005;
      satMesh.position.y += (Math.random() - 0.5) * 0.0005;
      satMesh.position.z += (Math.random() - 0.5) * 0.0005;
    };

    // Animation
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      requestAnimationFrame(animate);
      controls.update();

      if (globeConfig.autoRotate) {
        dotMatrix.rotation.y += globeConfig.autoRotateSpeed * 0.001;
        countriesRef.current.rotation.y += globeConfig.autoRotateSpeed * 0.001;
        satellitesRef.current.rotation.y += globeConfig.autoRotateSpeed * 0.001;
      }

      // Satellite movement
      satellitesRef.current.children.forEach(satMesh => {
        const userData = satMesh.userData;
        if (userData?.targetLat !== undefined) {
          const targetPos = latLongToVector3(
            userData.targetLat,
            userData.targetLng,
            1 + userData.targetAlt
          );
          satMesh.position.lerp(targetPos, 0.05);

          if (Math.random() < 0.001) {
            driftSatellite(satMesh);
          }
        }
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };
  }, [data, globeConfig, countriesData]);

  // Satellite updates
  useEffect(() => {
    if (!sceneRef.current || !satellitesRef.current || !isClient) return;
    
    satellitesRef.current.clear();

    const createSatelliteMesh = (color: string) => {
      const bodyGeometry = new THREE.BoxGeometry(0.02, 0.01, 0.01);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color });
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
      satMesh.userData = {
        targetLat: sat.lat,
        targetLng: sat.lng,
        targetAlt: sat.alt
      };

      satMesh.scale.set(0, 0, 0);
      let scaleFactor = 0;
      const grow = () => {
        scaleFactor += 0.05;
        satMesh.scale.setScalar(scaleFactor);
        if (scaleFactor < 1) requestAnimationFrame(grow);
      };
      grow();

      satellitesRef.current.add(satMesh);
    });
  }, [satellites, isClient]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};