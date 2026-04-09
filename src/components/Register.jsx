import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="flex flex-col md:flex-row overflow-hidden bg-white rounded-md shadow-lg md:flex-1 lg:max-w-4xl w-full">
        
        {/* Left Sidebar */}
        <div className="p-6 py-8 text-white bg-blue-500 md:w-80 md:flex-shrink-0 flex flex-col items-center justify-center md:justify-evenly">
          <div className="my-3 text-4xl font-bold tracking-wider text-center">
            <span>CloudShare</span>
          </div>
          <p className="mt-6 font-normal text-center text-blue-100 text-sm">
            Secure file storage and sharing made simple. Upload, organize, and share your files with ease.
          </p>
          <p className="flex flex-col items-center justify-center mt-10 text-center">
            <span className="text-sm">Already have an account?</span>
            <Link to="/login" className="underline hover:text-blue-200 transition-colors font-semibold">
              Sign In!
            </Link>
          </p>
          <p className="mt-6 text-xs text-center text-blue-100">
            Your files are encrypted and protected with industry-standard security.
          </p>
        </div>

        {/* Right Form Section */}
        <div className="p-6 md:p-8 bg-white flex-1">
          <h3 className="my-4 text-2xl font-bold text-gray-800">Create Account</h3>

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
              <label htmlFor="password" className="text-sm font-semibold text-gray-600">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-3 transition duration-300 border border-gray-300 rounded focus:border-transparent focus:outline-none focus:ring-4 focus:ring-blue-200"
              />
              {password && password.length < 6 && (
                <p className="text-red-600 text-xs mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-600">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`px-4 py-3 transition duration-300 border rounded focus:border-transparent focus:outline-none focus:ring-4 ${
                  confirmPassword && !passwordsMatch ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
              )}
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading || !passwordsMatch || password.length < 6}
              className="w-full px-4 py-3 text-lg font-bold text-white transition-all duration-300 bg-blue-500 rounded-md shadow hover:bg-blue-600 focus:outline-none focus:ring-blue-200 focus:ring-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-bold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
