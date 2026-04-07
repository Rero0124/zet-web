"use client";

import { MentionEditor } from "./mention-editor";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function MentionTextarea({ value, onChange, placeholder, className }: MentionTextareaProps) {
  return (
    <MentionEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      multiline
    />
  );
}
