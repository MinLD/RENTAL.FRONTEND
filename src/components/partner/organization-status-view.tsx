"use client";

import { authPageHref } from "@/utils/auth-redirect";

import {
  Check,
  CircleAlert,
  Copy,
  FileClock,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { refreshSession } from "@/services/auth-service";
import {
  ORGANIZATION_STATUS,
  type OrganizationApplication,
} from "@/types/organization";
import { cn } from "@/utils/cn";

type OrganizationStatusViewProps = {
  organization: OrganizationApplication;
  isRefreshing?: boolean;
  error?: string;
  onRefresh: () => void;
  onEdit: () => void;
};

const STATUS_CONTENT = {
  pending: {
    icon: FileClock,
    label: "Đang xét duyệt",
    title: "Đã gửi hồ sơ",
    subtitle: "Hồ sơ của bạn đang được xét duyệt",
    description:
      "DPU Rental sẽ kiểm tra thông tin doanh nghiệp và giấy phép kinh doanh trước khi kích hoạt tài khoản nhà cung cấp.",
    color: "text-primary",
  },
  active: {
    icon: ShieldCheck,
    label: "Đã được duyệt",
    title: "Hồ sơ đã được duyệt",
    subtitle: "Tổ chức của bạn đã được kích hoạt",
    description:
      "Bạn có thể tiếp tục sử dụng tài khoản nhà cung cấp đã được phê duyệt.",
    color: "text-success",
  },
  rejected: {
    icon: CircleAlert,
    label: "Bị từ chối",
    title: "Hồ sơ bị từ chối",
    subtitle: "Vui lòng chỉnh sửa thông tin và gửi lại hồ sơ",
    description:
      "Bạn có thể cập nhật và gửi lại hồ sơ hiện tại để được xét duyệt.",
    color: "text-error",
  },
  suspended: {
    icon: ShieldOff,
    label: "Tạm ngưng",
    title: "Tổ chức đang tạm ngưng",
    subtitle: "Vui lòng liên hệ hỗ trợ để được hướng dẫn",
    description:
      "Hồ sơ tổ chức của bạn vẫn được lưu. Liên hệ hỗ trợ để tìm hiểu nguyên nhân và cách xử lý.",
    color: "text-error",
  },
  unknown: {
    icon: CircleAlert,
    label: "Trạng thái chưa xác định",
    title: "Chưa thể hiển thị trạng thái hồ sơ",
    subtitle: "Vui lòng kiểm tra lại trạng thái hoặc liên hệ hỗ trợ",
    description:
      "Hồ sơ của bạn đã tồn tại. Hệ thống cần xác nhận trạng thái trước khi bạn tiếp tục.",
    color: "text-primary",
  },
};

export function OrganizationStatusView({
  organization,
  isRefreshing,
  error,
  onRefresh,
  onEdit,
}: OrganizationStatusViewProps) {
  const router = useRouter();
  const [isCopying, setIsCopying] = useState(false);
  const [isEnteringOw, setIsEnteringOw] = useState(false);
  const isPending = organization.status === ORGANIZATION_STATUS.pending;
  const isActive = organization.status === ORGANIZATION_STATUS.active;
  const isRejected = organization.status === ORGANIZATION_STATUS.rejected;
  // Deployed Swagger uses 3; accept 4 for compatibility with the supplied contract.
  const isSuspended =
    organization.status === ORGANIZATION_STATUS.suspended ||
    organization.status === 4;
  const content = isPending
    ? STATUS_CONTENT.pending
    : isActive
      ? STATUS_CONTENT.active
      : isRejected
        ? STATUS_CONTENT.rejected
        : isSuspended
          ? STATUS_CONTENT.suspended
          : STATUS_CONTENT.unknown;
  const Icon = content.icon;
  const submittedAt = organization.submittedAtUtc || organization.createdAtUtc;
  const submittedDate = submittedAt ? new Date(submittedAt) : null;
  const formattedDate =
    submittedDate && !Number.isNaN(submittedDate.getTime())
      ? new Intl.DateTimeFormat("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(submittedDate)
      : null;

  async function copyId() {
    if (isCopying) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(organization.id);
      toast.success("Đã sao chép ID hồ sơ.");
    } catch {
      toast.error(
        "Không thể sao chép. Bạn có thể chọn và sao chép ID đầy đủ trong thông tin hồ sơ.",
      );
    } finally {
      setIsCopying(false);
    }
  }

  async function enterOwPortal() {
    if (isEnteringOw) return;

    setIsEnteringOw(true);

    try {
      await refreshSession();
      router.push("/own");
      router.refresh();
    } catch {
      toast.error("Phiên đăng nhập cần được cập nhật. Vui lòng đăng nhập lại.");
      router.push(authPageHref("/login", "/own"));
    } finally {
      setIsEnteringOw(false);
    }
  }

  return (
    <section
      aria-labelledby="organization-status-heading"
      className="mx-auto flex min-h-[560px] max-w-lg flex-col items-center pb-16 pt-8 text-center sm:pt-12"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-8 stroke-[1.5]", content.color)}
      />
      <h1
        aria-live="polite"
        className="mt-8 text-2xl font-bold tracking-tight text-foreground"
        id="organization-status-heading"
      >
        {content.title}
      </h1>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {content.subtitle}
      </p>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {content.description}
      </p>

      {(isPending || isActive) && (
        <ol
          aria-label="Tiến trình xét duyệt hồ sơ"
          className="relative mt-9 grid w-full max-w-sm grid-cols-3"
        >
          <li
            aria-hidden="true"
            className="absolute left-[16.67%] right-[16.67%] top-3.5 h-px bg-border"
          >
            <span
              className={cn(
                "block h-full",
                isActive ? "w-full bg-success" : "w-1/2 bg-success",
              )}
            />
          </li>
          {["Đã gửi hồ sơ", "Đang xét duyệt", "Kích hoạt NCC"].map(
            (label, index) => {
              const completed = index === 0 || isActive;
              const current = isPending && index === 1;
              return (
                <li
                  aria-current={
                    current || (isActive && index === 2) ? "step" : undefined
                  }
                  className="relative flex flex-col items-center gap-2"
                  key={label}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full border bg-background",
                      completed
                        ? "border-success bg-success text-white"
                        : current
                          ? "border-primary text-primary"
                          : "border-border bg-slate-50 text-slate-300",
                    )}
                  >
                    {completed ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      <span
                        className={cn(
                          "size-2.5 rounded-full",
                          current ? "bg-primary" : "bg-slate-300",
                        )}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs",
                      completed || current
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            },
          )}
        </ol>
      )}

      <div className="mt-10 w-full max-w-md rounded-xl border border-border/60 p-5 text-left sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">
          Thông tin hồ sơ
        </h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">ID hồ sơ</dt>
            <dd className="flex items-center gap-1.5">
              <code
                className="rounded border border-border/60 px-2 py-1 text-xs font-semibold"
                title={organization.id}
              >
                {organization.id.length > 14
                  ? `${organization.id.slice(0, 6)}…${organization.id.slice(-4)}`
                  : organization.id}
              </code>
              <Button
                aria-label="Sao chép ID hồ sơ đầy đủ"
                className="size-8"
                disabled={isCopying}
                onClick={() => void copyId()}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Copy aria-hidden="true" className="size-3.5" />
              </Button>
            </dd>
          </div>
          {formattedDate && (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Ngày gửi</dt>
              <dd className="text-foreground">{formattedDate}</dd>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Trạng thái</dt>
            <dd
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold",
                content.color,
              )}
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-current"
              />
              {content.label}
            </dd>
          </div>
        </dl>

        {isRejected && organization.rejectionReason && (
          <div className="mt-5 rounded-lg bg-error/5 p-3 text-sm">
            <p className="font-semibold text-error">Lý do từ chối</p>
            <p className="mt-1 whitespace-pre-wrap break-words leading-6 text-foreground">
              {organization.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 max-w-md text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {isRejected && (
          <Button disabled={isRefreshing} onClick={onEdit} type="button">
            Chỉnh sửa và gửi lại hồ sơ
          </Button>
        )}
        {isActive && (
          <Button
            disabled={isEnteringOw}
            onClick={() => {
              void enterOwPortal();
            }}
            type="button"
          >
            {isEnteringOw ? "Đang vào trang quản lý..." : "Vào trang quản lý"}
          </Button>
        )}
        {isSuspended && (
          <Button asChild>
            <a href="mailto:hotro@dprental.vn">Liên hệ hỗ trợ</a>
          </Button>
        )}
        <Button
          disabled={isRefreshing}
          onClick={onRefresh}
          size="sm"
          type="button"
          variant="ghost"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn("size-3.5", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? "Đang kiểm tra..." : "Kiểm tra lại trạng thái"}
        </Button>
      </div>
    </section>
  );
}
