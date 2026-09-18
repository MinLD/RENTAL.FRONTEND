import Link from "next/link";

import { Container } from "@/components/layout/container";
import { MAIN_NAVIGATION } from "@/config/navigation";

export function Navigation() {
  return (
    <nav aria-label="Điều hướng chính" className="hidden bg-navy text-navy-foreground md:block">
      <Container className="flex h-10 items-stretch">
        <button
          className="inline-flex shrink-0 items-center gap-2 bg-primary px-3 text-xs font-semibold text-primary-foreground lg:px-5"
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M5 7h14M5 12h14M5 17h14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
          DANH MỤC THIẾT BỊ
          <svg
            aria-hidden="true"
            className="size-3"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m7 10 5 5 5-5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

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
