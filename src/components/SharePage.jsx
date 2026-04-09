import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Download, AlertCircle } from 'lucide-react';

const SharePage = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchFile();
  }, [fileId]);

  const fetchFile = async () => {
    if (!fileId) {
      setError('Invalid file ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('File not found');
        }
        throw fetchError;
      }

      if (!data) {
        throw new Error('File not found');
      }

      setFile(data);
    } catch (err) {
      console.error('Error fetching file:', err);
      setError(err.message || 'Failed to fetch file');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadNow = async () => {
    try {
      setDownloading(true);

      const response = await fetch(file.public_url);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-amber-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center border border-gray-200">
          <div className="flex justify-center mb-4">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">File Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The file you are looking for does not exist or has been deleted.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-lg transition-all"
          >
            Go to CloudShare
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">📁</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CloudShare</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gray-50 p-12 text-center border-b border-gray-200">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-4xl font-bold mb-2 text-gray-900">File Ready for Download</h2>
            <p className="text-gray-600">Shared via CloudShare</p>
          </div>

          {/* File Details */}
          <div className="p-8 sm:p-12 space-y-8">
            {/* File Name */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest">
                File Name
              </label>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{file.file_name}</p>
            </div>

            {/* File Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">File Size</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(file.file_size)}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">File Type</p>
                <p className="text-2xl font-bold text-gray-700">
                  {file.file_type?.split('/')[1]?.toUpperCase() || 'File'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">Shared On</p>
                <p className="text-sm font-semibold text-gray-700">{formatDate(file.created_at)}</p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadNow}
              disabled={downloading}
              className="w-full py-4 px-6 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-400 text-gray-900 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 text-lg"
            >
              <Download size={24} />
              {downloading ? 'Downloading...' : 'Download File'}
            </button>

            {/* Security Note */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                <span className="font-semibold">🔒 Secure Sharing:</span> This link is unique to this file and should only be shared with intended recipients.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 text-center border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Powered by <span className="font-semibold text-indigo-600">CloudShare</span> — Secure Cloud File Storage
            </p>
          </div>
        </div>

        {/* Return Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            ← Back to CloudShare
          </button>
        </div>
      </main>
    </div>
  );
};

export default SharePage;
