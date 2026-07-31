"use client";

import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import {
  PlatformIcon,
} from "@/components/icons";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { cn } from "@/lib/utils";
import { formatDateRange, groupSkillsByCategory } from "@/features/templates/utils";
import type { PortfolioData } from "@/features/templates/types";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import {
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
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
import styles from "./ledger-template.module.css";
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Star,
  GitFork,
  Calendar,
  Trophy,
  BookOpen,
  GraduationCap,
  Code,
  Search,
  Check,
  Copy,
  ArrowUpRight,
  Menu,
  X,
  Cpu,
  Database,
  Terminal,
  Layers,
  Cloud,
  ChevronRight,
  FileCheck,
  Filter,
} from "lucide-react";

interface AppProps {
  data: PortfolioData;
}

// ---- helpers -------------------------------------------------------------

function displayYear(date: string | null, fallback = "N/A"): string {
  if (!date) return fallback;
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) return String(parsed.getFullYear());
  return date.slice(0, 4) || fallback;
}

/** Initials from the first two words of a display name (e.g. "Akshai Kumar" → "AK"). */
function getInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/** skills.level is a numeric score (0-5) or null; map it to a display label + color. */
function getSkillLevelDisplay(level: number | null): { label: string; classes: string } | null {
  if (level === null || level === undefined) return null;
  if (level >= 4) {
    return { label: 'Expert', classes: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' };
  }
  if (level >= 3) {
    return { label: 'Advanced', classes: 'bg-blue-500/10 border border-blue-500/20 text-blue-400' };
  }
  return { label: 'Familiar', classes: 'bg-slate-900 border border-slate-800 text-slate-400' };
}

/** cachedStats is Record<string, unknown> | null; read known numeric-ish fields safely. */
function getSocialStatLabel(stats: Record<string, unknown> | null): string | null {
  if (!stats) return null;
  if (stats.followers !== undefined && stats.followers !== null) {
    return `${stats.followers} flwrs`;
  }
  if (stats.connections !== undefined && stats.connections !== null) {
    return `${stats.connections}+ conns`;
  }
  return null;
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ledger-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-ledger-display',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-ledger-mono',
});

