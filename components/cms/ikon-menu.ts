import {
  CalendarDays,
  Coins,
  FileText,
  Globe,
  HandCoins,
  Home,
  House,
  Images,
  Megaphone,
  MessageSquareWarning,
  Network,
  Newspaper,
  ReceiptText,
  ScrollText,
  Settings,
  UserCog,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Peta nama ikon di lib/menu.ts ke komponennya. Nama yang tidak ada di sini
 * jatuh ke ikon Home tanpa peringatan: menambah butir menu berarti menambah
 * ikonnya di sini juga.
 */
export const IKON_MENU: Record<string, LucideIcon> = {
  Home,
  Globe,
  Images,
  Network,
  Newspaper,
  CalendarDays,
  FileText,
  Megaphone,
  MessageSquareWarning,
  House,
  Users,
  UserRound,
  Coins,
  ReceiptText,
  HandCoins,
  Wallet,
  UserCog,
  Settings,
  ScrollText,
};
