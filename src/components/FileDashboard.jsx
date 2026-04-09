import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import {
  Folder,
  FileImage,
  FileText,
  Music,
  Video,
  Archive,
  File,
  Plus,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Grid3x3,
  List,
  Clock,
  FileUp,
  X,
} from 'lucide-react';

const FileDashboard = ({ onUploadSuccess }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [sharedFileId, setSharedFileId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'name' or 'size'

  useEffect(() => {
    fetchFiles();
  }, [currentUser]);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <FileImage size={24} className="text-pink-500" />;
    if (fileType.startsWith('video/')) return <Video size={24} className="text-red-500" />;
    if (fileType.startsWith('audio/')) return <Music size={24} className="text-purple-500" />;
    if (fileType.includes('pdf')) return <FileText size={24} className="text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText size={24} className="text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileText size={24} className="text-green-500" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return <Archive size={24} className="text-yellow-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  const getFileCategory = (fileType) => {
    if (fileType.startsWith('image/')) return 'Images';
    if (fileType.startsWith('video/')) return 'Videos';
    if (fileType.startsWith('audio/')) return 'Audio';
    if (fileType.includes('pdf')) return 'Documents';
    if (fileType.includes('word') || fileType.includes('document') || fileType.includes('sheet') || fileType.includes('excel')) return 'Documents';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return 'Archives';
    return 'Other';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Images': { bg: 'from-pink-100 to-pink-50', icon: 'text-pink-500', badge: 'bg-pink-100 text-pink-700' },
      'Videos': { bg: 'from-red-100 to-red-50', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' },
      'Audio': { bg: 'from-purple-100 to-purple-50', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700' },
      'Documents': { bg: 'from-blue-100 to-blue-50', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
      'Archives': { bg: 'from-yellow-100 to-yellow-50', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
      'Other': { bg: 'from-gray-100 to-gray-50', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-700' },
    };
    return colors[category] || colors['Other'];
  };

  const groupedByCategory = files.reduce((acc, file) => {
    const category = getFileCategory(file.file_type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {});

  const handleDownload = (publicUrl) => {
    window.open(publicUrl, '_blank');
    setOpenMenu(null);
  };

  const handleDelete = async (fileId, storagePath, fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;

    try {
      setDeleting(fileId);
      setOpenMenu(null);

      await supabase.storage.from('StackShare-files').remove([storagePath]);
      await supabase.from('files').delete().eq('id', fileId);

      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleShare = async (fileId) => {
    try {
      const shareUrl = `${window.location.origin}/share/${fileId}`;
      await navigator.clipboard.writeText(shareUrl);
      setSharedFileId(fileId);
      setOpenMenu(null);
      setTimeout(() => setSharedFileId(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      setError('Failed to copy share link');
    }
  };

  // Filter and sort files
  const filteredFiles = files
    .filter(file => file.file_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.file_name.localeCompare(b.file_name);
      if (sortBy === 'size') return b.file_size - a.file_size;
      return new Date(b.created_at) - new Date(a.created_at); // date
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your files...</p>
        </div>
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-900 font-semibold">Failed to load files</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Storage Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-gray-600 text-xs font-medium mb-2">Total Storage</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            {formatFileSize(filteredFiles.reduce((sum, f) => sum + f.file_size, 0))}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 rounded-full h-2 transition-all"
                style={{
                  width: `${Math.min(
                    (filteredFiles.reduce((sum, f) => sum + f.file_size, 0) / (100 * 1024 * 1024)) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <span className="text-xs font-medium text-gray-600">70GB</span>
          </div>
        </div>

        {/* Total Files Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-gray-600 text-xs font-medium mb-2">Total Files</p>
          <h3 className="text-3xl font-bold text-gray-900">{filteredFiles.length}</h3>
          <p className="text-gray-500 text-xs mt-2">Files stored safely</p>
        </div>

        {/* Recent Upload Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-gray-600 text-xs font-medium mb-2">Recent Upload</p>
          <h3 className="text-lg font-bold text-gray-900">
            {filteredFiles.length > 0 ? formatDate(filteredFiles[0].created_at) : 'N/A'}
          </h3>
          <p className="text-gray-500 text-xs mt-2">Latest file updated</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Search and Controls Bar - Always show if there are files */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Mode and Sort Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>

              {/* View Mode Buttons */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Grid view"
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="List view"
                >
                  <List size={18} />
                </button>
              </div>

              {/* Upload Button - Always Accessible */}
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all whitespace-nowrap text-sm"
              >
                <FileUp size={18} />
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Categories/Display */}
      {files.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Folder size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Files Yet</h3>
          <p className="text-gray-600 mb-6">Upload your first file to get started</p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
          >
            <FileUp size={20} />
            Upload File
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Search size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No files found</h3>
          <p className="text-gray-600">Try adjusting your search query</p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all group"
            >
              {/* File Icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gray-50 rounded-lg">{getFileIcon(file.file_type)}</div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === file.id ? null : file.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenu === file.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                      <button
                        onClick={() => handleDownload(file.public_url)}
                        className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-xs font-medium border-b border-gray-100"
                      >
                        <Download size={14} className="text-blue-600" />
                        Download
                      </button>

                      <button
                        onClick={() => handleShare(file.id)}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium border-b border-gray-100 ${
                          sharedFileId === file.id
                            ? 'bg-green-50 text-green-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {sharedFileId === file.id ? (
                          <>
                            <CheckCircle size={14} className="text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Share2 size={14} className="text-green-600" />
                            Share
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(file.id, file.storage_path, file.file_name)}
                        disabled={deleting === file.id}
                        className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-xs font-medium disabled:opacity-50"
                      >
                        <Trash2 size={14} className="text-red-600" />
                        {deleting === file.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* File Name */}
              <h4 className="font-semibold text-gray-900 truncate mb-2 text-sm" title={file.file_name}>
                {file.file_name}
              </h4>

              {/* File Details */}
              <div className="space-y-1">
                <p className="text-xs text-gray-600">{formatFileSize(file.file_size)}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(file.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">File Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.file_type)}
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs" title={file.file_name}>
                          {file.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(file.file_size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(file.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === file.id ? null : file.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} className="text-gray-600" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenu === file.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                            <button
                              onClick={() => handleDownload(file.public_url)}
                              className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-xs font-medium border-b border-gray-100"
                            >
                              <Download size={14} className="text-blue-600" />
                              Download
                            </button>

                            <button
                              onClick={() => handleShare(file.id)}
                              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium border-b border-gray-100 ${
                                sharedFileId === file.id
                                  ? 'bg-green-50 text-green-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {sharedFileId === file.id ? (
                                <>
                                  <CheckCircle size={14} className="text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Share2 size={14} className="text-green-600" />
                                  Share
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDelete(file.id, file.storage_path, file.file_name)}
                              disabled={deleting === file.id}
                              className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-xs font-medium disabled:opacity-50"
                            >
                              <Trash2 size={14} className="text-red-600" />
                              {deleting === file.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Upload Files</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <FileUpload
                onUploadSuccess={() => {
                  setShowUpload(false);
                  onUploadSuccess?.();
                  fetchFiles(); // Refresh files after upload
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDashboard;
