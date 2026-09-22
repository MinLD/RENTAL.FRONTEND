export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fa] px-6 py-10">
      <section className="mx-auto w-full max-w-6xl rounded border border-border bg-background p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          DPRENTAL Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Trang quản trị
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Khu vực dành cho tài khoản có role admin. Nội dung dashboard sẽ được
          bổ sung ở các task tiếp theo.
        </p>
      </section>
    </main>
  );
}
