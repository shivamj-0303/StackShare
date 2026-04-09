import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Upload, X, CheckCircle, AlertCircle, Folder, Camera, FileText, Music } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadType, setUploadType] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to upload files');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const timestamp = Date.now();
      const fileName = `${currentUser.uid}/${timestamp}-${file.name}`;

      const { data, error: uploadError } = await supabase.storage
        .from('StackShare-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentComplete = (progress.loaded / progress.total) * 100;
            setProgress(Math.round(percentComplete));
          },
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('StackShare-files')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicUrl;

      const { data: insertData, error: dbError } = await supabase
        .from('files')
        .insert([
          {
            user_id: currentUser.uid,
            file_name: file.name,
            file_size: file.size,
            file_type: file.mime_type || file.type,
            storage_path: fileName,
            public_url: publicUrl,
          },
        ])
        .select();

      if (dbError) throw dbError;

      setSuccess(
        `File "${file.name}" uploaded successfully! Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      setFile(null);
      setProgress(0);
      setUploadType(null);

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      if (onUploadSuccess) {
        onUploadSuccess(insertData?.[0]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-emerald-900 font-semibold text-sm">Upload Successful</p>
            <p className="text-emerald-800 text-sm">{success}</p>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="text-emerald-600 hover:text-emerald-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-900 font-semibold text-sm">Upload Failed</p>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {!uploadType ? (
        // File Type Selection
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setUploadType('file')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-3 group"
          >
            <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
              <Folder size={28} className="text-blue-600" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">File</span>
          </button>

          <button
            onClick={() => setUploadType('image')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-3 group"
          >
            <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
              <Camera size={28} className="text-pink-600" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Photo</span>
          </button>

          <button
            onClick={() => setUploadType('document')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-3 group"
          >
            <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
              <FileText size={28} className="text-indigo-600" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Document</span>
          </button>

          <button
            onClick={() => setUploadType('audio')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-3 group"
          >
            <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
              <Music size={28} className="text-purple-600" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Audio</span>
          </button>
        </div>
      ) : (
        // Upload Form
        <form onSubmit={handleUpload} className="space-y-4 bg-white rounded-lg border border-gray-200 p-8">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed transition-all p-12 cursor-pointer ${
              dragActive
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50'
            }`}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="flex flex-col items-center justify-center gap-3">
              <div
                className={`p-4 rounded-full transition-all ${
                  dragActive
                    ? 'bg-amber-200'
                    : 'bg-gray-200'
                }`}
              >
                <Upload
                  size={32}
                  className={`transition-colors ${
                    dragActive ? 'text-amber-700' : 'text-gray-600'
                  }`}
                />
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-semibold">
                  {file ? file.name : 'Drop files here or click to upload'}
                </p>
                {file && (
                  <p className="text-gray-600 text-sm mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">Max file size: 50 MB</p>
              </div>
            </label>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-gray-700 text-sm font-medium">Uploading...</p>
                <p className="text-gray-600 text-sm">{progress}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading || !file}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                uploading || !file
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-400 text-gray-900 hover:bg-amber-500'
              }`}
            >
              <Upload size={20} />
              {uploading ? `Uploading (${progress}%)` : 'Upload File'}
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadType(null);
                setFile(null);
                setProgress(0);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FileUpload;
