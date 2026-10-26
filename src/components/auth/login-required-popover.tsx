"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { Popover } from "radix-ui";
import {
  cloneElement,
  useId,
  useState,
  type MouseEvent,
  type MouseEventHandler,
  type ReactElement,
} from "react";

import { Button } from "@/components/ui/button";
import { withReturnTo } from "@/utils/return-to";

type ActionPromptPopoverProps = {
  actionHref: string;
  actionLabel: string;
  children: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }>;
  closeLabel?: string;
  message: string;
  returnTo?: string;
};

export function ActionPromptPopover({
  actionHref,
  actionLabel,
  children,
  closeLabel = "Bỏ qua",
  message,
  returnTo,
}: ActionPromptPopoverProps) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState(returnTo);
  const titleId = useId();

  function triggerPrompt(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDestination(
      returnTo ??
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
    setOpen((current) => !current);
  }

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        {cloneElement(children, { onClick: triggerPrompt })}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          aria-labelledby={titleId}
          className="z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-[#262626] p-4 text-white shadow-lg outline-none"
          collisionPadding={16}
          side="top"
          sideOffset={10}
        >
          <p className="pr-6 text-sm font-semibold leading-5" id={titleId}>
            {message}
          </p>
          <Popover.Close asChild>
            <button
              aria-label="Đóng thông báo"
              className="absolute right-3 top-3 inline-flex size-6 cursor-pointer items-center justify-center rounded text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </Popover.Close>
          <div className="mt-4 flex justify-end gap-2">
            <Popover.Close asChild>
              <Button size="sm" type="button" variant="secondary">
                {closeLabel}
              </Button>
            </Popover.Close>
            <Button asChild size="sm">
              <Link href={withReturnTo(actionHref, destination)}>
                {actionLabel}
              </Link>
            </Button>
          </div>
          <Popover.Arrow className="fill-[#262626]" height={7} width={14} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export type LoginRequiredPopoverProps = {
  isAuthenticated: boolean;
  isProfileCompleted?: boolean;
  children: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }>;
  message?: string;
  profileMessage?: string;
  returnTo?: string;
};

export function LoginRequiredPopover({
  isAuthenticated,
  isProfileCompleted,
  children,
  message = "Đăng nhập để tiếp tục thuê thiết bị",
  profileMessage = "Cần cập nhật hồ sơ để có thể thuê thiết bị",
  returnTo,
}: LoginRequiredPopoverProps) {
  if (!isAuthenticated) {
    return (
      <ActionPromptPopover
        actionHref="/login"
        actionLabel="Đăng nhập"
        message={message}
        returnTo={returnTo}
      >
        {children}
      </ActionPromptPopover>
    );
  }

  if (isProfileCompleted === false) {
    return (
      <ActionPromptPopover
        actionHref="/account"
        actionLabel="Cập nhật hồ sơ"
        message={profileMessage}
        returnTo={returnTo}
      >
        {children}
      </ActionPromptPopover>
    );
  }

  return children;
}

export type ProfileRequiredPopoverProps = {
  isProfileCompleted: boolean;
  children: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }>;
  message?: string;
  returnTo?: string;
};

export function ProfileRequiredPopover({
  isProfileCompleted,
  children,
  message = "Cần cập nhật hồ sơ để có thể thuê thiết bị",
  returnTo,
}: ProfileRequiredPopoverProps) {
  if (isProfileCompleted) return children;

  return (
    <ActionPromptPopover
      actionHref="/account"
      actionLabel="Cập nhật hồ sơ"
      message={message}
      returnTo={returnTo}
    >
      {children}
    </ActionPromptPopover>
  );
}
