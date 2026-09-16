import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import PageLoader from './components/common/PageLoader';

import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/layout/DashboardLayout';

// Lazy-loaded routes for code-splitting & instant initial bundle load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const OrbitalViewer = lazy(() => import('./pages/OrbitalViewer'));
const CubeSatStudio = lazy(() => import('./pages/studio/CubeSatStudio'));
const CubeSatSimulator = lazy(() => import('./pages/studio/CubeSatSimulator'));

const SatelliteFleet = lazy(() => import('./pages/satellites/SatelliteFleet'));
const SatelliteDetail = lazy(() => import('./pages/satellites/SatelliteDetail'));

const MissionFleet = lazy(() => import('./pages/missions/MissionFleet'));
const MissionDetail = lazy(() => import('./pages/missions/MissionDetail'));
const Communications = lazy(() => import('./pages/communications/Communications'));
const GroundStations = lazy(() => import('./pages/groundstations/GroundStations'));

const TelemetryAnalytics = lazy(() => import('./pages/analytics/TelemetryAnalytics'));
const AlertsIncidents = lazy(() => import('./pages/alerts/AlertsIncidents'));
const NotificationCenter = lazy(() => import('./pages/alerts/NotificationCenter'));

const FleetAnalytics = lazy(() => import('./pages/analytics/FleetAnalytics'));
const Reports = lazy(() => import('./pages/analytics/Reports'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));

const SettingsLayout = lazy(() => import('./pages/settings/SettingsLayout'));
const Profile = lazy(() => import('./pages/settings/Profile'));
const Preferences = lazy(() => import('./pages/settings/Preferences'));
const Diagnostics = lazy(() => import('./pages/settings/Diagnostics'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected Routes (wrapped in Layout) */}
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orbit" element={<OrbitalViewer />} />
              <Route path="/studio" element={<CubeSatStudio />} />
              <Route path="/cubesat-sim" element={<CubeSatSimulator />} />
              
              {/* Phase 4: Satellites */}
              <Route path="/satellites" element={<SatelliteFleet />} />
              <Route path="/satellites/:id" element={<SatelliteDetail />} />

              {/* Phase 4: Missions */}
              <Route path="/missions" element={<MissionFleet />} />
              <Route path="/missions/:id" element={<MissionDetail />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/ground-stations" element={<GroundStations />} />

              {/* Phase 9/11: Telemetry & Alerts */}
              <Route path="/telemetry" element={<TelemetryAnalytics />} />
              <Route path="/alerts" element={<AlertsIncidents />} />
              <Route path="/notifications" element={<NotificationCenter />} />

              {/* Phase 12: Analytics */}
              <Route path="/analytics" element={<FleetAnalytics />} />
              <Route path="/reports" element={<Reports />} />

              {/* Phase 13/15: Admin Dashboard & Logs */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/logs" element={<ActivityLogs />} />

              {/* Phase 14: Settings */}
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Profile />} />
                <Route path="profile" element={<Profile />} />
                <Route path="preferences" element={<Preferences />} />
                <Route path="diagnostics" element={<Diagnostics />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
