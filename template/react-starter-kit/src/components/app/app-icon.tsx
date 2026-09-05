import { Activity, AlertTriangle, Bell, CalendarDays, Check, CheckCircle2, CircleHelp, ClipboardList, Clock, Coffee, Copy, Eye, Factory, FileText, Globe, KeyRound, Layers, LayoutDashboard, LifeBuoy, Lock, type LucideIcon, LucideProps, Mail, MailCheck, Megaphone, MessageCircleQuestion, MessageSquare, MessageSquareQuote, Phone, Plus, Server, Settings2, Shield, ShieldCheck, TriangleAlert, User, UserCheck, UserRound, Users, UserX, Wrench, XCircle, Zap } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';

export type AppIconProps = LucideProps & {
  name: IconName
};

const iconMap: Partial<Record<IconName, LucideIcon>> = {
  'activity': Activity,
  'alert-triangle': AlertTriangle,
  'bell': Bell,
  'calendar-days': CalendarDays,
  'check': Check,
  'check-circle-2': CheckCircle2,
  'clipboard-list': ClipboardList,
  'clock': Clock,
  'coffee': Coffee,
  'circle-help': CircleHelp,
  'copy': Copy,
  'eye': Eye,
  'file-text': FileText,
  'factory': Factory,
  'globe': Globe,
  'key-round': KeyRound,
  'layers': Layers,
  'layout-dashboard': LayoutDashboard,
  'life-buoy': LifeBuoy,
  'lock': Lock,
  'mail': Mail,
  'mail-check': MailCheck,
  'megaphone': Megaphone,
  'message-circle-question': MessageCircleQuestion,
  'message-square': MessageSquare,
  'message-square-quote': MessageSquareQuote,
  'phone': Phone,
  'plus': Plus,
  'server': Server,
  'settings-2': Settings2,
  'shield': Shield,
  'shield-check': ShieldCheck,
  'triangle-alert': TriangleAlert,
  'user': User,
  'user-check': UserCheck,
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
