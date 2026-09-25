export default function AdminPage() {
  return (
    <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        Dashboard admin
      </p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">
        Tổng quan quản trị
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Khung dashboard admin đã sẵn sàng. Bước tiếp theo có thể thay menu tĩnh
        bằng API navigation theo RBAC.
      </p>
    </section>
  );
}
