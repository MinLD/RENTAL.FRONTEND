import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <Container className="py-12">
      <EmptyState
        title="Không tìm thấy thiết bị"
        description="Thiết bị hiện không còn được công khai hoặc đường dẫn chưa chính xác."
        action={
          <Button asChild variant="secondary">
            <Link href="/products">Xem thiết bị khác</Link>
          </Button>
        }
      />
    </Container>
  );
}
