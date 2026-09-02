import { Activity, AlertTriangle, CheckCircle2, CircleHelp, Clock, Coffee, Factory, FileText, KeyRound, Layers, LayoutDashboard, type LucideIcon, LucideProps, Mail, MailCheck, Megaphone, MessageCircleQuestion, MessageSquareQuote, Phone, Settings2, ShieldCheck, UserRound, Users, Wrench } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';

const iconMap: Partial<Record<IconName, LucideIcon>> = {
  'activity': Activity,
  'alert-triangle': AlertTriangle,
  'check-circle-2': CheckCircle2,
  'clock': Clock,
  'coffee': Coffee,
  'circle-help': CircleHelp,
  'file-text': FileText,
  'factory': Factory,
  'key-round': KeyRound,
  'layers': Layers,
  'layout-dashboard': LayoutDashboard,
  'mail': Mail,
  'mail-check': MailCheck,
  'megaphone': Megaphone,
  'message-circle-question': MessageCircleQuestion,
  'message-square-quote': MessageSquareQuote,
  'phone': Phone,
  'settings-2': Settings2,
  'shield-check': ShieldCheck,
  'user-round': UserRound,
  'users': Users,
  'wrench': Wrench,
};

type AppIconProps = LucideProps & {
  name: IconName
};

export function AppIcon({ name, ...props }: AppIconProps) {
  const Icon = iconMap[name] ?? CircleHelp;
  return <Icon {...props} />;
}
