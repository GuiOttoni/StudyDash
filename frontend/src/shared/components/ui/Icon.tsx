import {
  // Sections
  Stack, ChartBar, Lightbulb, Cpu, GitBranch, Gauge, Buildings, Envelope,
  // Design Patterns
  Hammer, Lock, Factory, Eye, Shuffle, PaintBrush,
  // Algorithms
  ArrowsDownUp, GitMerge, MagnifyingGlass,
  // Clean Code / Principles
  GraduationCap, Flask, BookOpen, Target,
  // Memory
  HardDrives, ArrowsClockwise, Package,
  // Concurrency / Performance
  Terminal, Lightning, TrendUp,
  // Architecture
  Radio, GridFour, ArrowsLeftRight,
  // Messaging
  PaperPlaneTilt, Scales, Tray,
  // Misc
  Star, Gear, Question, Sparkle, Wrench, MagicWand, Spinner, Play,
  Sun, Moon, MapTrifold,
  type Icon as PhosphorIcon, type IconProps, type IconWeight,
} from "@phosphor-icons/react";

const REGISTRY: Record<string, PhosphorIcon> = {
  // Sections
  Layers: Stack, BarChart2: ChartBar, Lightbulb, Cpu, GitBranch, Gauge, Building2: Buildings, Mail: Envelope,
  // Design Patterns
  Hammer, Lock, Factory, Eye, Shuffle, Paintbrush: PaintBrush,
  // Algorithms
  ArrowUpDown: ArrowsDownUp, GitMerge, Search: MagnifyingGlass,
  // Clean Code / Principles
  GraduationCap, FlaskConical: Flask, BookOpen, Target,
  // Memory
  Server: HardDrives, RefreshCw: ArrowsClockwise, Boxes: Package,
  // Concurrency / Performance
  Terminal, Zap: Lightning, TrendingUp: TrendUp,
  // Architecture
  Radio, LayoutGrid: GridFour, ArrowLeftRight: ArrowsLeftRight,
  // Messaging
  Send: PaperPlaneTilt, Scale: Scales, Inbox: Tray,
  // Misc
  Star, Settings: Gear, Sparkles: Sparkle, Wrench, Wand2: MagicWand, Loader: Spinner, Play,
  Sun, Moon, Map: MapTrifold,
};

interface Props extends Omit<IconProps, "weight"> {
  name: string;
  /** Compat com a API antiga (Lucide): convertido para o `weight` mais próximo do Phosphor. */
  strokeWidth?: number;
  weight?: IconWeight;
}

function weightFromStrokeWidth(strokeWidth?: number): IconWeight {
  if (strokeWidth === undefined) return "regular";
  if (strokeWidth <= 1)   return "thin";
  if (strokeWidth <= 1.5) return "light";
  if (strokeWidth <= 2)   return "regular";
  return "bold";
}

export function Icon({ name, strokeWidth, weight, ...props }: Props) {
  const PhosphorIconComponent = REGISTRY[name] ?? Question;
  return <PhosphorIconComponent weight={weight ?? weightFromStrokeWidth(strokeWidth)} {...props} />;
}

/** Returns all registered icon names — useful for admin pickers */
export const ICON_NAMES = Object.keys(REGISTRY).sort();
