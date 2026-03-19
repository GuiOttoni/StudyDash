import {
  // Sections
  Layers, BarChart2, Lightbulb, Cpu, GitBranch, Gauge, Building2, Mail,
  // Design Patterns
  Hammer, Lock, Factory, Eye, Shuffle, Paintbrush,
  // Algorithms
  ArrowUpDown, GitMerge, Search,
  // Clean Code / Principles
  GraduationCap, FlaskConical, BookOpen, Target,
  // Memory
  Server, RefreshCw, Boxes,
  // Concurrency / Performance
  Terminal, Zap, TrendingUp,
  // Architecture
  Radio, LayoutGrid, ArrowLeftRight,
  // Messaging
  Send, Scale, Inbox,
  // Misc
  Star, Settings, HelpCircle,
} from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  // Sections
  Layers, BarChart2, Lightbulb, Cpu, GitBranch, Gauge, Building2, Mail,
  // Design Patterns
  Hammer, Lock, Factory, Eye, Shuffle, Paintbrush,
  // Algorithms
  ArrowUpDown, GitMerge, Search,
  // Clean Code / Principles
  GraduationCap, FlaskConical, BookOpen, Target,
  // Memory
  Server, RefreshCw, Boxes,
  // Concurrency / Performance
  Terminal, Zap, TrendingUp,
  // Architecture
  Radio, LayoutGrid, ArrowLeftRight,
  // Messaging
  Send, Scale, Inbox,
  // Misc
  Star, Settings,
};

interface Props extends LucideProps {
  name: string;
}

export function Icon({ name, ...props }: Props) {
  const LucideIcon = REGISTRY[name] ?? HelpCircle;
  return <LucideIcon {...props} />;
}

/** Returns all registered icon names — useful for admin pickers */
export const ICON_NAMES = Object.keys(REGISTRY).sort();
