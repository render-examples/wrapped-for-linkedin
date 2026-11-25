import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import type { ParsedExcelData } from '@utils/excel/types';
import { useCache } from '@/hooks/useCache';
import { useSampleData } from '@/hooks/useSampleData';
import { SampleDataButton } from '@components/SampleDataButton';
import { isTouchDevice } from '@utils/webShare';
import '@styles/FileUpload.css';

interface FileUploadProps {
  onDataLoaded: (data: ParsedExcelData) => void;
  onError: (message: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError }) => {
  const touch = isTouchDevice();
  // Show the dashboard from the cache when there is cached data.
  const { save: saveToCache } = useCache(onDataLoaded);

  const sampleData = useSampleData(onDataLoaded, (error) => onError(error.message));

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      const { processExcelFile } = await import('@utils/excel/excelProcessor');
      const data = await processExcelFile(acceptedFiles[0]);
      saveToCache(data);
      onDataLoaded(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      console.error('Error processing file:', error);
      onError(errorMessage);
    }
  }, [saveToCache, onDataLoaded, onError]);

  const isDisabled = sampleData.isLoading;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    disabled: isDisabled,
  });

  useEffect(() => {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'prefetch';
    preloadLink.href = '/demo-data/linkedin-demo.xlsx';
    document.head.appendChild(preloadLink);
  }, []);

  return (
    <div className="file-upload-container">
      <div className="instructions">
        <h3>Export your LinkedIn analytics</h3>
        <ol>
          <li>Head to your <a href="https://www.linkedin.com/analytics/creator/content/?metricType=ENGAGEMENTS&timeRange=past_365_days" target="_blank" rel="noreferrer">LinkedIn analytics dashboard</a> ↗</li>
          <li>Click <b>Export</b> in the top right</li>
          <li>Upload the exported file below ↓</li>
        </ol>
        <a
          href="https://www.youtube.com/watch?v=fpvWoG_PB00"
          target="_blank"
          rel="noopener noreferrer"
          className="watch-demo-button"
        >
          Watch demo ↗
        </a>
      </div>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <p className="dropzone-text">Upload your LinkedIn analytics file here</p>
          <img src="/images/upload/icon-upload.svg" alt="Upload" className="upload-icon" />
          {isDragActive ? (
            <p className="dropzone-text">Drop your file here</p>
          ) : (
            <>
              <p className="dropzone-subtext">
                {touch ? 'Tap to choose a file' : 'Drag and drop or click to select a file'}
              </p>
              <p className="dropzone-formats">Excel (.xlsx) files only</p>
            </>
          )}
        </div>
      </div>

      <div className="or-divider">or</div>

      <SampleDataButton
        onClick={sampleData.loadSampleData}
        isLoading={sampleData.isLoading}
      />

      <div className="privacy-disclaimer">
        <p>
          <img src="/images/upload/icon-shield.svg" alt="Shield" className="shield-icon"/>
          <br/>
          <strong>Your analytics data never leaves your browser</strong>
          <br /> <br />
          <span className="privacy-disclaimer-text">
            All processing happens locally. To show and export your top posts,
            the app sends only each post's public ID to our server.
          </span>
          <br /> <br />
          <a
            href="https://github.com/render-examples/wrapped-for-linkedin/blob/main/site/src/utils/excel/excelProcessor.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source code on GitHub ↗
          </a>
        </p>
      </div>
    </div>
  );
};
