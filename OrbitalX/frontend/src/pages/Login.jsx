import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, Globe, ArrowRight, Satellite, Zap } from 'lucide-react';

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

  const handleQuickDemo = () => {
    setEmail('admin@orbitalx.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1F] flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-[420px] bg-transparent">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#121C36] flex items-center justify-center rounded-xl border border-gray-800 mb-5 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <Satellite className="text-[#00F0FF] w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl text-white font-bold tracking-tight mb-2 text-center flex items-center space-x-2">
            <span>Mission Control Access</span>
          </h1>
          <p className="text-gray-400 text-xs font-mono tracking-widest text-center uppercase">
            ORBITALX AEROSPACE & SATELLITE OPERATIONS GATEWAY
          </p>
        </div>

        {/* Quick Demo Credentials Autofill Banner */}
        <div className="bg-[#0B1221] border border-[#00F0FF]/30 rounded-lg p-3 mb-5 flex items-center justify-between shadow-lg">
          <div className="text-xs font-mono">
            <span className="text-gray-400 block text-[10px] uppercase">DEMO CREDENTIALS:</span>
            <span className="text-white font-semibold">admin@orbitalx.com / admin123</span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="flex items-center space-x-1 px-2.5 py-1 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 text-[#00F0FF] rounded text-[11px] font-mono font-bold transition-all"
            title="Auto-fill default admin credentials"
          >
            <Zap size={12} />
            <span>AUTO-FILL</span>
          </button>
        </div>

        {error && (
          <div className="bg-[#FF2A2A]/15 border border-[#FF2A2A]/50 text-[#FF2A2A] p-3 rounded mb-5 text-xs font-mono text-center shadow-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-gray-400 text-xs font-mono tracking-widest mb-1.5 uppercase">
              Operator ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User size={16} />
              </div>
              <input
                type="email"
                placeholder="admin@orbitalx.com"
                className="w-full bg-[#0B1221] border border-gray-800 text-white p-3 pl-10 rounded text-sm focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors placeholder:text-gray-600 font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-gray-400 text-xs font-mono tracking-widest uppercase">
                Access Code
              </label>
              <a href="#" className="text-[#00F0FF] text-xs font-mono hover:underline">
                Forgot code?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-[#0B1221] border border-gray-800 text-white p-3 pl-10 pr-10 rounded text-sm focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/50 transition-colors placeholder:text-gray-600 font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center pt-1">
            <input
              type="checkbox"
              id="secureSession"
              defaultChecked
              className="w-4 h-4 rounded border-gray-700 bg-[#0B1221] text-[#00F0FF] focus:ring-[#00F0FF]/30 focus:ring-offset-[#0A0F1F]"
            />
            <label htmlFor="secureSession" className="ml-2 text-xs text-gray-400 font-mono">
              Maintain secure operational session
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#00F0FF] hover:bg-white text-black font-mono font-bold py-3.5 px-4 rounded transition-all duration-200 uppercase tracking-widest text-xs flex items-center justify-center space-x-2 mt-3 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            <span>INITIALIZE OPERATOR LINK</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-[#0A0F1F] text-gray-500 font-mono tracking-widest uppercase text-[10px]">
              Or Alternate Relay
            </span>
          </div>
        </div>

        {/* Alternate Login Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          className="w-full bg-transparent border border-gray-800 hover:border-gray-600 text-gray-300 font-mono py-2.5 rounded transition-colors text-xs flex items-center justify-center space-x-2.5 mb-6"
        >
          <Globe size={15} className="text-gray-400" />
          <span>Quick Login as System Administrator</span>
        </button>

        {/* Footer Link */}
        <p className="text-center text-gray-400 text-xs font-mono">
          New operator?{' '}
          <Link to="/register" className="text-[#00F0FF] hover:underline hover:text-white transition-colors underline-offset-4">
            Request Access Credentials
          </Link>
        </p>
      </div>
    </div>
  );
}
