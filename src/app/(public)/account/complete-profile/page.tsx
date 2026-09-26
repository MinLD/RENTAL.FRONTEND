import Link from "next/link";

import { CompleteProfileForm } from "@/components/account/complete-profile-form";
import { Container } from "@/components/layout/container";
import { getCurrentUser } from "@/services/session-service";

export default async function CompleteProfilePage() {
  const user = (await getCurrentUser()) ?? {
    email: "",
    id: "",
    isProfileCompleted: false,
    name: "",
    roleLabel: "Tài khoản",
  };

  return (
    <div className="flex flex-1 flex-col bg-[#f5f7fa] py-6">
      <Container>
        <nav
          aria-label="Breadcrumb"
          className="mb-5 text-xs text-muted-foreground"
        >
          <Link className="transition-colors hover:text-primary" href="/">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <span className="font-medium text-foreground">
            Hoàn thiện hồ sơ
          </span>
        </nav>

        <CompleteProfileForm user={user} />
      </Container>
    </div>
  );
}
