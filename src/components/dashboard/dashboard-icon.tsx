import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  UserPen,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { DashboardNavigationIcon } from "@/types/dashboard-navigation";

const DASHBOARD_ICON_MAP: Record<DashboardNavigationIcon, LucideIcon> = {
  "bar-chart": BarChart3,
  building: Building2,
  "credit-card": CreditCard,
  "file-text": FileText,
  "layout-dashboard": LayoutDashboard,
  menu: Menu,
  package: Package,
  settings: Settings,
  shield: ShieldCheck,
  truck: Truck,
  "user-pen": UserPen,
  users: Users,
};

export function DashboardIcon({
  className,
  name,
}: {
  className?: string;
  name?: DashboardNavigationIcon;
}) {
  const Icon = name ? DASHBOARD_ICON_MAP[name] : LayoutDashboard;

  return <Icon className={className} />;
}
