import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { MAIN_NAVIGATION } from "@/config/navigation";

export function Navigation({ catalogMenu }: { catalogMenu: ReactNode }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="hidden bg-navy text-navy-foreground md:block"
    >
      <Container className="flex h-10 items-stretch">
        {catalogMenu}

        <div aria-hidden="true" className="w-10 shrink-0 lg:w-14" />

        <ul className="flex min-w-0 items-stretch">
          {MAIN_NAVIGATION.map((item) => (
            <li key={item.href}>
              <Link
                aria-current={item.isActive ? "page" : undefined}
                className={`flex h-full items-center gap-2 whitespace-nowrap px-2 text-xs font-semibold transition-colors hover:bg-surface/10 lg:px-5 lg:text-sm ${
                  item.isActive ? "bg-surface/10" : ""
                }`}
                href={item.href}
              >
                {item.isActive ? (
                  <svg
                    aria-hidden="true"
                    className="size-4 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />
                  </svg>
                ) : null}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
