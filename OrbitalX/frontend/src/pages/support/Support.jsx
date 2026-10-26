import React, { useState } from 'react';
import { 
  HelpCircle, 
  LifeBuoy, 
  PhoneCall, 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Send, 
  ChevronRight, 
  Search, 
  ExternalLink, 
  Plus, 
  Radio, 
  Satellite, 
  RadioTower, 
  Cpu, 
  MessageSquare,
  X,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Support() {
  // Ticket Submission Form State
  const [subject, setSubject] = useState('');
  const [subsystem, setSubsystem] = useState('ADCS & Pointing');
  const [severity, setSeverity] = useState('P2');
  const [asset, setAsset] = useState('SAT-ORB-01 (ApexSat-1)');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);

  // Active Support Tickets List
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('orbital_support_tickets');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      {
        id: 'TK-9402',
        subject: 'ADCS gyro slight quaternion drift during shadow exit',
        subsystem: 'ADCS & Pointing',
        asset: 'SAT-ORB-01 (ApexSat-1)',
        severity: 'P2',
        status: 'INVESTIGATING',
        createdAt: '2026-10-25 14:22 UTC',
        assignee: 'Flight Dynamics Team',
        notes: ['Telemetry replay initiated', 'Re-calibrating star tracker sensor matrix']
      },
      {
        id: 'TK-9388',
        subject: 'Bengaluru antenna azimuth feed alignment calibration',
        subsystem: 'Ground Station RF',
        asset: 'GS-BLR-01 (Bengaluru)',
        severity: 'P3',
        status: 'IN PROGRESS',
        createdAt: '2026-10-25 11:05 UTC',
        assignee: 'RF Ground Operations',
        notes: ['Slight 0.4 dB attenuation at 12 deg elevation. Rotor grease serviced.']
      },
      {
        id: 'TK-9241',
        subject: 'CubeSat SGP4 orbital propagator epoch sync validation',
        subsystem: 'Orbital Mechanics',
        asset: 'All Fleet Satellites',
        severity: 'P4',
        status: 'RESOLVED',
        createdAt: '2026-10-24 18:30 UTC',
        assignee: 'Mission Control Software',
        notes: ['TLE bulletin updated with latest Space-Track NORAD catalog elements.']
      }
    ];
  });

  // Selected Ticket Detail Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newNote, setNewNote] = useState('');

  // Knowledge Base Search Query & Active Protocol Modal
  const [kbSearch, setKbSearch] = useState('');
  const [activeProtocol, setActiveProtocol] = useState(null);

  const emergencyProtocols = [
    {
      id: 'proto-esm',
      title: 'EMERGENCY SAFE MODE (ESM) PROTOCOL',
      badge: 'CRITICAL RUNBOOK',
      summary: 'Automated satellite contingency when attitude determination is lost or battery drops below 20%.',
      steps: [
        'Command Payload Shutdown: De-energize high-power transceivers and science instruments.',
        'Detumble B-Dot Trigger: Activate magnetic torquers with high derivative gain to null angular body rates below 0.1 deg/s.',
        'Sun Acquisition Pointing: Align Solar Panel Z-axis normal toward the solar vector using coarse sun sensors.',
        'Beacon Mode Transition: UHF low-data-rate heartbeat beacon set to 120s pulse interval to conserve EPS battery.'
      ]
    },
    {
      id: 'proto-los',
      title: 'LOSS OF SIGNAL (LOS) ACQUISITION CHECKLIST',
      badge: 'GROUND NETWORK',
      summary: 'Checklist to re-establish two-way RF contact during an unexpected pass blackout.',
      steps: [
        'Verify Ground Station Azimuth/Elevation limits (Ensure elevation angle > 10.0 deg above terrain mask).',
        'Check Doppler Frequency Offset (L-band Doppler shift up to ±35 kHz at 7.5 km/s velocity).',
        'Execute Ground Transmitter Cold Reset via Ground Station Control Console.',
        'Listen for Omni-Directional UHF carrier frequency at 437.525 MHz on secondary tracking dish.'
      ]
    },
    {
      id: 'proto-conjunction',
      title: 'ORBITAL COLLISION & CONJUNCTION ALERT RUNBOOK',
      badge: 'FLIGHT DYNAMICS',
      summary: 'Actions for orbital close encounters (< 1.0 km miss distance) identified by Space-Track.',
      steps: [
        'Pull latest Conjunction Summary Message (CSM) from 18th Space Defense Squadron.',
        'Calculate Probability of Collision (Pc); if Pc > 1e-4, execute immediate avoidance maneuver.',
        'Compute along-track delta-v burn vector (0.15 m/s differential burn provides 5 km radial clearance within 1 orbit).',
        'Confirm orbit modification pass with next downstream Ground Station.'
      ]
    }
  ];

  // Save tickets to localStorage
  const saveTickets = (newTicketsList) => {
    setTickets(newTicketsList);
    localStorage.setItem('orbital_support_tickets', JSON.stringify(newTicketsList));
  };

  // Submit Ticket
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newTicketObj = {
        id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: subject.trim(),
        subsystem,
        asset,
        severity,
        status: 'INVESTIGATING',
        createdAt: `${new Date().toISOString().replace('T', ' ').substring(0, 16)} UTC`,
        assignee: 'Flight Operations Team',
        notes: [`Incident reported by operator: "${description.trim().substring(0, 90)}..."`]
      };

      const updated = [newTicketObj, ...tickets];
      saveTickets(updated);

      setSubject('');
      setDescription('');
      setIsSubmitting(false);
      setFormSuccess(`Ticket [${newTicketObj.id}] successfully dispatched to Mission Operations.`);
      setTimeout(() => setFormSuccess(null), 5000);
    }, 600);
  };

  // Add Note to Selected Ticket
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedTicket) return;

    const updated = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          notes: [...(t.notes || []), `Operator note: ${newNote.trim()}`]
        };
      }
      return t;
    });

    saveTickets(updated);
    setSelectedTicket(prev => ({
      ...prev,
      notes: [...(prev.notes || []), `Operator note: ${newNote.trim()}`]
    }));
    setNewNote('');
  };

  // Toggle Ticket Status
  const handleToggleStatus = (ticketId, nextStatus) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTickets(updated);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status: nextStatus }));
    }
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'P1': return 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-[#FF2A2A]/40 font-bold';
      case 'P2': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 font-bold';
      case 'P3': return 'bg-blue-500/10 text-blue-400 border-blue-500/40';
      default: return 'bg-gray-700/30 text-gray-400 border-gray-700';
    }
  };

  const getStatusStyle = (st) => {
    switch (st) {
      case 'INVESTIGATING': return 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30';
      case 'IN PROGRESS': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'RESOLVED': return 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30';
      default: return 'bg-gray-700/20 text-gray-400 border-gray-700';
    }
  };

  const filteredProtocols = emergencyProtocols.filter(p => 
    !kbSearch || 
    p.title.toLowerCase().includes(kbSearch.toLowerCase()) || 
    p.summary.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      
      {/* Top Header */}
      <div className="border-b border-gray-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
              <LifeBuoy size={28} className="text-[#00F0FF] mr-3" />
              Flight Support & Mission Operations Center
            </h1>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] mr-2 shadow-[0_0_8px_#00FF66]"></span>
              24/7 ORBITAL OPERATIONS FLIGHT READINESS: ONLINE (SLA 99.98%)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/settings/diagnostics"
              className="px-3 py-1.5 rounded text-xs font-mono text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/10 transition-colors"
            >
              SYSTEM HEALTH
            </Link>
          </div>
        </div>
      </div>

      {/* Hotline & Escalation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center text-[#FF2A2A] mb-2 font-mono text-xs font-bold uppercase tracking-wider">
            <PhoneCall size={16} className="mr-2" />
            Flight Director Emergency Desk
          </div>
          <p className="text-white font-mono font-bold text-lg">+1 (800) ORBITAL-X</p>
          <p className="text-[11px] font-mono text-gray-500 mt-1">Extension: 911-FLIGHT (Priority Line)</p>
        </div>

        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center text-[#00F0FF] mb-2 font-mono text-xs font-bold uppercase tracking-wider">
            <Radio size={16} className="mr-2" />
            Encrypted Satcom Channel
          </div>
          <p className="text-white font-mono font-bold text-lg">SATCOM-SEC-04</p>
          <p className="text-[11px] font-mono text-gray-500 mt-1">UHF Uplink 437.525 MHz / AES-256</p>
        </div>

        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center text-[#00FF66] mb-2 font-mono text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={16} className="mr-2" />
            MCC Autonomous Health Agent
          </div>
          <p className="text-white font-mono font-bold text-lg">AI DIAGNOSTIC ENGINE</p>
          <p className="text-[11px] font-mono text-gray-500 mt-1">Active anomaly scanning enabled</p>
        </div>

      </div>

      {/* Main Support Grid: Ticket Form & Active Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: TICKET SUBMISSION FORM (5 cols) */}
        <div className="lg:col-span-5 bg-[#0B1221] border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-gray-300 tracking-[0.2em] uppercase flex items-center">
                <Send size={15} className="mr-2 text-[#00F0FF]" /> Dispatch Mission Support Incident
              </h3>
              <p className="text-gray-500 text-xs font-mono mt-1">
                Report telemetry anomalies, ground antenna tracking loss, or flight software requests.
              </p>
            </div>

            {formSuccess && (
              <div className="mb-4 p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded text-[#00FF66] text-xs font-mono flex items-center">
                <CheckCircle2 size={16} className="mr-2 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Incident Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. ADCS Star Tracker dropout on eclipse entry"
                  className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                    Severity *
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none cursor-pointer"
                  >
                    <option value="P1">P1 - CRITICAL FLIGHT EMERGENCY</option>
                    <option value="P2">P2 - HIGH ANOMALY</option>
                    <option value="P3">P3 - MEDIUM DEGRADATION</option>
                    <option value="P4">P4 - LOW / GENERAL INQUIRY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                    Subsystem *
                  </label>
                  <select
                    value={subsystem}
                    onChange={(e) => setSubsystem(e.target.value)}
                    className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none cursor-pointer"
                  >
                    <option value="ADCS & Pointing">ADCS & Pointing</option>
                    <option value="Ground Station RF">Ground Station RF</option>
                    <option value="Power EPS & Battery">Power EPS & Battery</option>
                    <option value="Thermal Management">Thermal Management</option>
                    <option value="Orbital Mechanics">Orbital Mechanics</option>
                    <option value="Payload & Imaging">Payload & Imaging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Target Asset / Satellite
                </label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none cursor-pointer"
                >
                  <option value="SAT-ORB-01 (ApexSat-1)">SAT-ORB-01 (ApexSat-1)</option>
                  <option value="SAT-ORB-02 (ApexSat-2)">SAT-ORB-02 (ApexSat-2)</option>
                  <option value="GS-BLR-01 (Bengaluru)">GS-BLR-01 (Bengaluru)</option>
                  <option value="GS-SVB-02 (Svalbard)">GS-SVB-02 (Svalbard)</option>
                  <option value="All Fleet Satellites">Entire Orbital Constellation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Telemetry Context & Technical Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide sensor readings, error codes, pass timeline, or reproduction steps..."
                  className="w-full bg-[#050810] border border-gray-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#121C36] hover:bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] hover:text-white px-4 py-2.5 rounded font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin mr-2" />
                    DISPATCHING TO MCC QUEUE...
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-2" />
                    SUBMIT INCIDENT TICKET
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* RIGHT: ACTIVE TICKETS MONITOR (7 cols) */}
        <div className="lg:col-span-7 bg-[#0B1221] border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-gray-300 tracking-[0.2em] uppercase flex items-center">
                  <Clock size={15} className="mr-2 text-[#00F0FF]" /> Active Flight Support Tickets
                </h3>
                <p className="text-gray-500 text-xs font-mono mt-0.5">
                  Live flight director queue and operator resolution status.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#00F0FF] bg-[#121C36] px-2.5 py-1 rounded border border-[#00F0FF]/30">
                {tickets.length} RECORDED
              </span>
            </div>

            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center text-gray-600 py-12 font-mono text-xs">
                  NO ACTIVE SUPPORT TICKETS IN QUEUE
                </div>
              ) : (
                tickets.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="p-4 bg-[#050810] border border-gray-800/80 hover:border-[#00F0FF]/40 rounded-lg cursor-pointer transition-all hover:bg-[#080d1a] group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[#00F0FF]">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${getSeverityStyle(t.severity)}`}>
                          {t.severity}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${getStatusStyle(t.status)}`}>
                          {t.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">{t.createdAt}</span>
                    </div>

                    <p className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors mb-2 font-mono">
                      {t.subject}
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-400 gap-2">
                      <span className="flex items-center">
                        <Satellite size={12} className="mr-1 text-gray-500" />
                        {t.asset}
                      </span>
                      <span className="flex items-center text-gray-500">
                        Assignee: <span className="text-gray-300 ml-1">{t.assignee}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Emergency Protocols & Knowledge Base */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-6">
          <div>
            <h3 className="text-xs font-bold text-gray-300 tracking-[0.2em] uppercase flex items-center">
              <AlertOctagon size={16} className="mr-2 text-yellow-400" /> Emergency Protocols & Flight Runbooks
            </h3>
            <p className="text-gray-500 text-xs font-mono mt-1">
              Standard operating procedures for flight emergencies, loss-of-signal blackout, and orbital collision avoidance.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={kbSearch}
              onChange={(e) => setKbSearch(e.target.value)}
              placeholder="Filter runbooks..."
              className="bg-[#050810] border border-gray-800 rounded pl-9 pr-3 py-1.5 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none w-56"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredProtocols.map(proto => (
            <div 
              key={proto.id}
              onClick={() => setActiveProtocol(proto)}
              className="p-5 bg-[#050810] border border-gray-800 hover:border-yellow-400/50 rounded-lg cursor-pointer transition-all hover:bg-[#0a0f1e] flex flex-col justify-between group"
            >
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 uppercase mb-3">
                  {proto.badge}
                </span>
                <h4 className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors font-mono mb-2">
                  {proto.title}
                </h4>
                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                  {proto.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-800/80 mt-4 flex items-center justify-between text-[10px] font-mono text-gray-500 group-hover:text-white">
                <span>VIEW RUNBOOK STEPS</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B1221] border border-[#00F0FF]/40 rounded-xl p-6 max-w-xl w-full shadow-[0_0_35px_rgba(0,240,255,0.2)] relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="text-base font-bold text-[#00F0FF] font-mono">{selectedTicket.id}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${getSeverityStyle(selectedTicket.severity)}`}>
                  {selectedTicket.severity}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${getStatusStyle(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white font-mono">
                {selectedTicket.subject}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#050810] p-3 rounded border border-gray-800 text-xs font-mono mb-4">
              <div>
                <p className="text-gray-500 text-[10px] uppercase">Target Asset</p>
                <p className="text-white font-bold">{selectedTicket.asset}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase">Subsystem</p>
                <p className="text-white font-bold">{selectedTicket.subsystem}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase">Reported</p>
                <p className="text-gray-300">{selectedTicket.createdAt}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase">Assigned Flight Group</p>
                <p className="text-gray-300">{selectedTicket.assignee}</p>
              </div>
            </div>

            {/* Status Change Controls */}
            <div className="flex items-center space-x-2 mb-4 text-xs font-mono">
              <span className="text-gray-400 uppercase text-[10px]">Update Status:</span>
              {['INVESTIGATING', 'IN PROGRESS', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => handleToggleStatus(selectedTicket.id, st)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors border ${
                    selectedTicket.status === st
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 font-bold'
                      : 'border-gray-800 text-gray-500 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Incident Log Notes */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 bg-[#050810] p-3 rounded border border-gray-800 font-mono text-xs">
              <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Flight Director Audit Notes:</p>
              {(selectedTicket.notes || []).map((note, idx) => (
                <div key={idx} className="p-2 bg-[#0A0F1F] rounded border border-gray-800/80 text-gray-300 text-xs">
                  {note}
                </div>
              ))}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="flex space-x-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Append telemetry log or operator note..."
                className="flex-1 bg-[#050810] border border-gray-800 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-[#00F0FF] focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#121C36] hover:bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] px-3 py-1.5 rounded text-xs font-mono tracking-wider"
              >
                ADD NOTE
              </button>
            </form>

          </div>
        </div>
      )}

      {/* PROTOCOL RUNBOOK MODAL */}
      {activeProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B1221] border border-yellow-400/40 rounded-xl p-6 max-w-lg w-full shadow-[0_0_35px_rgba(255,200,0,0.15)] relative">
            <button
              onClick={() => setActiveProtocol(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 uppercase mb-3">
              {activeProtocol.badge}
            </span>

            <h2 className="text-base font-bold text-white font-mono mb-2">
              {activeProtocol.title}
            </h2>

            <p className="text-xs text-gray-400 font-mono mb-5 leading-relaxed">
              {activeProtocol.summary}
            </p>

            <div className="space-y-3 mb-6">
              {activeProtocol.steps.map((st, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-[#050810] border border-gray-800 rounded font-mono text-xs">
                  <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-300 leading-relaxed">{st}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveProtocol(null)}
              className="w-full bg-[#121C36] hover:bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-mono text-xs py-2 rounded uppercase tracking-wider"
            >
              CLOSE RUNBOOK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
