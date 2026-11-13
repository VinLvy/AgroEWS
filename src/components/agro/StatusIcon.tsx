import React from "react";
import {
  ShieldCheck,
  TriangleAlert,
  ShieldAlert,
  Thermometer,
  Droplet,
  CloudRain,
  UserCheck,
  Send,
  Pencil,
  MapPin,
  Users,
  FileText,
  Sliders,
  MessageSquare,
  Check,
  Clock,
  Filter,
  Upload,
  Plus,
  ArrowRight,
  Calendar,
  Download,
  Activity,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  LayoutDashboard,
  Map,
  BarChart3,
  LogOut,
  Radio,
  ChevronRight,
  RefreshCw,
  CheckCheck,
  Sprout,
  TrendingUp,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  "shield-check": ShieldCheck,
  "triangle-alert": TriangleAlert,
  "shield-alert": ShieldAlert,
  thermometer: Thermometer,
  droplet: Droplet,
  "cloud-rain": CloudRain,
  "user-check": UserCheck,
  send: Send,
  pencil: Pencil,
  "map-pin": MapPin,
  users: Users,
  "file-text": FileText,
  sliders: Sliders,
  "message-square": MessageSquare,
  check: Check,
  clock: Clock,
  filter: Filter,
  upload: Upload,
  plus: Plus,
  "arrow-right": ArrowRight,
  calendar: Calendar,
  download: Download,
  activity: Activity,
  eye: Eye,
  "eye-off": EyeOff,
  "alert-circle": AlertCircle,
  "check-circle-2": CheckCircle2,
  x: X,
  "layout-dashboard": LayoutDashboard,
  map: Map,
  "bar-chart-3": BarChart3,
  "log-out": LogOut,
  radio: Radio,
  "chevron-right": ChevronRight,
  "refresh-cw": RefreshCw,
  "check-check": CheckCheck,
  sprout: Sprout,
  "trending-up": TrendingUp,
} satisfies Record<string, React.ComponentType<LucideProps>>;

export type IconName = keyof typeof ICONS;

interface StatusIconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  className?: string;
  size?: number;
}

export function StatusIcon({
  name,
  className = "w-5 h-5",
  size = 20,
  strokeWidth = 2,
  ...props
}: StatusIconProps) {
  const IconComponent = ICONS[name] ?? ShieldCheck;
  return (
    <IconComponent
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    />
  );
}
