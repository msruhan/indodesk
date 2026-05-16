import * as React from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import {
  ArrowRight as PhArrowRight,
  ArrowsInSimple,
  Bell as PhBell,
  Briefcase as PhBriefcase,
  Broadcast,
  Buildings,
  Calendar as PhCalendar,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatCircle,
  ChatText,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  CheckSquare as PhCheckSquare,
  Checks,
  Clock as PhClock,
  ClockCounterClockwise,
  Code as PhCode,
  CreditCard as PhCreditCard,
  Copy as PhCopy,
  CurrencyDollar,
  DeviceMobile,
  DotsThree,
  DotsThreeVertical,
  DownloadSimple,
  EnvelopeSimple,
  Eye as PhEye,
  FacebookLogo,
  FileText as PhFileText,
  Folders,
  Funnel,
  GearSix,
  GithubLogo,
  Globe as PhGlobe,
  GraduationCap as PhGraduationCap,
  Headphones as PhHeadphones,
  Heart as PhHeart,
  House,
  Image as PhImage,
  InstagramLogo,
  Laptop as PhLaptop,
  Lightning,
  LinkedinLogo,
  List,
  Lock as PhLock,
  LockOpen,
  MagnifyingGlass,
  MapPin as PhMapPin,
  Minus as PhMinus,
  Package as PhPackage,
  Paperclip as PhPaperclip,
  PaperPlaneTilt,
  PencilSimple,
  Phone as PhPhone,
  Play as PhPlay,
  Plus as PhPlus,
  Question,
  Quotes,
  ArrowsClockwise,
  ShareNetwork,
  SignOut as PhSignOut,
  ShieldCheck,
  ShoppingBag as PhShoppingBag,
  ShoppingCart as PhShoppingCart,
  Smiley as PhSmiley,
  Sparkle,
  SquaresFour,
  Star as PhStar,
  Storefront,
  ThumbsUp as PhThumbsUp,
  Trash,
  TrendDown,
  TrendUp,
  Trophy,
  TwitterLogo,
  User as PhUser,
  UserCheck as PhUserCheck,
  UserCircle as PhUserCircle,
  UserPlus as PhUserPlus,
  Users as PhUsers,
  VideoCamera,
  Wallet as PhWallet,
  Warning,
  WarningCircle,
  Wrench as PhWrench,
  X as PhX,
  XCircle as PhXCircle,
  YoutubeLogo,
} from '@phosphor-icons/react/dist/ssr'

type IconProps = React.ComponentProps<PhosphorIcon>

function withPremiumWeight(Icon: PhosphorIcon, defaultWeight: IconProps['weight'] = 'duotone') {
  const PremiumIcon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ weight = defaultWeight, ...props }, ref) => (
      <Icon ref={ref} weight={weight} {...props} />
    )
  )

  PremiumIcon.displayName = Icon.displayName ?? Icon.name ?? 'PremiumIcon'
  return PremiumIcon
}

