"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type HomeLinkProps = Omit<
  ComponentProps<typeof Link>,
  "href" | "onNavigate" | "prefetch"
>;

export function HomeLink(props: HomeLinkProps) {
  return (
    <Link
      {...props}
      href="/"
      prefetch={false}
      onNavigate={(event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (
          window.location.pathname === "/" &&
          !window.location.search &&
          !window.location.hash
        ) {
          window.location.reload();
        } else {
          window.location.assign(window.location.origin);
        }
      }}
    />
  );
}
