import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { World } from "./World";
import { SatelliteData } from '@/types';
import axios from 'axios';

// Satellite colors
const colors = ["#06b6d4", "#3b82f6", "#6366f1"];

// Globe configuration
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
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

// Function to convert TLE data to lat/long
function calculateSatellitePosition(tle: any) {
  // Simple conversion for demo - in reality, you'd want to use a proper TLE library
  // This is a placeholder that returns random values within reasonable bounds
  const lat = (Math.random() * 180 - 90) * 0.8; // Limit to ±72° latitude (typical Starlink orbit)
  const lng = Math.random() * 360 - 180;
  const alt = 0.05 + Math.random() * 0.02; // Vary altitude slightly for visual interest
  
  return { lat, lng, alt };
}

export function GlobeDemo() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchStarlinkData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json');
      const starlinkData = response.data.slice(0, 20); // Get first 20 satellites
      
      const newSatellites: SatelliteData[] = starlinkData.map((sat: any) => {
        const position = calculateSatellitePosition(sat);
        return {
          ...position,
          color: colors[Math.floor(Math.random() * colors.length)],
          name: sat.OBJECT_NAME || 'Unknown Starlink',
        };
      });
      
      setSatellites(newSatellites);
    } catch (error) {
      console.error('Error fetching Starlink data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formStarShieldGrid = () => {
    const rows = 5;
    const cols = Math.ceil(satellites.length / rows);
    const latStep = 10;
    const lngStep = 15;
    const baseLat = -((rows - 1) * latStep) / 2;
    const baseLng = -((cols - 1) * lngStep) / 2;

    const newFormation = satellites.map((sat, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...sat,
        lat: baseLat + row * latStep,
        lng: baseLng + col * lngStep,
        alt: 0.05,
      };
    });

    setSatellites(newFormation);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        <World data={[]} globeConfig={globeConfig} satellites={satellites} />
      </div>

      <motion.div
        className="absolute left-10 top-10 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-5xl font-bold text-white tracking-wide">
          Starlink Visualization
        </h1>
        <p className="text-lg text-gray-300 mt-2">
          Real-time Starlink satellite network
        </p>
      </motion.div>

      <motion.div
        className="absolute top-4 right-4 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <button
          onClick={() => setShowControls(!showControls)}
          className="text-white bg-blue-600/50 hover:bg-blue-600/80 px-4 py-2 rounded-full backdrop-blur-sm transition-all"
        >
          {showControls ? "Hide Controls" : "Show Controls"}
        </button>
      </motion.div>

      {showControls && (
        <motion.div
          className="absolute right-4 top-16 bg-gray-900/90 text-white rounded-xl p-6 shadow-2xl backdrop-blur-md z-20 border border-gray-700/50"
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={fetchStarlinkData}
              disabled={loading}
              className="w-full bg-blue-600/90 hover:bg-blue-500 py-3 px-6 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading Starlink Data..." : "Load Starlink Satellites"}
            </button>
            <button
              onClick={formStarShieldGrid}
              className="w-full bg-emerald-600/90 hover:bg-emerald-500 py-3 px-6 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5"
            >
              Form Star Shield Grid
            </button>
            <div className="w-full h-px bg-gray-700/50 my-2"></div>
            <p className="text-sm text-gray-300 font-medium">
              Active Satellites: {satellites.length}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}