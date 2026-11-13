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
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "shield-check"
  | "triangle-alert"
  | "shield-alert"
  | "thermometer"
  | "droplet"
  | "cloud-rain"
  | "user-check"
  | "send"
  | "pencil"
  | "map-pin"
  | "users"
  | "file-text"
  | "sliders"
  | "message-square"
  | "check"
  | "clock"
  | "filter"
  | "upload"
  | "plus"
  | "arrow-right"
  | "calendar"
  | "download"
  | "activity"
  | "eye"
  | "eye-off"
  | "alert-circle"
  | "check-circle-2";

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
  const iconProps = {
    className,
    size,
    strokeWidth,
    "aria-hidden": true,
    ...props,
  };

  switch (name) {
    case "shield-check":
      return <ShieldCheck {...iconProps} />;
    case "triangle-alert":
      return <TriangleAlert {...iconProps} />;
    case "shield-alert":
      return <ShieldAlert {...iconProps} />;
    case "thermometer":
      return <Thermometer {...iconProps} />;
    case "droplet":
      return <Droplet {...iconProps} />;
    case "cloud-rain":
      return <CloudRain {...iconProps} />;
    case "user-check":
      return <UserCheck {...iconProps} />;
    case "send":
      return <Send {...iconProps} />;
    case "pencil":
      return <Pencil {...iconProps} />;
    case "map-pin":
      return <MapPin {...iconProps} />;
    case "users":
      return <Users {...iconProps} />;
    case "file-text":
      return <FileText {...iconProps} />;
    case "sliders":
      return <Sliders {...iconProps} />;
    case "message-square":
      return <MessageSquare {...iconProps} />;
    case "check":
      return <Check {...iconProps} />;
    case "clock":
      return <Clock {...iconProps} />;
    case "filter":
      return <Filter {...iconProps} />;
    case "upload":
      return <Upload {...iconProps} />;
    case "plus":
      return <Plus {...iconProps} />;
    case "arrow-right":
      return <ArrowRight {...iconProps} />;
    case "calendar":
      return <Calendar {...iconProps} />;
    case "download":
      return <Download {...iconProps} />;
    case "activity":
      return <Activity {...iconProps} />;
    case "eye":
      return <Eye {...iconProps} />;
    case "eye-off":
      return <EyeOff {...iconProps} />;
    case "alert-circle":
      return <AlertCircle {...iconProps} />;
    case "check-circle-2":
      return <CheckCircle2 {...iconProps} />;
    default:
      return <ShieldCheck {...iconProps} />;
  }
}
