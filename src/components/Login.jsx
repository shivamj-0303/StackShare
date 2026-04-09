import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { X, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Email not found. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="flex flex-col md:flex-row overflow-hidden bg-white rounded-md shadow-lg md:flex-1 lg:max-w-4xl w-full">
        
        {/* Left Sidebar */}
        <div className="p-6 py-8 text-white bg-blue-500 md:w-80 md:flex-shrink-0 flex flex-col items-center justify-center md:justify-evenly">
          <div className="my-3 text-4xl font-bold tracking-wider text-center">
            <span>StackShare</span>
          </div>
          <p className="mt-6 font-normal text-center text-blue-100 text-sm">
            Secure file storage and sharing made simple. Upload, organize, and share your files with ease.
          </p>
          <p className="flex flex-col items-center justify-center mt-10 text-center">
            <span className="text-sm">Don't have an account?</span>
            <Link to="/register" className="underline hover:text-blue-200 transition-colors font-semibold">
              Get Started!
            </Link>
          </p>
          <p className="mt-6 text-xs text-center text-blue-100">
            Your files are encrypted and protected with industry-standard security.
          </p>
        </div>

        {/* Right Form Section */}
        <div className="p-6 md:p-8 bg-white flex-1">
          <h3 className="my-4 text-2xl font-bold text-gray-800">Account Login</h3>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            {/* Email Field */}
            <div className="flex flex-col space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-600">
                Email address
              </label>
              <input
                type="email"
                id="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-4 py-3 transition duration-300 border border-gray-300 rounded focus:border-transparent focus:outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-gray-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-blue-600 hover:underline focus:text-blue-800 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-3 transition duration-300 border border-gray-300 rounded focus:border-transparent focus:outline-none focus:ring-4 focus:ring-blue-200"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 transition duration-300 rounded focus:ring-2 focus:ring-offset-0 focus:outline-none focus:ring-blue-200 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm font-semibold text-gray-600 cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-lg font-bold text-white transition-all duration-300 bg-blue-500 rounded-md shadow hover:bg-blue-600 focus:outline-none focus:ring-blue-200 focus:ring-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-4 bg-blue-100 rounded-full">
                  <AlertCircle size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Password reset functionality is coming soon! For now, please contact support at <span className="font-semibold">support@stackshare.com</span> to reset your password.
                </p>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
