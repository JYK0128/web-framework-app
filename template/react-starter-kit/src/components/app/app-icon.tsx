import { Activity, AlertTriangle, Apple, Bell, CalendarClock, CalendarDays, ChartNoAxesCombined, Check, CheckCircle2, CircleHelp, ClipboardList, Clock, Code2, Coffee, Compass, Copy, Eye, Factory, FileText, Gamepad2, Globe, Hash, KeyRound, Layers, LayoutDashboard, LayoutGrid, LifeBuoy, Lock, type LucideIcon, LucideProps, Mail, MailCheck, Megaphone, MessageCircle, MessageCircleQuestion, MessageSquare, MessageSquareQuote, Phone, Plus, Server, Settings2, Share2, Shield, ShieldCheck, TriangleAlert, User, UserCheck, UserPlus, UserRound, Users, UserX, Wrench, XCircle, Zap } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';

export type AppIconProps = LucideProps & {
  name: IconName
};

const iconMap: Partial<Record<IconName, LucideIcon>> = {
  'activity': Activity,
  'alert-triangle': AlertTriangle,
  'apple': Apple,
  'bell': Bell,
  'calendar-clock': CalendarClock,
  'calendar-days': CalendarDays,
  'chart-no-axes-combined': ChartNoAxesCombined,
  'check': Check,
  'check-circle-2': CheckCircle2,
  'clipboard-list': ClipboardList,
  'clock': Clock,
  'code-2': Code2,
  'coffee': Coffee,
  'compass': Compass,
  'circle-help': CircleHelp,
  'copy': Copy,
  'eye': Eye,
  'file-text': FileText,
  'factory': Factory,
  'gamepad-2': Gamepad2,
  'globe': Globe,
  'hash': Hash,
  'key-round': KeyRound,
  'layers': Layers,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'life-buoy': LifeBuoy,
  'lock': Lock,
  'mail': Mail,
  'mail-check': MailCheck,
  'megaphone': Megaphone,
  'message-circle': MessageCircle,
  'message-circle-question': MessageCircleQuestion,
  'message-square': MessageSquare,
  'message-square-quote': MessageSquareQuote,
  'phone': Phone,
  'plus': Plus,
  'server': Server,
  'settings-2': Settings2,
  'share-2': Share2,
  'shield': Shield,
  'shield-check': ShieldCheck,
  'triangle-alert': TriangleAlert,
  'user': User,
  'user-check': UserCheck,
  'user-plus': UserPlus,
  'user-round': UserRound,
  'user-x': UserX,
  'users': Users,
  'wrench': Wrench,
  'x-circle': XCircle,
  'zap': Zap,
};

export function AppIcon({ name, ...props }: AppIconProps) {
  const Icon = iconMap[name];
  return Icon ? <Icon {...props} /> : null;
}
