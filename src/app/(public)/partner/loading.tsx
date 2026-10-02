import { LoaderCircle } from "lucide-react";

export default function PartnerLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-[560px] flex-1 flex-col items-center justify-center gap-3 py-16"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Đang kiểm tra hồ sơ...</p>
    </div>
  );
}
