"use client";
import React from "react";
import { motion } from "framer-motion";
import { World } from "./Globe";

export function GlobeDemo() {
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
        </motion.div>
        
        <div className="flex-1 w-full relative">
          <div className="absolute inset-0">
            <World data={sampleArcs} globeConfig={globeConfig} />
          </div>
        </div>
        
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-black pointer-events-none" />
      </div>
    </div>
  );
}