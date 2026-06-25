import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  /** When provided, the modal can be dismissed via ESC and overlay click. */
  onClose?: () => void;
  /** Extra class for the dialog box, e.g. a width modifier. */
  className?: string;
  children: ReactNode;
}

export function Modal({ title, onClose, className, children }: ModalProps) {
  useEffect(() => {
    if (!onClose) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="modal__title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
