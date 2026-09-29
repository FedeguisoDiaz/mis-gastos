import {
  Utensils, ShoppingBasket, Fuel, PartyPopper, Watch, MonitorSmartphone, House, HeartPulse, PawPrint,
  Sparkles, Briefcase, HandCoins, Landmark, PiggyBank, Wallet, Car, Bus, Coffee, Pizza, Gift, Shirt,
  GraduationCap, Dumbbell, Gamepad2, Music, Plane, Smartphone, Wifi, Zap, Baby, Book, Scissors, Wrench,
  Beer, Film, Heart, Package, ArrowLeftRight, type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, 'shopping-basket': ShoppingBasket, fuel: Fuel, 'party-popper': PartyPopper, watch: Watch,
  'monitor-smartphone': MonitorSmartphone, house: House, 'heart-pulse': HeartPulse, 'paw-print': PawPrint,
  sparkles: Sparkles, briefcase: Briefcase, 'hand-coins': HandCoins, landmark: Landmark, 'piggy-bank': PiggyBank,
  wallet: Wallet, car: Car, bus: Bus, coffee: Coffee, pizza: Pizza, gift: Gift, shirt: Shirt,
  'graduation-cap': GraduationCap, dumbbell: Dumbbell, gamepad: Gamepad2, music: Music, plane: Plane,
  smartphone: Smartphone, wifi: Wifi, zap: Zap, baby: Baby, book: Book, scissors: Scissors, wrench: Wrench,
  beer: Beer, film: Film, heart: Heart, package: Package, transfer: ArrowLeftRight,
}

export const ICON_KEYS = Object.keys(ICONS).filter((k) => !['landmark', 'transfer'].includes(k))

export const PALETTE = [
  '#F47C20', '#E9A23B', '#D9776B', '#C9678F', '#8C7AE6', '#5B8DB8',
  '#6FA39B', '#7D9A72', '#B08850', '#1C1B1A', '#A89F94', '#E26D5A',
]

export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? Sparkles
  return <C size={size} strokeWidth={1.7} className={className} />
}

/** Burbuja redondeada con el icono de la categoría */
export function IconBubble({ icon, color, size = 42 }: { icon: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, #ffffff 0%, ${color}26 70%)`, color, boxShadow: `inset 0 0 0 1px ${color}22` }}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} />
    </span>
  )
}
