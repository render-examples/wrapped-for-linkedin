import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import '../styles/FileUpload.css';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, isLoading = false }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    disabled: isLoading,
  });

  return (
    <div className="file-upload-container">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="upload-icon">📤</div>
          {isDragActive ? (
            <p className="dropzone-text">Drop your file here...</p>
          ) : (
            <>
              <p className="dropzone-text">Drag & drop your LinkedIn export file here</p>
              <p className="dropzone-subtext">or click to select a file</p>
              <p className="dropzone-formats">Supported: Excel (.xlsx) or CSV (.csv)</p>
            </>
          )}
        </div>
      </div>
      <div className="instructions">
        <h3>How to export your LinkedIn data:</h3>
        <ol>
          <li>Visit <a href="https://www.linkedin.com/analytics/creator" target="_blank" rel="noreferrer">LinkedIn Analytics</a></li>
          <li>Switch to "Engagements" mode</li>
          <li>Set date range to "Last 365 days"</li>
          <li>Click "Export" button in top right</li>
          <li>Upload the file here</li>
        </ol>
      </div>
    </div>
  );
};
