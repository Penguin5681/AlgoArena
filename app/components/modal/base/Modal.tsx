import React, { useEffect, useRef } from 'react';
import styles from '../css/Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  width = '500px'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div 
        className={styles.modalContainer} 
        ref={modalRef}
        style={{ maxWidth: width }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;