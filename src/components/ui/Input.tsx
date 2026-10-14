import React from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: string | React.ReactNode;
  rightAddon?: string | React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftAddon, rightAddon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`${styles.wrapper} ${className}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={`${styles.inputContainer} ${error ? styles.hasError : ""}`}>
          {leftAddon && <span className={styles.addonLeft}>{leftAddon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`${styles.input} ${leftAddon ? styles.hasLeftAddon : ""} ${
              rightAddon ? styles.hasRightAddon : ""
            }`}
            {...props}
          />
          {rightAddon && <span className={styles.addonRight}>{rightAddon}</span>}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
        {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
