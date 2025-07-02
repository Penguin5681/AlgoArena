import React from 'react';
import styles from '../css/GoogleButton.module.css';
import Image from 'next/image';

interface GoogleButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

const GoogleButton: React.FC<GoogleButtonProps> = ({ onClick, disabled = false }) => {
    return (
        <button 
            className={styles.button} 
            onClick={onClick}
            disabled={disabled}
            type="button"
        >
            <div className={styles.iconWrapper}>
                <Image 
                    src="/google.png" 
                    alt="Google Icon" 
                    width={20} 
                    height={20} 
                    className={styles.googleIcon}
                />
            </div>
            <span>Continue with Google</span>
        </button>
    );
};

export default GoogleButton;