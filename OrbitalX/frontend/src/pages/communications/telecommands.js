export const TELECOMMAND_CATEGORIES = [
  {
    category: 'SYSTEM & HEARTBEAT',
    color: '#00F0FF',
    commands: [
      {
        code: 'SYS:PING',
        label: 'SYS:PING',
        desc: 'Check flight computer alive & round-trip latency',
        category: 'SYSTEM & HEARTBEAT'
      },
      {
        code: 'SYS:REBOOT:OBC',
        label: 'SYS:REBOOT:OBC',
        desc: 'Perform warm reboot of on-board computer',
        category: 'SYSTEM & HEARTBEAT'
      },
      {
        code: 'SYS:MEM:FLUSH',
        label: 'SYS:MEM:FLUSH',
        desc: 'Flush non-volatile telemetry buffers',
        category: 'SYSTEM & HEARTBEAT'
      },
      {
        code: 'SYS:CLOCK:SYNC',
        label: 'SYS:CLOCK:SYNC',
        desc: 'Synchronize onboard clock to ground UTC',
        category: 'SYSTEM & HEARTBEAT'
      },
      {
        code: 'SYS:SELFTEST:FULL',
        label: 'SYS:SELFTEST:FULL',
        desc: 'Run full subsystem diagnostic routine',
        category: 'SYSTEM & HEARTBEAT'
      }
    ]
  },
  {
    category: 'POWER & EPS',
    color: '#F59E0B',
    commands: [
      {
        code: 'PWR:SOLAR:DEPLOY',
        label: 'PWR:SOLAR:DEPLOY',
        desc: 'Deploy solar panel array wings',
        category: 'POWER & EPS'
      },
      {
        code: 'PWR:SOLAR:STOW',
        label: 'PWR:SOLAR:STOW',
        desc: 'Retract/stow solar arrays for atmospheric pass',
        category: 'POWER & EPS'
      },
      {
        code: 'PWR:BAT:HEATERS_ON',
        label: 'PWR:BAT:HEATERS_ON',
        desc: 'Activate battery cell survival heaters',
        category: 'POWER & EPS'
      },
      {
        code: 'PWR:BAT:HEATERS_OFF',
        label: 'PWR:BAT:HEATERS_OFF',
        desc: 'Deactivate battery survival heaters',
        category: 'POWER & EPS'
      },
      {
        code: 'PWR:BUS:SHED_LOADS',
        label: 'PWR:BUS:SHED_LOADS',
        desc: 'Shed non-essential payload bus to preserve battery',
        category: 'POWER & EPS'
      },
      {
        code: 'PWR:STATUS:GET',
        label: 'PWR:STATUS:GET',
        desc: 'Read battery SOC, voltage, and bus currents',
        category: 'POWER & EPS'
      }
    ]
  },
  {
    category: 'ATTITUDE & ADCS',
    color: '#8B5CF6',
    commands: [
      {
        code: 'ADCS:MODE:DETUMBLE',
        label: 'ADCS:MODE:DETUMBLE',
        desc: 'Initiate B-Dot magnetic rate detumble',
        category: 'ATTITUDE & ADCS'
      },
      {
        code: 'ADCS:MODE:NADIR',
        label: 'ADCS:MODE:NADIR',
        desc: 'Lock 3-axis nadir pointing toward Earth',
        category: 'ATTITUDE & ADCS'
      },
      {
        code: 'ADCS:MODE:SUN',
        label: 'ADCS:MODE:SUN',
        desc: 'Orient solar panels toward Sun for charging',
        category: 'ATTITUDE & ADCS'
      },
      {
        code: 'ADCS:RW:DESATURATE',
        label: 'ADCS:RW:DESATURATE',
        desc: 'Fire magnetorquers to desaturate reaction wheels',
        category: 'ATTITUDE & ADCS'
      },
      {
        code: 'ADCS:STARTRACKER:CAL',
        label: 'ADCS:STARTRACKER:CAL',
        desc: 'Trigger star tracker recalibration cycle',
        category: 'ATTITUDE & ADCS'
      }
    ]
  },
  {
    category: 'PROPULSION & ORBIT',
    color: '#EF4444',
    commands: [
      {
        code: 'PROP:COLD_GAS:FIRE_500MS',
        label: 'PROP:COLD_GAS:FIRE_500MS',
        desc: 'Fire cold-gas thruster for 500ms impulse burn',
        category: 'PROPULSION & ORBIT'
      },
      {
        code: 'PROP:ION:START_CONTINUOUS',
        label: 'PROP:ION:START_CONTINUOUS',
        desc: 'Engage continuous electric ion thruster burn',
        category: 'PROPULSION & ORBIT'
      },
      {
        code: 'PROP:ION:SHUTDOWN',
        label: 'PROP:ION:SHUTDOWN',
        desc: 'Safely shutdown ion propulsion thruster',
        category: 'PROPULSION & ORBIT'
      },
      {
        code: 'PROP:VALVES:PURGE',
        label: 'PROP:VALVES:PURGE',
        desc: 'Purge propulsion feedlines and repressurize',
        category: 'PROPULSION & ORBIT'
      }
    ]
  },
  {
    category: 'PAYLOAD & SENSORS',
    color: '#10B981',
    commands: [
      {
        code: 'PAYLOAD:CAM:CAPTURE_HIGHRES',
        label: 'PAYLOAD:CAM:CAPTURE_HIGHRES',
        desc: 'Trigger high-resolution optical imager snapshot',
        category: 'PAYLOAD & SENSORS'
      },
      {
        code: 'PAYLOAD:SAR:SWATH_ACTIVATE',
        label: 'PAYLOAD:SAR:SWATH_ACTIVATE',
        desc: 'Execute Synthetic Aperture Radar swath scan',
        category: 'PAYLOAD & SENSORS'
      },
      {
        code: 'PAYLOAD:SPEC:INTEGRATE',
        label: 'PAYLOAD:SPEC:INTEGRATE',
        desc: 'Initiate hyperspectral sensor integration',
        category: 'PAYLOAD & SENSORS'
      },
      {
        code: 'PAYLOAD:POWER:CYCLE',
        label: 'PAYLOAD:POWER:CYCLE',
        desc: 'Power-cycle primary science instrument',
        category: 'PAYLOAD & SENSORS'
      }
    ]
  },
  {
    category: 'COMMS & TELEMETRY',
    color: '#06B6D4',
    commands: [
      {
        code: 'COMMS:TX:HIGH_POWER',
        label: 'COMMS:TX:HIGH_POWER',
        desc: 'Boost downlink transmitter to 5W mode',
        category: 'COMMS & TELEMETRY'
      },
      {
        code: 'COMMS:TX:LOW_POWER',
        label: 'COMMS:TX:LOW_POWER',
        desc: 'Set downlink transmitter to 1W low power',
        category: 'COMMS & TELEMETRY'
      },
      {
        code: 'COMMS:DOWNLINK:START_BURST',
        label: 'COMMS:DOWNLINK:START_BURST',
        desc: 'Initiate high-speed S-Band data burst downlink',
        category: 'COMMS & TELEMETRY'
      },
      {
        code: 'TLM:DUMP',
        label: 'TLM:DUMP',
        desc: 'Download full memory buffer telemetry stream',
        category: 'COMMS & TELEMETRY'
      }
    ]
  },
  {
    category: 'SAFETY & EMERGENCY',
    color: '#EC4899',
    commands: [
      {
        code: 'SAFE:ENTER_SAFE_MODE',
        label: 'SAFE:ENTER_SAFE_MODE',
        desc: 'Force satellite into minimal survival safe mode',
        category: 'SAFETY & EMERGENCY'
      },
      {
        code: 'SAFE:RESUME_NORMAL_OPS',
        label: 'SAFE:RESUME_NORMAL_OPS',
        desc: 'Clear fault flags and restore nominal schedule',
        category: 'SAFETY & EMERGENCY'
      },
      {
        code: 'SAFE:BEACON:TRANSMIT',
        label: 'SAFE:BEACON:TRANSMIT',
        desc: 'Broadcast emergency distress beacon on UHF',
        category: 'SAFETY & EMERGENCY'
      }
    ]
  }
];

export const ALL_TELECOMMANDS = TELECOMMAND_CATEGORIES.flatMap(cat => cat.commands);
