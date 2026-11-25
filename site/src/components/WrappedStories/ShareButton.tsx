import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { exportCardAsImage } from '@exports/imageExport';
import { buildCardsPDF } from '@exports/pdfExport';
import { getPostImage } from '@exports/postScreenshot';
import { DownloadInstructions, type ExportType } from '@components/WrappedStories/DownloadInstructions';
import { NativeSharePrompt } from '@components/WrappedStories/NativeSharePrompt';
import { dataUrlToFile, downloadFile, getShareMode, type ShareMode } from '@utils/webShare';
import { Icon } from '@components/Icon';
import type { ShareableCard, ShareInfo } from '@/types/wrappedStories';
import '@styles/ShareButton.css';

interface ShareButtonProps {
  card: ShareableCard;
  cardRef: React.RefObject<HTMLDivElement | null>;
  allCards?: React.RefObject<HTMLDivElement | null>[];
  shareInfo: ShareInfo;
  onPauseAutoplay?: () => void;
}

/**
 * Place the menu below the button and keep it in the viewport.
 * On phones, CSS shows the menu as a bottom sheet and ignores this position.
 */
function getDropdownPosition(button: HTMLElement): { top: string; left: string } {
  if (window.innerWidth <= 480) {
    return { top: '50%', left: '50%' };
  }
  const rect = button.getBoundingClientRect();
  // The menu is 280px wide. Center it under the button, 10px below it.
  const left = rect.left + rect.width / 2 - 140;
  const adjustedLeft = Math.max(10, Math.min(window.innerWidth - 290, left));
  return { top: `${rect.bottom + 10}px`, left: `${adjustedLeft}px` };
}

/**
 * A share button with a menu. Export the current card as a PNG, or all cards as one PDF.
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  card,
  cardRef,
  allCards = [],
  shareInfo,
  onPauseAutoplay,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('current-card');
  const [error, setError] = useState<string | null>(null);
  const [exportedFile, setExportedFile] = useState<File | null>(null);
  const [shareMode, setShareMode] = useState<ShareMode>('download');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: string; left: string }>({ top: '0px', left: '0px' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu on a click outside it.
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  /**
   * Download the file on desktop. On touch devices, keep it for the share prompt.
   */
  const deliverFile = useCallback((file: File) => {
    const mode = getShareMode(file);
    setExportedFile(file);
    setShareMode(mode);
    if (mode === 'download') {
      downloadFile(file);
    }
    setShowInstructions(true);
  }, []);

  const handleFallbackDownload = useCallback(() => {
    if (exportedFile) {
      downloadFile(exportedFile);
    }
    setShareMode('download');
  }, [exportedFile]);

  const handlePNGExport = useCallback(async () => {
    if (!cardRef.current) {
      setError('Card element not found');
      return;
    }

    setIsExporting(true);
    setError(null);
    setIsDropdownOpen(false);
    setExportType('current-card');

    try {
      const postImage =
        card.type === 'top-post' && card.data.url ? await getPostImage(card.data.url) : null;
      const imageDataUrl = await exportCardAsImage(cardRef.current, { postImage });

      deliverFile(await dataUrlToFile(imageDataUrl, `wrapped-for-linkedin-${card.id}.png`));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export card';
      setError(errorMessage);
      console.error('Card export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [cardRef, card, deliverFile]);

  /**
   * Export all cards as one PDF.
   */
  const handlePDFExport = useCallback(async () => {
    if (allCards.length === 0) {
      setError('No cards available for PDF export');
      return;
    }

    setIsExporting(true);
    setError(null);
    setIsDropdownOpen(false);
    setExportType('all-cards');

    try {
      const getCardElements = () =>
        allCards.map((ref) => ref.current).filter((element) => element !== null);

      // If a ref is still empty, wait for the card to render, then try again.
      let cardElements = getCardElements();
      if (cardElements.length < allCards.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
        cardElements = getCardElements();
      }

      if (cardElements.length === 0) {
        setError('Card elements not found. Make sure cards are displayed first.');
        return;
      }

      const postImage = shareInfo.topPostUrl ? await getPostImage(shareInfo.topPostUrl) : null;
      const pdf = await buildCardsPDF(cardElements, { postImage });

      deliverFile(new File([pdf], `wrapped_${shareInfo.year}.pdf`, { type: 'application/pdf' }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export PDF';
      setError(errorMessage);
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [allCards, shareInfo, deliverFile]);

  const handleToggleDropdown = useCallback(() => {
    if (isExporting) {
      return;
    }
    if (!isDropdownOpen) {
      if (buttonRef.current) {
        setDropdownPosition(getDropdownPosition(buttonRef.current));
      }
      onPauseAutoplay?.();
    }
    setIsDropdownOpen(prev => !prev);
  }, [isExporting, isDropdownOpen, onPauseAutoplay]);

  return (
    <div className="share-button-wrapper">
      <div className="share-button-container">
        <button
          ref={buttonRef}
          className="share-button"
          onClick={handleToggleDropdown}
          disabled={isExporting}
          aria-label="Share and export Wrapped for LinkedIn"
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
        >
          {isExporting ? (
            <>
              <span className="share-spinner" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <img
                src="/images/dashboard/linkedin-logo.png"
                alt="LinkedIn"
                className="linkedin-logo-btn"
              />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* The portal puts the menu outside the card's stacking context. */}
      {isDropdownOpen && !isExporting && createPortal(
        <>
          <div className="share-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)} />
          <div
            className="share-dropdown-menu"
            role="menu"
            style={dropdownPosition}
            ref={dropdownRef}
          >
            <button
              className="dropdown-option"
              onClick={handlePNGExport}
              role="menuitem"
            >
              <img src="/images/share/png-file.png" alt="PNG" className="option-icon" />
              <div className="option-content">
                <div className="option-title">PNG</div>
                <div className="option-description">Export current card as a PNG</div>
              </div>
            </button>

            <button
              className="dropdown-option"
              onClick={handlePDFExport}
              role="menuitem"
            >
              <img src="/images/share/pdf-file.png" alt="PDF" className="option-icon" />
              <div className="option-content">
                <div className="option-title">PDF</div>
                <div className="option-description">Export all cards as a single PDF</div>
              </div>
            </button>
          </div>
        </>,
        document.body
      )}

      {error && (
        <div className="share-feedback error">
          <span className="share-feedback-icon">
            <Icon name="error" />
          </span>
          {error}
        </div>
      )}

      {/* The portal puts the modal outside the card's stacking context. */}
      {showInstructions && createPortal(
        shareMode === 'native' && exportedFile ? (
          <NativeSharePrompt
            file={exportedFile}
            shareInfo={shareInfo}
            exportType={exportType}
            onShared={() => setShowInstructions(false)}
            onFallback={handleFallbackDownload}
            onDismiss={() => setShowInstructions(false)}
          />
        ) : (
          <DownloadInstructions
            shareInfo={shareInfo}
            exportType={exportType}
            onDismiss={() => setShowInstructions(false)}
          />
        ),
        document.body
      )}
    </div>
  );
};
