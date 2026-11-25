import React, { useCallback } from 'react';
import { openLinkedInShare } from '@utils/linkedinShareLink';
import { isTouchDevice } from '@utils/webShare';
import { Icon } from '@components/Icon';
import type { ShareInfo } from '@/types/wrappedStories';
import '@styles/WrappedStories.css';

export type ExportType = 'current-card' | 'all-cards';

interface DownloadInstructionsProps {
  isVisible: boolean;
  shareInfo: ShareInfo;
  exportType?: ExportType;
  onDismiss?: () => void;
}

/**
 * Show the steps to attach a downloaded export to a LinkedIn post.
 * The steps are different for a PNG of one card and a PDF of all cards.
 */
export const DownloadInstructions: React.FC<DownloadInstructionsProps> = ({
  isVisible,
  shareInfo,
  exportType = 'current-card',
  onDismiss,
}) => {
  const touch = isTouchDevice();
  const click = touch ? 'Tap' : 'Click';
  const clicking = touch ? 'tapping' : 'clicking';

  const handleShareOnLinkedIn = useCallback(() => {
    openLinkedInShare(shareInfo);
  }, [shareInfo]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="download-instructions-overlay">
      <div className="download-instructions-modal">
        {/* Header */}
        <div className="instructions-header">
          <h3 className="instructions-title">
            <img
              src="/images/share/check.png"
              alt="Check"
              className="instructions-check-icon"
            />
            Download complete
          </h3>
          <button
            className="instructions-close-btn"
            onClick={onDismiss}
            aria-label="Close instructions"
          >
            <span className="instructions-close-icon">
              <Icon name="close" />
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="instructions-actions">
          <button
            className="button primary btn-share-linkedin"
            onClick={handleShareOnLinkedIn}
            aria-label="Share on LinkedIn with prepared text"
          >
            <img
              src="/images/dashboard/linkedin-logo.png"
              alt="LinkedIn"
              className="btn-linkedin-icon"
            />
            Share on LinkedIn
          </button>
        </div>

        {/* Content */}
        <div className="instructions-content">
          <p className="instructions-text">
            Follow these steps to share your Wrapped for LinkedIn:
          </p>

          <div className="instructions-steps">
            <p className="instruction-step">1. <b>Open LinkedIn.</b>{` ${click} the button above to open LinkedIn with a prepared post.`}</p>
            <p className="instruction-step"><strong>Note:</strong>{` Close the link preview by ${clicking} `}<strong>X</strong> before attaching media.</p>
            <img src="/images/share/close-embed.png" alt="Close the link embed" className="instruction-image" />
            {exportType === 'current-card' ? (
              <>
                <p className="instruction-step">2. <b>Attach your card.</b>{` ${click} the image icon in the bottom left of the post modal. Select your Wrapped for LinkedIn card image (PNG file).`}</p>
                <img src="/images/share/add-media.png" alt={`${click} the image icon`} className="instruction-image" />
              </>
            ) : (
              <>
                <p className="instruction-step">2. <b>Attach your cards.</b>{` ${click} the `}<b>+</b>{` icon at the bottom of the post modal to expand options. ${click} the document icon (second from the right) to upload a file and select your Wrapped for LinkedIn PDF file.`}
                </p>
                <div className="instruction-images-column">
                  <img src="/images/share/more.png" alt={`${click} the plus icon to expand options`} className="instruction-image" />
                  <img src="/images/share/add-a-document.png" alt={`${click} the document icon to upload`} className="instruction-image" />
                </div>
                <p><b>Name it.</b>Give your LinkedIn PDF a name like "wrapped".</p>
              </>
            )}
          </div>

          {/* Disclaimer */}
          <div className="instructions-disclaimer">
            <p className="disclaimer-text">
              𝒊 &nbsp; &nbsp; We can't automatically attach the file to your LinkedIn post without violating LinkedIn's terms of service.
              These manual steps ensure we stay compliant and respect LinkedIn's policies.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
