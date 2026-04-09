import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import FileDashboard from './FileDashboard';
import { useState, useRef } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileDashboardRef = useRef();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        <div className="px-6 md:px-8 py-4 flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-gray-900">StackShare</span>
          </div>
          
          {/* User Profile Section */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900">Account</p>
                <p className="text-xs text-gray-600 truncate max-w-xs">{currentUser?.email}</p>
              </div>
              <ChevronDown size={18} className={`text-gray-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">Logged in as</p>
                  <p className="text-xs text-gray-600 truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 md:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">Welcome to</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">File Manager</h1>
          </div>
        </div>

        {/* Files Dashboard Section */}
        <FileDashboard key={refreshTrigger} ref={fileDashboardRef} onUploadSuccess={handleUploadSuccess} />
      </main>
    </div>
  );
};

export default Dashboard;
