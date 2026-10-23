"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { Popover } from "radix-ui";
import { cloneElement, useId, useState, type MouseEvent, type MouseEventHandler, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { withReturnTo } from "@/utils/return-to";

type LoginRequiredPopoverProps = {
  isAuthenticated: boolean;
  children: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }>;
  message?: string;
  returnTo?: string;
};

// Keep the original action intact for signed-in users. Guest-only state is
// unmounted when the session changes, so a dismissed prompt cannot reappear.
export function LoginRequiredPopover({ isAuthenticated, ...props }: LoginRequiredPopoverProps) {
  return isAuthenticated ? props.children : <GuestLoginPopover {...props} />;
}

function GuestLoginPopover({
  children,
  message = "Đăng nhập để tiếp tục",
  returnTo,
}: Omit<LoginRequiredPopoverProps, "isAuthenticated">) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState(returnTo);
  const titleId = useId();

  function requestLogin(event: MouseEvent<HTMLElement>) {
    // Replace the action rather than invoking its original click handler.
    // preventDefault also blocks navigation and form submission for guests.
    event.preventDefault();
    event.stopPropagation();
    setDestination(returnTo ?? `${window.location.pathname}${window.location.search}${window.location.hash}`);
    setOpen((current) => !current);
  }

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        {cloneElement(children, { onClick: requestLogin })}
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
          <p className="pr-6 text-sm font-semibold leading-5" id={titleId}>{message}</p>
          <Popover.Close asChild>
            <button
              aria-label="Đóng thông báo đăng nhập"
              className="absolute right-3 top-3 inline-flex size-6 cursor-pointer items-center justify-center rounded text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </Popover.Close>
          <div className="mt-4 flex justify-end gap-2">
            <Popover.Close asChild><Button size="sm" type="button" variant="secondary">Bỏ qua</Button></Popover.Close>
            <Button asChild size="sm"><Link href={withReturnTo("/login", destination)}>Đăng nhập</Link></Button>
          </div>
          <Popover.Arrow className="fill-[#262626]" height={7} width={14} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
