export type DashboardNavigationIcon =
  | "bar-chart"
  | "building"
  | "credit-card"
  | "file-text"
  | "layout-dashboard"
  | "menu"
  | "package"
  | "settings"
  | "shield"
  | "truck"
  | "users";

export type DashboardNavigationItem = {
  children?: DashboardNavigationItem[];
  href: string;
  icon?: DashboardNavigationIcon;
  label: string;
  permissions?: string[];
};
