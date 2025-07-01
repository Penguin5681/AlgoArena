import React, { ButtonHTMLAttributes, ReactNode } from "react";
import styles from '../css/GradientButton.module.css';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export default function GradientButton({
  children,
  onClick,
  ...rest
}: GradientButtonProps): React.JSX.Element {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}