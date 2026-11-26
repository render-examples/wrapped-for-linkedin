import React, { useEffect, useId, useRef } from 'react';
import { ShareModalHeader } from '@components/WrappedStories/ShareModalHeader';
import '@styles/ShareModal.css';

interface ShareModalProps {
  title: string;
  closeLabel: string;
  onDismiss: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * A modal for the share flow. It uses a native dialog, so the browser traps focus,
 * makes the page behind it inert, and closes it on Escape.
 */
export const ShareModal: React.FC<ShareModalProps> = ({
  title,
  closeLabel,
  onDismiss,
  className,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Stop Escape here, so the story viewer does not also handle it.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={className ? `share-modal ${className}` : 'share-modal'}
      aria-labelledby={titleId}
      onClose={onDismiss}
      onKeyDown={handleKeyDown}
    >
      <ShareModalHeader
        title={title}
        titleId={titleId}
        closeLabel={closeLabel}
        onDismiss={onDismiss}
      />
      {children}
    </dialog>
  );
};
