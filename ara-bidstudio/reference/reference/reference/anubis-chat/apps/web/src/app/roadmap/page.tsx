'use client';

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Grid3x3,
  List,
  Rocket,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  categoryColors,
  type RoadmapFeature,
  roadmapData,
  statusConfig,
} from '@/lib/constants/roadmap-data';
import { cn } from '@/lib/utils';
import SiteLinksSection from '../(landing)/components/siteLinksSection';

type FeatureStatus = 'completed' | 'in-progress' | 'upcoming';
type ViewMode = 'timeline' | 'kanban' | 'list';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 70,
      damping: 14,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const glowVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'easeInOut' as const,
    },
  },
};

interface EmptySearchStateProps {
  Icon: React.ComponentType<{ className?: string }>;
  onClearFilters: () => void;
}

function EmptySearchState({ Icon, onClearFilters }: EmptySearchStateProps) {
  return (
    <div className="py-12 text-center">
      <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">
        No features match your search criteria
      </p>
      <Button
        className="mt-4"
        onClick={onClearFilters}
        size="sm"
        variant="outline"
      >
        Clear filters
      </Button>
    </div>
  );
}

function FeatureCard({
  feature,
  expanded,
  onToggle,
}: {
  feature: RoadmapFeature;
  expanded: boolean;
  onToggle: () => void;
}) {
  const StatusIcon = statusConfig[feature.status].icon;
  const FeatureIcon = feature.icon;

  return (
    <motion.div
      animate="visible"
      initial="hidden"
      layout
      transition={{ layout: { type: 'spring', stiffness: 200, damping: 25 } }}
      variants={cardVariants}
      whileHover="hover"
    >
      <Card
        className={cn(
          'group relative transform-gpu overflow-hidden border-primary/10 backdrop-blur-sm',
          expanded && 'shadow-xl ring-2 ring-primary'
        )}
      >
        <motion.span
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ opacity: 1 }}
        />
        <CardHeader className="relative pb-4">
          <button
            aria-expanded={expanded}
            aria-label={`${feature.title} - ${feature.status} - Click to ${expanded ? 'collapse' : 'expand'} details`}
            className="relative w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={onToggle}
            type="button"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <motion.div
                  className={cn(
                    'rounded-lg p-2',
                    statusConfig[feature.status].bgColor
                  )}
                  transition={{ type: 'spring', stiffness: 400 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <FeatureIcon className="h-5 w-5" />
                </motion.div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {feature.title}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <StatusIcon
                        className={cn(
                          'h-4 w-4',
                          statusConfig[feature.status].color
                        )}
                      />
                    </motion.div>
                  </CardTitle>
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="mt-2 flex flex-wrap gap-2"
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge
                      className={cn('border', categoryColors[feature.category])}
                    >
                      {feature.category}
                    </Badge>
                    <Badge variant="outline">{feature.quarter}</Badge>
                    {feature.estimatedDate && (
                      <Badge variant="secondary">{feature.estimatedDate}</Badge>
                    )}
                  </motion.div>
                </div>
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  className="flex h-6 w-6 items-center justify-center"
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </div>
            </div>
          </button>
        </CardHeader>
        <CardContent className="relative">
          <motion.p
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            {feature.description}
          </motion.p>

          {feature.status !== 'upcoming' && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.4 }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Progress</span>
                <motion.span
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-medium text-xs"
                  initial={{ scale: 1.5, opacity: 0 }}
                  key={feature.progress}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {feature.progress}%
                </motion.span>
              </div>
              <Progress
                className="h-2"
                value={feature.progress}
                variant={feature.progress === 100 ? 'success' : 'default'}
              />
            </motion.div>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-4"
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {feature.details && (
                  <motion.div
                    animate={{ x: 0, opacity: 1 }}
                    initial={{ x: -20, opacity: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="mb-2 font-medium text-sm">Key Features:</h4>
                    <ul className="space-y-1">
                      {feature.details.map((detail, index) => (
                        <motion.li
                          animate={{ x: 0, opacity: 1 }}
                          className="flex items-start gap-2 text-muted-foreground text-sm"
                          initial={{ x: -20, opacity: 0 }}
                          key={detail}
                          transition={{ delay: 0.15 + index * 0.05 }}
                        >
                          <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                          <span>{detail}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
                {feature.links && (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="flex gap-2"
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {feature.links.map((link) => (
                      <Link
                        className="text-primary text-sm underline underline-offset-4 transition-colors hover:text-primary/80"
                        href={link.href}
                        key={link.href}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper function to avoid nested ternary
function getQuarterStatus(index: number): string {
  switch (index) {
    case 0:
      return 'Shipped';
    case 1:
      return 'In Development';
    default:
      return 'Planning';
  }
}

function TimelineView({
  features,
  expandedCards,
  onToggleCard,
}: {
  features: RoadmapFeature[];
  expandedCards: Set<string>;
  onToggleCard: (id: string) => void;
}) {
  const quarters = ['Q3 2025', 'Q4 2025', '2026'] as const;

  // Calculate statistics for the progress card
  const stats = {
    completed: features.filter((f) => f.status === 'completed').length,
    inProgress: features.filter((f) => f.status === 'in-progress').length,
    upcoming: features.filter((f) => f.status === 'upcoming').length,
    totalProgress: Math.round(
      (features.filter((f) => f.status === 'completed').length /
        features.length) *
        100
    ),
  };

  return (
    <motion.div
      animate="visible"
      className="space-y-8"
      initial="hidden"
      variants={containerVariants}
    >
      {/* Overall Progress with glow */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-primary/20">
          <motion.div
            animate="animate"
            className="-inset-2 pointer-events-none absolute rounded-xl"
            initial="initial"
            variants={glowVariants}
          >
            <div className="absolute inset-0 rounded-xl bg-[radial-gradient(50%_30%_at_50%_20%,rgba(34,197,94,0.12)_0%,rgba(34,197,94,0.06)_40%,transparent_85%)] blur-[6px]" />
          </motion.div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 20,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                <Rocket className="h-5 w-5" />
              </motion.div>
              Overall Roadmap Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              <motion.div
                animate={{ scaleX: 1 }}
                initial={{ scaleX: 0 }}
                style={{ originX: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              >
                <Progress
                  className="h-3"
                  value={stats.totalProgress}
                  variant="success"
                />
              </motion.div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.div
                    animate={{ scale: 1 }}
                    className="font-bold text-2xl text-green-600 dark:text-green-400"
                    initial={{ scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      delay: 0.8,
                    }}
                  >
                    {stats.completed}
                  </motion.div>
                  <div className="text-muted-foreground">Completed</div>
                </motion.div>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.div
                    animate={{ scale: 1 }}
                    className="font-bold text-2xl text-yellow-600 dark:text-yellow-400"
                    initial={{ scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      delay: 0.9,
                    }}
                  >
                    {stats.inProgress}
                  </motion.div>
                  <div className="text-muted-foreground">In Progress</div>
                </motion.div>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.9 }}
                >
                  <motion.div
                    animate={{ scale: 1 }}
                    className="font-bold text-2xl text-gray-600 dark:text-gray-400"
                    initial={{ scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      delay: 1,
                    }}
                  >
                    {stats.upcoming}
                  </motion.div>
                  <div className="text-muted-foreground">Upcoming</div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Animated Timeline Line */}
        <motion.div
          animate={{ scaleY: 1 }}
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-8 w-0.5 bg-gradient-to-b from-green-500 via-yellow-500 to-gray-400"
          initial={{ scaleY: 0 }}
          style={{ originY: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {quarters.map((quarter, qIdx) => {
          const quarterFeatures = features.filter((f) => f.quarter === quarter);

          return (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="relative mb-12"
              initial={{ opacity: 0, x: -50 }}
              key={quarter}
              transition={{ delay: 0.3 + qIdx * 0.2, duration: 0.6 }}
            >
              {/* Quarter Marker with enhanced glow */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative">
                  {/* Animated glow effect behind marker */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    className="-inset-2 pointer-events-none absolute rounded-full"
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-[8px]" />
                  </motion.div>
                  <motion.div
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-background shadow-lg"
                    transition={{ type: 'spring', stiffness: 300 }}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                  >
                    <Calendar className="h-6 w-6" />
                  </motion.div>
                </div>
                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.5 + qIdx * 0.2 }}
                >
                  <h3 className="font-bold text-xl">{quarter}</h3>
                  <p className="text-muted-foreground text-sm">
                    {getQuarterStatus(qIdx)}
                  </p>
                </motion.div>
              </div>

              {/* Features with enhanced spacing */}
              <motion.div
                animate="visible"
                className="ml-20 space-y-6"
                initial="hidden"
                variants={containerVariants}
              >
                {quarterFeatures.map((feature, fIdx) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: -30 }}
                    key={feature.id}
                    transition={{
                      delay: 0.6 + qIdx * 0.2 + fIdx * 0.1,
                      duration: 0.5,
                    }}
                  >
                    <FeatureCard
                      expanded={expandedCards.has(feature.id)}
                      feature={feature}
                      onToggle={() => onToggleCard(feature.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function KanbanView({
  features,
  expandedCards,
  onToggleCard,
}: {
  features: RoadmapFeature[];
  expandedCards: Set<string>;
  onToggleCard: (id: string) => void;
}) {
  return (
    <motion.div
      animate="visible"
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      initial="hidden"
      variants={containerVariants}
    >
      {(['completed', 'in-progress', 'upcoming'] as FeatureStatus[]).map(
        (status, index) => {
          const statusFeatures = features.filter((f) => f.status === status);
          const config = statusConfig[status];
          const Icon = config.icon;

          return (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
              initial={{ opacity: 0, y: 50 }}
              key={status}
              transition={{
                delay: index * 0.15,
                duration: 0.6,
                ease: 'easeOut',
              }}
            >
              <motion.div
                className={cn('rounded-lg border p-4', config.bgColor)}
                transition={{ type: 'spring', stiffness: 400 }}
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="flex items-center gap-2 font-semibold">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.5,
                    }}
                  >
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </motion.div>
                  {config.label}
                  <motion.div
                    animate={{ scale: 1 }}
                    initial={{ scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      delay: 0.3 + index * 0.1,
                    }}
                  >
                    <Badge className="ml-auto" variant="secondary">
                      {statusFeatures.length}
                    </Badge>
                  </motion.div>
                </h3>
              </motion.div>
              <motion.div
                animate="visible"
                className="space-y-4"
                initial="hidden"
                variants={containerVariants}
              >
                {statusFeatures.map((feature, fIdx) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: -20 }}
                    key={feature.id}
                    transition={{
                      delay: 0.4 + index * 0.15 + fIdx * 0.08,
                      duration: 0.5,
                    }}
                  >
                    <FeatureCard
                      expanded={expandedCards.has(feature.id)}
                      feature={feature}
                      onToggle={() => onToggleCard(feature.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          );
        }
      )}
    </motion.div>
  );
}

function ListView({
  features,
  expandedCards,
  onToggleCard,
}: {
  features: RoadmapFeature[];
  expandedCards: Set<string>;
  onToggleCard: (id: string) => void;
}) {
  return (
    <motion.div
      animate="visible"
      className="space-y-4"
      initial="hidden"
      variants={containerVariants}
    >
      {features.map((feature, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 30 }}
          key={feature.id}
          transition={{
            delay: index * 0.08,
            duration: 0.5,
            ease: 'easeOut',
          }}
        >
          <FeatureCard
            expanded={expandedCards.has(feature.id)}
            feature={feature}
            onToggle={() => onToggleCard(feature.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function RoadmapPage(): ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FeatureStatus | 'all'>(
    'all'
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  const toggleCard = (id: string): void => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFeatures = roadmapData.filter((feature) => {
    const matchesSearch =
      searchQuery === '' ||
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.details?.some((detail) =>
        detail.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter =
      selectedFilter === 'all' || feature.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen w-full">
      <LandingHeader />

      <main className="relative w-full flex-1 pb-10">
        {/* Hero with enhanced animations */}
        <AnimatedSection
          allowOverlap
          className="isolate overflow-visible px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8"
          dustIntensity="low"
          parallaxY={24}
          revealStrategy="none"
          softEdges
        >
          <motion.div
            animate="visible"
            className="relative z-10 mx-auto w-full max-w-4xl"
            initial="hidden"
            style={{ opacity, scale }}
            variants={containerVariants}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-orange-500/10 px-3 py-1 backdrop-blur-sm md:mb-8"
              transition={{ type: 'spring', stiffness: 400 }}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                <Sparkles className="h-3 w-3 text-primary" />
              </motion.div>
              <span className="font-medium text-primary text-xs tracking-wide">
                Live Updates • Community Driven
              </span>
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                <Sparkles className="h-3 w-3 text-primary" />
              </motion.div>
            </motion.div>

            <motion.h1
              className="mt-2 mb-4 font-bold text-4xl sm:text-5xl md:mt-4 md:mb-6 md:text-6xl lg:text-7xl"
              variants={itemVariants}
            >
              <motion.span
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary"
                style={{ backgroundSize: '200% 100%' }}
                transition={{
                  duration: 8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                Interactive Product Roadmap
              </motion.span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-3 mb-10 max-w-3xl text-lg text-muted-foreground sm:text-xl md:mt-4 md:mb-12 md:text-2xl"
              variants={itemVariants}
            >
              Track our progress, explore upcoming features, and see what we're
              building next.{' '}
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                className="font-semibold text-primary"
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              >
                Click on any card
              </motion.span>{' '}
              to see more details.
            </motion.p>

            {/* Info badges with animated glow background */}
            <motion.div className="relative mt-6" variants={itemVariants}>
              {/* Animated glow effect behind info */}
              <motion.div
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                className="-inset-4 pointer-events-none absolute rounded-xl"
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
              >
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(50%_30%_at_50%_50%,rgba(34,197,94,0.08)_0%,rgba(34,197,94,0.04)_40%,transparent_85%)] blur-[6px]" />
              </motion.div>

              <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs sm:flex-row sm:gap-4">
                <motion.span
                  className="flex items-center gap-1"
                  transition={{ type: 'spring', stiffness: 400 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Clock className="h-3 w-3" />
                  Last updated: {new Date().toISOString().split('T')[0]}
                </motion.span>
                <motion.div
                  transition={{ type: 'spring', stiffness: 400 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Badge className="gap-1" variant="outline">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                    </motion.div>
                    Pro+ Voting Coming Soon
                  </Badge>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatedSection>

        {/* Controls */}
        <AnimatedSection
          className="px-4 py-12 sm:px-6 lg:px-8"
          dustIntensity="low"
          parallaxY={8}
          revealStrategy="inview"
          softEdges
        >
          <div className="relative z-10 mx-auto max-w-6xl space-y-4">
            {/* Show results count when searching */}
            {searchQuery && (
              <div className="mb-4 text-muted-foreground text-sm">
                Found {filteredFeatures.length}{' '}
                {filteredFeatures.length === 1 ? 'feature' : 'features'}{' '}
                matching "{searchQuery}"
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search roadmap features"
                  className="pr-4 pl-9"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features by name, category, or description..."
                  type="search"
                  value={searchQuery}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('all')}
                  size="sm"
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                >
                  <Filter className="mr-1 h-4 w-4" />
                  All
                  {searchQuery && ` (${filteredFeatures.length})`}
                </Button>
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('completed')}
                  size="sm"
                  variant={
                    selectedFilter === 'completed' ? 'default' : 'outline'
                  }
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Completed
                </Button>
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('in-progress')}
                  size="sm"
                  variant={
                    selectedFilter === 'in-progress' ? 'default' : 'outline'
                  }
                >
                  <Clock className="mr-1 h-4 w-4" />
                  In Progress
                </Button>
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('upcoming')}
                  size="sm"
                  variant={
                    selectedFilter === 'upcoming' ? 'default' : 'outline'
                  }
                >
                  <Calendar className="mr-1 h-4 w-4" />
                  Upcoming
                </Button>
              </div>
            </div>

            {/* View Tabs */}
            <Tabs
              onValueChange={(v: string) => setViewMode(v as ViewMode)}
              value={viewMode}
            >
              <TabsList className="mb-2 grid w-full max-w-md grid-cols-3">
                <TabsTrigger className="gap-2" value="timeline">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger className="gap-2" value="kanban">
                  <Grid3x3 className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger className="gap-2" value="list">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-6" value="timeline">
                {filteredFeatures.length > 0 ? (
                  <TimelineView
                    expandedCards={expandedCards}
                    features={filteredFeatures}
                    onToggleCard={toggleCard}
                  />
                ) : (
                  <EmptySearchState
                    Icon={Search}
                    onClearFilters={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent className="mt-6" value="kanban">
                {filteredFeatures.length > 0 ? (
                  <KanbanView
                    expandedCards={expandedCards}
                    features={filteredFeatures}
                    onToggleCard={toggleCard}
                  />
                ) : (
                  <EmptySearchState
                    Icon={Grid3x3}
                    onClearFilters={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent className="mt-6" value="list">
                {filteredFeatures.length > 0 ? (
                  <ListView
                    expandedCards={expandedCards}
                    features={filteredFeatures}
                    onToggleCard={toggleCard}
                  />
                ) : (
                  <EmptySearchState
                    Icon={List}
                    onClearFilters={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </AnimatedSection>

        {/* Footer CTA with enhanced animations */}
        <AnimatedSection
          allowOverlap
          className="isolate overflow-visible px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8"
          dustIntensity="medium"
          parallaxY={16}
          revealStrategy="inview"
          softEdges
          useSurface={false}
        >
          <motion.div
            className="relative z-10 mx-auto max-w-4xl"
            initial={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-100px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <motion.h3
              className="mb-4 font-bold text-2xl md:text-3xl"
              initial={{ opacity: 0, y: 30 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <motion.span
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary"
                style={{ backgroundSize: '200% 100%' }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                Have feedback or feature requests?
              </motion.span>
            </motion.h3>
            <motion.p
              className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-10"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              We'd love to hear from you! Pro+ Voting Coming Soon.
            </motion.p>

            {/* Animated glow effect behind buttons */}
            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1 }}
            >
              <motion.div
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.05, 1],
                }}
                className="-inset-8 pointer-events-none absolute rounded-2xl"
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(60%_40%_at_50%_50%,rgba(34,197,94,0.10)_0%,rgba(34,197,94,0.05)_40%,transparent_85%)] blur-[12px]" />
              </motion.div>

              <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    delay: 0.5,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="group relative overflow-hidden"
                    size="lg"
                    variant="default"
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ opacity: 1 }}
                    />
                    <motion.div
                      className="flex items-center"
                      transition={{ type: 'spring', stiffness: 400 }}
                      whileHover={{ x: 2 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                      </motion.div>
                      Vote on Features Coming Soon (Pro+)
                    </motion.div>
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    delay: 0.6,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/referral-info">
                    <Button
                      className="group border-primary/20 backdrop-blur-sm hover:border-primary/40"
                      size="lg"
                      variant="outline"
                    >
                      Learn about referrals
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatedSection>
        <SiteLinksSection />
      </main>
      <LandingFooter />
    </div>
  );
}
