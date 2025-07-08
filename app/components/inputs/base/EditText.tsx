import styles from "../css/EditText.module.css";
import React, { useState } from "react";
import Image from "next/image";

interface EditTextProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "password";
  name?: string;
  onBlur?: () => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const EditText: React.FC<EditTextProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  onBlur,
  name,
  onKeyPress,
  onKeyDown,
  onKeyUp,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleMouseDown = () => {
    setIsPasswordVisible(true);
  };

  const handleMouseUp = () => {
    setIsPasswordVisible(false);
  };

  const inputType =
    type === "password" && !isPasswordVisible ? "password" : "text";

  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.inputLabel}>{label}</label>}
      <div className={styles.inputBox}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          onBlur={onBlur}
          onKeyPress={onKeyPress}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          className={styles.inputField}
        />
        {type === "password" && (
          <button
            type={"button"}
            className={styles.eyeButton}
            onMouseUp={handleMouseUp}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseUp}
          >
            <Image src={"/eye.png"} alt={"Eye Icon"} width={24} height={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default EditText;
