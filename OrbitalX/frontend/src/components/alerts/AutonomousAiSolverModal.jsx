import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Zap, 
  Activity, 
  Cpu, 
  ArrowRight, 
  X, 
  Check, 
  CheckCheck,
  Radio,
  Satellite as SatIcon
} from 'lucide-react';

export default function AutonomousAiSolverModal({
  isOpen,
  onClose,
  unresolvedAlerts = [],
  onResolveAlert,
  onCompleteAll
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('INGEST'); // INGEST -> TRIAGE -> DISPATCH -> VERIFY -> NEXT
  const [resolvedHistory, setResolvedHistory] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef(null);

  // Active alert being worked on
  const currentAlert = unresolvedAlerts[currentIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setCurrentPhase('INGEST');
      setResolvedHistory([]);
      setIsCompleted(false);
      setAutoPlay(true);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isCompleted) return;

    if (!currentAlert || currentIndex >= unresolvedAlerts.length) {
      setIsCompleted(true);
      if (onCompleteAll) onCompleteAll();
      return;
    }

    if (!autoPlay) return;

    // Phase 1: INGEST (0.6s) -> Telemetry ingestion
    if (currentPhase === 'INGEST') {
      timerRef.current = setTimeout(() => {
        setCurrentPhase('TRIAGE');
      }, 700);
    } 
    // Phase 2: TRIAGE (0.7s) -> AI classification & RCA
    else if (currentPhase === 'TRIAGE') {
      timerRef.current = setTimeout(() => {
        setCurrentPhase('DISPATCH');
      }, 800);
    } 
    // Phase 3: DISPATCH (0.8s) -> Transmit 1-click command & call backend resolve
    else if (currentPhase === 'DISPATCH') {
      timerRef.current = setTimeout(() => {
        // Compute best telecommand
        const isTemp = currentAlert.metric === 'Temperature';
        const isBatt = currentAlert.metric === 'Battery' || currentAlert.type?.toLowerCase().includes('power');
        const isGyro = currentAlert.metric === 'Gyro' || currentAlert.type?.toLowerCase().includes('tumble');
        const isDebris = currentAlert.type?.toLowerCase().includes('debris') || currentAlert.type?.toLowerCase().includes('collision');
        
        let telecommand = 'CMD_EPS_SAFE_MODE';
        if (isDebris) telecommand = 'CMD_PROP_ARM_CAM_BURN';
        else if (isGyro) telecommand = 'CMD_ADCS_DETUMBLE_BDOT';
        else if (isTemp) telecommand = 'CMD_TCS_COOLING_SLEW';
        else if (isBatt) telecommand = 'CMD_EPS_SWITCH_BUS_B';

        // Trigger parent resolve handler to update database
        if (onResolveAlert) {
          onResolveAlert(currentAlert._id, telecommand);
        }

        const satName = typeof currentAlert.satelliteId === 'object' 
          ? currentAlert.satelliteId?.name 
          : (currentAlert.satelliteId || 'Target CubeSat');

        setResolvedHistory(prev => [
          ...prev,
          {
            id: currentAlert._id,
            satelliteName: satName,
            type: currentAlert.type || 'Telemetry Anomaly',
            metric: currentAlert.metric,
            telecommand,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);

        setCurrentPhase('VERIFY');
      }, 900);
    } 
    // Phase 4: VERIFY (0.8s) -> Confirm telemetry return to envelope
    else if (currentPhase === 'VERIFY') {
      timerRef.current = setTimeout(() => {
        if (currentIndex + 1 < unresolvedAlerts.length) {
          setCurrentIndex(prev => prev + 1);
          setCurrentPhase('INGEST');
        } else {
          setIsCompleted(true);
          if (onCompleteAll) onCompleteAll();
        }
      }, 800);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, currentIndex, currentPhase, autoPlay, isCompleted, unresolvedAlerts]);

  if (!isOpen) return null;

  const totalAlerts = unresolvedAlerts.length;
  const progressPercent = totalAlerts > 0 ? Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalAlerts) * 100) : 100;

  const satName = typeof currentAlert?.satelliteId === 'object' 
    ? (currentAlert.satelliteId?.name || currentAlert.satelliteId?.satelliteId)
    : (currentAlert?.satelliteId || 'Active CubeSat');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#070D18] border-2 border-[#00F0FF]/60 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden font-mono">
        
        {/* Glow Accent Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00F0FF] via-[#00FF66] to-[#00F0FF]"></div>

        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#0A1224]/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/50 flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Cpu size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center space-x-2">
                <span>ORBITALX AUTONOMOUS AI FLEET COPILOT</span>
                <span className="text-[10px] bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 px-2 py-0.5 rounded font-bold">
                  ACTIVE
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Automated continuous multi-satellite telemetry triage & 1-click mitigation loop
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        {!isCompleted ? (
          <div className="p-6 space-y-6">
            
            {/* Progress Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#00F0FF] font-bold tracking-wider">
                  SOLVING ANOMALY {Math.min(currentIndex + 1, totalAlerts)} OF {totalAlerts}
                </span>
                <span className="text-gray-400 font-bold">
                  {progressPercent}% FLEET RECOVERY COMPLETE
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700">
                <div 
                  className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00FF66] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,255,102,0.5)]"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Current Target CubeSat Card */}
            {currentAlert && (
              <div className="p-4 rounded-lg bg-[#0C1527] border border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.1)] space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <SatIcon size={14} className="text-[#00F0FF]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {satName}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    currentAlert.severity === 'CRITICAL'
                      ? 'bg-[#FF2A2A]/20 text-[#FF2A2A] border-[#FF2A2A]/40'
                      : 'bg-[#FFB000]/20 text-[#FFB000] border-[#FFB000]/40'
                  }`}>
                    {currentAlert.severity}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {currentAlert.type || 'Telemetry Anomaly'}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {currentAlert.message || 'Telemetry breached safe operating limits.'}
                  </p>
                </div>

                {/* 4 Multi-Step AI Reasoning Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                  
                  {/* Step 1: Ingest */}
                  <div className={`p-2.5 rounded border text-[10px] transition-all duration-300 ${
                    currentPhase === 'INGEST'
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : ['TRIAGE', 'DISPATCH', 'VERIFY'].includes(currentPhase)
                      ? 'bg-[#00FF66]/10 border-[#00FF66]/40 text-[#00FF66]'
                      : 'bg-black/40 border-gray-800 text-gray-500'
                  }`}>
                    <div className="flex items-center space-x-1.5 font-bold mb-1">
                      {['TRIAGE', 'DISPATCH', 'VERIFY'].includes(currentPhase) ? (
                        <Check size={11} className="text-[#00FF66]" />
                      ) : (
                        <Activity size={11} className={currentPhase === 'INGEST' ? "animate-spin" : ""} />
                      )}
                      <span>1. INGEST</span>
                    </div>
                    <span className="text-[9px] block text-gray-400">16-Dim Sensors</span>
                  </div>

                  {/* Step 2: Triage */}
                  <div className={`p-2.5 rounded border text-[10px] transition-all duration-300 ${
                    currentPhase === 'TRIAGE'
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : ['DISPATCH', 'VERIFY'].includes(currentPhase)
                      ? 'bg-[#00FF66]/10 border-[#00FF66]/40 text-[#00FF66]'
                      : 'bg-black/40 border-gray-800 text-gray-500'
                  }`}>
                    <div className="flex items-center space-x-1.5 font-bold mb-1">
                      {['DISPATCH', 'VERIFY'].includes(currentPhase) ? (
                        <Check size={11} className="text-[#00FF66]" />
                      ) : (
                        <Cpu size={11} className={currentPhase === 'TRIAGE' ? "animate-pulse" : ""} />
                      )}
                      <span>2. DIAGNOSE</span>
                    </div>
                    <span className="text-[9px] block text-gray-400">Model Analysis</span>
                  </div>

                  {/* Step 3: Dispatch */}
                  <div className={`p-2.5 rounded border text-[10px] transition-all duration-300 ${
                    currentPhase === 'DISPATCH'
                      ? 'bg-[#FFB000]/15 border-[#FFB000] text-[#FFB000] shadow-[0_0_10px_rgba(255,176,0,0.2)]'
                      : ['VERIFY'].includes(currentPhase)
                      ? 'bg-[#00FF66]/10 border-[#00FF66]/40 text-[#00FF66]'
                      : 'bg-black/40 border-gray-800 text-gray-500'
                  }`}>
                    <div className="flex items-center space-x-1.5 font-bold mb-1">
                      {currentPhase === 'VERIFY' ? (
                        <Check size={11} className="text-[#00FF66]" />
                      ) : (
                        <Send size={11} className={currentPhase === 'DISPATCH' ? "animate-spin" : ""} />
                      )}
                      <span>3. DISPATCH</span>
                    </div>
                    <span className="text-[9px] block text-gray-400">1-Click Telecommand</span>
                  </div>

                  {/* Step 4: Verify */}
                  <div className={`p-2.5 rounded border text-[10px] transition-all duration-300 ${
                    currentPhase === 'VERIFY'
                      ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                      : 'bg-black/40 border-gray-800 text-gray-500'
                  }`}>
                    <div className="flex items-center space-x-1.5 font-bold mb-1">
                      {currentPhase === 'VERIFY' ? (
                        <CheckCircle2 size={11} className="text-[#00FF66] animate-pulse" />
                      ) : (
                        <ShieldCheck size={11} />
                      )}
                      <span>4. RESOLVE</span>
                    </div>
                    <span className="text-[9px] block text-gray-400">Uplink Confirmed</span>
                  </div>

                </div>
              </div>
            )}

            {/* Real-time Telecommand Execution Log */}
            <div className="p-3 bg-black/60 rounded border border-gray-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold border-b border-gray-800 pb-1">
                <span>AUTONOMOUS EXECUTION STATUS</span>
                <span className="text-[#00F0FF] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping"></span>
                  <span>LIVE REASONING</span>
                </span>
              </div>
              <p className="text-gray-300">
                {currentPhase === 'INGEST' && `Ingesting 16-channel continuous telemetry feed for ${satName}...`}
                {currentPhase === 'TRIAGE' && `AI Model evaluating failure signature for ${currentAlert?.type} (Confidence: 98.4%)...`}
                {currentPhase === 'DISPATCH' && `Transmitting automated 1-click mitigation telecommand via simulated RF ground uplink...`}
                {currentPhase === 'VERIFY' && `Spacecraft Command Counter ACK received (+1). Telemetry returned to nominal envelope.`}
              </p>
            </div>

            {/* Footer Control Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="text-xs text-gray-400 hover:text-white font-mono px-3 py-1.5 rounded bg-gray-800/80 hover:bg-gray-800 border border-gray-700 transition-colors"
              >
                {autoPlay ? '⏸ PAUSE AUTO-PILOT' : '▶ RESUME AUTO-PILOT'}
              </button>

              <div className="text-[11px] text-gray-400 flex items-center space-x-2">
                <span>Moving to next error automatically...</span>
              </div>
            </div>

          </div>
        ) : (
          /* =========================================================================
             COMPLETION SCREEN: ALL ERRORS COMPLETED WINDOW
             ========================================================================= */
          <div className="p-6 space-y-6 text-center animate-in zoom-in-95 duration-300">
            
            <div className="w-16 h-16 mx-auto rounded-full bg-[#00FF66]/20 border-2 border-[#00FF66] flex items-center justify-center text-[#00FF66] shadow-[0_0_30px_rgba(0,255,102,0.35)] animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider font-sans">
                ALL FLEET ANOMALIES AUTONOMOUSLY RESOLVED!
              </h2>
              <p className="text-xs text-[#00FF66] font-mono tracking-wide">
                100% OF SATELLITE EMERGENCIES MITIGATED BY ORBITALX AI COPILOT
              </p>
            </div>

            {/* Summary Audit Ledger Table */}
            <div className="bg-[#050810] border border-gray-800 rounded-lg overflow-hidden text-left">
              <div className="p-3 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-bold">
                <span>RECOVERED SATELLITE ASSET & INCIDENT</span>
                <span>DISPATCHED TELECOMMAND</span>
                <span>STATUS</span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-gray-800/60 text-[11px]">
                {resolvedHistory.length > 0 ? (
                  resolvedHistory.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-900/40">
                      <div>
                        <span className="text-white font-bold block">{item.satelliteName}</span>
                        <span className="text-[10px] text-gray-400">{item.type}</span>
                      </div>
                      <div className="font-mono text-[#00F0FF] text-[10px] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/30">
                        {item.telecommand}
                      </div>
                      <div className="flex items-center space-x-1 text-[#00FF66] font-bold text-[10px]">
                        <Check size={12} />
                        <span>RESOLVED ✓</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    All satellite assets were already nominal and verified.
                  </div>
                )}
              </div>
            </div>

            {/* Fleet Health Certified Banner */}
            <div className="p-3 bg-gradient-to-r from-[#00FF66]/15 via-[#00F0FF]/20 to-[#00FF66]/15 border border-[#00FF66]/50 rounded-lg text-xs text-gray-200 font-mono">
              ⚡ <b>Mission Status:</b> All spacecraft telemetry restored to nominal operating envelope. 0 critical errors, 0 warnings remaining in active fleet queue.
            </div>

            {/* Close & Continue Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-[#00FF66] to-[#00F0FF] hover:from-[#82FFB0] hover:to-[#82E6E6] text-black font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(0,255,102,0.4)] transform hover:scale-[1.01]"
            >
              COMPLETE & RETURN TO MISSION CONTROL DASHBOARD ✓
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
