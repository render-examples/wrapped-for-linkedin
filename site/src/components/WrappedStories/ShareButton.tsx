import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { exportCardAsImage } from '@exports/imageExport';
import { buildCardsPDF } from '@exports/pdfExport';
import { getPostImage } from '@exports/postScreenshot';
import {
  DownloadInstructions,
  type ExportType,
} from '@components/WrappedStories/DownloadInstructions';
import { NativeSharePrompt } from '@components/WrappedStories/NativeSharePrompt';
import {
  canShareFiles,
  dataUrlToFile,
  downloadFile,
  getShareMode,
  shareFile,
  type ShareMode,
} from '@utils/webShare';
import { buildShareText } from '@utils/linkedinShareLink';
import { Icon } from '@components/Icon';
import { getMenuPosition, type MenuPosition } from '@components/WrappedStories/menuPosition';
import type { ShareableCard, ShareInfo } from '@/types/wrappedStories';
import '@styles/ShareButton.css';

interface ShareButtonProps {
  card: ShareableCard;
  cardRef: React.RefObject<HTMLDivElement | null>;
  allCardRefs: React.RefObject<HTMLDivElement | null>[];
  shareInfo: ShareInfo;
  onPauseAutoPlay: () => void;
}

type CardFile = { cardId: string; file: File };

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
  const [dropdownPosition, setDropdownPosition] = useState<MenuPosition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  // On phones, the PNG renders when the menu opens, so the PNG tap can open the share sheet at once.
  // Both values store the card ID. Each use checks it, so a file for another card is never shared.
  const [prerendered, setPrerendered] = useState<CardFile | null>(null);
  const prerenderRef = useRef<{ cardId: string; promise: Promise<File> } | null>(null);

  // Move focus into the menu when it opens, so keyboard users can reach the options.
  // The menu is in a portal at the end of the page, so Tab from the button does not reach it.
  useEffect(() => {
    if (isDropdownOpen) {
      dropdownRef.current?.querySelector('button')?.focus();
    }
  }, [isDropdownOpen]);

  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);

  // Close the menu on Escape and return focus to the share button.
  // Stop the event, so the story viewer does not also handle it.
  const handleMenuKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      setIsDropdownOpen(false);
      buttonRef.current?.focus();
    }
  }, []);

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
      },
    );
  }, [card.id, renderCardFile]);

  /**
   * Close the menu and clear the last error before an export or a share.
   */
  const beginExport = useCallback((type: ExportType) => {
    setError(null);
    setIsDropdownOpen(false);
    setExportType(type);
  }, []);

  /**
   * Run an export, show the spinner while it runs, and deliver the file.
   * The task throws to show an error message.
   */
  const runExport = useCallback(
    async (type: ExportType, task: () => Promise<File>, fallbackMessage: string) => {
      beginExport(type);
      setIsExporting(true);
      try {
        deliverFile(await task());
      } catch (err) {
        setError(err instanceof Error ? err.message : fallbackMessage);
        console.error('Export failed:', err);
      } finally {
        setIsExporting(false);
      }
    },
    [beginExport, deliverFile],
  );

  const handlePNGExport = useCallback(async () => {
    // Call share before any await. Browsers allow a share only during or just after a tap.
    if (prerendered?.cardId === card.id) {
      const file = prerendered.file;
      beginExport('current-card');
      const result = await shareFile(file, buildShareText(shareInfo));
      if (result === 'failed') {
        setExportedFile(file);
        setShareMode('native');
        setShowInstructions(true);
      }
      return;
    }

    const pending = prerenderRef.current?.cardId === card.id ? prerenderRef.current.promise : null;
    await runExport('current-card', () => pending ?? renderCardFile(), 'Failed to export card');
  }, [card.id, prerendered, shareInfo, beginExport, renderCardFile, runExport]);

  /**
   * Export all cards as one PDF.
   */
  const handlePDFExport = useCallback(async () => {
    await runExport(
      'all-cards',
      async () => {
        const cardElements = allCardRefs
          .map((ref) => ref.current)
          .filter((element) => element !== null);
        if (cardElements.length === 0) {
          throw new Error('Card elements not found. Make sure cards are displayed first.');
        }
        const postImage = shareInfo.topPostUrl ? await getPostImage(shareInfo.topPostUrl) : null;
        const pdf = await buildCardsPDF(cardElements, { postImage });
        return new File([pdf], `wrapped_${shareInfo.year}.pdf`, { type: 'application/pdf' });
      },
      'Failed to export PDF',
    );
  }, [allCardRefs, shareInfo, runExport]);

  const handleToggleDropdown = useCallback(() => {
    if (isExporting) {
      return;
    }
    if (!isDropdownOpen) {
      if (buttonRef.current) {
        setDropdownPosition(
          getMenuPosition(buttonRef.current.getBoundingClientRect(), window.innerWidth),
        );
      }
      setError(null);
      onPauseAutoPlay();
      if (canShareFiles()) {
        startPrerender();
      }
    }
    setIsDropdownOpen((prev) => !prev);
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
          aria-controls={isDropdownOpen ? menuId : undefined}
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
      {isDropdownOpen &&
        !isExporting &&
        createPortal(
          <>
            <div className="share-dropdown-backdrop" onClick={closeDropdown} />
            <div
              id={menuId}
              className="share-dropdown-menu"
              style={dropdownPosition ?? undefined}
              ref={dropdownRef}
              onKeyDown={handleMenuKeyDown}
            >
              <button className="dropdown-option" onClick={handlePNGExport}>
                <img src="/images/share/png-file.png" alt="PNG" className="option-icon" />
                <div className="option-content">
                  <div className="option-title">PNG</div>
                  <div className="option-description">Export current card as a PNG</div>
                </div>
              </button>

              <button className="dropdown-option" onClick={handlePDFExport}>
                <img src="/images/share/pdf-file.png" alt="PDF" className="option-icon" />
                <div className="option-content">
                  <div className="option-title">PDF</div>
                  <div className="option-description">Export all cards as a single PDF</div>
                </div>
              </button>
            </div>
          </>,
          document.body,
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
      {showInstructions &&
        createPortal(
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
          document.body,
        )}
    </div>
  );
};
