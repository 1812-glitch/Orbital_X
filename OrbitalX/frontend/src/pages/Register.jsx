import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Satellite,
  Eye,
  EyeOff,
  Rocket,
  BarChart3,
  Globe2,
  Command,
} from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== verifyPassword) {
      setError("Auth keys do not match.");
      return;
    }
    try {
      await register(name, email, password);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200 flex flex-col md:flex-row font-sans">
      {/* Left Column - Form */}
      <div className="w-full md:w-[55%] p-8 lg:p-16 xl:p-24 flex flex-col justify-center">
        <div className="max-w-[480px] w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2 text-[#00F0FF] mb-8">
            <Satellite size={24} />
            <span className="text-lg font-mono font-bold tracking-widest">
              ORBITAL-X
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
            Create Mission Control Account
          </h1>
          <p className="text-gray-400 mb-10 text-[15px]">
            Join the OrbitalX orbital simulation environment.
          </p>

          {error && (
            <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF2A2A] p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest uppercase mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Dr. Jane Doe"
                className="w-full bg-[#0B1221] border border-gray-800 text-white p-3.5 rounded focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors placeholder:text-gray-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest uppercase mb-2">
                Secure Email
              </label>
              <input
                type="email"
                placeholder="jane.doe@agency.gov"
                className="w-full bg-[#0B1221] border border-gray-800 text-white p-3.5 rounded focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors placeholder:text-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest uppercase mb-2">
                Auth Key (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-[#0B1221] border border-gray-800 text-white p-3.5 pr-10 rounded focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors placeholder:text-gray-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest uppercase mb-2">
                Verify Auth Key
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#0B1221] border border-gray-800 text-white p-3.5 rounded focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                required
              />
              <p className="text-gray-600 text-xs font-mono tracking-widest uppercase mt-2">
                Minimum 8 characters, 1 uppercase, 1 numeric
              </p>
            </div>

            <div className="flex items-start mt-6">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  required
                  id="tos"
                  className="w-4 h-4 rounded border-gray-700 bg-[#0B1221] text-[#00F0FF] focus:ring-[#00F0FF]/30 focus:ring-offset-[#0A0F1F]"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="tos" className="text-gray-400 font-sans">
                  I agree to the{" "}
                  <a href="#" className="text-[#00F0FF] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#00F0FF] hover:underline">
                    Telemetry Data Policy
                  </a>
                  .
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#82E6E6] hover:bg-white text-[#0A0F1F] font-bold py-4 rounded transition-all duration-200 uppercase tracking-widest text-[13px] flex items-center justify-center space-x-2 mt-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <span>Initialize Account</span>
              <Rocket size={16} />
            </button>
          </form>

          <p className="mt-8 text-gray-400 text-sm text-center">
            Already an operator?{" "}
            <Link
              to="/login"
              className="text-[#00F0FF] hover:underline hover:text-white transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Features (Hidden on mobile) */}
      <div className="hidden md:flex md:w-[45%] bg-[#12192b] border-l border-gray-800 p-8 lg:p-16 flex-col justify-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#00F0FF] opacity-5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-12">
            Explore OrbitalX
          </h2>

          <div className="space-y-8">
            {/* Feature 01 */}
            <div className="bg-[#0A0F1F]/50 border border-gray-800 rounded-lg p-6 flex relative group hover:border-gray-600 transition-colors">
              <span className="text-3xl font-mono text-gray-700 absolute left-6 group-hover:text-[#00F0FF]/20 transition-colors">
                01
              </span>
              <div className="ml-16">
                <div className="flex items-center space-x-3 mb-2">
                  <BarChart3 className="text-[#00F0FF]" size={20} />
                  <h3 className="text-sm font-mono tracking-widest uppercase text-white font-bold">
                    Monitor Telemetry
                  </h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Real-time data streaming from low earth orbit assets.
                </p>
              </div>
            </div>

            {/* Feature 02 */}
            <div className="bg-[#0A0F1F]/50 border border-gray-800 rounded-lg p-6 flex relative group hover:border-gray-600 transition-colors">
              <span className="text-3xl font-mono text-gray-700 absolute left-6 group-hover:text-[#00F0FF]/20 transition-colors">
                02
              </span>
              <div className="ml-16">
                <div className="flex items-center space-x-3 mb-2">
                  <Globe2 className="text-[#00F0FF]" size={20} />
                  <h3 className="text-sm font-mono tracking-widest uppercase text-white font-bold">
                    3D Orbital Sims
                  </h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Interactive WebGL environments for trajectory planning.
                </p>
              </div>
            </div>

            {/* Feature 03 */}
            <div className="bg-[#0A0F1F]/50 border border-gray-800 rounded-lg p-6 flex relative group hover:border-gray-600 transition-colors">
              <span className="text-3xl font-mono text-gray-700 absolute left-6 group-hover:text-[#00F0FF]/20 transition-colors">
                03
              </span>
              <div className="ml-16">
                <div className="flex items-center space-x-3 mb-2">
                  <Command className="text-[#00F0FF]" size={20} />
                  <h3 className="text-sm font-mono tracking-widest uppercase text-white font-bold">
                    Mission Control
                  </h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Operate command sequences in a secure sandbox.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-gray-800 flex justify-between items-center w-full font-mono text-[11px] text-gray-500 tracking-widest">
            <span>SYS: SECURE</span>
            <span>V. 2.4.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
