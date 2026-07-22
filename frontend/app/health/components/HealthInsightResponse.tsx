"use client";

type InsightSection = {
  title: string;
  body: string[];
  bullets: {
    title: string;
    description: string;
  }[];
};

const sectionStyles = [
  {
    keywords: ["overall", "assessment", "summary", "wellness"],
    label: "Wellness Assessment",
    icon: "❤️",
    border: "border-rose-500/25",
    background: "bg-rose-500/[0.06]",
    iconBackground: "bg-rose-500/15",
    title: "text-rose-300",
  },
  {
    keywords: ["good", "strength", "positive", "working"],
    label: "What Is Going Well",
    icon: "✅",
    border: "border-emerald-500/25",
    background: "bg-emerald-500/[0.06]",
    iconBackground: "bg-emerald-500/15",
    title: "text-emerald-300",
  },
  {
    keywords: ["attention", "risk", "concern", "improve"],
    label: "Needs Attention",
    icon: "⚠️",
    border: "border-amber-500/25",
    background: "bg-amber-500/[0.06]",
    iconBackground: "bg-amber-500/15",
    title: "text-amber-300",
  },
  {
    keywords: ["action", "next step", "recommendation", "plan"],
    label: "Recommended Actions",
    icon: "🎯",
    border: "border-violet-500/25",
    background: "bg-violet-500/[0.06]",
    iconBackground: "bg-violet-500/15",
    title: "text-violet-300",
  },
];

function cleanText(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^[-•]\s*/, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeResponse(content: string) {
  return content
    .replace(/\r/g, "")
    .replace(/([^\n])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(-\s+\*\*)/g, "$1\n$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseInsight(content: string): InsightSection[] {
  const normalized = normalizeResponse(content);
  const sectionPattern = /(?:^|\n)\s*\d+\.\s*\*\*(.+?)\*\*:\s*/g;
  const matches = Array.from(normalized.matchAll(sectionPattern));

  if (matches.length === 0) {
    const paragraphs = normalized
      .split(/\n{2,}/)
      .map(cleanText)
      .filter(Boolean);

    return paragraphs.length
      ? [
          {
            title: "Health Twin Recommendation",
            body: paragraphs,
            bullets: [],
          },
        ]
      : [];
  }

  return matches.map((match, index) => {
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd =
      index + 1 < matches.length
        ? matches[index + 1].index ?? normalized.length
        : normalized.length;

    const sectionContent = normalized.slice(bodyStart, bodyEnd).trim();
    const bulletPattern = /(?:^|\n)\s*[-•]\s*\*\*(.+?)\*\*:\s*/g;
    const bulletMatches = Array.from(sectionContent.matchAll(bulletPattern));

    const firstBulletIndex =
      bulletMatches.length > 0
        ? bulletMatches[0].index ?? sectionContent.length
        : sectionContent.length;

    const body = sectionContent
      .slice(0, firstBulletIndex)
      .split(/\n{2,}/)
      .map(cleanText)
      .filter(Boolean);

    const bullets = bulletMatches.map((bulletMatch, bulletIndex) => {
      const descriptionStart =
        (bulletMatch.index ?? 0) + bulletMatch[0].length;
      const descriptionEnd =
        bulletIndex + 1 < bulletMatches.length
          ? bulletMatches[bulletIndex + 1].index ?? sectionContent.length
          : sectionContent.length;

      return {
        title: cleanText(bulletMatch[1] || "Action"),
        description: cleanText(
          sectionContent.slice(descriptionStart, descriptionEnd)
        ),
      };
    });

    return {
      title: cleanText(match[1] || `Section ${index + 1}`),
      body,
      bullets,
    };
  });
}

function getSectionStyle(title: string, index: number) {
  const normalizedTitle = title.toLowerCase();

  return (
    sectionStyles.find((style) =>
      style.keywords.some((keyword) => normalizedTitle.includes(keyword))
    ) ?? sectionStyles[index % sectionStyles.length]
  );
}

export default function HealthInsightResponse({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  const sections = parseInsight(content);

  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-1 ${
        compact ? "gap-4 xl:grid-cols-2" : "gap-5 lg:grid-cols-2"
      }`}
    >
      {sections.map((section, index) => {
        const style = getSectionStyle(section.title, index);
        const isActionSection =
          section.bullets.length > 0 ||
          section.title.toLowerCase().includes("action");

        return (
          <section
            key={`${section.title}-${index}`}
            className={`rounded-2xl border ${style.border} ${style.background} ${
              isActionSection && sections.length > 1 ? "lg:col-span-2" : ""
            } ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBackground}`}
              >
                <span aria-hidden="true">{style.icon}</span>
              </div>

              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.12em] ${style.title}`}
                >
                  {style.label}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {section.title}
                </h3>
              </div>
            </div>

            {section.body.length > 0 ? (
              <div className="mt-4 space-y-3">
                {section.body.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="text-sm leading-7 text-slate-300"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            {section.bullets.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {section.bullets.map((bullet, bulletIndex) => (
                  <article
                    key={`${bullet.title}-${bulletIndex}`}
                    className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-xs font-bold text-rose-300">
                        {bulletIndex + 1}
                      </span>

                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {bullet.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {bullet.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
