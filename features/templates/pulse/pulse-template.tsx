"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";
import {
  GithubIcon as Github,
  LinkedinIcon as Linkedin,
} from "@/components/icons";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDateRange,
  groupSkillsByCategory,
} from "@/features/templates/utils";
import type {
  PortfolioData,
  PortfolioCustomization,
} from "@/features/templates/types";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import {
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  PROJECT_CARD_BODY,
  PROJECT_CARD_HEADER,
  PROJECT_CARD_META,
  PROJECT_CARD_TITLE,
  HERO_HEADER_COLUMN,
  HERO_HEADLINE_SCALE,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  SocialPills,
  PROJECTS_GRID_2,
  TEMPLATE_CONTAINER,
  getSectionLabels,
} from "@/features/templates/shared";
import { CollapsibleList } from "@/features/templates/collapsible-list";
import { getTemplateSectionLayout } from "@/features/templates/section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import styles from "./pulse-template.module.css";
import {
  Terminal,
  Cpu,
  MessageSquare,
  MapPin,
  Phone,
  Globe,
  Copy,
  Check,
  Server,
  Database,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Calendar,
  Award,
  Trophy,
  Star,
  GitFork,
  ExternalLink,
  Play,
  CheckCircle2,
  RotateCcw,
  Network,
  Zap,
  Send,
  Inbox,
  Clock,
  Trash2,
  RefreshCw,
  Mail,
  Menu,
  X,
} from "lucide-react";

// ==========================================
// 1. TYPES (derived from the shared PortfolioData contract)
// ==========================================
type PortfolioMeta = PortfolioData["portfolio"];
type Experience = PortfolioData["experiences"][number];
type Education = PortfolioData["educations"][number];
type Skill = PortfolioData["skills"][number];
type Project = PortfolioData["projects"][number];
type Article = PortfolioData["articles"][number];
type SocialProfile = PortfolioData["socialProfiles"][number];
type Certification = PortfolioData["certifications"][number];
type Achievement = PortfolioData["achievements"][number];
type CustomSection = PortfolioData["customSections"][number];

interface AppProps {
  data: PortfolioData;
}

// ==========================================
// SHARED HELPERS (null-safety for fields that are optional on the real data)
// ==========================================
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-bluish-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-bluish-display",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-bluish-serif",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-bluish-mono",
});

function displayDate(dateStr: string | null, fallback = "N/A"): string {
  return formatDate(dateStr) || fallback;
}

function displayYear(dateStr: string | null, fallback = "N/A"): string {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) return String(date.getFullYear());
  return dateStr.split("-")[0] || fallback;
}

/** experiences/educations duration calc — guards against a missing start date. */
function getDuration(start: string | null, end: string | null): string {
  if (!start) return '';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  if (Number.isNaN(startDate.getTime())) return '';

  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();

  let totalMonths = years * 12 + months;
  if (totalMonths <= 0) totalMonths = 1;

  const displayYears = Math.floor(totalMonths / 12);
  const displayMonths = totalMonths % 12;

  let durationStr = '';
  if (displayYears > 0) {
    durationStr += `${displayYears} yr${displayYears > 1 ? 's' : ''} `;
  }
  if (displayMonths > 0) {
    durationStr += `${displayMonths} mo${displayMonths > 1 ? 's' : ''}`;
  }
  return durationStr.trim();
}

/** skills.level is now a numeric score (0-5) or null — map it to a label + progress meter. */
function getSkillLevelInfo(level: number | null): { label: string; value: number; color: string } {
  if (level === null || level === undefined) {
    return { label: 'N/A', value: 40, color: 'from-slate-500 to-slate-400' };
  }
  if (level >= 4.5) return { label: 'Expert', value: 95, color: 'from-blue-500 to-indigo-500' };
  if (level >= 3.5) return { label: 'Advanced', value: 80, color: 'from-emerald-500 to-teal-500' };
  if (level >= 2) return { label: 'Intermediate', value: 65, color: 'from-amber-500 to-orange-500' };
  return { label: 'Familiar', value: 50, color: 'from-slate-500 to-slate-400' };
}

/** cachedStats is Record<string, unknown> | null; read known fields safely. */
function getStat(stats: Record<string, unknown> | null, key: string): number {
  if (!stats) return 0;
  const val = stats[key];
  return typeof val === 'number' ? val : 0;
}

// ==========================================
// 2. HEADER COMPONENT
// ==========================================
interface HeaderProps {
  portfolioTitle: string;
  navItems: Array<{ id: string; label: string }>;
  activeSection: string;
  setActiveSection: (section: string) => void;
  primaryColor: string;
  accentColors: { name: string; hex: string; className: string }[];
  setPrimaryColor: (hex: string) => void;
}

