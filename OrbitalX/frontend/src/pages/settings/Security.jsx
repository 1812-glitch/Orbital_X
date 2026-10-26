import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Laptop, 
  Globe, 
  ShieldCheck,
  X
} from 'lucide-react';
import { authService } from '../../services/authService';

export default function Security() {
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, success: null, error: null });

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    return localStorage.getItem('orbital_2fa_enabled') === 'true';
  });
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Active Sessions State
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Mission Flight Console (Current)',
      browser: 'Chrome 124.0 / Windows 11',
      location: 'Primary Ops Center (192.168.1.104)',
      lastActive: 'Active Now',
      isCurrent: true
    },
    {
      id: 'sess-2',
      device: 'Ground Terminal Alpha',
      browser: 'Firefox ESR / Debian Linux',
      location: 'Svalbard Node 02 (10.44.0.12)',
      lastActive: '14 minutes ago',
      isCurrent: false
    },
    {
      id: 'sess-3',
      device: 'Telemetry Mobile Companion',
      browser: 'Orbital PWA / iOS 17.4',
      location: 'Encrypted Cellular (172.56.21.90)',
      lastActive: '2 hours ago',
      isCurrent: false
    }
  ]);
  const [sessionNotice, setSessionNotice] = useState(null);

  // API & Telecommand Tokens
  const [apiTokens, setApiTokens] = useState([
    {
      id: 'tok-1',
      name: 'FLIGHT-DIRECTOR-TELECOMMAND',
      prefix: 'orbx_live_948a****',
      permissions: 'Full Telecommand & Control',
      created: '2026-10-15',
      lastUsed: '4 minutes ago'
    },
    {
      id: 'tok-2',
      name: 'GROUND-STATION-TELEMETRY-INGEST',
      prefix: 'orbx_ingest_77b1****',
      permissions: 'Read/Write Telemetry Stream',
      created: '2026-09-28',
      lastUsed: 'Just now'
    }
  ]);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenPermission, setNewTokenPermission] = useState('Read/Write Telemetry');
  const [createdTokenKey, setCreatedTokenKey] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Password Strength Calculation
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'EMPTY', color: 'bg-gray-700', text: 'text-gray-500' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 15;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;

    if (score <= 30) return { score, label: 'WEAK', color: 'bg-red-500', text: 'text-red-400' };
    if (score <= 65) return { score, label: 'MODERATE', color: 'bg-yellow-500', text: 'text-yellow-400' };
    if (score < 90) return { score, label: 'STRONG', color: 'bg-[#00FF66]', text: 'text-[#00FF66]' };
    return { score: 100, label: 'MISSION-CRITICAL', color: 'bg-[#00F0FF]', text: 'text-[#00F0FF]' };
  };

  const strength = calculatePasswordStrength(newPassword);

  // Handle Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, success: null, error: null });

    if (!currentPassword) {
      setPasswordStatus({ loading: false, success: null, error: 'Please enter your current operator password.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ loading: false, success: null, error: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ loading: false, success: null, error: 'New password and confirmation do not match.' });
      return;
    }

    try {
      await authService.updatePassword(currentPassword, newPassword);
      setPasswordStatus({
        loading: false,
        success: 'Credentials successfully re-encrypted and updated across the orbital gateway.',
        error: null
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({
        loading: false,
        success: null,
        error: err.response?.data?.message || 'Authentication error: Unable to update password. Verify current password.'
      });
    }
  };

  // Handle 2FA Toggle
  const handleToggle2FA = () => {
    if (twoFactorEnabled) {
      if (window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will lose biometric/authenticator verification.')) {
        setTwoFactorEnabled(false);
        localStorage.setItem('orbital_2fa_enabled', 'false');
      }
    } else {
      setShowTwoFactorModal(true);
    }
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    if (twoFactorCode.length < 6) return;
    setTwoFactorEnabled(true);
    localStorage.setItem('orbital_2fa_enabled', 'true');
    setShowTwoFactorModal(false);
    setTwoFactorCode('');
  };

  // Handle Revoke Session
  const handleRevokeSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setSessionNotice('Session revoked. Cryptographic bearer token invalidated.');
    setTimeout(() => setSessionNotice(null), 4000);
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    setSessionNotice('All remote and secondary sessions have been terminated.');
    setTimeout(() => setSessionNotice(null), 4000);
  };

  // Handle Token Generation
  const handleCreateToken = (e) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const fullKey = `orbx_${newTokenPermission.includes('Telecommand') ? 'tc' : 'live'}_${randomHex}`;
    
    const newTokenObj = {
      id: `tok-${Date.now()}`,
      name: newTokenName.trim().toUpperCase(),
      prefix: `${fullKey.slice(0, 14)}****`,
      permissions: newTokenPermission,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };

    setApiTokens(prev => [newTokenObj, ...prev]);
    setCreatedTokenKey(fullKey);
  };

  const handleRevokeToken = (tokenId) => {
    setApiTokens(prev => prev.filter(t => t.id !== tokenId));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[950px]">
      
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Security & Access Control</h1>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <p className="text-gray-400 uppercase tracking-widest flex items-center">
            <ShieldCheck size={14} className="text-[#00FF66] mr-2" />
            OPERATOR CIPHER SUITE: AES-256-GCM / SHA-512
          </p>
          <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
            ENCRYPTION LOCK ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. PASSWORD CHANGE SECTION */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 flex items-center">
              <Lock size={15} className="mr-2 text-[#00F0FF]" /> Update Access Credentials
            </h3>
            <p className="text-gray-500 text-xs font-mono mb-4">
              Rotate your mission controller password to protect telemetry commands and orbital assets.
            </p>

            {passwordStatus.success && (
              <div className="mb-4 p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded text-[#00FF66] text-xs font-mono flex items-center">
                <CheckCircle2 size={16} className="mr-2 shrink-0" />
                <span>{passwordStatus.success}</span>
              </div>
            )}

            {passwordStatus.error && (
              <div className="mb-4 p-3 bg-[#FF2A2A]/10 border border-[#FF2A2A]/30 rounded text-[#FF2A2A] text-xs font-mono flex items-center">
                <AlertTriangle size={16} className="mr-2 shrink-0" />
                <span>{passwordStatus.error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 chars, 1 uppercase, 1 symbol"
                    className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-500 uppercase">Entropy Rating:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${strength.color}`} 
                        style={{ width: `${strength.score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passwordStatus.loading}
                className="w-full bg-[#121C36] hover:bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] px-4 py-2.5 rounded text-xs font-mono tracking-widest uppercase transition-colors flex items-center justify-center mt-2 disabled:opacity-50"
              >
                {passwordStatus.loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin mr-2" />
                    ENCRYPTING CREDENTIALS...
                  </>
                ) : (
                  'UPDATE PASSWORD'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 2. TWO-FACTOR AUTHENTICATION (2FA) */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase flex items-center">
                <Smartphone size={15} className="mr-2 text-[#00F0FF]" /> Two-Factor Authentication
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${
                twoFactorEnabled 
                  ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30' 
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
              }`}>
                {twoFactorEnabled ? 'ENFORCED' : 'OFFLINE'}
              </span>
            </div>

            <p className="text-gray-500 text-xs font-mono mb-4">
              Add a second layer of defense with a hardware token or authenticator app (TOTP) for telecommand authorization.
            </p>

            <div className="p-4 bg-[#050810] border border-gray-800 rounded space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white font-bold">Authenticator App (TOTP)</p>
                  <p className="text-[10px] text-gray-500 font-mono">Google Authenticator, Authy, 1Password</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors border ${
                    twoFactorEnabled
                      ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                      : 'border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10'
                  }`}
                >
                  {twoFactorEnabled ? 'DISABLE' : 'CONFIGURE'}
                </button>
              </div>


            </div>

            <div className="border border-gray-800/80 rounded p-4 bg-[#121C36]/30 space-y-2">
              <p className="text-[11px] font-mono text-[#00F0FF] uppercase tracking-wider flex items-center">
                <Shield size={13} className="mr-1.5" /> Telecommand Security Policy
              </p>
              <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                Critical maneuvers, payload power cycling, and thruster burns require dual-authorization signatures when 2FA is enforced.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ACTIVE SESSIONS TABLE */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase flex items-center">
              <Laptop size={15} className="mr-2 text-[#00F0FF]" /> Active Ground & Orbital Sessions
            </h3>
            <p className="text-gray-500 text-xs font-mono">
              Devices and terminals currently authenticated to your mission controller profile.
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllOtherSessions}
              className="text-[11px] font-mono text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded tracking-wider transition-colors"
            >
              TERMINATE OTHER SESSIONS
            </button>
          )}
        </div>

        {sessionNotice && (
          <div className="mb-4 p-3 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded text-[#00F0FF] text-xs font-mono flex items-center">
            <CheckCircle2 size={16} className="mr-2 shrink-0" />
            <span>{sessionNotice}</span>
          </div>
        )}

        <div className="divide-y divide-gray-800/80 border border-gray-800 rounded overflow-hidden">
          {sessions.map((sess) => (
            <div key={sess.id} className="p-4 bg-[#050810] flex flex-wrap items-center justify-between gap-3 hover:bg-[#070c18] transition-colors">
              <div className="flex items-center space-x-3.5">
                <div className={`w-9 h-9 rounded flex items-center justify-center border ${
                  sess.isCurrent ? 'border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF]' : 'border-gray-800 bg-[#0A0F1F] text-gray-400'
                }`}>
                  <Globe size={18} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-bold text-white font-mono">{sess.device}</p>
                    {sess.isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {sess.browser} • {sess.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className={`text-[10px] font-mono tracking-wider ${
                  sess.isCurrent ? 'text-[#00FF66]' : 'text-gray-500'
                }`}>
                  {sess.lastActive}
                </span>
                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="text-gray-500 hover:text-red-400 text-xs transition-colors p-1"
                    title="Revoke Session"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. API & TELECOMMAND TOKENS */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase flex items-center">
              <Key size={15} className="mr-2 text-[#00F0FF]" /> Telecommand & Ingest API Keys
            </h3>
            <p className="text-gray-500 text-xs font-mono">
              Cryptographic bearer tokens used by ground antennas, automated orbital scripts, and simulation tools.
            </p>
          </div>
          <button
            onClick={() => {
              setCreatedTokenKey(null);
              setNewTokenName('');
              setShowTokenModal(true);
            }}
            className="flex items-center bg-[#121C36] hover:bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors"
          >
            <Plus size={14} className="mr-1.5" /> GENERATE NEW TOKEN
          </button>
        </div>

        <div className="divide-y divide-gray-800/80 border border-gray-800 rounded overflow-hidden">
          {apiTokens.map((tok) => (
            <div key={tok.id} className="p-4 bg-[#050810] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold text-white font-mono">{tok.name}</p>
                  <span className="text-[10px] font-mono text-[#00F0FF] bg-[#121C36] px-2 py-0.5 rounded border border-[#00F0FF]/20">
                    {tok.permissions}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-mono mt-1">
                  <span>Key: <code className="text-gray-300">{tok.prefix}</code></span>
                  <span>•</span>
                  <span>Created: {tok.created}</span>
                  <span>•</span>
                  <span>Last Active: {tok.lastUsed}</span>
                </div>
              </div>

              <button
                onClick={() => handleRevokeToken(tok.id)}
                className="text-xs font-mono text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-500/30 px-2.5 py-1 rounded transition-colors"
              >
                REVOKE
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA SETUP MODAL */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B1221] border border-[#00F0FF]/40 rounded-xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
            <button
              onClick={() => setShowTwoFactorModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <ShieldCheck size={20} className="text-[#00F0FF]" />
              <h2 className="text-base font-bold text-white tracking-wider uppercase font-mono">
                Enable Authenticator (TOTP)
              </h2>
            </div>

            <p className="text-xs text-gray-400 font-mono mb-4 leading-relaxed">
              Scan this QR code with Google Authenticator, 1Password, or Authy, then enter the 6-digit confirmation code.
            </p>

            {/* QR Mockup */}
            <div className="bg-white p-4 rounded-lg flex items-center justify-center mx-auto w-48 h-48 mb-4">
              <svg className="w-full h-full text-black" viewBox="0 0 100 100">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                {/* Simulated QR blocks */}
                <rect x="10" y="10" width="25" height="25" fill="black" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="19" y="19" width="7" height="7" fill="black" />
                <rect x="65" y="10" width="25" height="25" fill="black" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="74" y="19" width="7" height="7" fill="black" />
                <rect x="10" y="65" width="25" height="25" fill="black" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="19" y="74" width="7" height="7" fill="black" />
                <rect x="42" y="15" width="12" height="12" fill="black" />
                <rect x="42" y="35" width="18" height="18" fill="black" />
                <rect x="42" y="65" width="14" height="20" fill="black" />
                <rect x="65" y="45" width="20" height="12" fill="black" />
                <rect x="70" y="70" width="15" height="15" fill="black" />
              </svg>
            </div>

            <div className="bg-[#050810] border border-gray-800 rounded p-2.5 mb-4 flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-300 tracking-wider">
                ORBX-9942-88F4-K21A
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('ORBX-9942-88F4-K21A');
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="text-[#00F0FF] hover:text-white text-xs flex items-center font-mono"
              >
                {copiedKey ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copiedKey ? 'COPIED' : 'COPY'}
              </button>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000 000"
                  className="w-full text-center tracking-[0.5em] text-lg font-mono bg-[#050810] border border-gray-700 rounded py-2 text-[#00F0FF] focus:border-[#00F0FF] focus:outline-none"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTwoFactorModal(false)}
                  className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2 rounded text-xs font-mono tracking-wider"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={twoFactorCode.length < 6}
                  className="flex-1 bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black font-bold py-2 rounded text-xs font-mono tracking-wider disabled:opacity-50"
                >
                  VERIFY & ACTIVATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE TOKEN MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B1221] border border-[#00F0FF]/40 rounded-xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
            <button
              onClick={() => setShowTokenModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <Key size={20} className="text-[#00F0FF]" />
              <h2 className="text-base font-bold text-white tracking-wider uppercase font-mono">
                {createdTokenKey ? 'Token Created' : 'New Security Token'}
              </h2>
            </div>

            {createdTokenKey ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded text-[#00FF66] text-xs font-mono">
                  Token successfully generated. Copy it now. For security purposes, you will not be able to view it again.
                </div>

                <div className="bg-[#050810] border border-gray-800 rounded p-3 break-all font-mono text-xs text-[#00F0FF] selection:bg-[#00F0FF] selection:text-black">
                  {createdTokenKey}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdTokenKey);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="w-full bg-[#121C36] hover:bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] py-2 rounded text-xs font-mono tracking-wider flex items-center justify-center"
                >
                  {copiedToken ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                  {copiedToken ? 'TOKEN COPIED TO CLIPBOARD' : 'COPY SECURITY TOKEN'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="w-full bg-[#00F0FF] text-black font-bold py-2 rounded text-xs font-mono tracking-wider mt-2"
                >
                  DONE
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                    Token Description / Label
                  </label>
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g. SVALBARD-GROUND-LINK"
                    required
                    className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                    Permission Scope
                  </label>
                  <select
                    value={newTokenPermission}
                    onChange={(e) => setNewTokenPermission(e.target.value)}
                    className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value="Read/Write Telemetry">Read/Write Telemetry Stream</option>
                    <option value="Full Telecommand & Control">Full Telecommand & Control (High Clearance)</option>
                    <option value="Ground Station Uplink Only">Ground Station Uplink Only</option>
                    <option value="Read-Only Observability">Read-Only Observability</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTokenModal(false)}
                    className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2 rounded text-xs font-mono tracking-wider"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black font-bold py-2 rounded text-xs font-mono tracking-wider"
                  >
                    CREATE TOKEN
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
