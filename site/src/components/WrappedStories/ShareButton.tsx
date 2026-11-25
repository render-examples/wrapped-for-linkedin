import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { exportCardAsImage } from '@exports/imageExport';
import { exportCardsAsPDFBatch } from '@exports/pdfExport';
import { getPostImage } from '@exports/postScreenshot';
import { DownloadInstructions } from '@components/WrappedStories/DownloadInstructions';
import { Icon } from '@components/Icon';
import type { ShareableCard, ShareInfo } from '@/types/wrappedStories';
import '@styles/ShareButton.css';

interface ShareButtonProps {
  card: ShareableCard;
  cardRef: React.RefObject<HTMLDivElement>;
  allCards?: React.RefObject<HTMLDivElement>[];
  shareInfo: ShareInfo;
  onPauseAutoplay?: () => void;
}

type ExportOption = 'current-card' | 'all-cards' | null;

/**
 * Place the menu below the button and keep it in the viewport.
 * On phones, CSS centers the menu in the viewport.
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
 * ShareButton component with dropdown menu for export options
 * Supports PNG export for single cards and PDF export for all cards
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
  const [exportType, setExportType] = useState<ExportOption>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: string; left: string }>({ top: '0px', left: '0px' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isDropdownOpen]);

  /**
   * Handle single card PNG export
   */
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

      // Download image from data URL
      const link = document.createElement('a');
      link.href = imageDataUrl;
      link.download = `wrapped-for-linkedin-${card.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show instructions
      setShowInstructions(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export card';
      setError(errorMessage);
      console.error('Card export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [cardRef, card]);

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
        allCards.map((ref) => ref.current).filter((element): element is HTMLDivElement => element !== null);

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

      const filename = `wrapped_${shareInfo.year}.pdf`;
      const postImage = shareInfo.topPostUrl ? await getPostImage(shareInfo.topPostUrl) : null;

      await exportCardsAsPDFBatch(cardElements, filename, { postImage });

      // Show instructions
      setShowInstructions(true);
    } catch (err) {
      if (err instanceof Error && err.message === 'Export cancelled') {
        setError(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export PDF';
        setError(errorMessage);
        console.error('PDF export failed:', err);
      }
    } finally {
      setIsExporting(false);
    }
  }, [allCards, shareInfo]);

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
        {/* Main Share Button */}
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

      {/* Dropdown Menu - Rendered as Portal to escape stacking context */}
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
              <img src="/images/share/png-file.png" alt="PNG" className="option-icon" style={{ height: '2rem' }} />
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
              <img src="/images/share/pdf-file.png" alt="PDF" className="option-icon" style={{ height: '2rem' }} />
              <div className="option-content">
                <div className="option-title">PDF</div>
                <div className="option-description">Export all cards as a single PDF</div>
              </div>
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Error Message */}
      {error && (
        <div className="share-feedback error">
          <span className="share-feedback-icon">
            <Icon name="error" />
          </span>
          {error}
        </div>
      )}

      {/* Download Instructions Modal - Rendered as Portal to escape stacking context */}
      {showInstructions && createPortal(
        <DownloadInstructions
          isVisible={showInstructions}
          shareInfo={shareInfo}
          exportType={exportType ?? 'current-card'}
          onDismiss={() => setShowInstructions(false)}
        />,
        document.body
      )}
    </div>
  );
};