function Header({
  portfolioTitle,
  navItems,
  activeSection,
  setActiveSection,
  primaryColor,
  accentColors,
  setPrimaryColor,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 @sm:px-6 @lg:px-8">
        {/* Logo/Brand */}
        <div
          onClick={() => handleScroll(navItems[0]?.id ?? 'about')}
          className="flex cursor-pointer items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white hover:opacity-95"
          id="header-brand-logo"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 transition-colors"
            style={{ color: primaryColor }}
          >
            <Terminal className="h-4.5 w-4.5" />
          </div>
          <span className="hidden max-w-48 truncate @sm:inline">{portfolioTitle}</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden @md:flex items-center gap-1" id="header-nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScroll(item.id)}
              className={`relative px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold transition-colors duration-200 rounded-md hover:text-white ${activeSection === item.id
                  ? 'text-white bg-white/5'
                  : 'text-slate-400'
                }`}
              id={`nav-item-${item.id}`}
            >
              {item.label}
              {activeSection === item.id && (
                <span
                  className="absolute bottom-1 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Customization Quick Controls */}
        <div className="flex items-center gap-2 @sm:gap-4" id="header-customizer-controls">
          <div className="flex items-center gap-2 bg-white/5 px-2 @sm:px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold hidden @sm:inline">Accent:</span>
            <div className="flex gap-1.5">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setPrimaryColor(color.hex)}
                  className={`h-4 w-4 rounded-full border transition-all ${primaryColor === color.hex
                      ? 'scale-125 border-white ring-2 ring-slate-950'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'
                    }`}
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} Accent`}
                  id={`accent-picker-${color.name.toLowerCase()}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => handleScroll('contact')}
            className="hidden @sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold font-display bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all hover:border-white/20"
            id="header-cta-connect"
          >
            <MessageSquare className="h-3.5 w-3.5" style={{ color: primaryColor }} />
            <span>Connect</span>
          </button>

          {navItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="@md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {mobileMenuOpen && navItems.length > 0 && (
        <nav className="border-t border-white/10 bg-[#0a0a0a]/95 px-4 py-3 @md:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScroll(item.id)}
                className={`rounded-lg px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-wider ${activeSection === item.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

// ==========================================
// 3. HERO COMPONENT
// ==========================================
interface HeroProps {
  portfolio: PortfolioMeta;
  socialProfiles: SocialProfile[];
  primaryColor: string;
  showSummary?: boolean;
}

function Hero({ portfolio, socialProfiles, primaryColor, showSummary = true }: HeroProps) {
  const [copied, setCopied] = useState(false);
  const [simulatedLoad, setSimulatedLoad] = useState(12);
  const [activeTab, setActiveTab] = useState<'details' | 'runtime'>('details');

  const handleCopyEmail = () => {
    if (!portfolio.contactEmail) return;
    navigator.clipboard.writeText(portfolio.contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedLoad(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return Math.max(5, Math.min(35, next));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden px-0 pt-8 pb-14 @sm:pt-12 @sm:pb-20 @md:py-28" id="about">
      {/* Absolute Ambient Glow */}
      <div
        className="absolute -top-40 right-0 h-96 w-96 rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute -bottom-20 left-10 h-72 w-72 rounded-full blur-[100px] opacity-10 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">
        <div className="grid grid-cols-1 @lg:grid-cols-12 gap-12 @lg:gap-16 items-center">

          {/* Left Column: Core Bio */}
          <div className="@lg:col-span-7 space-y-8" id="hero-bio-container">


            <div className={cn(HERO_HEADER_COLUMN, "space-y-4")}>
              <h1
                className={cn(
                  HERO_TITLE_BASE,
                  HERO_TITLE_SCALE_7XL,
                  "font-serif font-normal italic tracking-tight text-white leading-tight"
                )}
              >
                Hi, I&apos;m <span className="block mt-1 relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 not-italic font-sans font-bold">
                  {portfolio.title}
                </span>
              </h1>

              {portfolio.headline && (
                <h2
                  className={cn(HERO_HEADLINE_SCALE, "font-display font-medium tracking-tight")}
                  style={{ color: primaryColor }}
                >
                  {portfolio.headline}
                </h2>
              )}

              {showSummary && portfolio.summary && (
                <DescriptionBlock
                  text={portfolio.summary}
                  paragraphClassName="font-sans text-base @sm:text-lg text-slate-400 leading-relaxed max-w-2xl"
                  listClassName="space-y-2 pl-5 font-sans text-base @sm:text-lg text-slate-400 leading-relaxed max-w-2xl marker:text-slate-500"
                />
              )}

              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-slate-300"
              />
              <div id="hero-profiles" className="scroll-mt-24 space-y-3">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                />
              </div>
            </div>

            {/* Quick Contact Specs */}
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 pt-2 text-sm text-slate-400 font-mono" id="hero-quick-specs">
              {portfolio.location && (
                <div className="flex min-w-0 items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{portfolio.location}</span>
                </div>
              )}
              {portfolio.phone && (
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{portfolio.phone}</span>
                </div>
              )}
              {portfolio.websiteUrl && (
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                  <a
                    href={portfolio.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 break-all hover:text-white transition-colors underline decoration-slate-700 underline-offset-4"
                  >
                    {portfolio.websiteUrl.replace('https://', '')}
                  </a>
                </div>
              )}
              {portfolio.contactEmail && (
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">{portfolio.contactEmail}</span>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-md transition-all shrink-0"
                    title="Copy Email Address"
                    id="hero-copy-email-btn"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. TIMELINE COMPONENT
// ==========================================
interface TimelineProps {
  experiences: Experience[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}

function Timeline({ experiences, primaryColor, labels }: TimelineProps) {
  if (experiences.length === 0) return null;

  return (
    <section key="experience" className="py-20 bg-transparent" id="experience">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">

        {/* Section Heading */}
        <div className="mb-8">
          <SectionHeading>{labels.experience}</SectionHeading>
        </div>

        <div className="space-y-16">

          {/* Work Experience */}
          <div className="space-y-10" id="timeline-experience-list">
              <div className="relative border-l border-white/10 pl-6 ml-5">
                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-12"
                  buttonClassName="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {experiences.map((exp) => {
                    const bulletPoints = (exp.description ?? "")
                      .split("\n")
                      .filter((p) => p.trim().length > 0);
                    const duration = getDuration(exp.startDate, exp.endDate);
                    return (
                      <div key={exp.id} className="relative group" id={`experience-card-${exp.id}`}>

                        {/* Timeline Node Point */}
                        <div
                          className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0a0a0a] border-2 transition-all group-hover:scale-125"
                          style={{
                            borderColor: primaryColor,
                            boxShadow: `0 0 10px ${primaryColor}40`
                          }}
                        />

                        <div className="space-y-4">
                          {/* Title & Metadata Card Header */}
                          <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="font-display text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                                {exp.role}
                              </h4>
                              <span
                                className="font-sans text-sm font-semibold transition-colors"
                                style={{ color: primaryColor }}
                              >
                                {exp.company}
                              </span>
                            </div>

                            {/* Period Tag */}
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md self-start @sm:self-center">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDateRange(exp.startDate, exp.endDate) || "N/A"}
                              </span>
                              {duration && (
                                <>
                                  <span className="text-white/10">|</span>
                                  <span className="text-slate-400">{duration}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Location details */}
                          {exp.location && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                              <MapPin className="h-3 w-3" />
                              <span>{exp.location}</span>
                            </div>
                          )}

                          {/* Decoded Bullet Points */}
                          {bulletPoints.length > 0 && (
                            <CollapsibleList
                              initial={3}
                              wrapperClassName="space-y-3 pt-1"
                              buttonClassName="mt-1 text-xs font-mono text-slate-400 hover:text-white transition-colors"
                            >
                              {bulletPoints.map((point, pIdx) => (
                                <div key={pIdx} className="flex gap-3 text-sm text-slate-400 leading-relaxed">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700 group-hover:bg-slate-400 transition-colors" />
                                  <span>{point}</span>
                                </div>
                              ))}
                            </CollapsibleList>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleList>
              </div>
            </div>

        </div>
      </div>
    </section>
  );
}

interface EducationSectionProps {
  educations: Education[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}

function EducationSection({ educations, primaryColor, labels }: EducationSectionProps) {
  if (educations.length === 0) return null;

  return (
    <section key="education" className="py-20 bg-transparent" id="education">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">
        <div className="space-y-10" id="timeline-education-list">
          <SectionHeading>{labels.education}</SectionHeading>

          <CollapsibleList
            initial={4}
            wrapperClassName="grid grid-cols-1 @md:grid-cols-2 gap-8"
            buttonClassName="@md:col-span-2 mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {educations.map((edu) => (
              <div
                key={edu.id}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all shadow-xl space-y-4"
                id={`education-card-${edu.id}`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-display text-base font-bold text-white">
                      {edu.degree}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-[#0a0a0a]/80 px-2 py-0.5 rounded border border-white/10">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {displayYear(edu.endDate)}
                      </span>
                    </div>
                  </div>
                  {edu.field && (
                    <p className="font-sans text-sm text-slate-400 font-medium">
                      {edu.field}
                    </p>
                  )}
                  <p
                    className="font-display text-xs font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {edu.institution}
                  </p>
                </div>

                {edu.gpa && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Cumulative GPA Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 items-center gap-1 bg-[#0a0a0a]/85 px-2.5 py-0.5 rounded border border-white/10 text-white font-bold">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span>{edu.gpa}</span>
                        <span className="text-slate-500 font-normal">/ 10</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CollapsibleList>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. SKILLS MATRIX COMPONENT
// ==========================================
interface SkillsMatrixProps {
  skills: Skill[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}

function SkillsMatrix({ skills, primaryColor, labels }: SkillsMatrixProps) {
  const groupedSkills = useMemo(() => groupSkillsByCategory(skills), [skills]);

  const skillLevelByName = useMemo(() => {
    const map = new Map<string, number | null>();
    skills.forEach((skill) => map.set(`${skill.category}::${skill.name}`, skill.level));
    return map;
  }, [skills]);

  return (
    <section className="py-20 bg-transparent border-y border-white/10" id="skills">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <SectionHeading>{labels.skills}</SectionHeading>
        </div>

        {/* Category-wise Skill Groups */}
        <div className="space-y-12" id="skills-matrix-grid">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className="space-y-5">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
                  {category}
                </h3>
              </div>

              <div className="grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 gap-6">
                {names.map((name) => {
                  const prof = getSkillLevelInfo(skillLevelByName.get(`${category}::${name}`) ?? null);
                  return (
                    <div
                      key={`${category}-${name}`}
                      className="relative min-h-auto overflow-hidden p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between gap-4 group"
                      id={`skill-card-${category}-${name}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 space-y-1">
                          <span className="block break-words text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                            {category}
                          </span>
                          <h4 className="line-clamp-2 break-words font-display text-base font-bold text-white group-hover:text-white">
                            {name}
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ==========================================
// 6. PROJECTS SHOWCASE COMPONENT
// ==========================================
interface ProjectsShowcaseProps {
  projects: Project[];
  primaryColor: string;
  livePreviewProjectIds: string[];
  labels: ReturnType<typeof getSectionLabels>;
}

function ProjectsShowcase({
  projects,
  primaryColor,
  livePreviewProjectIds,
  labels,
}: ProjectsShowcaseProps) {
  const firstTwo = projects.slice(0, 2);
  const [selectedSimId, setSelectedSimId] = useState<string>(firstTwo[0]?.id ?? '');
  const [simPayload, setSimPayload] = useState<string>(
    JSON.stringify({ event: 'push', repository: firstTwo[0]?.title ?? 'repo', commits: 5, ref: 'refs/heads/main' }, null, 2)
  );
  const [simOutput, setSimOutput] = useState<string[]>([
    'System ready. Select a service above and click "Simulate Pipeline Execution" to run.',
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  const selectSimulation = (project: Project) => {
    setSelectedSimId(project.id);
    setSimPayload(JSON.stringify({ event: 'push', repository: project.title, commits: 5, ref: 'refs/heads/main' }, null, 2));
    setSimOutput([`System ready. Click "Simulate Pipeline" to trigger a run against ${project.title}.`]);
    setSimStep(0);
  };

  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);

    const logs: string[] = [];
    const pushLog = (msg: string) => {
      logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setSimOutput([...logs]);
    };

    pushLog('⚡ Incoming event detected on service gateway');

    await new Promise(r => setTimeout(r, 600));
    setSimStep(2);
    pushLog('🔍 Parsing payload signature & validating checksum...');

    await new Promise(r => setTimeout(r, 700));
    setSimStep(3);
    pushLog('📦 Event loop checking pool congestion. Allocating thread task queue...');

    await new Promise(r => setTimeout(r, 800));
    setSimStep(4);
    pushLog('💾 Querying local cache for related state...');
    pushLog('🟢 CACHE HIT - bypassed database lookup to avoid redundant connections');

    await new Promise(r => setTimeout(r, 900));
    setSimStep(5);
    pushLog('🚀 Dispatching asynchronous task to microservice workers...');
    pushLog('✅ System completed dispatch. Status: 202 Accepted.');

    setIsSimulating(false);
  };

  return (
    <section className="py-20" id="work">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">

        {/* Header Title */}
        <div className="mb-16">
          <SectionHeading>{labels.projects}</SectionHeading>
        </div>

        {/* Projects Grid */}
        <CollapsibleList
          initial={4}
          wrapperClassName={cn(PROJECTS_GRID_2, "gap-8 mb-20")}
          buttonClassName="@md:col-span-2 mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                PROJECT_CARD,
                "relative rounded-3xl bg-white/5 border transition-all hover:bg-white/10 hover:scale-[1.01] flex flex-col justify-between",
                project.featured
                  ? "border-white/20 ring-1 ring-white/10"
                  : "border-white/10"
              )}
              id={`project-card-${project.id}`}
            >

              {/* Card Body */}
              <div className={cn(PROJECT_CARD_BODY, "space-y-6")}>

                {/* Visual Image Header */}
                <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10">
                  <TemplateProjectPreview
                    templateId="pulse"
                    liveUrl={project.liveUrl}
                    projectId={project.id}
                    livePreviewProjectIds={livePreviewProjectIds}
                    alt={project.title}
                    loading="lazy"
                    containerClassName="h-full aspect-auto bg-[#0a0a0a]"
                    className="h-full w-full object-cover object-top opacity-75 transition-all duration-300 group-hover:opacity-90"
                  />
                  {/* Category overlay */}
                  {project.language && (
                    <div className="absolute top-4 left-4 max-w-[45%] truncate bg-[#0a0a0a]/95 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300">
                      {project.language}
                    </div>
                  )}

                  {project.featured && (
                    <div className="absolute top-4 right-4 max-w-[45%] truncate bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-right text-[11px] font-mono text-white font-semibold">
                      Featured Build
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className={PROJECT_CARD_HEADER}>
                    <div className={PROJECT_CARD_META}>
                      <h3 className={cn(PROJECT_CARD_TITLE, "font-display text-xl font-bold text-white leading-tight")}>
                        {project.title}
                      </h3>
                    </div>
                  </div>
                  {project.description && (
                    <DescriptionBlock
                      text={project.description}
                      paragraphClassName="font-sans text-sm text-slate-400 leading-relaxed"
                      listClassName="space-y-2 pl-5 font-sans text-sm text-slate-400 leading-relaxed marker:text-slate-600"
                    />
                  )}
                </div>

                {project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs font-mono text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 @sm:px-8 py-5 border-t border-white/10 bg-white/2 flex flex-wrap justify-between items-center gap-4">

                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                  <div className="flex items-center gap-1 hover:text-white transition-colors cursor-default">
                    <Star className="h-3.5 w-3.5" />
                    <span>{project.githubStars ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-white transition-colors cursor-default">
                    <GitFork className="h-3.5 w-3.5" />
                    <span>{project.githubForks ?? 0}</span>
                  </div>
                </div>

                <ProjectActions
                  liveUrl={project.liveUrl}
                  sourceUrl={project.sourceUrl}
                  liveClassName="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-white hover:bg-slate-100 text-slate-950 transition-all shadow"
                  sourceClassName="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#0a0a0a] hover:bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
                />

              </div>
            </div>
          ))}
        </CollapsibleList>

        {/* {firstTwo.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-4 @sm:p-10 shadow-2xl space-y-8" id="system-sandbox">

            <div className="flex flex-col @md:flex-row @md:items-start justify-between gap-6">
              <div className="space-y-3 min-w-0 flex-1">
                <SectionHeading as="h3">Architectural Execution Playground</SectionHeading>
                <p className="font-sans text-xs @sm:text-sm text-slate-400 max-w-xl">
                  Simulate low-level event flows, webhook triggers, and runtime socket handshakes built natively on my core components.
                </p>
              </div>

              <div className="flex max-w-full gap-2 overflow-x-auto bg-white/5 p-1.5 rounded-xl border border-white/10 self-stretch @md:self-start">
                {firstTwo.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => selectSimulation(project)}
                    className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${selectedSimId === project.id
                        ? 'bg-[#0a0a0a] text-white border border-white/10 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                    id={`sim-selector-${project.id}`}
                  >
                    {project.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 @lg:grid-cols-12 gap-8 items-stretch">

              <div className="@lg:col-span-5 flex flex-col justify-between space-y-5" id="sim-input-card">
                <div className="space-y-2">
                  <label className="block text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    Interactive Event Payload (Editable)
                  </label>
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]/80">
                    <textarea
                      rows={7}
                      value={simPayload}
                      onChange={(e) => setSimPayload(e.target.value)}
                      className="w-full bg-transparent p-4 font-mono text-xs text-slate-300 focus:outline-none focus:ring-0 placeholder-slate-600 leading-relaxed resize-none"
                      id="sim-payload-editor"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      JSON Format
                    </div>
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="h-auto w-full whitespace-normal text-center leading-snug flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-950 transition-colors shadow"
                  id="sim-trigger-btn"
                >
                  {isSimulating ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      <span>Executing pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-slate-700 fill-current" />
                      <span>Simulate Pipeline</span>
                    </>
                  )}
                </button>
              </div>

              <div className="@lg:col-span-7 flex flex-col justify-between space-y-6">

                <div className="bg-white/5 p-4 @sm:p-5 rounded-2xl border border-white/10 space-y-4">
                  <span className="block text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    Visual Architecture Process Sequence
                  </span>
                  <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3 text-center text-[10px] font-mono">
                    <div
                      className={`p-3.5 rounded-xl border transition-all ${simStep === 1 || simStep === 2
                          ? 'border-blue-500 text-white bg-blue-500/10 scale-105'
                          : simStep > 1
                            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5'
                            : 'border-white/10 bg-[#0a0a0a]/50'
                        }`}
                    >
                      <Network className="h-4 w-4 mx-auto mb-1.5 text-slate-500" style={{ color: simStep === 1 ? primaryColor : undefined }} />
                      <span className="block font-bold">1. RECEIVE</span>
                      <span className="text-[9px] text-slate-500">Gateway Port</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-xl border transition-all ${simStep === 3 || simStep === 4
                          ? 'border-blue-500 text-white bg-blue-500/10 scale-105'
                          : simStep > 3
                            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5'
                            : 'border-white/10 bg-[#0a0a0a]/50'
                        }`}
                    >
                      <Cpu className="h-4 w-4 mx-auto mb-1.5 text-slate-500" style={{ color: simStep === 3 ? primaryColor : undefined }} />
                      <span className="block font-bold">2. PROCESS</span>
                      <span className="text-[9px] text-slate-500">Event Loop Pool</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-xl border transition-all ${simStep === 5
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 scale-105'
                          : 'border-white/10 bg-[#0a0a0a]/50'
                        }`}
                    >
                      <CheckCircle2 className="h-4 w-4 mx-auto mb-1.5 text-slate-500" style={{ color: simStep === 5 ? '#10b981' : undefined }} />
                      <span className="block font-bold">3. DISPATCH</span>
                      <span className="text-[9px] text-slate-500">Sync Success</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between h-48">

                  <div className="bg-white/5 border-b border-white/10 px-3 @sm:px-4 py-2 flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                      <span className="ml-1.5 text-slate-400">system-compiler-logs</span>
                    </div>
                    <span>UTF-8 // BUN_SHELL</span>
                  </div>

                  <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed overflow-y-auto [overflow-wrap:anywhere] space-y-2 text-slate-300">
                    {simOutput.map((log, idx) => (
                      <div key={idx} className={idx === 0 && isSimulating ? 'text-white font-bold animate-pulse' : 'opacity-85'}>
                        {log}
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#0a0a0a] border-t border-white/5 px-3 @sm:px-4 py-1.5 flex flex-wrap justify-between items-center gap-2 text-[9px] font-mono text-slate-500">
                    <span>MEMORY_USAGE: 24.8MB</span>
                    <span>LATENCY: 0.04ms</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )} */}

      </div>
    </section>
  );
}

// ==========================================
// 7. ARTICLES AND SOCIALS COMPONENT
// ==========================================
// 7. ORDERABLE CONTENT SECTIONS
// ==========================================
function CertificationsSection({
  certifications,
  labels,
}: {
  certifications: Certification[];
  labels: ReturnType<typeof getSectionLabels>;
}) {
  const [certVerified, setCertVerified] = useState<string | null>(null);

  const handleVerifyCert = (certId: string) => {
    setCertVerified(certId);
    setTimeout(() => setCertVerified(null), 3000);
  };

  if (certifications.length === 0) return null;

  return (
    <section key="certifications" className="py-20 bg-transparent" id="certifications">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col @sm:flex-row @sm:items-center justify-between gap-4 group hover:border-white/20 transition-all"
              id={`cert-card-${cert.id}`}
            >
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-white">
                  {cert.name}
                </h4>
                <p className="font-sans text-xs text-slate-400">
                  Issued by <span className="font-semibold text-slate-300">{cert.issuer}</span>
                  {cert.issueDate && <> &bull; {displayDate(cert.issueDate)}</>}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start @sm:self-center shrink-0">
                <button
                  onClick={() => handleVerifyCert(cert.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border ${certVerified === cert.id
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#0a0a0a] text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                    }`}
                  id={`cert-verify-btn-${cert.id}`}
                >
                  {certVerified === cert.id ? '✓ CREDENTIAL_VALID' : 'Verify TLS Checksum'}
                </button>
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#0a0a0a] text-slate-500 hover:text-white border border-white/10 rounded-lg transition-colors"
                    title="Open Credential"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function ArticlesSection({
  articles,
  labels,
}: {
  articles: Article[];
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (articles.length === 0) return null;

  return (
    <section key="articles" className="py-20 bg-transparent" id="articles">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {articles.map((art) => (
            <a
              key={art.id}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 block group hover:bg-white/10 transition-all space-y-3"
              id={`article-card-${art.id}`}
            >
              <div className="space-y-1">
                {art.publishedAt && (
                  <span className="text-[10px] font-mono text-slate-500 bg-[#0a0a0a] px-2 py-0.5 rounded border border-white/10">
                    {displayDate(art.publishedAt)}
                  </span>
                )}
                <h4 className="font-display text-base font-bold text-white group-hover:text-white leading-snug pt-1">
                  {art.title}
                </h4>
                {art.description && (
                  <p className="font-sans text-xs text-slate-400 leading-relaxed line-clamp-2">{art.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                <span>Read entire publication{art.readTime ? ` · ${art.readTime} min` : ''}</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </a>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function AchievementsSection({
  achievements,
  primaryColor,
  labels,
}: {
  achievements: Achievement[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (achievements.length === 0) return null;

  return (
    <section key="achievements" className="py-20 bg-transparent" id="achievements">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="relative pl-4 space-y-8"
          buttonClassName="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="relative pl-6 border-l border-white/10 space-y-2 group"
              id={`achievement-card-${ach.id}`}
            >
              <div
                className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 border transition-all duration-300 group-hover:scale-110"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Trophy className="h-2.5 w-2.5" />
              </div>
              <div className="space-y-1">
                {ach.date && (
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {displayDate(ach.date)}
                  </span>
                )}
                <h4 className="font-display text-sm font-bold text-white leading-snug group-hover:text-slate-300 transition-colors">
                  {ach.title}
                </h4>
              </div>
            </div>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function ProfilesSection({
  portfolio,
  socialProfiles,
  hasProfiles,
  labels,
}: {
  portfolio: PortfolioMeta;
  socialProfiles: SocialProfile[];
  hasProfiles: boolean;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (!hasProfiles && socialProfiles.length === 0) return null;

  return (
    <section key="profiles" className="py-20 bg-transparent scroll-mt-24" id="profiles">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.profiles}</SectionHeading>
        {hasProfiles && (
          <ProfileLinksSection
            portfolio={portfolio}
            profiles={socialProfiles}
            chipClassName="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-slate-300"
            pillClassName="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-white/10 transition-colors"
            titleClassName="font-display text-sm font-bold text-white"
            textClassName="font-sans text-xs text-slate-400"
          />
        )}
        {socialProfiles.length > 0 && (
          <div className="space-y-4">
            {socialProfiles.map((prof) => {
              const isGitHub = prof.platform.toLowerCase() === 'github';
              const followers = getStat(prof.cachedStats, 'followers');
              const publicRepos = getStat(prof.cachedStats, 'publicRepos');
              const connections = getStat(prof.cachedStats, 'connections');
              return (
                <a
                  key={prof.platform}
                  href={prof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 block group hover:bg-white/10 transition-all"
                  id={`social-card-${prof.platform}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a] border border-white/10 text-slate-300 group-hover:text-white transition-colors">
                        {isGitHub ? <Github className="h-5 w-5" /> : <Linkedin className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-display text-base font-bold text-white uppercase tracking-wide">
                          {prof.platform}
                        </h4>
                        {prof.username && <span className="font-mono text-xs text-slate-400">@{prof.username}</span>}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  {prof.cachedStats && (
                    <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-center font-mono text-xs">
                      {isGitHub ? (
                        <>
                          <div>
                            <span className="block text-[11px] text-slate-500 uppercase">Followers</span>
                            <span className="font-bold text-white text-sm">{followers}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-slate-500 uppercase">Repositories</span>
                            <span className="font-bold text-white text-sm">{publicRepos}</span>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 text-left px-2">
                          <span className="inline-block text-[11px] text-slate-500 uppercase mr-2">Connections:</span>
                          <span className="font-bold text-emerald-400 text-sm">{connections}+ Industry Experts</span>
                        </div>
                      )}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// 8. CONTACT CRM COMPONENT
// ==========================================
interface ContactCRMProps {
  contactEmail: string | null;
  primaryColor: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  org: string;
  topic: string;
  text: string;
  timestamp: string;
}

function isStoredMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;

  const message = value as Record<string, unknown>;
  return (
    typeof message.id === 'string' &&
    typeof message.name === 'string' &&
    typeof message.email === 'string' &&
    typeof message.org === 'string' &&
    typeof message.topic === 'string' &&
    typeof message.text === 'string' &&
    typeof message.timestamp === 'string'
  );
}

function ContactCRM({ contactEmail, primaryColor }: ContactCRMProps) {
  const messageStorageKey = `pulse_portfolio_messages:${contactEmail ?? 'anonymous'}`;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [topic, setTopic] = useState('Hiring');
  const [text, setText] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>(['REST listener listening on port 3000...']);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem(messageStorageKey);
      if (saved) {
        try {
          const parsed: unknown = JSON.parse(saved);
          if (!Array.isArray(parsed) || !parsed.every(isStoredMessage)) {
            throw new Error('Saved messages have an invalid format');
          }

          setMessages(parsed);
          return;
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'Unknown storage error';
          localStorage.removeItem(messageStorageKey);
          setApiLogs((current) => [
            `[storage] Invalid saved inbox was reset: ${reason}`,
            ...current,
          ]);
        }
      }

      const starterMessages: Message[] = [
        {
          id: 'msg_starter_1',
          name: 'Sarah Jenkins',
          email: 'sjenkins@techstaffing.io',
          org: 'Prism Tech Partners',
          topic: 'Hiring',
          text: 'Hi, loved your open-source work. We are currently scouting a Lead Engineer with expertise in high-throughput backend systems. Let me know if you would be open to a casual discovery chat sometime next week!',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ];
      setMessages(starterMessages);
      localStorage.setItem(messageStorageKey, JSON.stringify(starterMessages));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [messageStorageKey]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !text) return;

    setIsSubmitting(true);
    const newLogs = [...apiLogs];
    newLogs.unshift(`[${new Date().toLocaleTimeString()}] 📨 Incoming HTTP POST request /api/v1/contact`);
    setApiLogs(newLogs);

    await new Promise(resolve => setTimeout(resolve, 800));

    const newMessage: Message = {
      id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      org: org || 'Independent Recruiter',
      topic,
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [newMessage, ...messages];
    setMessages(updatedMessages);
    localStorage.setItem(messageStorageKey, JSON.stringify(updatedMessages));

    setName('');
    setEmail('');
    setOrg('');
    setTopic('Hiring');
    setText('');
    setIsSubmitting(false);

    const completedLogs = [
      `[${new Date().toLocaleTimeString()}] ✅ DB Transaction SUCCESS - Message stored securely (ID: ${newMessage.id})`,
      `[${new Date().toLocaleTimeString()}] 💾 Allocated index lookup block for payload validation`,
      ...newLogs
    ];
    setApiLogs(completedLogs);
  };

  const handleClearMessages = () => {
    localStorage.removeItem(messageStorageKey);
    setMessages([]);
    setApiLogs([`[${new Date().toLocaleTimeString()}] 🗑️ Cleared client database logs`]);
  };

  return (
    <section className="py-20 border-t border-white/10" id="contact">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">

        {/* Title Heading */}
        <div className="mb-16 space-y-3">
          <SectionHeading>Secure Message Dispatcher</SectionHeading>
          <p className="font-sans text-sm @sm:text-base text-slate-400 max-w-xl">
            A real-time reactive REST transaction log dashboard representing custom CRM databases running server-side.
          </p>
        </div>

        <div className="grid grid-cols-1 @lg:grid-cols-12 gap-12 items-stretch">

          {/* Left Block: Interactive Contact Form (7/12) */}
          <div className="@lg:col-span-7 rounded-3xl border border-white/10 bg-white/5 p-6 @sm:p-8 space-y-6" id="contact-form-card">
            <div className="flex flex-col @sm:flex-row @sm:justify-between @sm:items-center gap-3 border-b border-white/10 pb-4">
              <h3 className="font-display text-base @sm:text-lg font-bold text-white flex items-center gap-2">
                <Send className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                Initialize REST Connection
              </h3>
              <button
                onClick={() => setInboxOpen(!inboxOpen)}
                className={`self-start px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${inboxOpen
                    ? 'bg-[#0a0a0a] text-white border-white/15'
                    : 'text-slate-400 hover:text-white border-transparent'
                  }`}
                id="contact-inbox-toggle-btn"
              >
                <Inbox className="h-4 w-4" />
                <span>Inbox ({messages.length})</span>
              </button>
            </div>

            {!inboxOpen ? (
              <form onSubmit={handleSendMessage} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wide">Client/Recruiter Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-colors"
                      id="contact-input-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wide">Secure Email Address</label>
                    <input
                      required
                      type="email"
                      placeholder="jane@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-colors"
                      id="contact-input-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wide">Organization name</label>
                    <input
                      type="text"
                      placeholder="Acme Systems"
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-colors"
                      id="contact-input-organization"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wide">Inquiry Topic Domain</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-colors"
                      id="contact-input-topic"
                    >
                      <option value="Hiring">Hiring / Core Role Opportunity</option>
                      <option value="Consultancy">Consultancy / Tech Architecture</option>
                      <option value="OpenSource">Open-Source Discussion</option>
                      <option value="Other">General / Saying Hi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wide">Encrypted Message Payload</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your engineering vacancy, stack demands, or consultancy request here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white p-4 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-colors resize-none leading-relaxed"
                    id="contact-input-text"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-auto w-full whitespace-normal text-center leading-snug flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-950 transition-colors"
                  id="contact-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Transmitting HTTP POST Packet...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 text-slate-800" />
                      <span>Transmit REST Request Packet</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-fadeIn font-mono">
                <div className="flex flex-col @sm:flex-row @sm:justify-between @sm:items-center gap-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Stored REST Records (Local DB Storage)</span>
                  {messages.length > 0 && (
                    <button
                      onClick={handleClearMessages}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/5 px-2.5 py-1 rounded border border-red-500/10 transition-colors"
                      id="contact-clear-db-btn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear Records</span>
                    </button>
                  )}
                </div>

                {messages.length > 0 ? (
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1" id="contact-inbox-scroller">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 space-y-2.5"
                      >
                        <div className="flex flex-col @sm:flex-row @sm:justify-between @sm:items-start gap-3 @sm:gap-4">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                              <span>{msg.name}</span>
                              <span className="text-[10px] font-normal text-slate-500">of</span>
                              <span className="text-xs text-slate-300 font-semibold">{msg.org}</span>
                            </h4>
                            <p className="break-all text-[10px] text-slate-500 lowercase pt-0.5">{msg.email}</p>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={{
                              color: primaryColor,
                              backgroundColor: `${primaryColor}10`,
                              borderColor: `${primaryColor}20`
                            }}
                          >
                            {msg.topic}
                          </span>
                        </div>

                        <p className="font-sans text-xs text-slate-300 leading-relaxed bg-[#0a0a0a] border border-white/5 p-2.5 rounded-lg">
                          {msg.text}
                        </p>

                        <div className="flex flex-col @sm:flex-row @sm:justify-between @sm:items-center gap-1 text-[9px] text-slate-500 pt-1">
                          <span className="break-all">REST_TRANSACTION_ID: {msg.id}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#0a0a0a] border border-dashed border-white/10 rounded-2xl space-y-3 font-mono">
                    <p className="text-xs text-slate-500">Your recruiting inbox is completely empty.</p>
                    <button
                      onClick={() => setInboxOpen(false)}
                      className="text-[11px] font-semibold px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors"
                    >
                      Write Starter Message
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Block: Live API Transaction Log Terminal (5/12) */}
          <div className="@lg:col-span-5 flex flex-col justify-between" id="api-transaction-console">

            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between h-full min-h-[300px]">

              {/* Header */}
              <div className="bg-white/5 border-b border-white/10 px-4 py-3.5 flex flex-wrap justify-between items-center gap-2 text-[11px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-4 w-4" style={{ color: primaryColor }} />
                  <span className="text-slate-400 font-semibold">express-server-logs</span>
                </div>
                <span>Port 3000 // Bun</span>
              </div>

              {/* Logs terminal body */}
              <div className="flex-1 p-5 font-mono text-[10.5px] leading-relaxed text-slate-400 overflow-y-auto [overflow-wrap:anywhere] max-h-[320px] space-y-2.5">
                {apiLogs.map((log, idx) => {
                  let logColor = 'text-slate-400';
                  if (log.includes('📨 Incoming')) logColor = 'text-blue-400 font-semibold';
                  if (log.includes('✅ DB Transaction')) logColor = 'text-emerald-400 font-semibold';
                  if (log.includes('🗑️')) logColor = 'text-amber-400 font-semibold';

                  return (
                    <div key={idx} className={logColor}>
                      {log}
                    </div>
                  );
                })}
              </div>

              {/* Status footer */}
              <div className="p-4 border-t border-white/10 bg-white/2 flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono text-slate-500">
                <span>POSTGRES_POOL_STATUS: ACTIVE</span>
                <span>IDLE: 0.0ms</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

// ==========================================
// 9. MAIN APP COMPONENT
// ==========================================
export function PulseTemplate({ data }: AppProps) {
  const {
    portfolio,
    experiences,
    educations,
    skills,
    projects,
    articles,
    socialProfiles,
    certifications,
    achievements,
    customSections,
    livePreviewProjectIds,
  } = data;

  const customization: PortfolioCustomization = portfolio.customization ?? {};
  const initialPrimaryColor =
    typeof customization.primaryColor === 'string' ? customization.primaryColor : '#3b82f6';

  const [activeSection, setActiveSection] = useState('about');
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);

  const githubProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github"
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const navItems = navbarEnabled ? sections : [];
  const navSectionIds = navItems.map((section) => section.id).join(",");
  const navSectionIdsRef = useRef(navSectionIds);
  navSectionIdsRef.current = navSectionIds;
  const labels = getSectionLabels(portfolio.customization);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("pulse"),
    portfolio.customization,
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: null,
    experience: experiences.length > 0 ? (
      <Timeline
        experiences={experiences}
        primaryColor={primaryColor}
        labels={labels}
      />
    ) : null,
    education: educations.length > 0 ? (
      <EducationSection
        educations={educations}
        primaryColor={primaryColor}
        labels={labels}
      />
    ) : null,
    skills: skills.length > 0 ? (
      <SkillsMatrix
        key="skills"
        skills={skills}
        primaryColor={primaryColor}
        labels={labels}
      />
    ) : null,
    projects: visibleProjects.length > 0 ? (
      <ProjectsShowcase
        key="projects"
        projects={visibleProjects}
        primaryColor={primaryColor}
        livePreviewProjectIds={livePreviewProjectIds}
        labels={labels}
      />
    ) : null,
    github: contributionCalendar ? (
      <section key="github" className="py-16" id="github-activity">
        <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
          <SectionHeading>{labels.github}</SectionHeading>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 overflow-x-auto">
            <div className="mx-auto w-max max-w-full">
              <GitHubContributionHeatmap
                calendar={contributionCalendar}
                profileUrl={githubProfile?.url}
                username={githubProfile?.username}
              />
            </div>
          </div>
        </div>
      </section>
    ) : null,
    certifications:
      certifications.length > 0 ? (
        <CertificationsSection
          certifications={certifications}
          labels={labels}
        />
      ) : null,
    articles:
      articles.length > 0 ? (
        <ArticlesSection articles={articles} labels={labels} />
      ) : null,
    achievements:
      achievements.length > 0 ? (
        <AchievementsSection
          achievements={achievements}
          primaryColor={primaryColor}
          labels={labels}
        />
      ) : null,
    profiles:
      hasProfiles || socialProfiles.length > 0 ? (
        <ProfilesSection
          portfolio={portfolio}
          socialProfiles={socialProfiles}
          hasProfiles={hasProfiles}
          labels={labels}
        />
      ) : null,
  };

  const accentColors = [
    { name: 'Blue', hex: '#3b82f6', className: 'bg-blue-500' },
    { name: 'Emerald', hex: '#10b981', className: 'bg-emerald-500' },
    { name: 'Purple', hex: '#8b5cf6', className: 'bg-purple-500' },
    { name: 'Orange', hex: '#f97316', className: 'bg-orange-500' },
    { name: 'Pink', hex: '#ec4899', className: 'bg-pink-500' },
  ];

  useEffect(() => {
    const handleScrollActive = () => {
      const scrollPosition = window.scrollY + 200;

      for (const section of navSectionIdsRef.current.split(",").filter(Boolean)) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollActive);
    return () => window.removeEventListener('scroll', handleScrollActive);
  }, []);

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        inter.variable,
        spaceGrotesk.variable,
        playfairDisplay.variable,
        jetBrainsMono.variable,
        "flex min-w-0 flex-col overflow-x-hidden font-sans selection:bg-slate-800 selection:text-white"
      )}
    >
      {/* Dynamic glow overlay */}
      <div
        className="fixed top-0 left-1/4 h-[40vh] w-[50vw] rounded-full blur-[140px] opacity-10 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Primary Header/Nav */}
      <Header
        portfolioTitle={portfolio.title}
        navItems={navItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        primaryColor={primaryColor}
        accentColors={accentColors}
        setPrimaryColor={setPrimaryColor}
      />

      {/* Main Content Sections */}
      <main className="flex-1" id="main-content-stream">

        {/* 1. Hero Bio Intro */}
        <Hero
          portfolio={portfolio}
          socialProfiles={socialProfiles}
          primaryColor={primaryColor}
          showSummary={!resolved.isHidden("about")}
        />

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && (
          <section className="py-20 bg-transparent">
            <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-12">
              {customSections.map((section) => (
                <div key={section.id} className="space-y-6" id={`custom-section-${section.id}`}>
                  <SectionHeading>{section.label}</SectionHeading>
                  <CustomSectionItems
                    items={section.items}
                    titleClassName="font-display text-base font-bold text-white"
                    textClassName="font-sans text-sm text-slate-400 leading-relaxed"
                    chipClassName="rounded-lg bg-[#0a0a0a] border border-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-400"
                    buttonClassName="mt-2 text-xs font-mono text-slate-400 hover:text-white"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Message Dispatcher Form and Recruiter Console */}
        {/* <ContactCRM
          contactEmail={portfolio.contactEmail}
          primaryColor={primaryColor}
        /> */}

      </main>

      {/* Primary Footer */}
      <footer className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-mono tracking-widest text-slate-500 py-8 mx-auto w-full max-w-7xl px-4 @sm:px-6 @lg:px-8">
        <div className="flex flex-col @md:flex-row items-center justify-between w-full gap-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" style={{ color: primaryColor }} />
            <span>{portfolio.title.toUpperCase()}</span>
          </div>

          <p className="text-center @md:text-right">
            &copy; {new Date().getFullYear()} {portfolio.title.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  children,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Tag
      className={
        Tag === "h3"
          ? "w-full border-b border-white/10 pb-4 text-left font-serif text-2xl @sm:text-3xl font-normal italic tracking-tight text-slate-200"
          : "w-full border-b border-white/10 pb-4 text-left font-serif text-3xl @sm:text-4xl font-normal italic tracking-tight text-slate-200"
      }
    >
      {children}
    </Tag>
  );
}