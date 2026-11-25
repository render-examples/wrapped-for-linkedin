import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { exportCardAsImage } from '@exports/imageExport';
import { buildCardsPDF } from '@exports/pdfExport';
import { getPostImage } from '@exports/postScreenshot';
import { DownloadInstructions, type ExportType } from '@components/WrappedStories/DownloadInstructions';
import { NativeSharePrompt } from '@components/WrappedStories/NativeSharePrompt';
import { canShareFiles, dataUrlToFile, downloadFile, getShareMode, shareFile, type ShareMode } from '@utils/webShare';
import { buildShareText } from '@utils/linkedinShareLink';
import { Icon } from '@components/Icon';
import type { ShareableCard, ShareInfo } from '@/types/wrappedStories';
import '@styles/ShareButton.css';

interface ShareButtonProps {
  card: ShareableCard;
  cardRef: React.RefObject<HTMLDivElement | null>;
  allCardRefs: React.RefObject<HTMLDivElement | null>[];
  shareInfo: ShareInfo;
  onPauseAutoPlay: () => void;
}

// Keep these values the same as the menu min-width and the phone breakpoint in ShareButton.css.
const MENU_WIDTH = 280;
const MENU_GAP = 10;
const PHONE_MAX_WIDTH = 480;

type MenuPosition = { top: string; left: string };
type CardFile = { cardId: string; file: File };

/**
 * Place the menu below the button and keep it in the viewport.
 * On phones, CSS shows the menu as a bottom sheet and ignores this position.
 */
function getDropdownPosition(button: HTMLElement): MenuPosition {
  if (window.innerWidth <= PHONE_MAX_WIDTH) {
    return { top: '50%', left: '50%' };
  }
  const rect = button.getBoundingClientRect();
  const centeredLeft = rect.left + rect.width / 2 - MENU_WIDTH / 2;
  const left = Math.max(MENU_GAP, Math.min(window.innerWidth - MENU_WIDTH - MENU_GAP, centeredLeft));
  return { top: `${rect.bottom + MENU_GAP}px`, left: `${left}px` };
}

/**
 * A share button with a menu. Export the current card as a PNG, or all cards as one PDF.
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  card,
  cardRef,
  allCardRefs,
  shareInfo,
  onPauseAutoPlay,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('current-card');
  const [error, setError] = useState<string | null>(null);
  const [exportedFile, setExportedFile] = useState<File | null>(null);
  const [shareMode, setShareMode] = useState<ShareMode>('download');
  const [dropdownPosition, setDropdownPosition] = useState<MenuPosition>({ top: '0px', left: '0px' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // On phones, the PNG renders when the menu opens, so the PNG tap can open the share sheet at once.
  const [prerendered, setPrerendered] = useState<CardFile | null>(null);
  const prerenderRef = useRef<{ cardId: string; promise: Promise<File> } | null>(null);

  // Drop the prerendered file when the card changes.
  useEffect(() => {
    prerenderRef.current = null;
    setPrerendered(null);
  }, [card.id]);

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

  const closeInstructions = useCallback(() => setShowInstructions(false), []);

  const handleFallbackDownload = useCallback(() => {
    if (exportedFile) {
      downloadFile(exportedFile);
    }
    setShareMode('download');
  }, [exportedFile]);

  /**
   * Render the current card as a PNG file.
   */
  const renderCardFile = useCallback(async (): Promise<File> => {
    const element = cardRef.current;
    if (!element) {
      throw new Error('Card element not found');
    }
    const postImage =
      card.type === 'top-post' && card.data.url ? await getPostImage(card.data.url) : null;
    const imageDataUrl = await exportCardAsImage(element, { postImage });
    return dataUrlToFile(imageDataUrl, `wrapped-for-linkedin-${card.id}.png`);
  }, [cardRef, card]);

  /**
   * Start the PNG render in the background, once per card.
   */
  const startPrerender = useCallback(() => {
    const cardId = card.id;
    if (prerenderRef.current?.cardId === cardId) {
      return;
    }
    const promise = renderCardFile();
    prerenderRef.current = { cardId, promise };
    promise.then(
      (file) => {
        if (prerenderRef.current?.promise === promise) {
          setPrerendered({ cardId, file });
        }
      },
      () => {
        // The normal export path shows the error. Clear the ref so that path renders again.
        if (prerenderRef.current?.promise === promise) {
          prerenderRef.current = null;
        }
      }
    );
  }, [card.id, renderCardFile]);

  const handlePNGExport = useCallback(async () => {
    setError(null);
    setIsDropdownOpen(false);
    setExportType('current-card');

    // Call share before any await. Browsers allow a share only during or just after a tap.
    if (prerendered?.cardId === card.id) {
      const file = prerendered.file;
      const result = await shareFile(file, buildShareText(shareInfo));
      if (result === 'failed') {
        setExportedFile(file);
        setShareMode('native');
        setShowInstructions(true);
      }
      return;
    }

    setIsExporting(true);

    try {
      const pending = prerenderRef.current?.cardId === card.id ? prerenderRef.current.promise : null;
      deliverFile(await (pending ?? renderCardFile()));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export card';
      setError(errorMessage);
      console.error('Card export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [card.id, prerendered, shareInfo, renderCardFile, deliverFile]);

  /**
   * Export all cards as one PDF.
   */
  const handlePDFExport = useCallback(async () => {
    if (allCardRefs.length === 0) {
      setError('No cards available for PDF export');
      return;
    }

    setIsExporting(true);
    setError(null);
    setIsDropdownOpen(false);
    setExportType('all-cards');

    try {
      const getCardElements = () =>
        allCardRefs.map((ref) => ref.current).filter((element) => element !== null);

      // If a ref is still empty, wait for the card to render, then try again.
      let cardElements = getCardElements();
      if (cardElements.length < allCardRefs.length) {
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
  }, [allCardRefs, shareInfo, deliverFile]);

  const handleToggleDropdown = useCallback(() => {
    if (isExporting) {
      return;
    }
    if (!isDropdownOpen) {
      if (buttonRef.current) {
        setDropdownPosition(getDropdownPosition(buttonRef.current));
      }
      onPauseAutoPlay();
      if (canShareFiles()) {
        startPrerender();
      }
    }
    setIsDropdownOpen(prev => !prev);
  }, [isExporting, isDropdownOpen, onPauseAutoPlay, startPrerender]);

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
            onShared={closeInstructions}
            onFallback={handleFallbackDownload}
            onDismiss={closeInstructions}
          />
        ) : (
          <DownloadInstructions
            shareInfo={shareInfo}
            exportType={exportType}
            onDismiss={closeInstructions}
          />
        ),
        document.body
      )}
    </div>
  );
};
