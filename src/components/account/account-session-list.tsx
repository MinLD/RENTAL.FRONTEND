"use client";

import { Clock3, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { formatDateTime } from "@/components/account/account-utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getUserSessions, revokeUserSession } from "@/services/account-service";
import type { UserSessionResponse } from "@/types/auth";

type AccountSessionListProps = {
  initialSessions: UserSessionResponse[];
};

export function AccountSessionList({
  initialSessions,
}: AccountSessionListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );
  const [pendingRevokeSession, setPendingRevokeSession] =
    useState<UserSessionResponse | null>(null);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);
  const activeSessionsCount = sessions.filter(
    (session) => session.isActive,
  ).length;

  async function refreshSessions() {
    setIsRefreshingSessions(true);

    try {
      setSessions(await getUserSessions());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách phiên đăng nhập.",
      );
    } finally {
      setIsRefreshingSessions(false);
    }
  }

  async function handleRevokeSession(session: UserSessionResponse) {
    if (session.isCurrent) {
      toast.info("Không thu hồi phiên hiện tại tại màn hình này.");

      return;
    }

    setRevokingSessionId(session.id);

    try {
      await revokeUserSession(session.id);
      toast.success("Đã thu hồi phiên đăng nhập.");
      setSessions((currentSessions) =>
        currentSessions.filter(
          (currentSession) => currentSession.id !== session.id,
        ),
      );
      setPendingRevokeSession(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể thu hồi phiên đăng nhập.",
      );
    } finally {
      setRevokingSessionId(null);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Thiết bị đang đăng nhập
            </h2>
            <span className="text-xs font-semibold text-primary">
              {activeSessionsCount} phiên đang hoạt động
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Thu hồi các phiên không nhận ra để bảo vệ tài khoản.
          </p>
        </div>
        <Button
          disabled={isRefreshingSessions}
          onClick={refreshSessions}
          size="sm"
          type="button"
          variant="secondary"
        >
          <RefreshCw
            className={isRefreshingSessions ? "animate-spin" : undefined}
            size={15}
          />
          Tải lại
        </Button>
      </div>

      <div className="mt-6 max-h-[360px] overflow-y-auto pr-1">
        {sessions.length ? (
          <div className="space-y-1">
            {sessions.map((session) => (
              <SessionRow
                isRevoking={revokingSessionId === session.id}
                key={session.id}
                onRevoke={() => setPendingRevokeSession(session)}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu phiên đăng nhập.
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Thu hồi"
        description="Phiên này sẽ bị đăng xuất khỏi hệ thống. Người dùng cần đăng nhập lại nếu muốn tiếp tục sử dụng trên thiết bị đó."
        icon={<Trash2 className="size-5" />}
        isSubmitting={Boolean(
          pendingRevokeSession && revokingSessionId === pendingRevokeSession.id,
        )}
        onConfirm={() => {
          if (pendingRevokeSession) {
            void handleRevokeSession(pendingRevokeSession);
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevokeSession(null);
          }
        }}
        open={Boolean(pendingRevokeSession)}
        submittingLabel="Đang thu hồi..."
        title="Thu hồi phiên đăng nhập?"
        variant="danger"
      />
    </section>
  );
}

function SessionRow({
  isRevoking,
  onRevoke,
  session,
}: {
  isRevoking: boolean;
  onRevoke: () => void;
  session: UserSessionResponse;
}) {
  const isDisabled = session.isCurrent || isRevoking;

  return (
    <div className="grid gap-4 rounded-lg px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <span className="mt-1.5 size-4 shrink-0 rounded-full bg-primary" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {session.isCurrent ? "Trình duyệt hiện tại" : "Thiết bị đăng nhập"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {session.isCurrent
              ? "Phiên hiện tại"
              : "Đăng nhập từ thiết bị khác"}
          </p>
          {session.isCurrent ? (
            <p className="mt-2 text-xs font-semibold text-success">
              Phiên hiện tại
            </p>
          ) : null}
          {!session.isActive ? (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Đã thu hồi
            </p>
          ) : null}
        </div>
      </div>

      <SessionTimeColumn label="Tạo lúc" value={session.createdAtUtc} />
      <SessionTimeColumn label="Hết hạn" value={session.expiresAtUtc} />

      <Button
        className="w-fit justify-self-start md:justify-self-end"
        disabled={isDisabled}
        onClick={onRevoke}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Trash2 size={14} />
        {isRevoking ? "Đang thu hồi..." : "Thu hồi"}
      </Button>
    </div>
  );
}

function SessionTimeColumn({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
        <Clock3 className="md:hidden" size={13} />
        {formatDateTime(value)}
      </p>
    </div>
  );
}
