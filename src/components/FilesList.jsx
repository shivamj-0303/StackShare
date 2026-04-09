import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const FilesList = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user's files
  const fetchFiles = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', currentUser.uid)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err.message || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  // Fetch files on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchFiles();
  }, [currentUser, refreshTrigger]);

  const handleDelete = async (fileId, storagePath) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from('StackShare-files')
        .remove([storagePath]);

      if (deleteStorageError) throw deleteStorageError;

      // Delete from database
      const { error: deleteDbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (deleteDbError) throw deleteDbError;

      // Update local state
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file: ' + err.message);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-2 text-gray-600">Loading your files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-4xl mb-3">📂</div>
        <p className="text-gray-600">No files uploaded yet. Start by uploading your first file!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Files</h2>

      {/* Files Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Size
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Uploaded
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <span className="text-gray-800 font-medium truncate">
                      {file.file_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {formatFileSize(file.file_size)}
                </td>
                <td className="px-6 py-3 text-gray-600 text-sm">
                  {formatDate(file.uploaded_at)}
                </td>
                <td className="px-6 py-3 space-x-2">
                  {file.public_url && (
                    <a
                      href={file.public_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1 px-3 rounded transition"
                    >
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(file.id, file.storage_path)}
                    className="inline-block bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-3 rounded transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* File Count */}
      <div className="mt-4 text-sm text-gray-600 text-right">
        Total files: <span className="font-semibold">{files.length}</span>
      </div>
    </div>
  );
};

export default FilesList;
