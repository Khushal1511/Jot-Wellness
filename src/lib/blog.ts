export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  excerpt: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  draft: boolean;
  readingTime: string;
  content: string;
  html: string;
};

type Frontmatter = Record<string, string | boolean | string[]>;

const DEFAULT_IMAGE =
  "https://images.pexels.com/photos/8653971/pexels-photo-8653971.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600";

const rawBlogFiles = import.meta.glob("../content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadingTime(markdown: string) {
  const words = stripMarkdown(markdown).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function parseScalar(value: string): string | boolean | string[] {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { data: {}, content: raw.trim() };

  const data: Frontmatter = {};
  match[1].split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    if (key) data[key] = parseScalar(value);
  });

  return { data, content: raw.slice(match[0].length).trim() };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate a URL and return it HTML-encoded for use in an href attribute.
 * safeUrl receives values that have already been HTML-escaped by renderInline
 * (e.g. & in query-strings arrives as &amp;). We decode those entities first
 * so the resulting href is a well-formed URL, then re-escape for HTML safety.
 */
function safeUrl(value: string) {
  // Decode HTML entities that escapeHtml introduced on the raw markdown text
  const decoded = value.trim()
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(decoded)) return escapeHtml(decoded);
  return "#";
}

function renderInline(value: string) {
  let rendered = escapeHtml(value);
  rendered = rendered.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => `<img src="${safeUrl(url)}" alt="${escapeHtml(alt)}" />`);
  rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`);
  rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  rendered = rendered.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return rendered;
}

function renderList(lines: string[], ordered: boolean) {
  const tag = ordered ? "ol" : "ul";
  const items = lines
    .map((line) => line.replace(ordered ? /^\d+\.\s+/ : /^[-*+]\s+/, ""))
    .map((line) => `<li>${renderInline(line)}</li>`)
    .join("");
  return `<${tag}>${items}</${tag}>`;
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push("<hr />");
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      // Offset by 1: # → h2, ## → h3, ### → h4, #### → h5
      // h1 is reserved for the page/post <title> rendered above the prose.
      const level = Math.min(heading[1].length + 1, 5);
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines = [trimmed.replace(/^>\s?/, "")];
      while (index + 1 < lines.length && lines[index + 1].trim().startsWith(">")) {
        index += 1;
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
      }
      blocks.push(`<blockquote>${quoteLines.map(renderInline).join("<br />")}</blockquote>`);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const listLines = [trimmed];
      while (index + 1 < lines.length && /^[-*+]\s+/.test(lines[index + 1].trim())) {
        index += 1;
        listLines.push(lines[index].trim());
      }
      blocks.push(renderList(listLines, false));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const listLines = [trimmed];
      while (index + 1 < lines.length && /^\d+\.\s+/.test(lines[index + 1].trim())) {
        index += 1;
        listLines.push(lines[index].trim());
      }
      blocks.push(renderList(listLines, true));
      continue;
    }

    const paragraphLines = [trimmed];
    while (
      index + 1 < lines.length &&
      lines[index + 1].trim() &&
      !/^(#{1,4})\s+/.test(lines[index + 1].trim()) &&
      !/^[-*+]\s+/.test(lines[index + 1].trim()) &&
      !/^\d+\.\s+/.test(lines[index + 1].trim()) &&
      !lines[index + 1].trim().startsWith(">") &&
      !lines[index + 1].trim().startsWith("```")
    ) {
      index += 1;
      paragraphLines.push(lines[index].trim());
    }
    blocks.push(`<p>${renderInline(paragraphLines.join(" "))}</p>`);
  }

  return blocks.join("\n");
}

function getString(data: Frontmatter, key: string, fallback = "") {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
}

function getBoolean(data: Frontmatter, key: string, fallback = false) {
  const value = data[key];
  return typeof value === "boolean" ? value : fallback;
}

function getStringArray(data: Frontmatter, key: string) {
  const value = data[key];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function fileSlug(path: string) {
  return path.split("/").pop()?.replace(/\.md$/, "") || "post";
}

export const blogPosts: BlogPost[] = Object.entries(rawBlogFiles)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw);
    const title = getString(data, "title", fileSlug(path).replace(/-/g, " "));
    const slug = slugify(getString(data, "slug", fileSlug(path) || title));
    const excerpt = getString(data, "excerpt", `${stripMarkdown(content).slice(0, 155)}...`);

    return {
      slug,
      title,
      date: getString(data, "date", new Date().toISOString().slice(0, 10)),
      author: getString(data, "author", "JOT Wellness"),
      category: getString(data, "category", "Parenting"),
      tags: getStringArray(data, "tags"),
      excerpt,
      image: getString(data, "image", DEFAULT_IMAGE),
      imageAlt: getString(data, "imageAlt", title),
      featured: getBoolean(data, "featured", false),
      draft: getBoolean(data, "draft", false),
      readingTime: estimateReadingTime(content),
      content,
      html: markdownToHtml(content),
    };
  })
  .filter((post) => !post.draft)
  .sort((a, b) => Number(b.featured) - Number(a.featured) || Date.parse(b.date) - Date.parse(a.date));

export const blogCategories = ["All", ...Array.from(new Set(blogPosts.map((post) => post.category)))];

export const featuredBlogPosts = blogPosts.slice(0, 4);

export function getBlogPostBySlug(slug?: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function formatBlogDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}
