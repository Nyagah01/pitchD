import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Mail, Phone, MapPin, Link2, Globe, Code2 } from "lucide-react";
import { getPortfolioBySlug } from "../lib/portfolio";
import NavThemeSwitcher from "../components/common/NavThemeSwitcher";
import { normalizeUrl, buildSkillsByCategory } from "../components/portfolio/shared";
import { DEFAULT_TEMPLATE, DEFAULT_ACCENT, PORTFOLIO_ACCENTS } from "../lib/portfolioThemes";
import AuroraTemplate from "../components/portfolio/templates/AuroraTemplate";
import TerminalTemplate from "../components/portfolio/templates/TerminalTemplate";
import TimelineTemplate from "../components/portfolio/templates/TimelineTemplate";
import GridTemplate from "../components/portfolio/templates/GridTemplate";
import SplitTemplate from "../components/portfolio/templates/SplitTemplate";

const TEMPLATE_COMPONENTS = {
  aurora: AuroraTemplate,
  terminal: TerminalTemplate,
  timeline: TimelineTemplate,
  grid: GridTemplate,
  split: SplitTemplate,
};

export default function PortfolioView() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, portfolio: null, error: false });

  useEffect(() => {
    getPortfolioBySlug(slug)
      .then((portfolio) => setState({ loading: false, portfolio, error: !portfolio }))
      .catch(() => setState({ loading: false, portfolio: null, error: true }));
  }, [slug]);

  if (state.loading) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">Loading…</div>;
  }

  if (state.error || !state.portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
        <p className="text-lg font-bold text-text">This portfolio isn't available.</p>
        <p className="text-sm text-muted">It may have been taken down, or the link is wrong.</p>
        <Link to="/" className="mt-2 text-sm font-medium text-primary hover:underline">
          Go to Pitchd →
        </Link>
      </div>
    );
  }

  const { profile = {}, experience = [], education = [], skills = [], certifications = [], projects = [] } =
    state.portfolio.data ?? {};
  const meta = state.portfolio.data?.meta ?? {};
  const templateId = TEMPLATE_COMPONENTS[meta.template] ? meta.template : DEFAULT_TEMPLATE;
  const accent = meta.accent || PORTFOLIO_ACCENTS.find((a) => a.id === DEFAULT_ACCENT)?.hex || "#b0223a";
  const Template = TEMPLATE_COMPONENTS[templateId];

  const contactLinks = [
    profile.email && { icon: Mail, label: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { icon: Phone, label: profile.phone, href: `tel:${profile.phone}` },
    profile.location && { icon: MapPin, label: profile.location },
    profile.linkedin_url && { icon: Link2, label: "LinkedIn", href: normalizeUrl(profile.linkedin_url) },
    profile.github_url && { icon: Code2, label: "GitHub", href: normalizeUrl(profile.github_url) },
    profile.portfolio_url && { icon: Globe, label: "Website", href: normalizeUrl(profile.portfolio_url) },
  ].filter(Boolean);

  const skillsByCategory = buildSkillsByCategory(skills);

  return (
    <div className="relative">
      <div className="fixed right-4 top-4 z-50">
        <NavThemeSwitcher variant="light" />
      </div>
      <Template
        profile={profile}
        experience={experience}
        education={education}
        certifications={certifications}
        projects={projects}
        contactLinks={contactLinks}
        skillsByCategory={skillsByCategory}
        accent={accent}
      />
    </div>
  );
}
