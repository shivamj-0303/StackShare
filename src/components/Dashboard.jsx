import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import FileDashboard from './FileDashboard';
import { useState, useRef } from 'react';
import { LogOut, Menu, User } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileDashboardRef = useRef();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Menu size={24} className="text-gray-600" />
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-600" />
              <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{currentUser?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors"
              title="Logout"
            >
              <span className="text-white font-bold text-lg">👤</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <p className="text-sm text-gray-600 font-medium mb-1">Welcome to</p>
          <h1 className="text-5xl font-bold text-gray-900">File Manager</h1>
        </div>

        {/* Files Dashboard Section */}
        <FileDashboard key={refreshTrigger} ref={fileDashboardRef} onUploadSuccess={handleUploadSuccess} />
      </main>
    </div>
  );
};

export default Dashboard;
