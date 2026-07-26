"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
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
} from "../utils";
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
import styles from "./maximalist-template.module.css";
import {
  Terminal as TerminalIcon,
  Code,
  Download,
  Mail,
  Server,
  Zap,
  Cpu,
  Layers,
  Database,
  Briefcase,
  FolderGit2,
  Trophy,
  Award,
  BookOpen,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  BarChart2,
  Star,
  GitFork,
  Activity,
  ArrowUp,
  Copy,
  Check,
  RefreshCw,
  Palette,
  Send,
  CornerDownLeft,
  FileText,
  UserCheck,
} from "lucide-react";

// ---- null-safety helpers (the shared PortfolioData type allows nulls the demo data didn't) ----
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb";

function displayDate(dateStr: string | null, fallback = "N/A"): string {
  return formatDate(dateStr) || fallback;
}

/** skills.level is now a numeric score (0-5) or null; map it to the old Expert/Advanced labels. */
function getSkillLevelLabel(level: number | null): 'Expert' | 'Advanced' | 'Intermediate' {
  if (level === null || level === undefined) return 'Intermediate';
  if (level >= 4.5) return 'Expert';
  if (level >= 3.5) return 'Advanced';
  return 'Intermediate';
}

interface AppProps {
  data: PortfolioData;
}