export function LedgerTemplate({ data }: AppProps) {
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

  // State management
  const [copiedText, setCopiedText] = useState<'email' | 'phone' | null>(null);
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeExperienceTab, setActiveExperienceTab] = useState<string>(experiences[0]?.id ?? '');

  const githubProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github"
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const navItems = navbarEnabled ? sections : [];
  const labels = getSectionLabels(portfolio.customization);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("ledger"),
    portfolio.customization,
  );
  const isSectionEnabled = (id: 'about' | 'work' | 'experience' | 'profiles') =>
    sections.some((s) => s.id === id);
  const groupedSkills = groupSkillsByCategory(skills);
  const visibleProjects = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

  // Copy helper — no-ops gracefully if the value is missing
  const handleCopy = (text: string | null, type: 'email' | 'phone') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Get list of all distinct technologies in projects
  const allProjectTechs = useMemo(() => {
    const techs = new Set<string>();
    visibleProjects.forEach(p => p.techStack.forEach(t => techs.add(t)));
    return Array.from(techs);
  }, [visibleProjects]);

  // Filter projects based on search text and selected technology tag
  const filteredProjects = useMemo(() => {
    return visibleProjects.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.techStack.some(t => t.toLowerCase().includes(projectSearch.toLowerCase()));
      const matchesTech = selectedTech ? p.techStack.includes(selectedTech) : true;
      return matchesSearch && matchesTech;
    });
  }, [visibleProjects, projectSearch, selectedTech]);

  // Skill category icon helper
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'languages':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'runtimes':
        return <Cpu className="w-4 h-4 text-green-400" />;
      case 'frameworks':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'databases':
        return <Database className="w-4 h-4 text-amber-400" />;
      case 'orms':
        return <Terminal className="w-4 h-4 text-rose-400" />;
      case 'cloud':
        return <Cloud className="w-4 h-4 text-indigo-400" />;
      default:
        return <Code className="w-4 h-4 text-slate-400" />;
    }
  };

  // Render social profile icon helper
  const getSocialIcon = (platform: string, className = 'w-5 h-5') => (
    <PlatformIcon platform={platform} className={className} />
  );


  const blocks: Partial<Record<ReorderableSectionKey, ReactNode>> = {
    about: null,
    experience: experiences.length > 0
      ? (
        <section key="experience" id="experience" className="space-y-8 scroll-mt-20">
            <div className="border-l-2 border-blue-500 pl-4">
              <SectionHeading>{labels.experience}</SectionHeading>
            </div>

            <div className="grid grid-cols-1 @lg:grid-cols-12 gap-8">
              {/* Sidebar list for active experience */}
              <div id="experience-tabs" className="@lg:col-span-4 flex flex-row @lg:flex-col overflow-x-auto @lg:overflow-x-visible gap-2 pb-2 @lg:pb-0 border-b @lg:border-b-0 @lg:border-r border-slate-800">
                {experiences.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setActiveExperienceTab(exp.id)}
                    className={`flex-none max-w-[85vw] @lg:max-w-none @lg:flex-1 text-left px-4 py-3 border transition-all flex flex-col gap-1 items-start whitespace-nowrap @lg:whitespace-normal rounded-none ${
                      activeExperienceTab === exp.id
                        ? 'bg-blue-600/5 border-l-2 border-l-blue-500 border-slate-800 text-white'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                    }`}
                    id={`tab-${exp.id}`}
                  >
                    <span className="font-mono font-bold text-xs uppercase tracking-wider">{exp.role}</span>
                    <span className="text-xs font-mono text-slate-500">{exp.company}</span>
                  </button>
                ))}
              </div>

              {/* Active experience detail container */}
              <div className="@lg:col-span-8 min-h-[250px]">
                <AnimatePresence mode="wait">
                  {experiences.map((exp) => exp.id === activeExperienceTab && (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="bg-[#111418] border border-slate-800 p-6 @sm:p-8 rounded-none space-y-6"
                      id={`exp-content-${exp.id}`}
                    >
                      <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <h3 className="text-base @sm:text-lg font-mono font-bold text-white flex items-center gap-2 flex-wrap">
                            <span className="text-blue-500 uppercase">{exp.role}</span>
                            <span className="text-slate-500 font-normal">@</span>
                            <span className="text-white uppercase tracking-wide">{exp.company}</span>
                          </h3>
                          {exp.location && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                              <MapPin className="w-3.5 h-3.5 text-slate-600" />
                              <span className="uppercase">{exp.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono self-start @sm:self-center">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>
                            {formatDateRange(exp.startDate, exp.endDate)?.toUpperCase() ||
                              "N/A"}
                          </span>
                        </div>
                      </div>

                      {exp.description && (
                        <DescriptionBlock
                          text={exp.description}
                          paragraphClassName="text-sm text-slate-300 leading-relaxed"
                          listClassName="space-y-3 text-sm text-slate-300 leading-relaxed"
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>
      )
      : null,
    projects: visibleProjects.length > 0
      ? (
        <section key="projects" id="work" className="space-y-8 scroll-mt-20">
          <div className="flex flex-col @sm:flex-row @sm:items-end justify-between gap-4 border-l-2 border-blue-500 pl-4">
            <div>
              <SectionHeading>{labels.projects}</SectionHeading>
            </div>

            {/* Total count badge */}
            <div className="px-3 py-1.5 rounded-none bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              COUNT: {filteredProjects.length} / {visibleProjects.length}
            </div>
          </div>

          {/* Interactive Search & Filter Controls */}
          <div id="project-filters-container" className="bg-[#111418] border border-slate-800 p-4 rounded-none space-y-4">
            <div className="flex flex-col @md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  id="project-search-input"
                  placeholder="SEARCH PROJECTS BY NAME, DESCRIPTION, TECH..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-none py-2.5 pl-10 pr-4 text-xs font-mono uppercase tracking-wider text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
                {projectSearch && (
                  <button
                    onClick={() => setProjectSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hover:text-white px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-none"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* Technologies quick select dropdown or filter row */}
              {allProjectTechs.length > 0 && (
                <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1 @md:max-w-[55%] @md:pb-0">
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap flex items-center gap-1 uppercase tracking-wider">
                    <Filter className="w-3 h-3 text-blue-500" /> TECH STACK:
                  </span>
                  <button
                    onClick={() => setSelectedTech(null)}
                    className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                      selectedTech === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    id="filter-tech-all"
                  >
                    ALL TECH
                  </button>
                  {allProjectTechs.map(tech => (
                    <button
                      key={tech}
                      onClick={() => setSelectedTech(tech === selectedTech ? null : tech)}
                      className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                        selectedTech === tech
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                      id={`filter-tech-${tech}`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          <CollapsibleList
            initial={4}
            wrapperClassName={cn(PROJECTS_GRID_2, "gap-6")}
            buttonClassName="@md:col-span-2 mt-2 rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    PROJECT_CARD,
                    "group bg-[#111418] border border-slate-800 rounded-none hover:border-slate-700 transition-all duration-300 flex flex-col justify-between"
                  )}
                  id={`project-card-${project.id}`}
                >
                  <div>
                    {/* Project Header Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-950 border-b border-slate-800">
                      <TemplateProjectPreview
                        templateId="ledger"
                        liveUrl={project.liveUrl}
                        projectId={project.id}
                        livePreviewProjectIds={livePreviewProjectIds}
                        alt={project.title}
                        loading="lazy"
                        containerClassName="h-full aspect-auto bg-slate-950"
                        className="h-full w-full object-cover object-top opacity-60 transition-all duration-500 group-hover:opacity-80"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111418] to-transparent opacity-80" />

                      {/* Tags in header */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                        {project.featured ? (
                          <span className="px-2 py-1 rounded-none bg-blue-500/15 border border-blue-500/40 text-[9px] font-mono text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 backdrop-blur-sm">
                            <Star className="w-3 h-3 fill-blue-400" /> FEATURED
                          </span>
                        ) : <span />}

                        {project.language && (
                          <span className="min-w-0 max-w-[55%] truncate px-2 py-0.5 rounded-none bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                            {project.language}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project Body */}
                    <div className={cn(PROJECT_CARD_BODY, "space-y-4")}>
                      <div className={PROJECT_CARD_HEADER}>
                        <div className={PROJECT_CARD_META}>
                          <h3 className={cn(PROJECT_CARD_TITLE, "text-lg font-mono font-bold text-white uppercase group-hover:text-blue-500 transition-colors")}>
                            {project.title}
                          </h3>
                        </div>
                      </div>

                      {project.description && (
                        <DescriptionBlock
                          text={project.description}
                          paragraphClassName="text-sm text-slate-400 leading-relaxed"
                          listClassName="space-y-2 pl-5 text-sm text-slate-400 leading-relaxed marker:text-blue-500"
                        />
                      )}

                      {/* Tech Stack list */}
                      {project.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {project.techStack.map(tag => (
                            <button
                              key={tag}
                              onClick={() => setSelectedTech(tag === selectedTech ? null : tag)}
                              className={`px-2 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-wider transition-colors ${
                                selectedTech === tag
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Footer containing Actions and Stats */}
                  <div className="px-4 @sm:px-6 py-4 border-t border-slate-800/80 bg-slate-950/65 flex flex-wrap items-center justify-between gap-3">
                    {/* GitHub Stats */}
                    <div className="flex items-center gap-4 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                      {!!project.githubStars && (
                        <div className="flex items-center gap-1 hover:text-amber-400 transition-colors" title="GitHub Stars">
                          <Star className="w-3.5 h-3.5 text-blue-500" />
                          <span>{project.githubStars}</span>
                        </div>
                      )}
                      {!!project.githubForks && (
                        <div className="flex items-center gap-1 hover:text-blue-400 transition-colors" title="GitHub Forks">
                          <GitFork className="w-3.5 h-3.5 text-blue-500" />
                          <span>{project.githubForks}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Links */}
                    <ProjectActions
                      liveUrl={project.liveUrl}
                      sourceUrl={project.sourceUrl}
                      liveClassName="px-3 py-1 bg-blue-600 border border-blue-500 hover:bg-transparent text-white hover:text-blue-400 font-semibold text-[10px] font-mono uppercase tracking-widest rounded-none transition-all"
                      sourceClassName="px-3 py-1 text-slate-500 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-none transition-colors text-[10px] font-mono uppercase tracking-widest"
                    />
                  </div>
                </div>
              ))}
          </CollapsibleList>

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-12 text-center bg-[#111418] border border-slate-800 rounded-none">
                <p className="text-slate-500 font-mono text-sm uppercase tracking-wide">No projects found matching the selection criteria.</p>
                <button
                  onClick={() => { setProjectSearch(''); setSelectedTech(null); }}
                  className="mt-4 px-4 py-2 bg-blue-600/5 text-blue-400 text-xs font-mono uppercase tracking-widest rounded-none hover:bg-blue-600/10 border border-blue-500/20"
                >
                  RESET ALL FILTERS
                </button>
              </div>
            )}
        </section>
      )
      : null,
    skills: skills.length > 0
      ? (
        <section key="skills" id="skills" className="space-y-8 scroll-mt-20">
            <div className="border-l-2 border-blue-500 pl-4">
              <SectionHeading>{labels.skills}</SectionHeading>
            </div>

            <div id="skills-container" className="space-y-8">
              {Object.entries(groupedSkills).map(([category, names]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 gap-4">
                    {names.map((name) => {
                      const skill = skills.find((s) => s.name === name && s.category === category);
                      const levelDisplay = getSkillLevelDisplay(skill?.level ?? null);
                      return (
                        <div
                          key={`${category}-${name}`}
                          className="min-w-0 bg-[#111418] border border-slate-800 p-4 rounded-none flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition-colors group"
                        >
                          <div className="space-y-1.5">
                            <p className="font-mono font-bold text-xs uppercase text-white group-hover:text-blue-500 transition-colors">{name}</p>
                          </div>
                          {levelDisplay && (
                            <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-widest font-bold ${levelDisplay.classes}`}>
                              {levelDisplay.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
      )
      : null,
    achievements: achievements.length > 0
      ? (
        <section key="achievements" id="achievements" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-blue-500 pl-4">
                  <SectionHeading as="h3">{labels.achievements}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-[#111418] border border-slate-800 p-5 rounded-none hover:border-slate-700 transition-colors flex items-start gap-4"
                      id={`achievement-card-${achievement.id}`}
                    >
                      <div className="p-2.5 rounded-none bg-blue-500/5 border border-blue-500/20 text-blue-400 shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-mono font-bold text-white text-sm @sm:text-base uppercase tracking-wide">
                            {achievement.title}
                          </h4>
                          {achievement.date && (
                            <span className="text-[10px] font-mono text-slate-500 uppercase">
                              {achievement.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    certifications: certifications.length > 0
      ? (
        <section key="certifications" id="certifications" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-blue-500 pl-4">
                  <SectionHeading as="h3">{labels.certifications}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-[#111418] border border-slate-800 p-4 @sm:p-5 rounded-none hover:border-slate-700 transition-colors flex flex-col @sm:flex-row @sm:items-center @sm:justify-between gap-4"
                      id={`cert-card-${cert.id}`}
                    >
                      <div className="flex min-w-0 items-start @sm:items-center gap-3 @sm:gap-4">
                        <div className="p-2.5 rounded-none bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="break-words font-mono font-bold text-white text-sm @sm:text-base uppercase tracking-wide">
                            {cert.url ? (
                              <a href={cert.url} target="_blank" rel="noreferrer" className="hover:text-blue-400">
                                {cert.name}
                              </a>
                            ) : (
                              cert.name
                            )}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5 font-mono uppercase">
                            <span>{cert.issuer}</span>
                            {cert.issueDate && (
                              <>
                                <span className="text-slate-700">•</span>
                                <span>Issued {cert.issueDate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noreferrer"
                          className="self-end @sm:self-auto p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-none transition-colors shrink-0"
                          title="Verify Certificate"
                          id={`cert-verify-${cert.id}`}
                        >
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </a>
                      )}
                    </div>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    articles: articles.length > 0
      ? (
        <section key="articles" id="publications" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-blue-500 pl-4">
                  <SectionHeading as="h3">{labels.articles}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {articles.map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-[#111418] border border-slate-800 p-5 rounded-none hover:border-slate-700 transition-all group"
                      id={`article-card-${article.id}`}
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 uppercase">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          {article.publishedAt ? `Published ${new Date(article.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}` : 'Unpublished'}
                          {article.readTime ? ` · ${article.readTime} min read` : ''}
                        </span>
                        <h4 className="font-mono font-bold text-white text-sm @sm:text-base group-hover:text-blue-500 transition-colors leading-snug uppercase tracking-wide">
                          {article.title}
                        </h4>
                        {article.description && (
                          <DescriptionBlock
                            text={article.description}
                            paragraphClassName="text-xs text-slate-400 leading-relaxed line-clamp-2"
                            listClassName="space-y-1 pl-4 text-xs text-slate-400 leading-relaxed marker:text-blue-500"
                          />
                        )}
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {article.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-none bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-500 uppercase">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-blue-500 font-mono pt-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                          <span>Read Article</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </a>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    education: educations.length > 0
      ? (
        <section key="education" id="education" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-blue-500 pl-4">
                  <SectionHeading as="h3">{labels.education}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {educations.map((edu) => (
                    <div
                      key={edu.id}
                      className="bg-[#111418] border border-slate-800 p-5 rounded-none space-y-3"
                      id={`edu-card-${edu.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-none bg-blue-500/5 border border-blue-500/20 text-blue-400 shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-mono font-bold text-white text-sm @sm:text-base leading-snug uppercase tracking-wide">
                            {edu.institution}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono text-slate-500 uppercase">
                        <span>
                          {displayYear(edu.endDate)}
                        </span>
                        {edu.gpa && (
                          <span className="px-2 py-0.5 rounded-none bg-slate-900 border border-slate-800 text-emerald-400 font-bold">
                            GPA {edu.gpa}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    github: contributionCalendar
      ? (
        <section key="github" className="space-y-6 scroll-mt-20">
            <div className="border-l-2 border-blue-500 pl-4">
              <SectionHeading>{labels.github}</SectionHeading>
            </div>
            <div className="bg-[#111418] border border-slate-800 p-5 rounded-none overflow-x-auto">
              <div className="mx-auto w-max max-w-full">
                <GitHubContributionHeatmap
                  calendar={contributionCalendar}
                  profileUrl={githubProfile?.url}
                  username={githubProfile?.username}
                />
              </div>
            </div>
          </section>
      )
      : null,
    profiles: hasProfiles
      ? (
        <section key="profiles" id="profiles" className="space-y-6 scroll-mt-20">
            <div className="border-l-2 border-blue-500 pl-4">
              <SectionHeading>{labels.profiles}</SectionHeading>
            </div>
            <div className="bg-[#111418] border border-slate-800 p-5 rounded-none">
              <ProfileLinksSection
                portfolio={portfolio}
                profiles={socialProfiles}
                chipClassName="rounded-none border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-400"
                pillClassName="rounded-none border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
                titleClassName="font-mono text-xs uppercase tracking-wider text-blue-400"
                textClassName="text-xs text-slate-500"
              />
            </div>
          </section>
      )
      : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        inter.variable,
        spaceGrotesk.variable,
        jetBrainsMono.variable,
        "min-w-0 overflow-x-hidden font-sans selection:bg-blue-600/30 selection:text-white"
      )}
    >

      {/* Header / Navbar */}
      <header id="header" className="sticky top-0 z-50 bg-[#0A0C10]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 @sm:px-6 @lg:px-8 h-16 flex items-center justify-between">
          <a href="#about" id="logo" className="flex min-w-0 items-center gap-2 group">
            <span className="w-9 h-9 rounded-none border border-blue-500 bg-slate-900 flex items-center justify-center font-display font-bold text-white group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
              {getInitials(portfolio.title)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="max-w-44 truncate font-display font-semibold text-white leading-none text-sm tracking-wide group-hover:text-blue-400 transition-colors @sm:max-w-64">
                {portfolio.title}
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          {navItems.length > 0 && (
            <nav id="desktop-nav" className="hidden @lg:flex items-center gap-6 @xl:gap-8">
              {navItems.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                >
                  {section.label}
                </a>
              ))}
              {(portfolio.contactEmail || portfolio.phone) && (
                <a href="#contact" className="px-4 py-2 rounded-none border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white font-mono uppercase text-xs tracking-wider font-semibold transition-all">
                  {labels.contact}
                </a>
              )}
            </nav>
          )}

          {/* Mobile Menu Button */}
          {navItems.length > 0 && (
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="@lg:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && navItems.length > 0 && (
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="@lg:hidden border-t border-slate-800 bg-[#0A0C10]"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                {navItems.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-mono uppercase tracking-wider text-slate-300 hover:text-white py-2 border-b border-slate-800/60"
                  >
                    {section.label}
                  </a>
                ))}
                {(portfolio.contactEmail || portfolio.phone) && (
                  <a
                    href="#contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-none border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white font-mono uppercase text-xs tracking-wider font-semibold transition-colors"
                  >
                    {labels.contact}
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>


      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 @sm:px-6 @lg:px-8 py-8 @md:py-16 space-y-24 @sm:space-y-32">

        {/* HERO SECTION */}
        <section id="about" className="relative pt-4 @md:pt-12 scroll-mt-20">
          <div className="grid grid-cols-1 @md:grid-cols-12 gap-8 @md:gap-12 items-center">
            {/* Left info column */}
            <div className={cn(HERO_HEADER_COLUMN, "@md:col-span-7 space-y-6 order-2 @md:order-1 text-center @md:text-left")}>

              <h1
                id="hero-title"
                className={cn(
                  HERO_TITLE_BASE,
                  HERO_TITLE_SCALE_7XL,
                  "font-display font-extrabold text-white tracking-tighter uppercase leading-none"
                )}
              >
                {portfolio.title}
              </h1>

              {portfolio.headline && (
                <p
                  id="hero-headline"
                  className={cn(
                    HERO_HEADLINE_SCALE,
                    "font-mono font-bold text-blue-500 tracking-widest uppercase mt-2"
                  )}
                >
                  {portfolio.headline}
                </p>
              )}

              {portfolio.customization?.heroTagline && (
                <p id="hero-tagline" className="text-lg @sm:text-xl text-white font-semibold">
                  {portfolio.customization.heroTagline}
                </p>
              )}

              {!resolved.isHidden("about") && portfolio.summary && (
                <DescriptionBlock
                  text={portfolio.summary}
                  paragraphClassName="text-base @sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto @md:mx-0"
                  listClassName="space-y-2 pl-5 text-base @sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto @md:mx-0 marker:text-blue-500"
                />
              )}

              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-none border border-slate-800 bg-[#111418] px-3 py-1.5 text-xs font-mono text-slate-400"
              />

              {/* Social profiles stats & links */}
              {socialProfiles.length > 0 && (
                <div id="hero-socials" className="flex flex-wrap items-center justify-center @md:justify-start gap-3 @sm:gap-4 pt-4">
                  {socialProfiles.map((profile) => {
                    const statLabel = getSocialStatLabel(profile.cachedStats);
                    return (
                      <a
                        key={profile.platform}
                        href={profile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-none bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white transition-all flex items-center gap-2 font-mono text-xs group"
                        id={`social-${profile.platform}`}
                      >
                        {getSocialIcon(profile.platform, 'w-4 h-4 text-blue-500')}
                        {profile.username && <span className="hidden @sm:inline">@{profile.username}</span>}
                        {statLabel && (
                          <span className="px-1.5 py-0.5 rounded-none bg-slate-950 text-[9px] text-slate-500 border border-slate-800/80 group-hover:text-blue-400 transition-colors">
                            {statLabel}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && (
          <div className="space-y-12">
            {customSections.map((sect) => (
              <section key={sect.id} id={`custom-section-${sect.id}`} className="space-y-6">
                <div className="border-l-2 border-blue-500 pl-4">
                  <SectionHeading as="h3">{sect.label}</SectionHeading>
                </div>
                <CustomSectionItems
                  items={sect.items}
                  titleClassName="font-mono font-bold text-blue-500 text-sm @sm:text-base uppercase tracking-wider"
                  textClassName="text-xs @sm:text-sm text-slate-400 leading-relaxed"
                  chipClassName="rounded-none border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-slate-500 uppercase"
                  buttonClassName="mt-2 text-xs font-mono uppercase tracking-wider text-blue-400 hover:text-blue-300"
                />
              </section>
            ))}
          </div>
        )}

        {(portfolio.contactEmail || portfolio.phone) && (
        <section id="contact" className="scroll-mt-20">
          <div className="bg-[#111418] border border-slate-800 p-5 @sm:p-12 rounded-none text-center space-y-6 relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="break-words text-2xl @sm:text-4xl font-display font-extrabold text-white uppercase tracking-tight">{labels.contact}</h2>
            </div>

            <div className="max-w-md mx-auto grid grid-cols-1 @sm:grid-cols-2 gap-4 pt-4">
                {/* Email Copier */}
                {portfolio.contactEmail && (
                  <button
                    onClick={() => handleCopy(portfolio.contactEmail, 'email')}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500 p-4 rounded-none flex flex-col items-center justify-center gap-2 group transition-all text-center focus:outline-none"
                    id="contact-email-btn"
                  >
                    <div className="p-2.5 rounded-none bg-blue-500/5 border border-blue-500/20 text-blue-400">
                      {copiedText === 'email' ? <Check className="w-5 h-5 text-emerald-400" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Email Address</p>
                    <p className="text-xs @sm:text-sm font-semibold text-white font-mono break-all group-hover:text-blue-400 transition-colors">
                      {portfolio.contactEmail}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                      <Copy className="w-3 h-3 text-blue-400" /> {copiedText === 'email' ? 'Copied!' : 'Click to Copy'}
                    </span>
                  </button>
                )}

                {/* Phone Copier */}
                {portfolio.phone && (
                  <button
                    onClick={() => handleCopy(portfolio.phone, 'phone')}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500 p-4 rounded-none flex flex-col items-center justify-center gap-2 group transition-all text-center focus:outline-none"
                    id="contact-phone-btn"
                  >
                    <div className="p-2.5 rounded-none bg-blue-500/5 border border-blue-500/20 text-blue-400">
                      {copiedText === 'phone' ? <Check className="w-5 h-5 text-emerald-400" /> : <Phone className="w-5 h-5" />}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Phone Number</p>
                    <p className="text-xs @sm:text-sm font-semibold text-white font-mono group-hover:text-blue-400 transition-colors">
                      {portfolio.phone}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                      <Copy className="w-3 h-3 text-blue-400" /> {copiedText === 'phone' ? 'Copied!' : 'Click to Copy'}
                    </span>
                  </button>
                )}
              </div>
          </div>
        </section>
        )}

      </main>

      {/* FOOTER */}
      <footer id="footer" className="border-t border-slate-800 bg-[#0A0C10] mt-24">
        <div className="max-w-6xl mx-auto px-4 @sm:px-6 @lg:px-8 py-12 flex flex-col @lg:flex-row items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-2 text-center @lg:text-left">
            <span className="w-8 h-8 rounded-none bg-slate-900 border border-slate-800 flex items-center justify-center font-display font-bold text-white text-xs">
              {getInitials(portfolio.title)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="break-words text-sm font-semibold text-white uppercase tracking-wider">{portfolio.title}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 @sm:gap-4 text-xs font-mono text-slate-500 uppercase">
            {isSectionEnabled('experience') && experiences.length > 0 && (
              <a href="#experience" className="hover:text-blue-500 transition-colors">{labels.experience}</a>
            )}
            {isSectionEnabled('work') && projects.length > 0 && (
              <a href="#work" className="hover:text-blue-500 transition-colors">{labels.projects}</a>
            )}
            {skills.length > 0 && (
              <a href="#skills" className="hover:text-blue-500 transition-colors">{labels.skills}</a>
            )}
            <a href="#header" className="p-2 rounded-none bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all">
              ↑ Back to top
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  children,
  as: Tag = "h2",
}: {
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Tag
      className={
        Tag === "h3"
          ? "text-xl @sm:text-2xl font-display font-extrabold text-white uppercase tracking-tight flex items-center gap-2"
          : "text-2xl @sm:text-3xl font-display font-extrabold text-white uppercase tracking-tight flex items-center gap-2"
      }
    >
      <span className="w-2.5 h-2.5 bg-blue-500 shrink-0 inline-block" /> {children}
    </Tag>
  );
}