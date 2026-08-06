"use client";

import { useRef, useState } from "react";

export default function RoomCodeInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const characters = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  const updateValue = (nextValue: string) => {
    onChange(nextValue.replace(/\D/g, "").slice(0, 6));
  };

  return (
    <div
      className={`glitcher-code-field ${focused ? "is-focused" : ""} ${hasError ? "has-error" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => updateValue(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          updateValue(event.clipboardData.getData("text"));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        aria-label="Mã phòng gồm sáu chữ số"
        aria-invalid={hasError}
        className="glitcher-code-field__input"
      />

      <div className="glitcher-code-field__cells" aria-hidden="true">
        {characters.map((character, index) => (
          <span
            key={index}
            className={`glitcher-code-cell ${
              character ? "is-filled" : index === value.length && focused ? "is-current" : ""
            }`}
          >
            {character || "·"}
          </span>
        ))}
      </div>
    </div>
  );
}

