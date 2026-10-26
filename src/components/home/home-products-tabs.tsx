"use client";

import { Tabs } from "radix-ui";
import type { ReactNode } from "react";

import { HOME_PRODUCTS_TABS } from "@/config/homepage";
import { HomeProductsFeed } from "./home-products-feed";

export function HomeProductsTabs({ children, userId }: { children: ReactNode; userId: string | null }) {
  return (
    <Tabs.Root defaultValue="recommended">
      <Tabs.List
        aria-label="Danh sách thiết bị"
        className="sticky top-[var(--site-header-height,6rem)] z-20 mb-4 flex gap-6 bg-background"
      >
        {HOME_PRODUCTS_TABS.map((tab) => (
          <Tabs.Trigger
            className="cursor-pointer border-b-2 border-transparent py-3 text-xs font-bold uppercase text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:border-primary data-[state=active]:text-primary sm:py-4 sm:text-sm"
            key={tab.value}
            value={tab.value}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content className="outline-none focus-visible:ring-2 focus-visible:ring-primary" value="recommended">
        {children}
      </Tabs.Content>
      <Tabs.Content className="outline-none focus-visible:ring-2 focus-visible:ring-primary" value="created_desc">
        <HomeProductsFeed sort="created_desc" userId={userId} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
