import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-center mt-32 w-full px-4 animate-in fade-in duration-300">
          <div className="bg-[#120B16] border-l-4 border-l-[#FF2A2A] border-y border-r border-gray-800 rounded p-6 max-w-lg w-full relative">
            <div className="absolute left-0 top-0 h-full w-1 bg-[#FF2A2A]" />
            <div className="flex items-start space-x-4">
              <div className="text-[#FF2A2A] mt-1 bg-[#FF2A2A]/10 p-2 rounded-full">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Unable to load satellite data</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Connection to node X-77 failed. Telemetry sync aborted.
                  <br />
                  <span className="text-xs text-gray-500 font-mono mt-2 block overflow-hidden text-ellipsis whitespace-nowrap" title={this.state.error?.message}>
                    {this.state.error?.message}
                  </span>
                </p>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:border-[#00F0FF] px-4 py-2 rounded text-xs font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,240,255,0.05)] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
