"use client";

import React from 'react';
import Editor from '@monaco-editor/react';
import styles from './MonacoEditor.module.css';

interface MonacoEditorProps {
  language: string;
  value: string;
  onCodeChange: (code: string) => void;
  onFocus?: () => void;
}

export default function MonacoEditor({ language, value, onCodeChange, onFocus }: MonacoEditorProps) {
  return (
    <div className={styles.editorContainer}>
      <Editor
        height="400px"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(newValue) => onCodeChange(newValue || '')}
        onMount={(editor) => {
          if (onFocus) {
            editor.onDidFocusEditorWidget(() => onFocus());
          }
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Fira Code, Courier New, Courier, monospace',
          scrollBeyondLastLine: false,
          padding: {
            top: 16,
            bottom: 16
          },
          automaticLayout: true,
        }}
      />
    </div>
  );
}