export const AlertCircle = withPremiumWeight(WarningCircle)
export const AlertTriangle = withPremiumWeight(Warning)
export const ArrowRight = withPremiumWeight(PhArrowRight, 'regular')
export const Award = withPremiumWeight(Trophy)
export const BarChart3 = withPremiumWeight(SquaresFour)
export const Bell = withPremiumWeight(PhBell)
export const Briefcase = withPremiumWeight(PhBriefcase)
export const Building = withPremiumWeight(Buildings)
export const Calendar = withPremiumWeight(PhCalendar)
export const Check = withPremiumWeight(PhCheck, 'regular')
export const CheckCheck = withPremiumWeight(Checks)
export const CheckCircle = withPremiumWeight(PhCheckCircle)
export const CheckCircle2 = CheckCircle
export const CheckSquare = withPremiumWeight(PhCheckSquare)
export const ChevronDown = withPremiumWeight(CaretDown, 'regular')
export const ChevronLeft = withPremiumWeight(CaretLeft, 'regular')
export const ChevronRight = withPremiumWeight(CaretRight, 'regular')
export const Clock = withPremiumWeight(PhClock)
export const Code = withPremiumWeight(PhCode)
export const CreditCard = withPremiumWeight(PhCreditCard)
export const Copy = withPremiumWeight(PhCopy)
export const DollarSign = withPremiumWeight(CurrencyDollar)
export const Download = withPremiumWeight(DownloadSimple)
export const Edit = withPremiumWeight(PencilSimple)
export const Eye = withPremiumWeight(PhEye)
export const Facebook = withPremiumWeight(FacebookLogo)
export const FileText = withPremiumWeight(PhFileText)
export const Filter = withPremiumWeight(Funnel)
export const FolderKanban = withPremiumWeight(Folders)
export const Github = withPremiumWeight(GithubLogo)
export const Globe = withPremiumWeight(PhGlobe)
export const GraduationCap = withPremiumWeight(PhGraduationCap)
export const Headphones = withPremiumWeight(PhHeadphones)
export const Heart = withPremiumWeight(PhHeart)
export const HelpCircle = withPremiumWeight(Question)
export const History = withPremiumWeight(ClockCounterClockwise)
export const Home = withPremiumWeight(House)
export const Image = withPremiumWeight(PhImage)
export const Instagram = withPremiumWeight(InstagramLogo)
export const Laptop = withPremiumWeight(PhLaptop)
export const LayoutDashboard = withPremiumWeight(SquaresFour)
export const Linkedin = withPremiumWeight(LinkedinLogo)
export const Lock = withPremiumWeight(PhLock)
export const LogOut = withPremiumWeight(PhSignOut)
export const Mail = withPremiumWeight(EnvelopeSimple)
export const MapPin = withPremiumWeight(PhMapPin)
export const Menu = withPremiumWeight(List, 'regular')
export const MessageCircle = withPremiumWeight(ChatCircle)
export const Minus = withPremiumWeight(PhMinus, 'regular')
export const MessageSquare = withPremiumWeight(ChatText)
export const Minimize2 = withPremiumWeight(ArrowsInSimple)
export const MoreHorizontal = withPremiumWeight(DotsThree)
export const MoreVertical = withPremiumWeight(DotsThreeVertical)
export const Package = withPremiumWeight(PhPackage)
export const Paperclip = withPremiumWeight(PhPaperclip, 'regular')
export const Phone = withPremiumWeight(PhPhone)
export const Play = withPremiumWeight(PhPlay)
export const Plus = withPremiumWeight(PhPlus, 'regular')
export const Quote = withPremiumWeight(Quotes)
export const Radio = withPremiumWeight(Broadcast)
export const RefreshCw = withPremiumWeight(ArrowsClockwise)
export const Search = withPremiumWeight(MagnifyingGlass)
export const Send = withPremiumWeight(PaperPlaneTilt)
export const Settings = withPremiumWeight(GearSix)
export const Share2 = withPremiumWeight(ShareNetwork)
export const Shield = withPremiumWeight(ShieldCheck)
export const ShoppingBag = withPremiumWeight(PhShoppingBag)
export const ShoppingCart = withPremiumWeight(PhShoppingCart)
export const Smile = withPremiumWeight(PhSmiley, 'regular')
export const Smartphone = withPremiumWeight(DeviceMobile)
export const Sparkles = withPremiumWeight(Sparkle)
export const Star = withPremiumWeight(PhStar)
export const Store = withPremiumWeight(Storefront)
export const ThumbsUp = withPremiumWeight(PhThumbsUp)
export const Trash2 = withPremiumWeight(Trash)
export const TrendingDown = withPremiumWeight(TrendDown)
export const TrendingUp = withPremiumWeight(TrendUp)
export const Twitter = withPremiumWeight(TwitterLogo)
export const Unlock = withPremiumWeight(LockOpen)
export const User = withPremiumWeight(PhUser)
export const UserCheck = withPremiumWeight(PhUserCheck)
export const UserCircle = withPremiumWeight(PhUserCircle)
export const UserPlus = withPremiumWeight(PhUserPlus)
export const Users = withPremiumWeight(PhUsers)
export const Video = withPremiumWeight(VideoCamera)
export const Wallet = withPremiumWeight(PhWallet)
export const Wrench = withPremiumWeight(PhWrench)
export const X = withPremiumWeight(PhX, 'regular')
export const XCircle = withPremiumWeight(PhXCircle)
export const Youtube = withPremiumWeight(YoutubeLogo)
export const Zap = withPremiumWeight(Lightning)
