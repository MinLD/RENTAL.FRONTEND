export default function CompanyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fa] px-6 py-10">
      <section className="mx-auto w-full max-w-6xl rounded border border-border bg-background p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          DPRENTAL Company
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Trang công ty
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Khu vực dành cho tài khoản công ty quản lý nhu cầu thuê thiết bị.
          Nội dung chi tiết sẽ được bổ sung ở các task tiếp theo.
        </p>
      </section>
    </main>
  );
}
