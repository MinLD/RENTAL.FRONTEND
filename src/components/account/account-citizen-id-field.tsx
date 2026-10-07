"use client";

import { Eye, EyeOff, IdCard, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { getCurrentUserCitizenId } from "@/services/account-service";
import { ApiError } from "@/services/api-error";

type AccountCitizenIdFieldProps = {
  initialValue: string;
  error?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
};

export function AccountCitizenIdField({
  initialValue,
  error,
  disabled,
  onValueChange,
}: AccountCitizenIdFieldProps) {
  const [draft, setDraft] = useState(initialValue);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [revealError, setRevealError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const isEdited = draft !== initialValue;

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, []);

  async function toggleVisibility() {
    if (disabled || requestRef.current) return;
    setRevealError("");
    if (isVisible) {
      setIsVisible(false);
      setRevealedValue(null);
      return;
    }
    // A newly typed value is already available locally; only fetch the saved ID.
    if (isEdited) {
      setIsVisible(true);
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);
    try {
      const citizenId = await getCurrentUserCitizenId(controller.signal);
      if (controller.signal.aborted) return;
      setRevealedValue(citizenId);
      setIsVisible(true);
    } catch (error) {
      if (controller.signal.aborted) return;
      setRevealError(
        error instanceof ApiError
          ? error.status === 401
            ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            : "Không thể xem CCCD/CMND. Vui lòng thử lại."
          : error instanceof Error && !(error instanceof TypeError)
            ? error.message
            : "Không thể xem CCCD/CMND. Vui lòng thử lại.",
      );
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsLoading(false);
      }
    }
  }

  function handleChange(value: string) {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsLoading(false);
    setRevealedValue(null);
    setRevealError("");
    setDraft(value);
    if (!isEdited && !isVisible) setIsVisible(true);
    onValueChange(value);
  }

  return (
    <>
      <TextField
        autoComplete="off"
        disabled={disabled}
        error={error || revealError}
        id="identityNumber"
        inputMode="numeric"
        label="CCCD/CMND"
        leftIcon={<IdCard size={16} />}
        maxLength={12}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Chưa cập nhật"
        rightElement={
          <Button
            aria-controls="identityNumber"
            aria-label={
              isLoading
                ? "Đang tải CCCD/CMND"
                : isVisible
                  ? "Ẩn số CCCD/CMND"
                  : "Hiện số CCCD/CMND"
            }
            aria-pressed={isVisible}
            disabled={disabled || isLoading || !draft.trim()}
            onClick={() => void toggleVisibility()}
            size="icon"
            type="button"
            variant="default"
          >
            {isLoading ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : isVisible ? (
              <EyeOff aria-hidden="true" size={16} />
            ) : (
              <Eye aria-hidden="true" size={16} />
            )}
          </Button>
        }
        type={isEdited && !isVisible ? "password" : "text"}
        value={isVisible && !isEdited ? (revealedValue ?? draft) : draft}
      />
      {/* Viewing an existing ID must not submit it as a profile edit. */}
      <input name="identityNumber" type="hidden" value={draft} />
    </>
  );
}
