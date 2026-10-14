"use client";

import { EmptyState } from "@/components/empty-state";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function ProductDetailError({ retry }: { retry: () => void }) {
  return (
    <Container className="py-12">
      <EmptyState
        title="Không thể tải chi tiết thiết bị"
        description="Vui lòng thử lại sau ít phút."
        role="alert"
        action={<Button onClick={retry}>Thử lại</Button>}
      />
    </Container>
  );
}
