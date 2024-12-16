"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { World } from "./World";
import { Satellite } from "../types";

// Sample Arcs Data and Colors
const colors = ["#06b6d4", "#3b82f6", "#6366f1"];
const sampleArcs = [
  {
    order: 1,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -22.9068,
    endLng: -43.1729,
    arcAlt: 0.1,
    color: colors[Math.floor(Math.random() * colors.length)],
  },
  {
    order: 2,
    startLat: 28.6139,
    startLng: 77.209,
    endLat: 3.139,
    endLng: 101.6869,
    arcAlt: 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
  },
  {
    order: 3,
    startLat: 51.5072,
    startLng: -0.1276,
    endLat: 40.7128,
    endLng: -74.006,
    arcAlt: 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  },
];

// Globe Configuration
const globeConfig = {
  pointSize: 10,
  globeColor: "#062056",
  showAtmosphere: true,
  atmosphereColor: "#FFFFFF",
  atmosphereAltitude: 0.1,
  emissive: "#062056",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#38bdf8",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

export function GlobeDemo() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  const addSatellite = () => {
    const newSatellite: Satellite = {
      id: `sat${satellites.length + 1}`,
      lat: Math.random() * 180 - 90,
      lng: Math.random() * 360 - 180,
      alt: 0.05,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setSatellites(prev => [...prev, newSatellite]);
    console.log(
      `Added Satellite ${newSatellite.id} at lat=${newSatellite.lat.toFixed(2)} lng=${newSatellite.lng.toFixed(2)}`
    );
  };

  const formStarShieldGrid = () => {
    // Assign a stable grid formation around the equator.
    // For example, arrange satellites in a 5xN grid:
    // We'll assume a small altitude and lat/lng steps.
    const rows = 5; 
    const cols = Math.ceil(satellites.length / rows);
    const latStep = 10;  // Degrees between rows
    const lngStep = 15;  // Degrees between columns
    const baseLat = -((rows-1)*latStep)/2; // Center the grid around lat=0
    const baseLng = -((cols-1)*lngStep)/2; // Center the grid around lng=0

    const newFormation = satellites.map((sat, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const newLat = baseLat + row * latStep;
      const newLng = baseLng + col * lngStep;

      return {
        ...sat,
        lat: newLat,
        lng: newLng,
        alt: 0.05, // keep them in a stable altitude
      };
    });

    setSatellites(newFormation);
    console.log("Satellites repositioned into a star shield grid formation");
  };

  return (
    <div className="relative w-full min-h-screen bg-black">
      <div className="absolute inset-0 flex flex-col items-center">
        
        <motion.div
          className="text-center mt-20 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl font-bold text-white">
            Global Network Visualization
          </h2>
          <p className="text-lg text-neutral-200 max-w-md mt-2">
            Interactive 3D globe showing worldwide connections
          </p>
          
          <div className="mt-4 flex flex-col gap-2 items-center">
            <button 
              onClick={addSatellite}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Add Satellite
            </button>
            <button
              onClick={formStarShieldGrid}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Form Star Shield Grid
            </button>
            <div className="text-sm text-neutral-400 mt-2">
              Active Satellites: {satellites.length}
            </div>
          </div>
        </motion.div>
        
        <div className="flex-1 w-full relative">
          <div className="absolute inset-0">
            <World data={sampleArcs} globeConfig={globeConfig} satellites={satellites} />
          </div>
        </div>
        
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-black pointer-events-none" />
      </div>
    </div>
  );
}
