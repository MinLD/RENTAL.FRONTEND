"use client";

import { forwardRef } from "react";

import { TextField, type TextFieldProps } from "@/components/forms/text-field";
import {
  formatMoneyInput,
  getMoneyInputCaret,
  parseMoneyInput,
} from "@/utils/money-input";

type MoneyFieldProps = Omit<
  TextFieldProps,
  "inputMode" | "onChange" | "onKeyDown" | "type" | "value"
> & {
  onChange: (value: string) => void;
  value: string;
};

export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(
  ({ onChange, value, ...props }, ref) => {
    function updateValue(
      input: HTMLInputElement,
      displayedValue: string,
      caret: number,
    ) {
      const parsed = parseMoneyInput(displayedValue);
      if (parsed === null) {
        input.value = formatMoneyInput(value);
        return;
      }
      const characterCount = displayedValue
        .slice(0, caret)
        .replace(/[.\s]/g, "").length;
      const formatted = formatMoneyInput(parsed);
      const nextCaret = getMoneyInputCaret(formatted, characterCount);
      onChange(parsed);
      input.value = formatted;
      input.setSelectionRange(nextCaret, nextCaret);
      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          input.setSelectionRange(nextCaret, nextCaret);
        }
      });
    }

    return (
      <TextField
        {...props}
        inputMode="decimal"
        onChange={(event) =>
          updateValue(
            event.currentTarget,
            event.currentTarget.value,
            event.currentTarget.selectionStart ??
              event.currentTarget.value.length,
          )
        }
        onKeyDown={(event) => {
          const input = event.currentTarget;
          const caret = input.selectionStart;
          if (caret === null || caret !== input.selectionEnd) return;
          let removedIndex: number | null = null;
          if (
            event.key === "Backspace" &&
            caret > 1 &&
            input.value[caret - 1] === "."
          ) {
            removedIndex = caret - 2;
          } else if (event.key === "Delete" && input.value[caret] === ".") {
            removedIndex = caret + 1;
          }
          if (removedIndex === null) return;
          event.preventDefault();
          const nextValue =
            input.value.slice(0, removedIndex) +
            input.value.slice(removedIndex + 1);
          updateValue(
            input,
            nextValue,
            event.key === "Backspace" ? removedIndex : caret,
          );
        }}
        ref={ref}
        type="text"
        value={formatMoneyInput(value)}
      />
    );
  },
);

MoneyField.displayName = "MoneyField";
