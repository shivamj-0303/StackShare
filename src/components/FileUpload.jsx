import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);

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

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      addFiles(Array.from(droppedFiles));
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(Array.from(selectedFiles));
    }
  };

  const addFiles = (newFiles) => {
    setFiles([...files, ...newFiles]);
    setError('');
    setSuccess('');
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to upload files');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} file(s) exceed 50MB limit`);
      return;
    }

    setUploading(true);
    setError('');

    let uploadedCount = 0;
    const uploadedFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `file-${i}`;

        try {
          const timestamp = Date.now();
          const fileName = `${currentUser.uid}/${timestamp}-${i}-${file.name}`;

          const { data, error: uploadError } = await supabase.storage
            .from('StackShare-files')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
              onUploadProgress: (progressEvent) => {
                const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
                setProgress(prev => ({ ...prev, [fileId]: Math.round(percentComplete) }));
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
                file_type: file.type || 'application/octet-stream',
                storage_path: fileName,
                public_url: publicUrl,
              },
            ])
            .select();

          if (dbError) throw dbError;

          uploadedFiles.push(insertData?.[0]);
          uploadedCount++;
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
        }
      }

      if (uploadedCount === files.length) {
        setSuccess(
          `All ${files.length} file(s) uploaded successfully!`
        );
      } else if (uploadedCount > 0) {
        setSuccess(
          `${uploadedCount} of ${files.length} file(s) uploaded successfully`
        );
      } else {
        setError('Failed to upload files');
      }

      setFiles([]);
      setProgress({});

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      if (onUploadSuccess && uploadedFiles.length > 0) {
        uploadedFiles.forEach(file => onUploadSuccess(file));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload files');
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

      {/* Upload Form */}
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
            multiple
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
                Drop files here or click to upload
              </p>
              <p className="text-gray-500 text-xs mt-2">Multiple files supported • Max 50 MB each</p>
            </div>
          </label>
        </div>

        {/* Queued Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-gray-700 text-sm font-medium">
              Queued Files ({files.length})
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 hover:border-gray-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 bg-blue-50 rounded">
                      <Upload size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm truncate">{file.name}</p>
                      <p className="text-gray-500 text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove file"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar - Per File */}
        {uploading && files.length > 0 && (
          <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <p className="text-gray-700 text-sm font-medium">Uploading...</p>
            {files.map((file, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-gray-700 text-xs truncate flex-1">{file.name}</p>
                  <p className="text-gray-600 text-xs ml-2 flex-shrink-0">
                    {progress[`file-${index}`] || 0}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress[`file-${index}`] || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              uploading || files.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-amber-400 text-gray-900 hover:bg-amber-500'
            }`}
          >
            <Upload size={20} />
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </button>

          <button
            type="button"
            onClick={() => {
              setFiles([]);
              setProgress({});
              setError('');
              setSuccess('');
              const fileInput = document.querySelector('input[type="file"]');
              if (fileInput) fileInput.value = '';
            }}
            disabled={uploading}
            className={`px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg transition-colors ${
              uploading
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUpload;
