import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, Globe, ArrowRight, Satellite } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1F] flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-[420px] bg-transparent">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#121C36] flex items-center justify-center rounded-lg border border-gray-800 mb-6 shadow-lg">
            <Satellite className="text-[#00F0FF] w-8 h-8" />
          </div>
          <h1 className="text-[22px] text-white font-medium mb-2 text-center">
            Mission Control Access<span className="text-gray-500">[ Log In/Register ]</span>
          </h1>
          <p className="text-gray-400 text-[15px] text-center px-4 leading-relaxed">
            Sign in to access the OrbitalX simulation environment.
          </p>
        </div>

        {error && (
          <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF2A2A] p-3 rounded mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2 uppercase">
              Operator ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User size={18} />
              </div>
              <input
                type="email"
                placeholder="operator@orbitalx.dev"
                className="w-full bg-[#0B1221] border border-gray-800 text-white p-3 pl-10 rounded focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors placeholder:text-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-400 text-xs font-mono tracking-widest uppercase">
                Access Code
              </label>
              <a href="#" className="text-[#00F0FF] text-xs font-mono hover:underline">
                Forgot code?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-[#0B1221] border border-gray-800 text-white p-3 pl-10 pr-10 rounded focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors placeholder:text-gray-600"
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

          {/* Checkbox */}
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="secureSession"
              className="w-4 h-4 rounded border-gray-700 bg-[#0B1221] text-[#00F0FF] focus:ring-[#00F0FF]/30 focus:ring-offset-[#0A0F1F]"
            />
            <label htmlFor="secureSession" className="ml-2 text-sm text-gray-400 font-mono">
              Maintain secure session
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#82E6E6] hover:bg-white text-[#0A0F1F] font-bold py-3.5 px-4 rounded transition-all duration-200 uppercase tracking-widest text-[13px] flex items-center justify-center space-x-2 mt-4"
          >
            <span>Initialize Link</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-[#0A0F1F] text-gray-500 font-mono tracking-widest uppercase">
              Or Alternate Relay
            </span>
          </div>
        </div>

        {/* SSO Button */}
        <button
          type="button"
          className="w-full bg-transparent border border-gray-800 hover:border-gray-600 text-gray-300 font-mono py-3 rounded transition-colors text-sm flex items-center justify-center space-x-3 mb-8"
        >
          <Globe size={18} className="text-gray-400" />
          <span>Continue via Another/Company Account</span>
        </button>

        {/* Footer Link */}
        <p className="text-center text-gray-400 text-sm font-mono">
          New operator?{' '}
          <Link to="/register" className="text-[#00F0FF] hover:underline hover:text-white transition-colors underline-offset-4">
            Request Access
          </Link>
        </p>
      </div>
    </div>
  );
}