export function MaximalistTemplate({ data: initialData }: AppProps) {
  // Kept as local, editable state so the CLI/JSON inspector demo features still work;
  // seeded from (and resettable to) the real data passed in via props.
  const [data, setData] = useState<PortfolioData>(initialData);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Bengaluru IST live clock
  const [bengaluruTime, setBengaluruTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setBengaluruTime(new Intl.DateTimeFormat('en-US', options).format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Confetti trigger
  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#ffffff', '#000000', '#fbbf24', '#ec4899'],
    });
  };

  const handleResetData = () => {
    setData(initialData);
  };

  const livePreviewProjectIds = data.livePreviewProjectIds ?? [];
  const githubProfile = data.socialProfiles.find(
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
  const labels = getSectionLabels(data.portfolio.customization);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("maximalist"),
    data.portfolio.customization,
  );
  const featuredProjects = data.projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...data.projects.filter((p) => !p.featured)]
      : data.projects;

  const topSkills = data.skills.slice(0, 6).map((s) => s.name).filter(Boolean);
  const latestExperience = data.experiences[0];
  const marqueeItems = [
    data.portfolio.headline
      ? `⚡ ${data.portfolio.title} — ${data.portfolio.headline}`
      : data.portfolio.title
        ? `⚡ ${data.portfolio.title}`
        : null,
    data.portfolio.location ? `📍 ${data.portfolio.location}` : null,
    latestExperience
      ? `💼 ${latestExperience.role} @ ${latestExperience.company}`
      : null,
    topSkills.length > 0 ? `🔥 ${topSkills.join(" / ")}` : null,
    data.portfolio.contactEmail ? `🚀 ${data.portfolio.contactEmail}` : null,
  ].filter((item): item is string => Boolean(item?.trim()));

  // Scroll spy for active navbar highlighting
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const section of navSectionIdsRef.current.split(",").filter(Boolean)) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: null,
    experience: data.experiences.length > 0
      ? (
        <section key="experience" id="experience" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
        {/* Ambient Radial Background Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#3b82f6]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b-4 border-white pb-6">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-2">
                <Briefcase className="w-4 h-4 text-[#3b82f6]" />
                <span>{"// CAREER ARCHITECTURE"}</span>
              </div>
              <SectionHeading>{labels.experience}</SectionHeading>
            </div>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute left-8 top-6 bottom-6 w-1 bg-[#3b82f6] pointer-events-none" />
            <CollapsibleList
              initial={4}
              wrapperClassName="space-y-10"
              buttonClassName="mt-8 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[#3b82f6] hover:text-black transition-colors neo-shadow"
            >
              {data.experiences.map((exp, index) => {
                const isCurrent = exp.endDate === null;

                const cardStyle = index === 0
                  ? 'bg-white text-black sm:rotate-[-1deg] hover:rotate-0 transition-transform duration-300 border-4 border-black neo-shadow-white'
                  : index === 1
                    ? 'bg-[#3b82f6] text-black sm:rotate-[1deg] hover:rotate-0 transition-transform duration-300 border-4 border-white neo-shadow'
                    : 'bg-black text-white sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300 border-4 border-white neo-shadow';

                return (
                  <div key={exp.id} className="relative lg:pl-16">

                    <div className="hidden lg:flex absolute left-4 top-6 -translate-x-1/2 w-9 h-9 bg-[#3b82f6] border-2 border-white items-center justify-center text-black font-mono font-black text-xs neo-shadow z-10">
                      0{index + 1}
                    </div>

                    <div className={`${cardStyle} p-6 sm:p-8 transition-all group`}>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-current">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-3xl font-black uppercase tracking-tight">
                              {exp.company}
                            </span>
                            {isCurrent && (
                              <span className="bg-[#3b82f6] text-black px-2 py-0.5 text-[10px] font-mono font-black uppercase border border-current">
                                PRESENT ROLE
                              </span>
                            )}
                            {exp.location && (
                              <span className="bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase border border-white">
                                {exp.location}
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-black uppercase tracking-tight opacity-90 font-mono">
                            {exp.role}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-xs">
                          <div className="bg-black text-white px-3 py-1.5 font-bold flex items-center gap-2 border border-white">
                            <Calendar className="w-3.5 h-3.5 text-[#3b82f6]" />
                            <span>
                              {formatDateRange(exp.startDate, exp.endDate) || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {exp.description && (
                        <div className="mt-5">
                          <DescriptionBlock
                            text={exp.description}
                            paragraphClassName="text-sm font-bold leading-relaxed"
                            listClassName="space-y-2 pl-5 text-sm font-bold leading-relaxed marker:text-current"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CollapsibleList>
          </div>

        </div>
      </section>
      )
      : null,
    projects: visibleProjects.length > 0
      ? (
        <section key="projects" id="work" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
        {/* Ambient Radial Background Glow */}
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b-4 border-white pb-6">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-2">
                <FolderGit2 className="w-4 h-4 text-[#3b82f6]" />
                <span>{"// FEATURED ARCHITECTURE & MICROSERVICES"}</span>
              </div>
              <SectionHeading>{labels.projects}</SectionHeading>
            </div>
          </div>

          <CollapsibleList
            initial={4}
            wrapperClassName={cn(PROJECTS_GRID_2, "gap-8")}
            buttonClassName="@md:col-span-2 mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[#3b82f6] hover:text-black transition-colors neo-shadow"
          >
            {visibleProjects.map((proj, projIdx) => {
              const isEven = projIdx % 2 === 0;
              const slantClass = isEven
                ? 'sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300'
                : 'sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300';

              return (
                <div
                  key={proj.id}
                  className={cn(
                    PROJECT_CARD,
                    "bg-black border-4 border-white hover:border-[#3b82f6] neo-shadow transition-all group flex flex-col justify-between",
                    slantClass
                  )}
                >
                  <div>

                    <div className="relative h-60 overflow-hidden border-b-4 border-white bg-black">
                      <TemplateProjectPreview
                        templateId="maximalist"
                        liveUrl={proj.liveUrl}
                        projectId={proj.id}
                        livePreviewProjectIds={livePreviewProjectIds}
                        alt={proj.title}
                        loading="lazy"
                        containerClassName="h-full aspect-auto bg-black"
                        className="h-full w-full object-cover object-top grayscale contrast-125 transition-all duration-300 group-hover:scale-105 group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                      {proj.featured && (
                        <div className="absolute top-3 left-3 bg-white text-black font-mono font-black text-[10px] px-2.5 py-1 border border-black italic uppercase">
                          ⚡ FEATURED ARCHITECTURE
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex items-center gap-2 font-mono text-xs">
                        {!!proj.githubStars && (
                          <span className="bg-black text-yellow-400 border-2 border-white px-2.5 py-1 flex items-center gap-1 font-black">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{proj.githubStars}</span>
                          </span>
                        )}
                        {!!proj.githubForks && (
                          <span className="bg-black text-[#3b82f6] border-2 border-white px-2.5 py-1 flex items-center gap-1 font-black">
                            <GitFork className="w-3.5 h-3.5" />
                            <span>{proj.githubForks}</span>
                          </span>
                        )}
                      </div>

                      {proj.language && (
                        <div className="absolute bottom-3 left-3 bg-[#3b82f6] text-black border border-black px-2.5 py-0.5 font-mono text-xs font-black uppercase">
                          {proj.language}
                        </div>
                      )}
                    </div>

                    <div className={cn(PROJECT_CARD_BODY, "space-y-4")}>
                      <div className={PROJECT_CARD_HEADER}>
                        <div className={PROJECT_CARD_META}>
                          <h3 className={cn(PROJECT_CARD_TITLE, "text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-[#3b82f6] transition-colors")}>
                            {proj.title}
                          </h3>
                        </div>
                      </div>

                      {proj.description && (
                        <DescriptionBlock
                          text={proj.description}
                          paragraphClassName="text-slate-200 text-sm font-bold"
                          listClassName="space-y-2 pl-5 text-slate-200 text-sm font-bold marker:text-[#3b82f6]"
                        />
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        {proj.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-1 bg-white/10 text-white border border-white/30 font-mono text-[10px] font-black uppercase"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                  <div className="px-6 py-4 bg-white/5 border-t-4 border-white font-mono text-xs">
                    <ProjectActions
                      liveUrl={proj.liveUrl}
                      sourceUrl={proj.sourceUrl}
                      liveClassName="flex-1 py-2.5 bg-[#3b82f6] hover:bg-white text-black font-black border-2 border-white flex items-center justify-center gap-2 neo-shadow transition-all hover:-translate-y-0.5 uppercase"
                      sourceClassName="flex-1 py-2.5 bg-black hover:bg-white hover:text-black text-white font-black border-2 border-white flex items-center justify-center gap-2 transition-colors uppercase"
                    />
                  </div>

                </div>
              );
            })}
          </CollapsibleList>

        </div>
      </section>
      )
      : null,
    skills: data.skills.length > 0
      ? <SkillsSectionComponent data={data} labels={labels} />
      : null,
    education: data.educations.length > 0
      ? (
        <section key="education" id="education" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-12 border-b-4 border-white pb-6">
              <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-2">
                <Award className="w-4 h-4 text-[#3b82f6]" />
                <span>{"// ACADEMIC PATH"}</span>
              </div>
              <SectionHeading>{labels.education}</SectionHeading>
            </div>
            <CollapsibleList
              initial={4}
              wrapperClassName="space-y-6"
              buttonClassName="mt-8 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[#3b82f6] hover:text-black transition-colors neo-shadow"
            >
              {data.educations.map((edu) => (
                <div
                  key={edu.id}
                  className="bg-black border-4 border-white neo-shadow p-6 space-y-3"
                >
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {edu.degree}
                    {edu.field && <span className="text-[#3b82f6]"> in {edu.field}</span>}
                  </h3>
                  <p className="font-mono text-sm font-bold text-slate-300">{edu.institution}</p>
                  {(edu.startDate || edu.endDate) && (
                    <p className="inline-block bg-[#3b82f6] text-black px-2 py-1 font-mono text-xs font-black uppercase">
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </p>
                  )}
                  {edu.gpa && <p className="font-mono text-xs font-bold text-slate-400">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </CollapsibleList>
          </div>
        </section>
      )
      : null,
    articles: data.articles.length > 0 ? (
      <ArticlesSectionComponent
        data={data}
        labels={labels}
        onOpenArticle={() => setSelectedArticle(true)}
      />
    ) : null,
    certifications: data.certifications.length > 0 ? (
      <CertificationsSectionComponent data={data} labels={labels} />
    ) : null,
    achievements: data.achievements.length > 0
      ? (
        <section key="achievements" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
        {/* Ambient Radial Glow */}
        <div className="absolute top-[-50px] left-[-50px] w-80 h-80 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b-4 border-white pb-6">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-2">
                <Trophy className="w-4 h-4 text-[#3b82f6]" />
                <span>{"// HONORS & ATHLETIC TITLES"}</span>
              </div>
              <SectionHeading>{labels.achievements}</SectionHeading>
            </div>

            <button
              onClick={handleTriggerConfetti}
              className="px-6 py-3 bg-[#3b82f6] hover:bg-white text-black font-mono font-black text-xs border-2 border-white neo-shadow flex items-center gap-2 transition-all uppercase"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>TRIGGER CELEBRATION</span>
            </button>
          </div>

          <CollapsibleList
            initial={4}
            wrapperClassName="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
            buttonClassName="lg:col-span-2 mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[#3b82f6] hover:text-black transition-colors neo-shadow"
          >
            {data.achievements.map((ach, idx) => {
              const isHackathon = ach.title.toLowerCase().includes('hackathon');
              const slantClass = idx % 2 === 0
                ? 'sm:rotate-[-1deg] hover:rotate-0 transition-transform duration-300'
                : 'sm:rotate-[1deg] hover:rotate-0 transition-transform duration-300';

              return (
                <div
                  key={ach.id}
                  className={`p-8 bg-black border-4 border-white neo-shadow transition-all group flex flex-col justify-between ${slantClass}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="px-3 py-1 bg-[#3b82f6] text-black font-black uppercase border border-black flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" />
                        {isHackathon ? '1ST PLACE WINNER' : 'ACHIEVEMENT'}
                      </span>
                      {ach.date && <span className="text-slate-300 font-bold">{displayDate(ach.date)}</span>}
                    </div>

                    <h3 className="text-3xl font-black text-white group-hover:text-[#3b82f6] transition-colors italic uppercase tracking-tight">
                      {ach.title}
                    </h3>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-white/20 flex items-center gap-2 font-mono text-xs text-slate-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#3b82f6]" />
                    <span>Verified Title & Competition Record</span>
                  </div>
                </div>
              );
            })}
          </CollapsibleList>

          {data.customSections.length > 0 && data.customSections.map((sec) => (
            <div key={sec.id} className="bg-black border-4 border-[#3b82f6] p-8 neo-shadow sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300 relative z-10 mb-8">
              <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-2">
                <Zap className="w-4 h-4 text-[#3b82f6] fill-[#3b82f6]" />
                <span>{`// ${sec.sectionType || "DEEP TECHNICAL FOCUS"}`}</span>
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4 italic">
                {sec.label}
              </h3>
              <CustomSectionItems
                items={sec.items}
                titleClassName="font-mono text-sm font-black text-[#3b82f6] uppercase"
                textClassName="text-slate-300 text-xs font-bold"
                chipClassName="px-2 py-0.5 bg-white/10 border border-white/20 font-mono text-[10px] text-white uppercase"
                buttonClassName="mt-4 font-mono text-xs font-black uppercase text-[#3b82f6] hover:text-white transition-colors"
              />
            </div>
          ))}

        </div>
      </section>
      )
      : null,
    profiles: hasProfiles
      ? (
        <section key="profiles" id="profiles" className="py-16 bg-black border-b-4 border-white scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 border-b-4 border-white pb-6">
              <SectionHeading>{labels.profiles}</SectionHeading>
            </div>
            <ProfileLinksSection
              portfolio={data.portfolio}
              profiles={data.socialProfiles}
              chipClassName="px-3 py-1.5 bg-black border-2 border-white font-mono text-[10px] font-black uppercase text-slate-300"
              pillClassName="px-3 py-1.5 bg-white text-black border-2 border-black font-mono text-xs font-black uppercase neo-shadow hover:bg-[#3b82f6] transition-colors"
              titleClassName="font-mono text-sm font-black uppercase text-[#3b82f6]"
              textClassName="text-slate-300 text-sm font-bold"
            />
          </div>
        </section>
      )
      : null,
    github: contributionCalendar
      ? (
        <section key="github" className="py-16 bg-black border-b-4 border-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-6">
              <Activity className="w-4 h-4" />
              <span>{"// "}{labels.github.toUpperCase()}</span>
            </div>
            <div className="overflow-x-auto">
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
      )
      : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        "min-w-0 overflow-x-hidden bg-[#0A0A0B] text-white font-sans selection:bg-[#3b82f6] selection:text-black"
      )}
    >

      {/* 1. TOP KINETIC MARQUEE BANNER */}
      {marqueeItems.length > 0 && (
        <div className="bg-[#3b82f6] text-black font-mono text-[11px] sm:text-xs font-black py-1.5 px-4 border-b-4 border-white overflow-hidden select-none">
          <div
            className="animate-marquee whitespace-nowrap flex items-center uppercase"
            style={{
              
              animationDuration: `${Math.max(18, marqueeItems.join("").length * 0.12)}s`,
            }}
          >
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-6 sm:gap-8 pr-6 sm:pr-8"
                aria-hidden={copy === 1}
              >
                {marqueeItems.map((item, index) => (
                  <React.Fragment key={`${copy}-${index}`}>
                    <span>{item}</span>
                    <span aria-hidden>•</span>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">

          {/* Logo */}
          <a href="#about" className="flex items-center gap-3 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#3b82f6] text-black font-mono font-black text-lg sm:text-xl flex items-center justify-center border-2 border-white neo-shadow group-hover:bg-white transition-colors">
              {data.portfolio.title.split(" ")[0].charAt(0)+data.portfolio.title.split(" ")[1].charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-black font-mono text-sm sm:text-base tracking-tighter text-white uppercase group-hover:text-[#3b82f6] transition-colors">
                {data.portfolio.title}
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          {navItems.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 font-mono text-xs font-black uppercase">
              {navItems.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className={`px-3 py-1.5 transition-all border-2 ${isActive
                        ? 'bg-[#3b82f6] text-black border-white neo-shadow'
                        : 'border-transparent text-slate-300 hover:text-white hover:border-white/40'
                      }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Right Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs font-black">
            <button
              onClick={() => setIsTerminalOpen(true)}
              className="px-3.5 py-2 bg-white text-black border-2 border-black neo-shadow hover:bg-[#3b82f6] transition-all flex items-center gap-1.5 uppercase"
              title="Open CLI Terminal"
            >
              <TerminalIcon className="w-4 h-4" />
              <span>CLI</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          {navItems.length > 0 && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-[#3b82f6] text-black border-2 border-white neo-shadow font-black"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && navItems.length > 0 && (
          <div className="lg:hidden border-t-4 border-white bg-black p-4 space-y-3 font-mono text-xs font-black uppercase">
            {navItems.map((link, index) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 bg-white/10 hover:bg-[#3b82f6] hover:text-black border-2 border-white transition-colors"
              >
                {String(index + 1).padStart(2, "0")} // {link.label}
              </a>
            ))}

            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsTerminalOpen(true);
                }}
                className="py-2.5 bg-white text-black border-2 border-black font-black text-center flex items-center justify-center gap-2"
              >
                <TerminalIcon className="w-4 h-4" />
                <span>TERMINAL CLI</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsInspectorOpen(true);
                }}
                className="py-2.5 bg-[#3b82f6] text-black border-2 border-white font-black text-center flex items-center justify-center gap-2"
              >
                <Code className="w-4 h-4" />
                <span>INSPECT JSON</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 3. HERO SECTION */}
      <section id="about" className="py-12 sm:py-20 border-b-4 border-white relative overflow-hidden bg-grid-pattern">
        {/* Ambient Radial Background Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#3b82f6]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Main Info Box */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">

              {/* Display Header */}
              <div className={cn(HERO_HEADER_COLUMN, "border-b-4 border-white pb-6 space-y-3")}>
                <h1
                  className={cn(
                    HERO_TITLE_BASE,
                    HERO_TITLE_SCALE_7XL,
                    "font-black leading-[0.88] sm:leading-[0.82] tracking-tighter uppercase text-white"
                  )}
                >
                  {data.portfolio.title}
                </h1>
                {data.portfolio.headline && (
                  <p
                    className={cn(
                      HERO_HEADLINE_SCALE,
                      "font-black tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[#3b82f6]"
                    )}
                  >
                    {data.portfolio.headline}
                  </p>
                )}
              </div>

              {/* Summary Text */}
              {!resolved.isHidden("about") && data.portfolio.summary && (
                <DescriptionBlock
                  text={data.portfolio.summary}
                  paragraphClassName="text-slate-200 text-base sm:text-lg font-bold leading-relaxed max-w-3xl"
                  listClassName="space-y-2 pl-5 text-slate-200 text-base sm:text-lg font-bold leading-relaxed max-w-3xl marker:text-[#3b82f6]"
                />
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-xs sm:text-sm font-black uppercase">
                <button
                  onClick={() => setIsTerminalOpen(true)}
                  className="px-6 py-3.5 bg-white text-black border-2 border-black neo-shadow hover:bg-[#3b82f6] transition-all hover:-translate-y-1 flex items-center gap-2"
                >
                  <TerminalIcon className="w-4 h-4" />
                  <span>LAUNCH CLI TERMINAL</span>
                </button>

                <a
                  href="#work"
                  className="px-6 py-3.5 bg-black hover:bg-white hover:text-black text-white border-2 border-white transition-all hover:-translate-y-1 flex items-center gap-2"
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>VIEW REPOSITORIES</span>
                </a>
              </div>

              <ContactChips
                portfolio={data.portfolio}
                chipClassName="px-3 py-1.5 bg-black border-2 border-white font-mono text-[10px] font-black uppercase text-slate-300"
              />
              <HeroProfileButtons
                profiles={data.socialProfiles}
                className="px-4 py-2 bg-white text-black border-2 border-black font-mono text-xs font-black uppercase neo-shadow hover:bg-[#3b82f6] transition-colors"
              />
            </div>

            {/* Right Column: Hero Profile Card */}
            {/* <div className="lg:col-span-4">
              <div className="bg-black border-4 border-white p-6 neo-shadow space-y-6 lg:rotate-[1deg] hover:rotate-0 transition-transform duration-300">

                <div className="relative border-4 border-white overflow-hidden bg-[#3b82f6]">
                  <img
                    src={data.portfolio.avatarUrl ?? FALLBACK_AVATAR}
                    alt={data.portfolio.title}
                    className="w-full h-72 sm:h-80 object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-300"
                  />
                  {data.portfolio.location && (
                    <div className="absolute bottom-2 left-2 bg-black text-white font-mono font-black text-[10px] px-2 py-1 border border-white uppercase">
                      📍 {data.portfolio.location}
                    </div>
                  )}
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span className="text-slate-400">STATUS:</span>
                    <span className="text-emerald-400 font-black">ACTIVE / BENGALURU</span>
                  </div>

                  {data.portfolio.contactEmail && (
                    <div className="flex items-center justify-between border-b border-white/20 pb-2">
                      <span className="text-slate-400">EMAIL:</span>
                      <a href={`mailto:${data.portfolio.contactEmail}`} className="text-[#3b82f6] font-black underline">
                        {data.portfolio.contactEmail}
                      </a>
                    </div>
                  )}

                  {data.portfolio.phone && (
                    <div className="flex items-center justify-between border-b border-white/20 pb-2">
                      <span className="text-slate-400">PHONE:</span>
                      <span className="text-white font-black">{data.portfolio.phone}</span>
                    </div>
                  )}

                </div>

              </div>
            </div> */}

          </div>
        </div>
      </section>


      {renderSections(resolved, "full", blocks)}

      {data.customSections.length > 0 && (
        <section className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {data.customSections.map((sec) => (
              <div key={sec.id} className="bg-black border-4 border-[#3b82f6] p-8 neo-shadow mb-8">
                <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-4 h-4 text-[#3b82f6] fill-[#3b82f6]" />
                  <span>{`// ${sec.sectionType || "DEEP TECHNICAL FOCUS"}`}</span>
                </div>
                <SectionHeading>{sec.label}</SectionHeading>
                <CustomSectionItems
                  items={sec.items}
                  titleClassName="font-mono text-sm font-black text-[#3b82f6] uppercase"
                  textClassName="text-slate-300 text-xs font-bold"
                  chipClassName="px-2 py-0.5 bg-white/10 border border-white/20 font-mono text-[10px] text-white uppercase"
                  buttonClassName="mt-4 font-mono text-xs font-black uppercase text-[#3b82f6] hover:text-white transition-colors"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 11. FOOTER SECTION */}
      <footer id="contact" className="bg-black border-t-4 border-white relative overflow-hidden">

        {marqueeItems.length > 0 && (
          <div className="bg-[#3b82f6] text-black font-mono text-xs font-black py-2.5 border-b-4 border-white select-none overflow-hidden uppercase">
            <div
              className="animate-marquee-reverse whitespace-nowrap flex items-center"
              style={{
                animationDuration: `${Math.max(18, marqueeItems.join("").length * 0.12)}s`,
              }}
            >
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex shrink-0 items-center gap-8 pr-8"
                  aria-hidden={copy === 1}
                >
                  {marqueeItems.map((item, index) => (
                    <React.Fragment key={`${copy}-${index}`}>
                      <span>{item}</span>
                      <span aria-hidden>•</span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">

            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#3b82f6] border-2 border-white font-mono font-black text-black flex items-center justify-center neo-shadow text-lg">
                  AK
                </div>
                <span className="text-3xl font-black text-white tracking-tight uppercase">
                  {data.portfolio.title}
                </span>
              </div>

              <p className="text-slate-300 font-bold text-sm max-w-md leading-relaxed">
                {data.portfolio.summary}
              </p>

              <div className="font-mono text-xs text-[#3b82f6] flex items-center gap-2 font-black">
                {data.portfolio.location && (
                  <>
                    <MapPin className="w-4 h-4 text-[#3b82f6]" />
                    <span>{data.portfolio.location}</span>
                    <span>•</span>
                  </>
                )}
                <span className="text-white font-black bg-[#3b82f6] text-black px-2 py-0.5">
                  IST: {bengaluruTime || '10:12:00 PM'}
                </span>
              </div>
            </div>

            {sections.length > 0 && (
              <div className="md:col-span-3 space-y-3 font-mono text-xs">
                <div className="text-[#3b82f6] font-black uppercase tracking-widest">{"// NAVIGATION JUMPS"}</div>
                <ul className="space-y-2 text-white font-bold">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="hover:text-[#3b82f6] transition-colors"
                      >
                        → {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="md:col-span-3 space-y-3 font-mono text-xs">
              <div className="text-[#3b82f6] font-black uppercase tracking-widest">{"// CONNECT DIRECT"}</div>

              <div className="flex items-center gap-2">
                {(() => {
                  const githubUrl = data.socialProfiles.find((s) => s.platform.toLowerCase() === 'github')?.url;
                  return githubUrl ? (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-black text-white hover:bg-[#3b82f6] hover:text-black font-black border-2 border-white transition-colors"
                      title="GitHub Profile"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  ) : null;
                })()}

                {(() => {
                  const linkedinUrl = data.socialProfiles.find((s) => s.platform.toLowerCase() === 'linkedin')?.url;
                  return linkedinUrl ? (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-[#3b82f6] text-black hover:bg-white font-black border-2 border-black neo-shadow transition-colors"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  ) : null;
                })()}

                <button
                  onClick={() => setIsTerminalOpen(true)}
                  className="px-3.5 py-3 bg-white text-black font-black border-2 border-black neo-shadow hover:bg-[#3b82f6] transition-colors flex items-center gap-1.5 uppercase"
                >
                  <TerminalIcon className="w-4 h-4" />
                  <span>CLI</span>
                </button>
              </div>

              {data.portfolio.contactEmail && (
                <a
                  href={`mailto:${data.portfolio.contactEmail}`}
                  className="block w-full py-3 bg-[#3b82f6] hover:bg-white text-black font-black border-2 border-black text-center neo-shadow transition-all uppercase"
                >
                  SEND DIRECT EMAIL
                </a>
              )}
            </div>

          </div>

          <div className="pt-6 border-t-2 border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-300 font-bold">
            <div>
              © {new Date().getFullYear()} {data.portfolio.title.toUpperCase()}. ALL RIGHTS RESERVED.
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-2 bg-white text-black hover:bg-[#3b82f6] font-black border-2 border-black neo-shadow flex items-center gap-2 transition-all uppercase"
            >
              <span>BACK TO TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </footer>

      {/* 12. MODALS */}
      {isTerminalOpen && (
        <TerminalContactModal data={data} onClose={() => setIsTerminalOpen(false)} />
      )}

      {isInspectorOpen && (
        <DataInspectorModal
          data={data}
          setData={setData}
          onClose={() => setIsInspectorOpen(false)}
          onResetData={handleResetData}
        />
      )}

      {selectedArticle && (
        <ArticleModal onClose={() => setSelectedArticle(false)} />
      )}

    </div>
  );
}

/* =========================================================================
   INLINE SUB-COMPONENTS
   ========================================================================= */

// 1. SKILLS SECTION COMPONENT
function SkillsSectionComponent({
  data,
  labels,
}: {
  data: PortfolioData;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  const groupedSkills = groupSkillsByCategory(data.skills);

  return (
    <section key="skills" id="skills" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3b82f6]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b-4 border-white pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest mb-2">
              <Cpu className="w-4 h-4 text-[#3b82f6]" />
              <span>{"// TECHNICAL PROFICIENCY & RUNTIMES"}</span>
            </div>
            <SectionHeading>{labels.skills}</SectionHeading>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className="mb-4 font-mono text-xs font-black uppercase tracking-widest text-[#3b82f6]">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {names.map((name, sIdx) => {
                  const slantClass = sIdx % 2 === 0
                    ? 'sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300'
                    : 'sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300';
                  return (
                    <div
                      key={`${category}-${name}`}
                      className={`p-5 bg-black border-4 border-white hover:border-[#3b82f6] neo-shadow transition-all group relative overflow-hidden ${slantClass}`}
                    >
                      <div className="text-2xl font-black text-white group-hover:text-[#3b82f6] transition-colors font-mono tracking-tight uppercase">
                        {name}
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

// 3. ARTICLES SECTION COMPONENT
function ArticlesSectionComponent({
  data,
  labels,
  onOpenArticle,
}: {
  data: PortfolioData;
  labels: ReturnType<typeof getSectionLabels>;
  onOpenArticle: () => void;
}) {
  if (data.articles.length === 0) return null;

  return (
    <section key="articles" id="articles" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
      <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-[#3b82f6]" />
            <span>{"// THOUGHT LEADERSHIP & WRITING"}</span>
          </div>
          <SectionHeading>{labels.articles}</SectionHeading>

          <CollapsibleList
            initial={4}
            wrapperClassName="space-y-6"
            buttonClassName="mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[#3b82f6] hover:text-black transition-colors neo-shadow"
          >
            {data.articles.map((art, idx) => {
              const slantClass = idx % 2 === 0
                ? 'sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300'
                : 'sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300';

              return (
                <div
                  key={art.id}
                  className={`bg-black border-4 border-white hover:border-[#3b82f6] neo-shadow p-6 transition-all group space-y-4 ${slantClass}`}
                >
                  <div className="flex items-center justify-between font-mono text-xs text-slate-300">
                    {art.publishedAt && (
                      <div className="flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span>{displayDate(art.publishedAt)}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-3xl font-black text-white group-hover:text-[#3b82f6] transition-colors uppercase tracking-tight italic">
                    {art.title}
                  </h3>

                  {art.description && (
                    <DescriptionBlock
                      text={art.description}
                      paragraphClassName="text-slate-200 text-sm font-bold leading-relaxed"
                      listClassName="space-y-2 pl-5 text-slate-200 text-sm font-bold leading-relaxed marker:text-[#3b82f6]"
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-black pt-2">
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-[#3b82f6] hover:bg-white text-black font-black border-2 border-black flex items-center gap-2 neo-shadow transition-all uppercase"
                    >
                      <span>READ ARTICLE</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={onOpenArticle}
                      className="px-4 py-2.5 bg-black hover:bg-white hover:text-black text-white font-black border-2 border-white flex items-center gap-2 transition-colors uppercase"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>QUICK PREVIEW</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </CollapsibleList>
        </div>
      </div>
    </section>
  );
}

function CertificationsSectionComponent({
  data,
  labels,
}: {
  data: PortfolioData;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (data.certifications.length === 0) return null;

  return (
    <section key="certifications" id="certifications" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden scroll-mt-24">
      <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-mono text-xs text-[#3b82f6] font-black uppercase tracking-widest">
            <Award className="w-4 h-4 text-[#3b82f6]" />
            <span>{"// INDUSTRY CREDENTIALS"}</span>
          </div>
          <SectionHeading>{labels.certifications}</SectionHeading>

          <CollapsibleList
            initial={4}
            wrapperClassName="space-y-4"
            buttonClassName="mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[#3b82f6] hover:text-black transition-colors neo-shadow"
          >
            {data.certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-black border-4 border-white neo-shadow p-5 space-y-3 sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xl font-black text-white uppercase">
                    {cert.url ? (
                      <a href={cert.url} target="_blank" rel="noreferrer" className="hover:text-[#3b82f6]">
                        {cert.name}
                      </a>
                    ) : (
                      cert.name
                    )}
                  </span>
                  <span className="bg-[#3b82f6] text-black font-mono px-2 py-0.5 font-black uppercase border border-black text-[10px]">
                    {cert.issuer}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
                  {cert.issueDate && <span>ISSUED: {displayDate(cert.issueDate)}</span>}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#3b82f6] hover:underline font-black"
                    >
                      VERIFY CERTIFICATE →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleList>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white">
      <span className="h-3 w-8 bg-[#3b82f6] shrink-0" />
      {children}
    </h2>
  );
}

// 4. TERMINAL CONTACT MODAL
function TerminalContactModal({ data, onClose }: { data: PortfolioData; onClose: () => void }) {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<{ cmd: string; output: React.ReactNode }[]>([
    {
      cmd: 'welcome',
      output: (
        <div className="space-y-1 text-slate-300">
          <div className="text-[#3b82f6] font-black">{data.portfolio.title} INTERACTIVE TERMINAL [v2.4.0]</div>
          <div>Type <span className="text-yellow-400 font-bold">help</span> to list available commands or <span className="text-[#3b82f6] font-bold">contact</span> to reach out directly.</div>
        </div>
      ),
    },
  ]);

  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sentStatus, setSentStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = input.trim().toLowerCase();
    if (!cleanCmd) return;

    let output: React.ReactNode = null;

    switch (cleanCmd) {
      case 'help':
        output = (
          <div className="space-y-1 text-xs">
            <div className="text-yellow-400 font-black">AVAILABLE COMMANDS:</div>
            <div>• <span className="text-[#3b82f6] font-bold">bio</span> : Summary & headline</div>
            <div>• <span className="text-[#3b82f6] font-bold">experience</span> : Career timeline & roles</div>
            <div>• <span className="text-[#3b82f6] font-bold">projects</span> : Repos & tech stack</div>
            <div>• <span className="text-[#3b82f6] font-bold">skills</span> : Full language & framework matrix</div>
            <div>• <span className="text-[#3b82f6] font-bold">contact</span> : Email & phone details</div>
            <div>• <span className="text-[#3b82f6] font-bold">clear</span> : Clear terminal screen</div>
            <div>• <span className="text-[#3b82f6] font-bold">cat resume.txt</span> : Export raw developer profile</div>
          </div>
        );
        break;

      case 'bio':
        output = (
          <div className="text-slate-200">
            <div className="text-[#3b82f6] font-bold">{data.portfolio.title} - {data.portfolio.headline}</div>
            <div>{data.portfolio.summary}</div>
            <div className="text-slate-400 mt-1">Location: {data.portfolio.location ?? 'N/A'}</div>
          </div>
        );
        break;

      case 'experience':
        output = (
          <div className="space-y-2 text-slate-200">
            {data.experiences.map((exp) => (
              <div key={exp.id} className="border-l-2 border-[#3b82f6] pl-2">
                <div className="font-bold text-[#3b82f6]">{exp.company} — {exp.role}</div>
                <div className="text-slate-400 text-[11px]">{formatDateRange(exp.startDate, exp.endDate) || "N/A"}</div>
                <div className="text-slate-300 mt-1 text-[11px] whitespace-pre-line">{exp.description}</div>
              </div>
            ))}
          </div>
        );
        break;

      case 'projects':
        output = (
          <div className="space-y-2 text-slate-200">
            {data.projects.map((p) => (
              <div key={p.id}>
                <div className="font-bold text-white">{p.title} (★ {p.githubStars})</div>
                <div className="text-slate-300 text-[11px]">{p.description}</div>
                <div className="text-[#3b82f6] text-[11px]">Stack: {p.techStack.join(', ')}</div>
              </div>
            ))}
          </div>
        );
        break;

      case 'skills':
        output = (
          <div className="text-slate-200">
            <div className="font-bold text-[#3b82f6]">SKILL MATRIX:</div>
            <div className="grid grid-cols-2 gap-1 text-[11px] mt-1">
              {data.skills.map((s) => (
                <div key={s.id}>
                  • <span className="font-bold text-white">{s.name}</span> ({s.category}) - <span className="text-[#3b82f6]">{getSkillLevelLabel(s.level)}</span>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case 'contact':
      case 'hire':
        output = (
          <div className="text-slate-200 space-y-1">
            <div className="text-[#3b82f6] font-bold">CONTACT DIRECT:</div>
            {data.portfolio.contactEmail ? (
              <div>Email: <a href={`mailto:${data.portfolio.contactEmail}`} className="text-[#3b82f6] underline">{data.portfolio.contactEmail}</a></div>
            ) : (
              <div>Email: N/A</div>
            )}
            <div>Phone: {data.portfolio.phone ?? 'N/A'}</div>
            <div>Location: {data.portfolio.location ?? 'N/A'}</div>
          </div>
        );
        break;

      case 'clear':
        setLogs([]);
        setInput('');
        return;

      case 'cat resume.txt':
        output = (
          <pre className="text-[10px] text-emerald-300 bg-black p-2 rounded overflow-x-auto border border-white/20">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
        break;

      default:
        output = (
          <div className="text-red-400">
            Command not recognized: &apos;{cleanCmd}&apos;. Type{" "}
            <span className="text-yellow-400 font-bold">help</span> for commands.
          </div>
        );
    }

    setLogs((prev) => [...prev, { cmd: input, output }]);
    setInput('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageSubject || !messageBody) return;
    setSentStatus(true);
    setTimeout(() => {
      setSentStatus(false);
      setMessageSubject('');
      setMessageBody('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border-4 border-white rounded-none max-w-3xl w-full p-4 sm:p-6 neo-shadow flex flex-col max-h-[90vh] text-slate-200 font-mono text-xs space-y-4">

        <div className="flex items-center justify-between pb-3 border-b-2 border-white">
          <div className="flex items-center gap-2 text-[#3b82f6] font-black text-sm">
            <TerminalIcon className="w-4 h-4 animate-pulse" />
            <span>{data.portfolio.title} CLI TERMINAL</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white text-black hover:bg-[#3b82f6] font-black border border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-black p-4 border-2 border-white/40 overflow-y-auto space-y-4 min-h-[220px]">
          {logs.map((log, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[#3b82f6]">$</span>
                <span className="text-white font-bold">{log.cmd}</span>
              </div>
              <div className="pl-4">{log.output}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleCommand} className="flex items-center gap-2">
          <span className="text-[#3b82f6] font-black text-base">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type 'help', 'bio', 'projects', 'contact'..."
            className="flex-1 bg-black border-2 border-white px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#3b82f6]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#3b82f6] hover:bg-white text-black font-black border-2 border-black neo-shadow flex items-center gap-1 shrink-0 uppercase"
          >
            <span>RUN</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-3 border-t-2 border-white space-y-2">
          <div className="text-xs text-[#3b82f6] font-black">
            DIRECT EMAIL DISPATCH: <span className="text-slate-200">{data.portfolio.contactEmail ?? 'N/A'}</span>
          </div>

          {sentStatus ? (
            <div className="p-3 bg-[#3b82f6] text-black border-2 border-white text-center font-black">
              ✓ Message dispatched successfully to {data.portfolio.contactEmail ?? 'the team'}!
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <input
                type="text"
                required
                placeholder="Subject / Organization Name"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                className="w-full bg-black border border-white/60 p-2 text-white font-mono text-xs focus:outline-none focus:border-[#3b82f6]"
              />
              <textarea
                required
                rows={2}
                placeholder="Message body / Project inquiry..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full bg-black border border-white/60 p-2 text-white font-mono text-xs focus:outline-none focus:border-[#3b82f6]"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#3b82f6] hover:bg-white text-black font-black border-2 border-black flex items-center justify-center gap-2 neo-shadow uppercase"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND DIRECT INQUIRY</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

// 5. DATA INSPECTOR MODAL
function DataInspectorModal({
  data,
  setData,
  onClose,
  onResetData,
}: {
  data: PortfolioData;
  setData: React.Dispatch<React.SetStateAction<PortfolioData>>;
  onClose: () => void;
  onResetData: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setData(parsed);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON syntax. Please check formatting.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border-4 border-white max-w-3xl w-full p-4 sm:p-6 neo-shadow space-y-4 font-mono text-xs text-slate-200 max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between pb-3 border-b-2 border-white">
          <div className="flex items-center gap-2 text-[#3b82f6] font-black text-sm">
            <Code className="w-4 h-4" />
            <span>PORTFOLIO DATA INSPECTOR</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white text-black hover:bg-[#3b82f6] font-black border border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-2 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 font-bold text-[11px]">
            <span>RAW JSON DATA OBJECT:</span>
            <button
              onClick={handleCopy}
              className="text-[#3b82f6] hover:text-white flex items-center gap-1 font-black"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED!' : 'COPY JSON'}</span>
            </button>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="flex-1 w-full bg-black p-3 border-2 border-white/60 font-mono text-[11px] text-emerald-400 focus:outline-none focus:border-[#3b82f6] overflow-y-auto"
            rows={12}
          />

          {jsonError && (
            <div className="text-red-400 font-bold bg-red-950 p-2 border border-red-500">
              ⚠️ {jsonError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t-2 border-white">
          <button
            onClick={onResetData}
            className="px-3 py-2 bg-black hover:bg-white hover:text-black text-white font-black border-2 border-white flex items-center gap-1.5 text-xs uppercase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            onClick={handleApplyJson}
            className="px-5 py-2.5 bg-[#3b82f6] hover:bg-white text-black font-black border-2 border-black neo-shadow text-xs uppercase"
          >
            UPDATE LIVE PORTFOLIO
          </button>
        </div>

      </div>
    </div>
  );
}

// 6. ARTICLE MODAL
function ArticleModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border-4 border-white max-w-3xl w-full p-6 neo-shadow space-y-4 font-mono text-xs text-slate-200 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between pb-3 border-b-2 border-white">
          <span className="text-[#3b82f6] font-black text-sm uppercase">{"// PUBLICATION PREVIEW"}</span>
          <button
            onClick={onClose}
            className="p-1 bg-white text-black hover:bg-[#3b82f6] font-black border border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic">
          Optimizing Node.js Event Loop for High-Throughput Microservices
        </h2>

        <p className="text-slate-300 font-sans text-sm leading-relaxed">
          When scaling backend services to handle over 10,000 concurrent requests per second, traditional CPU synchronous tasks can stall Node.js&apos;s single-threaded event loop. This article breaks down:
        </p>

        <ul className="space-y-2 list-disc list-inside text-slate-200 font-sans text-xs">
          <li><strong>libuv Thread Pool:</strong> Worker allocation for crypto and filesystem ops.</li>
          <li><strong>Microtasks vs Macrotasks:</strong> `Promise.then` priority over `setTimeout` timers.</li>
          <li><strong>Benchmarking Runtimes:</strong> Comparing Node.js V8 execution against Bun JSC runtime.</li>
        </ul>

        <div className="pt-4 border-t-2 border-white flex justify-end">
          <a
            href="https://dev.to"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-[#3b82f6] text-black font-black border-2 border-black neo-shadow uppercase"
          >
            FULL ARTICLE ON DEV.TO →
          </a>
        </div>

      </div>
    </div>
  );
}