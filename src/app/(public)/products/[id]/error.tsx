"use client";

import { ErrorState } from "@/components/error-state";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function ProductDetailError({ retry }: { retry: () => void }) {
  return (
    <Container className="py-12">
      <ErrorState
        title="Không thể tải chi tiết thiết bị"
        description="Vui lòng thử lại sau ít phút."
        action={<Button onClick={retry}>Thử lại</Button>}
      />
    </Container>
  );
}
