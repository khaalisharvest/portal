'use client';

import { ReactNode } from 'react';
import { 
  FolderIcon, 
  TagIcon, 
  ScaleIcon, 
  CubeIcon, 
  CubeTransparentIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
  CogIcon,
  ChartBarIcon,
  HomeIcon,
  HeartIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  MinusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowPathRoundedSquareIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ShareIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  DocumentPlusIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentMinusIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderMinusIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  InboxIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  InboxArrowDownIcon,
  InboxStackIcon,
  ServerIcon,
  ServerStackIcon,
  CpuChipIcon,
  CircleStackIcon,
  CircleStackIcon as DatabaseIcon,
  CloudIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  WifiIcon,
  SignalIcon,
  SignalSlashIcon,
  Battery0Icon,
  Battery50Icon,
  Battery100Icon,
  BellIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  XCircleIcon as XCircleSolidIcon,
  ExclamationTriangleIcon as ExclamationTriangleSolidIcon,
  InformationCircleIcon as InformationCircleSolidIcon,
  HomeIcon as HomeSolidIcon,
  UserIcon as UserSolidIcon,
  CogIcon as CogSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  ShoppingBagIcon as ShoppingBagSolidIcon,
  TruckIcon as TruckSolidIcon,
  FolderIcon as FolderSolidIcon,
  TagIcon as TagSolidIcon,
  ScaleIcon as ScaleSolidIcon,
  CubeIcon as CubeSolidIcon,
  CubeTransparentIcon as CubeTransparentSolidIcon
} from '@heroicons/react/24/solid';

