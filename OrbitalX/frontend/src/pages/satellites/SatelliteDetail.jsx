import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import satelliteService from '../../services/satelliteService';
import { Heart, Send, Wifi, Globe, Terminal, LineChart } from 'lucide-react';

export default function SatelliteDetail() {
  const { id } = useParams();
  const [satellite, setSatellite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSatellite = async () => {
      try {
        const data = await satelliteService.getById(id);
        setSatellite(data.data);
      } catch (error) {
        console.error('Error fetching satellite details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSatellite();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-[#00F0FF] font-mono">ESTABLISHING UPLINK...</div>;
  if (!satellite) return <div className="p-8 text-center text-[#FF2A2A] font-mono">SATELLITE NOT FOUND</div>;

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-4 font-mono text-sm tracking-widest uppercase">
          <Link to="/satellites" className="text-gray-500 hover:text-white transition-colors">Satellites</Link>
          <span className="text-gray-700">/</span>
          <span className="text-[#00F0FF]">{satellite.satelliteId}</span>
          <span className="text-gray-700">/</span>
          <span className="text-white font-bold">{satellite.name}</span>
        </div>
        <div className="flex items-center space-x-6 text-[10px] font-mono tracking-widest uppercase">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full shadow-[0_0_5px_#00FF66]"></div>
            <span className="text-[#00FF66]">STATUS: RUNNING</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full shadow-[0_0_5px_#00F0FF]"></div>
            <span className="text-gray-400">WS: CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-8 relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00F0FF]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between relative z-10">
          <div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight uppercase">{satellite.name}</h1>
            <div className="flex items-center space-x-6 font-mono text-xs text-gray-400 tracking-widest">
              <span>ID: {satellite.satelliteId}</span>
              <span className="text-gray-700">|</span>
              <span>NORAD: {satellite.noradId || 'UNKNOWN'}</span>
              <span className="text-gray-700">|</span>
              <span>ORBIT: {satellite.orbitType}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8 md:mt-0">
            {/* Status Indicators */}
            <div className="flex space-x-3">
              <div className="border border-[#00F0FF]/30 bg-[#00F0FF]/5 px-4 py-2 rounded flex items-center space-x-2">
                <Wifi size={12} className="text-[#00F0FF]" />
                <span className="text-[10px] font-mono tracking-widest text-[#00F0FF] uppercase">Connected</span>
              </div>
              <div className="border border-[#00FF66]/30 bg-[#00FF66]/5 px-4 py-2 rounded flex items-center space-x-2">
                <Heart size={12} className="text-[#00FF66]" />
                <span className="text-[10px] font-mono tracking-widest text-[#00FF66] uppercase">Health: 96%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button className="border border-gray-600 hover:border-[#00F0FF] text-gray-300 hover:text-[#00F0FF] px-6 py-2.5 rounded text-[11px] font-mono tracking-widest uppercase transition-colors">
                Mission Control
              </button>
              <button className="bg-[#82E6E6] hover:bg-white text-[#0A0F1F] font-bold px-6 py-2.5 rounded text-[11px] font-mono tracking-widest uppercase flex items-center space-x-2 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                <Send size={14} />
                <span>Send Command</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Telemetry Link */}
        <Link to="/telemetry" className="group bg-[#0B1221] border border-gray-800 hover:border-[#00F0FF]/50 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-[#00F0FF]/5">
          <div className="bg-[#00F0FF]/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <LineChart size={28} className="text-[#00F0FF]" />
          </div>
          <h3 className="text-white font-mono text-sm tracking-widest uppercase mb-2">Telemetry Analytics</h3>
          <p className="text-gray-500 text-xs font-mono">View historical data, power draw, and thermal stability metrics.</p>
        </Link>

        {/* 3D View Link */}
        <Link to="/orbital" className="group bg-[#0B1221] border border-gray-800 hover:border-[#FFB000]/50 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-[#FFB000]/5">
          <div className="bg-[#FFB000]/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Globe size={28} className="text-[#FFB000]" />
          </div>
          <h3 className="text-white font-mono text-sm tracking-widest uppercase mb-2">3D Orbital Viewer</h3>
          <p className="text-gray-500 text-xs font-mono">Visualize current position and orbital trajectory in 3D space.</p>
        </Link>

        {/* Mission Control Link */}
        <Link to="/missions" className="group bg-[#0B1221] border border-gray-800 hover:border-[#FF2A2A]/50 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-[#FF2A2A]/5">
          <div className="bg-[#FF2A2A]/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Terminal size={28} className="text-[#FF2A2A]" />
          </div>
          <h3 className="text-white font-mono text-sm tracking-widest uppercase mb-2">Mission Control</h3>
          <p className="text-gray-500 text-xs font-mono">Access live command terminal, alerts, and real-time operations.</p>
        </Link>

      </div>
    </div>
  );
}
