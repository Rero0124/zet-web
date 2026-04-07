"use client";

import { MentionEditor } from "./mention-editor";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({ value, onChange, onSubmit, placeholder, className }: MentionInputProps) {
  return (
    <MentionEditor
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      placeholder={placeholder}
      className={className}
      multiline={false}
    />
  );
}