// Icon mapping for string-based icons
const iconMap: Record<string, ReactNode> = {
  // Categories
  'folder': <FolderIcon className="w-4 h-4" />,
  'folder-open': <FolderOpenIcon className="w-4 h-4" />,
  'folder-plus': <FolderPlusIcon className="w-4 h-4" />,
  'folder-minus': <FolderMinusIcon className="w-4 h-4" />,
  
  // Product Types
  'tag': <TagIcon className="w-4 h-4" />,
  'tags': <TagIcon className="w-4 h-4" />,
  
  // Units
  'scale': <ScaleIcon className="w-4 h-4" />,
  'cube': <CubeIcon className="w-4 h-4" />,
  'box': <CubeTransparentIcon className="w-4 h-4" />,
  'shopping-bag': <ShoppingBagIcon className="w-4 h-4" />,
  'shopping-cart': <ShoppingCartIcon className="w-4 h-4" />,
  'credit-card': <CreditCardIcon className="w-4 h-4" />,
  
  // Navigation
  'home': <HomeIcon className="w-4 h-4" />,
  'user': <UserIcon className="w-4 h-4" />,
  'logout': <ArrowRightOnRectangleIcon className="w-4 h-4" />,
  'cog': <CogIcon className="w-4 h-4" />,
  'chart': <ChartBarIcon className="w-4 h-4" />,
  'truck': <TruckIcon className="w-4 h-4" />,
  
  // Actions
  'plus': <PlusIcon className="w-4 h-4" />,
  'minus': <MinusIcon className="w-4 h-4" />,
  'edit': <PencilIcon className="w-4 h-4" />,
  'delete': <TrashIcon className="w-4 h-4" />,
  'view': <EyeIcon className="w-4 h-4" />,
  'hide': <EyeSlashIcon className="w-4 h-4" />,
  'search': <MagnifyingGlassIcon className="w-4 h-4" />,
  'filter': <FunnelIcon className="w-4 h-4" />,
  'menu': <Bars3Icon className="w-4 h-4" />,
  'close': <XMarkIcon className="w-4 h-4" />,
  'login': <UserIcon className="w-4 h-4" />,
  
  // Status
  'check': <CheckCircleIcon className="w-4 h-4" />,
  'check-circle': <CheckCircleIcon className="w-4 h-4" />,
  'error': <XCircleIcon className="w-4 h-4" />,
  'x-circle': <XCircleIcon className="w-4 h-4" />,
  'warning': <ExclamationTriangleIcon className="w-4 h-4" />,
  'alert-circle': <ExclamationTriangleIcon className="w-4 h-4" />,
  'info': <InformationCircleIcon className="w-4 h-4" />,
  'star': <StarIcon className="w-4 h-4" />,
  'heart': <HeartIcon className="w-4 h-4" />,
  'leaf': <SparklesIcon className="w-4 h-4" />,
  'droplet': <SparklesIcon className="w-4 h-4" />,
  
  // Arrows
  'chevron-down': <ChevronDownIcon className="w-4 h-4" />,
  'chevron-up': <ChevronUpIcon className="w-4 h-4" />,
  'chevron-left': <ChevronLeftIcon className="w-4 h-4" />,
  'chevron-right': <ChevronRightIcon className="w-4 h-4" />,
  'arrow-up': <ArrowUpIcon className="w-4 h-4" />,
  'arrow-down': <ArrowDownIcon className="w-4 h-4" />,
  'arrow-left': <ArrowLeftIcon className="w-4 h-4" />,
  'arrow-right': <ArrowRightIcon className="w-4 h-4" />,
  
  // Time & Date
  'calendar': <CalendarIcon className="w-4 h-4" />,
  'clock': <ClockIcon className="w-4 h-4" />,
  
  // Location
  'location': <MapPinIcon className="w-4 h-4" />,
  'phone': <PhoneIcon className="w-4 h-4" />,
  'email': <EnvelopeIcon className="w-4 h-4" />,
  'globe': <GlobeAltIcon className="w-4 h-4" />,
  
  // Media
  'document': <DocumentTextIcon className="w-4 h-4" />,
  'photo': <PhotoIcon className="w-4 h-4" />,
  'video': <VideoCameraIcon className="w-4 h-4" />,
  'music': <MusicalNoteIcon className="w-4 h-4" />,
  'speaker': <SpeakerWaveIcon className="w-4 h-4" />,
  'mute': <SpeakerXMarkIcon className="w-4 h-4" />,
  
  // Playback
  'play': <PlayIcon className="w-4 h-4" />,
  'pause': <PauseIcon className="w-4 h-4" />,
  'stop': <StopIcon className="w-4 h-4" />,
  'forward': <ForwardIcon className="w-4 h-4" />,
  'backward': <BackwardIcon className="w-4 h-4" />,
  
  // System
  'refresh': <ArrowPathIcon className="w-4 h-4" />,
  'undo': <ArrowUturnLeftIcon className="w-4 h-4" />,
  'redo': <ArrowUturnRightIcon className="w-4 h-4" />,
  'external': <ArrowTopRightOnSquareIcon className="w-4 h-4" />,
  'download': <ArrowDownTrayIcon className="w-4 h-4" />,
  'upload': <ArrowUpTrayIcon className="w-4 h-4" />,
  'share': <ShareIcon className="w-4 h-4" />,
  'link': <LinkIcon className="w-4 h-4" />,
  
  // Documents
  'clipboard': <ClipboardDocumentIcon className="w-4 h-4" />,
  'clipboard-list': <ClipboardDocumentListIcon className="w-4 h-4" />,
  'copy': <DocumentDuplicateIcon className="w-4 h-4" />,
  'document-plus': <DocumentPlusIcon className="w-4 h-4" />,
  'document-arrow-down': <DocumentArrowDownIcon className="w-4 h-4" />,
  'document-arrow-up': <DocumentArrowUpIcon className="w-4 h-4" />,
  'document-check': <DocumentCheckIcon className="w-4 h-4" />,
  'document-x': <DocumentMinusIcon className="w-4 h-4" />,
  
  // Storage
  'archive': <ArchiveBoxIcon className="w-4 h-4" />,
  'archive-x': <ArchiveBoxXMarkIcon className="w-4 h-4" />,
  'inbox': <InboxIcon className="w-4 h-4" />,
  'inbox-arrow-down': <InboxArrowDownIcon className="w-4 h-4" />,
  'inbox-stack': <InboxStackIcon className="w-4 h-4" />,
  
  // Tech
  'server': <ServerIcon className="w-4 h-4" />,
  'server-stack': <ServerStackIcon className="w-4 h-4" />,
  'cpu': <CpuChipIcon className="w-4 h-4" />,
  'database': <DatabaseIcon className="w-4 h-4" />,
  'stack': <CircleStackIcon className="w-4 h-4" />,
  'cloud': <CloudIcon className="w-4 h-4" />,
  'cloud-upload': <CloudArrowUpIcon className="w-4 h-4" />,
  'cloud-download': <CloudArrowDownIcon className="w-4 h-4" />,
  'wifi': <WifiIcon className="w-4 h-4" />,
  'signal': <SignalIcon className="w-4 h-4" />,
  'signal-slash': <SignalSlashIcon className="w-4 h-4" />,
  'battery-0': <Battery0Icon className="w-4 h-4" />,
  'battery-50': <Battery50Icon className="w-4 h-4" />,
  'battery-100': <Battery100Icon className="w-4 h-4" />,
  'bell': <BellIcon className="w-4 h-4" />,
  'shield-check': <ShieldCheckIcon className="w-4 h-4" />,
  
  // Effects
  'lightbulb': <LightBulbIcon className="w-4 h-4" />,
  'sun': <SunIcon className="w-4 h-4" />,
  'moon': <MoonIcon className="w-4 h-4" />,
  'sparkles': <SparklesIcon className="w-4 h-4" />,
  'fire': <FireIcon className="w-4 h-4" />,
  'bolt': <BoltIcon className="w-4 h-4" />,
};

interface IconProps {
  name: string;
  className?: string;
}

export default function Icon({ name, className = '' }: IconProps) {
  const icon = iconMap[name];
  
  if (!icon) {
    // Fallback to a default icon if not found
    return <TagIcon className={`w-4 h-4 ${className}`} />;
  }
  
  return <span className={className}>{icon}</span>;
}

// Export the icon map for use in dropdowns
export { iconMap };
