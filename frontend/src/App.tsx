import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { UnifiedDashboard } from './components/UnifiedDashboard';
import { Loading } from './components/Loading';
import { ErrorDisplay } from './components/Error';
import { Header } from './components/Header';
import { uploadFile, getEngagementMetrics, getDemographicInsights } from './utils/api';
import type { DemographicInsights } from './types';
import './App.css';

function App() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engagement, setEngagement] = useState(null);
  const [demographics, setDemographics] = useState<DemographicInsights | undefined>(undefined);

  useEffect(() => {
    if (fileId) {
      loadData();
    }
  }, [fileId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [engagementData, demographicsData] = await Promise.all([
        getEngagementMetrics(fileId!),
        getDemographicInsights(fileId!).catch(() => null),
      ]);
      setEngagement(engagementData);
      setDemographics(demographicsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const response = await uploadFile(file);
      if (response.success) {
        setFileId(response.fileId);
      } else {
        setError('Upload failed: ' + response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setFileId(null);
    setEngagement(null);
    setDemographics(undefined);
    setError(null);
  };

  return (
    <div className="app-container">
      <Header />

      <main className="app-main">
        {error && <ErrorDisplay error={error} onRetry={handleRetry} />}

        {loading && <Loading />}

        {!loading && !error && fileId && engagement ? (
          <UnifiedDashboard data={engagement} demographics={demographics} />
        ) : !loading && !error && !fileId ? (
          <FileUpload onFileSelected={handleFileSelected} isLoading={loading} />
        ) : null}
      </main>

      <footer className="app-footer">
        <p>LinkedIn Wrapped &nbsp; | &nbsp; © 2025 Shifra Williams </p>
      </footer>
    </div>
  );
}

export default App;
