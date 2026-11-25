import React, { useCallback, useState } from 'react';
import { buildShareText } from '@utils/linkedinShareLink';
import { shareFile } from '@utils/webShare';
import { ShareModalHeader } from '@components/WrappedStories/ShareModalHeader';
import type { ExportType } from '@components/WrappedStories/DownloadInstructions';
import type { ShareInfo } from '@/types/wrappedStories';
import '@styles/WrappedStories.css';
import '@styles/NativeSharePrompt.css';

interface NativeSharePromptProps {
  file: File;
  shareInfo: ShareInfo;
  exportType: ExportType;
  onShared: () => void;
  onFallback: () => void;
  onDismiss: () => void;
}

/**
 * On phones, open the system share sheet with the exported file.
 * The share runs from a new tap, because browsers reject a share after a slow export.
 */
export const NativeSharePrompt: React.FC<NativeSharePromptProps> = ({
  file,
  shareInfo,
  exportType,
  onShared,
  onFallback,
  onDismiss,
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    const result = await shareFile(file, buildShareText(shareInfo));
    setIsSharing(false);
    if (result === 'shared') {
      onShared();
    } else if (result === 'failed') {
      onFallback();
    }
  }, [file, shareInfo, onShared, onFallback]);

  return (
    <div className="download-instructions-overlay native-share-overlay">
      <div className="download-instructions-modal">
        <ShareModalHeader
          title={exportType === 'all-cards' ? 'Your cards are ready' : 'Your card is ready'}
          closeLabel="Close share prompt"
          onDismiss={onDismiss}
        />

        <div className="instructions-content">
          <p className="instructions-text">
            Tap <b>Share to LinkedIn</b>, then pick LinkedIn. We also copy your post text, so you can paste it into your post.
          </p>
        </div>

        <div className="native-share-actions">
          <button className="button primary btn-share-linkedin" onClick={handleShare} disabled={isSharing}>
            <img src="/images/dashboard/linkedin-logo.png" alt="LinkedIn" className="btn-linkedin-icon" />
            Share to LinkedIn
          </button>
          <button className="button secondary native-share-download" onClick={onFallback}>
            Download instead
          </button>
        </div>
      </div>
    </div>
  );
};
