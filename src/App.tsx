import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import { AnimatePresence, motion, useInView, type Variants } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./lib/firebase";
import { blogCategories, blogPosts, featuredBlogPosts, formatBlogDate, getBlogPostBySlug, type BlogPost } from "./lib/blog";

type PageKey = "home" | "services" | "guided-growth" | "holding-canvas" | "about" | "blog" | "contact" | "faq";
type AppRoute = { page: PageKey; slug?: string };
type IconName = "network" | "speech" | "hands" | "book" | "ripple" | "heart" | "school" | "shield" | "home" | "chart" | "phone" | "star";

type Service = {
  name: string;
  icon: IconName;
  license: string;
  summary: string;
  detail: string;
  conditions: string[];
  frequency: string;
  credential: string;
};

type LeadForm = {
  childName: string;
  parentName: string;
  phone: string;
  age: string;
  concern: string;
  time: string;
};

const WHATSAPP_NUMBER = "917503191998";

const images = {
  family:
    "https://images.pexels.com/photos/8819068/pexels-photo-8819068.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600",
  therapy:
    "https://images.pexels.com/photos/8653971/pexels-photo-8653971.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600",
  child:
    "https://images.pexels.com/photos/8654102/pexels-photo-8654102.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600",
  school:
    "https://images.pexels.com/photos/8926900/pexels-photo-8926900.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600",
  classroom:
    "https://images.pexels.com/photos/8363040/pexels-photo-8363040.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600",
  founder: "/khushal-singh-founder.jpg",
  founderAlt: "/khushal-singh-founder.jpg",
  parent:
    "https://images.pexels.com/photos/16825058/pexels-photo-16825058.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600",
};

const pageMeta: Record<PageKey, { label: string; title: string; description: string }> = {
  home: {
    label: "Home",
    title: "JOT Wellness | One Team. One Plan. Real Outcomes.",
    description:
      "JOT Wellness is an outcome-based child development and inclusion system offering Guided Growth, Holding Canvas, and individual therapy services across Delhi NCR.",
  },
  services: {
    label: "Therapies",
    title: "Individual Therapy Services | JOT Wellness",
    description:
      "Specialized speech therapy, occupational therapy, special education, behaviour support, psychology, and play-based interventions with measurable goals.",
  },
  "guided-growth": {
    label: "Guided Growth",
    title: "Guided Growth | Outcome-Based Child Development System",
    description:
      "India's first outcome-based home-delivered child development system: one child, one program owner, one personalized roadmap.",
  },
  "holding-canvas": {
    label: "Holding Canvas",
    title: "Holding Canvas | School Inclusion Ecosystem",
    description:
      "A school-embedded inclusion ecosystem aligning students, teachers, families, specialists, and leadership around measurable student success.",
  },
  about: {
    label: "Founder",
    title: "Khushal Singh | Founder & Clinical Director",
    description:
      "Meet Khushal Singh, RCI Licensed Special Educator, BACB-USA ABA Certified professional, Karamveer Chakra award recipient, and founder of JOT Wellness.",
  },
  blog: {
    label: "Blog",
    title: "Resources | JOT Wellness",
    description: "Parent resources, expert insights, and practical guidance on child development, autism, ADHD, speech, OT, and school readiness.",
  },
  contact: {
    label: "Contact",
    title: "Schedule Consultation | JOT Wellness",
    description: "Book a discovery consultation for Guided Growth, Holding Canvas, or individual therapy services across Delhi NCR.",
  },
  faq: {
    label: "FAQ",
    title: "FAQ | JOT Wellness",
    description: "Answers to common parent questions about home therapy, assessments, pricing, credentials, and Guided Growth.",
  },
};

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "guided-growth", label: "Guided Growth" },
  { key: "holding-canvas", label: "Holding Canvas" },
  { key: "services", label: "Therapies" },
  { key: "about", label: "Founder" },
  { key: "blog", label: "Resources" },
  { key: "contact", label: "Contact" },
  { key: "faq", label: "FAQ" },
];

const metrics: Array<{ value: number; suffix: string; label: string } | { text: string; label: string }> = [
  { value: 1200, suffix: "+", label: "Families Served" },
  { value: 7, suffix: "+", label: "Years Leadership" },
  { value: 100, suffix: "%", label: "Outcome-Focused" },
  { text: "Delhi NCR", label: "Home & School Support" },
];

const services: Service[] = [
  {
    name: "Behavior Therapy & ABA",
    icon: "network",
    license: "BACB aligned",
    summary: "Behavior support that studies the why, builds regulation, and strengthens communication.",
    detail:
      "Our behavior programs are respectful, practical, and coordinated. We study triggers, communication barriers, sensory needs, and home routines before building a plan that helps the child feel safer and more capable.",
    conditions: ["Autism", "ADHD", "challenging behavior", "transition difficulty", "attention and regulation needs"],
    frequency: "2 to 5 sessions per week after assessment",
    credential: "BACB-USA supervision available",
  },
  {
    name: "Speech Therapy",
    icon: "speech",
    license: "RCI verified",
    summary: "Helping children understand, express, request, connect, and advocate for themselves.",
    detail:
      "Speech therapy covers receptive language, expressive language, articulation, social communication, play-based interaction, and alternative communication when needed.",
    conditions: ["speech delay", "language delay", "limited expression", "social communication needs", "stammering"],
    frequency: "2 to 4 sessions per week with home practice",
    credential: "RCI licensed speech professionals",
  },
  {
    name: "Occupational Therapy",
    icon: "hands",
    license: "RCI verified",
    summary: "Body awareness, motor planning, self-care, handwriting, and sensory participation.",
    detail:
      "OT helps children participate in daily routines by supporting fine motor skills, gross motor coordination, sensory processing, self-care, and functional independence.",
    conditions: ["sensory challenges", "handwriting difficulty", "poor coordination", "self-care delays", "motor planning needs"],
    frequency: "2 to 3 sessions per week based on goals",
    credential: "RCI licensed occupational therapists",
  },
  {
    name: "Special Education",
    icon: "book",
    license: "RCI verified",
    summary: "Personalized learning plans that respect pace, strengths, and school expectations.",
    detail:
      "Special education bridges development and academics through adapted teaching, functional learning, readiness goals, IEP support, and school collaboration.",
    conditions: ["learning delays", "autism", "ADHD", "school readiness", "functional academic needs"],
    frequency: "2 to 5 sessions per week",
    credential: "RCI licensed special educators",
  },
  {
    name: "Sensory Integration",
    icon: "ripple",
    license: "OT led",
    summary: "Helping children feel safer in their bodies and more comfortable in daily environments.",
    detail:
      "Sensory integration identifies patterns around seeking, avoiding, overwhelm, movement, attention, and daily routines, then creates targeted home strategies.",
    conditions: ["sensory seeking", "sensory avoidance", "meltdowns", "grooming difficulty", "sleep and routine challenges"],
    frequency: "Integrated into OT or standalone blocks",
    credential: "OT-led sensory planning",
  },
  {
    name: "Counseling & Family Support",
    icon: "heart",
    license: "Licensed experts",
    summary: "Emotional support for children, parents, siblings, and family systems.",
    detail:
      "Counseling supports emotional literacy, anxiety, confidence, family stress, parent overwhelm, sibling understanding, and resilient family communication.",
    conditions: ["anxiety", "low confidence", "emotional outbursts", "family stress", "school refusal"],
    frequency: "Weekly or fortnightly",
    credential: "Licensed counseling professionals",
  },
  {
    name: "School Integration",
    icon: "school",
    license: "Inclusion team",
    summary: "Readiness, transition, teacher alignment, classroom strategies, and belonging.",
    detail:
      "We support preschool transition, school readiness, inclusive classroom strategies, teacher notes, parent preparation, and participation goals.",
    conditions: ["school transition", "inclusive education", "peer interaction", "attention needs", "readiness delays"],
    frequency: "Intensive readiness blocks or ongoing support",
    credential: "Special educators and inclusion specialists",
  },
];

const pillars = [
  {
    icon: "shield" as IconName,
    title: "All Licensed. All Verified.",
    proof: "RCI. BACB-USA. Verified.",
    text: "Every therapist holds active credentials or works under certified supervision. License numbers are available on request with no exceptions.",
  },
  {
    icon: "network" as IconName,
    title: "One Plan. One Leader.",
    proof: "No more managing multiple providers.",
    text: "Therapists work under a single coordinated roadmap with shared outcomes, reviews, and accountability.",
  },
  {
    icon: "home" as IconName,
    title: "Your Home. Your Terms.",
    proof: "Morning. Afternoon. Evening. Flexible.",
    text: "Zero travel, flexible scheduling, parent coaching, and therapy designed around the real rhythm of family life.",
  },
  {
    icon: "chart" as IconName,
    title: "Progress You Can See.",
    proof: "Monthly reports. Milestone tracking.",
    text: "Outcome reviews, milestone celebrations, and parent confidence tracking keep everyone aligned on what is working.",
  },
];

const processSteps = [
  ["01", "Discovery Consultation", "We understand concerns, goals, strengths, routines, school context, and the kind of support your family or school needs.", "Free first step"],
  ["02", "Comprehensive Assessment", "A qualified professional studies developmental needs, participation barriers, priorities, and real-world outcomes.", "Structured review"],
  ["03", "Personalized Roadmap", "You receive a written plan with clear goals, responsibilities, timelines, and outcome measures.", "Clear direction"],
  ["04", "Coordinated Delivery", "Therapists, educators, parents, and schools work from one shared roadmap instead of separate recommendations.", "One team"],
  ["05", "Progress Review", "Progress is tracked, discussed, documented, and refined so support remains honest and accountable.", "Every month"],
];

const testimonials = [
  {
    quote:
      "For the first time, everyone involved in my child's development was working together. We finally had clarity, direction, and confidence.",
    author: "Parent",
    role: "Guided Growth™",
    outcome: "One roadmap and visible progress",
  },
  {
    quote:
      "The difference wasn't more therapy. The difference was coordination. We stopped feeling lost.",
    author: "Parent",
    role: "Guided Growth™",
    outcome: "Reduced confusion and stronger home routines",
  },
  {
    quote:
      "Holding Canvas transformed the way our school approached inclusion. Teachers felt supported, parents felt heard, and students benefited.",
    author: "School Leader",
    role: "Holding Canvas™",
    outcome: "Better classroom alignment",
  },
];


const therapists = [
  ["Speech & Language Team", "Communication, language, speech clarity, social communication", "Qualified Professionals", "Goal-based plans"],
  ["Occupational Therapy Team", "Sensory processing, motor development, daily living skills", "Qualified Professionals", "Participation-focused"],
  ["Special Education Team", "Learning strategies, literacy, numeracy, executive functioning", "RCI-Aligned Expertise", "School-ready support"],
  ["Psychology & Behaviour Team", "Regulation, emotional well-being, counselling, behaviour support", "Evidence-Informed", "Family partnership"],
];

const resources = ["School readiness checklist", "Sensory routine planner", "Parent confidence tracker"];


const faqTabs = [
  {
    tab: "Getting Started",
    items: [
      ["Is JOT Wellness a clinic?", "No. JOT Wellness is a coordinated child development ecosystem that delivers therapy, coaching, and planning around the child's real life."],
      ["Do we need a diagnosis first?", "No. We begin with needs, strengths, routines, and family priorities. Diagnosis can guide decisions, but it does not define the child."],
      ["How quickly can we start?", "After the free call and assessment, most families receive a roadmap within 48 hours and can begin scheduling soon after."],
    ],
  },
  {
    tab: "Services",
    items: [
      ["Are sessions available at home?", "Yes. Doorstep support is available across New Delhi, Gurugram, Noida, and Faridabad."],
      ["How is frequency decided?", "Frequency is recommended after assessment based on developmental goals, school timelines, home routines, and intensity needed."],
      ["Is parent coaching included?", "Yes. Parent coaching is part of the ecosystem because progress begins at home."],
    ],
  },
  {
    tab: "Pricing",
    items: [
      ["Are travel fees hidden?", "No. Pricing is designed to include Delhi NCR travel and parent coaching."],
      ["Can we choose only one therapy?", "Yes. Families can choose A La Carte support, Hybrid support, or the full Guided Growth program."],
      ["Is the assessment free?", "The first 15-minute guidance call is free. Formal diagnostic assessments are recommended only when needed."],
    ],
  },
];

const initialLeadForm: LeadForm = { childName: "", parentName: "", phone: "", age: "", concern: "", time: "" };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 42 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: "easeOut" } },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

function getRouteFromHash(): AppRoute {
  const rawHash = window.location.hash.replace(/^#\/?/, "");
  const [pageSegment, slugSegment] = rawHash.split("?")[0].split("/");
  const page = pageSegment as PageKey;
  return { page: pageMeta[page] ? page : "home", slug: page === "blog" ? slugSegment : undefined };
}

function navigateTo(page: PageKey) {
  window.location.hash = `/${page}`;
}

function navigateToBlogPost(slug: string) {
  window.location.hash = `/blog/${slug}`;
}

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function pushAnalyticsEvent(event: Record<string, unknown>) {
  const analyticsWindow = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  analyticsWindow.dataLayer?.push(event);
}

function saveLeadLocally(lead: LeadForm & { source: string; submittedAt: string }) {
  try {
    const existing = JSON.parse(localStorage.getItem("jotAssessmentLeads") || "[]") as Array<unknown>;
    localStorage.setItem("jotAssessmentLeads", JSON.stringify([...existing, lead]));
  } catch {
    localStorage.setItem("jotAssessmentLeads", JSON.stringify([lead]));
  }
}

function getWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function scrollToAssessment() {
  document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(getRouteFromHash);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", handleHashChange);
    if (!window.location.hash) window.history.replaceState(null, "", "#/home");
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const post = route.page === "blog" ? getBlogPostBySlug(route.slug) : undefined;
    const meta = pageMeta[route.page];
    document.title = post ? `${post.title} | JOT Wellness` : meta.title;
    setMetaTag("description", post?.excerpt ?? meta.description);
    pushAnalyticsEvent({ event: "page_view", page: route.page, slug: route.slug });
    window.scrollTo({ top: 0, behavior: "smooth" });

    const schema = {
      "@context": "https://schema.org",
      "@type": "ChildCare",
      name: "JOT Wellness",
      url: window.location.origin,
      description: pageMeta.home.description,
      areaServed: ["New Delhi", "Gurugram", "Noida", "Faridabad"],
      founder: { "@type": "Person", name: "Khushal Singh" },
      slogan: "One Team. One Plan. Real Outcomes.",
      contactPoint: { "@type": "ContactPoint", telephone: "+91 75031 91998", contactType: "customer support" },
    };
    let script = document.getElementById("jot-schema") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "jot-schema";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }, [route.page, route.slug]);

  const page = useMemo(() => {
    switch (route.page) {
      case "services":
        return <ServicesPage />;
      case "guided-growth":
        return <GuidedGrowthPage />;
      case "holding-canvas":
        return <HoldingCanvasPage />;
      case "about":
        return <AboutPage />;
      case "blog":
        return <BlogPage slug={route.slug} />;
      case "contact":
        return <ContactPage />;
      case "faq":
        return <FaqPage />;
      default:
        return <HomePage />;
    }
  }, [route.page, route.slug]);

  return (
    <div className="min-h-screen bg-[var(--warm-white)] text-[var(--forest)]">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <CustomCursor />
      <Header route={route.page} navigate={navigateTo} />
      <AnimatePresence mode="wait">
        <motion.main
          id="main"
          key={`${route.page}-${route.slug ?? "index"}` }
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {page}
        </motion.main>
      </AnimatePresence>
      <Footer navigate={navigateTo} />
      <FloatingWhatsApp />
    </div>
  );
}

function Header({ route, navigate }: { route: PageKey; navigate: (page: PageKey) => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [location, setLocation] = useState("New Delhi");

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (page: PageKey) => {
    navigate(page);
    setIsMobileOpen(false);
    setIsMegaOpen(false);
  };

  return (
    <header className={`world-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="mx-auto flex h-full max-w-[1520px] items-center gap-4 px-5 lg:px-8">
        <button className="shrink-0" onClick={() => handleNav("home")} aria-label="Go to JOT Wellness home">
          <BrandLogo inverse />
        </button>

        <nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <div key={item.key} onMouseEnter={() => item.key === "services" && setIsMegaOpen(true)}>
              <button
                className={`nav-link ${route === item.key ? "active" : ""}`}
                onClick={() => handleNav(item.key)}
                aria-current={route === item.key ? "page" : undefined}
              >
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <div className="location-menu">
            <button className="location-trigger" aria-label="Select service location">
              <span>{location}</span>
              <span aria-hidden="true">v</span>
            </button>
            <div className="location-dropdown">
              {["New Delhi", "Gurugram", "Noida", "Faridabad"].map((city) => (
                <button key={city} onClick={() => setLocation(city)}>
                  <span>{city}</span>
                  {location === city && <span aria-hidden="true">Active</span>}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-gold btn-arrow" onClick={() => handleNav("contact")}>
            Schedule Consultation <span className="arrow-icon">-&gt;</span>
          </button>
        </div>

        <button className="hamburger ml-auto xl:hidden" onClick={() => setIsMobileOpen((value) => !value)} aria-label="Toggle menu" aria-expanded={isMobileOpen}>
          <span />
          <span />
          <span />
        </button>
      </div>

      <AnimatePresence>
        {isMegaOpen && (
          <motion.div
            className="mega-menu hidden xl:block"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            onMouseLeave={() => setIsMegaOpen(false)}
          >
            <div className="glass-dark mx-auto grid max-w-[920px] grid-cols-[1.2fr_0.8fr] gap-10 rounded-[28px] p-8 text-[var(--warm-white)]">
              <div>
                <p className="micro-label text-[var(--gold)]">Our Services</p>
                <div className="mt-5 grid gap-3">
                  {services.slice(0, 7).map((service) => (
                    <button key={service.name} className="mega-link" onClick={() => handleNav("services")}>
                      <span>-&gt;</span> {service.name}
                    </button>
                  ))}
                </div>
                <button className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-[var(--gold)]" onClick={() => handleNav("services")}>
                  View all services -&gt;
                </button>
              </div>
              <div>
                <p className="micro-label text-[var(--gold)]">Quick Access</p>
                <div className="mt-5 grid gap-3 text-sm font-semibold text-white/80">
                  <button className="text-left" onClick={() => handleNav("contact")}>Book assessment</button>
                  <a href="tel:+917503191998">Call now</a>
                  <a href={getWhatsAppUrl("Hello JOT Wellness, I want to schedule a consultation.")} target="_blank" rel="noreferrer">WhatsApp us</a>
                </div>
                <div className="mt-7 rounded-3xl border border-[var(--gold)]/30 bg-white/8 p-5">
                  <p className="font-display text-3xl text-[var(--gold)]">Guided Growth</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">A 12-month coordinated transformation journey.</p>
                  <button className="mt-4 text-sm font-bold text-[var(--gold)]" onClick={() => handleNav("guided-growth")}>
                    Start Guided Growth -&gt;
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div className="mobile-menu xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.nav variants={stagger} initial="hidden" animate="visible" className="grid gap-4" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <motion.button variants={fadeUp} key={item.key} onClick={() => handleNav(item.key)}>
                  {item.label}
                </motion.button>
              ))}
              <motion.button variants={fadeUp} className="btn-gold mt-8" onClick={() => handleNav("contact")}>
                Schedule Consultation -&gt;
              </motion.button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustMetrics />
      <AboutPreview />
      <ServicesEcosystem />
      <WhyChooseUs />
      <ProcessTimeline />
      <FounderSpotlight />
      <Testimonials />
      <BlogPreview />
      <AssessmentSection />
    </>
  );
}

function HeroSection() {
  const words = ["One", "Team.", "One", "Plan.", "Real", "Outcomes."];

  return (
    <section className="hero-section noise-overlay">
      <ParticleField />
      <div className="hero-grid mx-auto grid min-h-screen max-w-[1520px] items-center gap-12 px-5 pt-28 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 max-w-4xl">
          <motion.p variants={cardReveal} className="hero-badge">
            India's First Outcome-Based Transformation System
          </motion.p>
          <motion.h1 className="hero-headline mt-8" aria-label="One Team. One Plan. Real Outcomes.">
            {words.map((word, index) => (
              <motion.span key={`${word}-${index}`} variants={fadeUp} className={word === "Real" || word === "Outcomes." ? "gold-italic" : ""}>
                {word}{index < words.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-7 max-w-2xl text-lg leading-8 text-white/78 md:text-xl">
            Your child doesn't need more disconnected sessions. They need one coordinated team, one written plan, and outcomes that show up in everyday life.
          </motion.p>
          <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-base leading-7 text-white/66">
            Guided Growth™ for families. Holding Canvas™ for schools. Individual therapies for focused support. All coordinated. All outcome-driven.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
            <span>1200+ families</span>
            <span className="text-[var(--gold)]">/</span>
            <span>RCI + BACB-USA expertise</span>
            <span className="text-[var(--gold)]">/</span>
            <span>7+ years</span>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button className="btn-gold btn-arrow" onClick={scrollToAssessment}>
              Schedule Consultation <span className="arrow-icon">-&gt;</span>
            </button>
            <button className="btn-ghost btn-arrow" onClick={() => navigateTo("guided-growth")}>
              Explore Programs <span className="arrow-icon">-&gt;</span>
            </button>
          </motion.div>
          <motion.button variants={fadeUp} className="scroll-indicator" onClick={() => document.getElementById("trust")?.scrollIntoView({ behavior: "smooth" })}>
            Scroll
            <span aria-hidden="true" />
          </motion.button>
        </motion.div>

        <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.6 }}>
          <div className="dot-grid" />
          <img src={images.founder} alt="Khushal Singh speaking about inclusion and child development" className="hero-circle" />
          <FloatingCard className="left-0 top-[16%]" title="1200+" text="Families" />
          <FloatingCard className="right-2 top-[24%] delay-200" title="1" text="Unified plan" />
          <FloatingCard className="bottom-[12%] left-[12%] delay-500" title="RCI" text="Licensed expertise" />
          <div className="credential-badge">Karamveer Chakra Award Recipient</div>
        </motion.div>
      </div>
    </section>
  );
}

function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {Array.from({ length: 68 }).map((_, index) => (
        <span
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 19) % 100}%`,
            animationDelay: `${(index % 14) * 0.3}s`,
            animationDuration: `${8 + (index % 9)}s`,
          }}
        />
      ))}
    </div>
  );
}

function FloatingCard({ title, text, className }: { title: string; text: string; className: string }) {
  return (
    <div className={`floating-card ${className}`}>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function TrustMetrics() {
  return (
    <section id="trust" className="bg-[var(--gold)] py-6 text-[var(--forest)]">
      <motion.div
        className="mx-auto grid max-w-[1520px] divide-y divide-[var(--forest)]/20 px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:px-8"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        {metrics.map((metric) => (
          <motion.div key={metric.label} variants={fadeUp} className="px-4 py-6 text-center">
            {"value" in metric ? <CountMetric value={metric.value} suffix={metric.suffix} /> : <p className="font-display text-5xl font-semibold">{metric.text}</p>}
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em]">{metric.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function CountMetric({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1800;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <p ref={ref} className="font-display text-6xl font-semibold leading-none">
      {count}{suffix}
    </p>
  );
}

function AboutPreview() {
  return (
    <section className="section-pad bg-[var(--warm-white)]">
      <div className="mx-auto grid max-w-[1520px] items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <motion.div className="founder-photo-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={cardReveal}>
          <img src={images.founder} alt="Khushal Singh founder portrait" className="h-[720px] w-full object-cover" />
          <div className="gold-arc" aria-hidden="true" />
          <div className="credential-card top-8 right-8">Karamveer Chakra Awardee</div>
          <div className="credential-card bottom-10 left-8">RCI No. B86705</div>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <motion.p variants={fadeUp} className="eyebrow">Meet the Founder</motion.p>
          <motion.h2 variants={fadeUp} className="display-title mt-5">
            Khushal Singh, building outcome-based systems for child development and inclusion.
          </motion.h2>
          <motion.p variants={fadeUp} className="lead-copy mt-7">
            After 7+ years across special education, inclusion, ABA-informed support, families, schools, and multidisciplinary teams, Khushal Singh built JOT Wellness around one belief: fragmentation is the enemy of progress; coordination is the architecture of transformation.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            {["Karamveer Chakra", "BACB-USA ABA Certified", "RCI Licensed", "1200+ families"].map((item) => (
              <span key={item} className="credential-pill">{item}</span>
            ))}
          </motion.div>
          <motion.blockquote variants={fadeUp} className="quote-block mt-10">
            "Fragmentation is the enemy of progress. Coordination is the architecture of transformation."
            <span>Khushal Singh</span>
          </motion.blockquote>
          <motion.button variants={fadeUp} className="btn-forest btn-arrow mt-9" onClick={() => navigateTo("about")}>
            Meet The Founder <span className="arrow-icon">-&gt;</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function ServicesEcosystem() {
  return (
    <section className="section-pad section-dark noise-overlay text-[var(--inverse)]">
      <div className="mx-auto max-w-[1520px] px-5 lg:px-8">
        <motion.div className="max-w-4xl" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          <motion.p variants={fadeUp} className="eyebrow text-[var(--gold)]">Three Pathways. One Philosophy.</motion.p>
          <motion.h2 variants={fadeUp} className="display-title mt-5 text-[var(--inverse)]">
            Children do not grow in fragments. Their support shouldn't either.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 max-w-3xl text-lg leading-8 text-white/68">
            Whether the need is home-based coordinated support, school-embedded inclusion, or focused therapy, every JOT Wellness pathway is built around coordination, accountability, and measurable outcomes.
          </motion.p>
        </motion.div>

        <motion.div className="mt-16 grid gap-5 lg:grid-cols-4" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <BentoCard large icon="network" title="Guided Growth™" subtitle="Home-delivered child development system" text="One child. One Program Owner. One personalized roadmap connecting therapies, family priorities, school needs, and measurable progress." cta="Learn About Guided Growth" page="guided-growth" />
          <BentoCard icon="school" title="Holding Canvas™" subtitle="School inclusion ecosystem" text="A school-embedded framework aligning students, teachers, parents, specialists, and leadership around student success." cta="Explore Holding Canvas" page="holding-canvas" />
          <BentoCard icon="book" title="Individual Therapies" subtitle="Focused specialist support" text="Speech, OT, special education, behaviour support, psychology, and play-based interventions with clear goals." cta="Explore Therapies" page="services" />
          <BentoCard small icon="heart" title="Family Partnership" subtitle="Parents stay informed" text="Transparent reviews, parent guidance, and honest next steps so families never carry the coordination burden alone." cta="Start Consultation" page="contact" />
        </motion.div>

        <motion.div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-7" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
          {services.map((service) => (
            <motion.article key={service.name} variants={cardReveal} className="service-mini-card xl:col-span-1">
              <Icon name={service.icon} className="h-10 w-10" />
              <h3>{service.name}</h3>
              <span>{service.license}</span>
              <p>{service.summary}</p>
              <button onClick={() => navigateTo("services")}>Learn More -&gt;</button>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function BentoCard({ large, small, icon, title, subtitle, text, cta, page }: { large?: boolean; small?: boolean; icon: IconName; title: string; subtitle: string; text: string; cta: string; page: PageKey }) {
  return (
    <motion.article variants={cardReveal} className={`bento-card ${large ? "lg:col-span-2 lg:row-span-2" : ""} ${small ? "lg:col-span-1" : ""}`}>
      <div className="flex items-start justify-between gap-6">
        <Icon name={icon} className="h-12 w-12 text-[var(--sage)]" />
        {large && <div className="network-visual" aria-hidden="true"><span /><span /><span /></div>}
      </div>
      <h3 className="mt-10 font-display text-5xl leading-none text-[var(--gold)]">{title}</h3>
      <p className="mt-3 text-lg font-bold text-white">{subtitle}</p>
      <p className="mt-4 max-w-xl leading-7 text-white/64">{text}</p>
      {large && (
        <div className="mt-7 flex flex-wrap gap-3">
          {["All 7 therapies", "One leader", "Monthly reports"].map((pill) => <span className="glass-pill" key={pill}>{pill}</span>)}
        </div>
      )}
      <button className="mt-8 font-bold uppercase tracking-[0.16em] text-[var(--gold)]" onClick={() => navigateTo(page)}>
        {cta} -&gt;
      </button>
    </motion.article>
  );
}

function WhyChooseUs() {
  return (
    <section className="section-pad bg-[var(--warm-white)]">
      <div className="mx-auto grid max-w-[1520px] gap-16 px-5 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">Our Difference</p>
          <h2 className="display-title mt-5">Not just therapy. A coordinated system built for your child.</h2>
          <p className="lead-copy mt-7">Every family receives the trust of verified expertise, the relief of coordination, and the clarity of measurable progress.</p>
          <button className="btn-forest btn-arrow mt-9" onClick={() => navigateTo("guided-growth")}>See How It Works <span className="arrow-icon">-&gt;</span></button>
          <div className="timeline-line" aria-hidden="true" />
        </div>
        <motion.div className="grid gap-6" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          {pillars.map((pillar) => (
            <motion.article key={pillar.title} variants={cardReveal} className="pillar-card">
              <Icon name={pillar.icon} className="h-10 w-10 text-[var(--gold)]" />
              <div>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
                <strong>{pillar.proof}</strong>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProcessTimeline() {
  return (
    <section className="section-pad section-dark text-[var(--inverse)]">
      <div className="mx-auto max-w-[1520px] px-5 lg:px-8">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="max-w-4xl">
          <motion.p variants={fadeUp} className="eyebrow text-[var(--gold)]">How It Works</motion.p>
          <motion.h2 variants={fadeUp} className="display-title mt-5 text-[var(--inverse)]">From first call to lasting transformation.</motion.h2>
        </motion.div>
        <div className="horizontal-timeline mt-14" aria-label="JOT Wellness process timeline">
          {processSteps.map(([number, title, text, duration]) => (
            <article key={number} className="step-card">
              <span className="step-number">{number}</span>
              <Icon name={number === "01" ? "phone" : number === "04" ? "home" : number === "05" ? "chart" : "book"} className="h-10 w-10 text-[var(--sage)]" />
              <h3>{title}</h3>
              <p>{text}</p>
              <small>{duration}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderSpotlight() {
  return (
    <section className="founder-immersive">
      <div className="founder-left">
        <img src={images.founderAlt} alt="Khushal Singh clinical director" />
        <div className="founder-glass-card">
          <strong>Karamveer Chakra Awardee</strong>
          <span>India's social impact recognition</span>
          <span>RCI Reg. No. B86705</span>
          <span>BACB-USA Certified</span>
        </div>
      </div>
      <motion.div className="founder-right" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
        <motion.p variants={fadeUp} className="eyebrow">Meet Khushal Singh</motion.p>
        <motion.h2 variants={fadeUp} className="display-title mt-5">Outcome-based systems for children, families, and schools.</motion.h2>
        <motion.p variants={fadeUp} className="lead-copy mt-7">
          Khushal Singh founded JOT Wellness to replace fragmented support with coordinated systems. His work brings together licensed expertise, family partnership, school inclusion, and outcome tracking so children receive direction instead of disconnected recommendations.
        </motion.p>
        <motion.div variants={stagger} className="credential-grid mt-8">
          {["Karamveer Chakra", "RCI Licensed", "BACB-USA ABA Certified", "1200+ Families"].map((item) => <motion.div variants={cardReveal} key={item}>{item}</motion.div>)}
        </motion.div>
        <motion.blockquote variants={fadeUp} className="quote-block mt-9">"Children do not grow in fragments. Their support should not either."</motion.blockquote>
        <motion.button variants={fadeUp} className="btn-forest btn-arrow mt-8" onClick={() => navigateTo("about")}>Read Full Story <span className="arrow-icon">-&gt;</span></motion.button>
      </motion.div>
    </section>
  );
}

function Testimonials() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % testimonials.length), 5200);
    return () => window.clearInterval(timer);
  }, []);
  const testimonial = testimonials[active];

  return (
    <section className="section-pad bg-[var(--warm-white)]">
      <div className="mx-auto max-w-[1180px] px-5 text-center lg:px-8">
        <p className="eyebrow">Parent Stories</p>
        <h2 className="display-title mt-5">Hope becomes real when progress enters daily life.</h2>
        <div className="testimonial-shell mt-14">
          <button aria-label="Previous testimonial" onClick={() => setActive((active + testimonials.length - 1) % testimonials.length)}>-</button>
          <AnimatePresence mode="wait">
            <motion.article key={testimonial.author} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45 }}>
              <span className="giant-quote">"</span>
              <p className="testimonial-quote">{testimonial.quote}</p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <img src={images.parent} alt="Parent testimonial" />
                <div className="text-left">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                  <em>{testimonial.outcome}</em>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
          <button aria-label="Next testimonial" onClick={() => setActive((active + 1) % testimonials.length)}>+</button>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          {testimonials.map((item, index) => (
            <button key={item.author} aria-label={`Show testimonial ${index + 1}`} className={`dot ${index === active ? "active" : ""}`} onClick={() => setActive(index)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  return (
    <section className="section-pad section-dark text-[var(--inverse)]">
      <div className="mx-auto max-w-[1520px] px-5 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow text-[var(--gold)]">Expert Insights</p>
            <h2 className="display-title mt-5 text-[var(--inverse)]">Resources built for parents like you.</h2>
          </div>
          <button className="btn-ghost w-fit" onClick={() => navigateTo("blog")}>View All Articles -&gt;</button>
        </div>
        <MagazineGrid />
      </div>
    </section>
  );
}

function MagazineGrid({ posts = featuredBlogPosts }: { posts?: BlogPost[] }) {
  return (
    <div className="magazine-grid mt-14">
      {posts.map((post, index) => (
        <article
          key={post.slug}
          className={`article-card article-${(index % 4) + 1}`}
          onClick={() => navigateToBlogPost(post.slug)}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") navigateToBlogPost(post.slug);
          }}
        >
          <img src={post.image} alt={post.imageAlt} />
          <div>
            <span>{post.category}</span>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <small>{post.author} - {post.readingTime}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

function AssessmentSection() {
  return (
    <section id="assessment" className="assessment-section noise-overlay">
      <div className="mx-auto grid max-w-[1520px] items-center gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          <motion.p variants={fadeUp} className="eyebrow text-[var(--gold)]">Take the First Step</motion.p>
          <motion.h2 variants={fadeUp} className="display-title mt-5 text-[var(--inverse)]">Your child's journey begins with one call.</motion.h2>
          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-white/72">
            Start with a discovery consultation. No pressure. We will help you understand whether Guided Growth™, Holding Canvas™, or individual therapy is the right next step.
          </motion.p>
          <motion.div variants={stagger} className="mt-9 grid gap-4 text-white/82">
            {["Licensed therapist on every call", "Personalized recommendation", "No sales pressure", "Delhi NCR doorstep service"].map((item) => (
              <motion.div variants={fadeUp} key={item} className="check-item">Included: {item}</motion.div>
            ))}
          </motion.div>
          <motion.a variants={fadeUp} className="whatsapp-link mt-9 inline-flex" href={getWhatsAppUrl("Hello JOT Wellness, I prefer WhatsApp for scheduling a consultation.")} target="_blank" rel="noreferrer">
            Prefer WhatsApp? Message us directly -&gt;
          </motion.a>
        </motion.div>
        <AssessmentForm source="homepage-assessment" inverse />
      </div>
    </section>
  );
}

function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="Individual Therapy Services" title="Specialized Support. Licensed Professionals. Measurable Progress." text="Focused, evidence-informed therapy services designed around communication, regulation, learning, participation, emotional well-being, and everyday independence." image={images.therapy} />
      <ServiceAccordion />
      <PricingTable />
      <ServiceModels />
      <TherapistTeam />
      <AssessmentSection />
    </>
  );
}

function ServiceAccordion() {
  const [open, setOpen] = useState(services[0].name);
  return (
    <section className="section-pad bg-[var(--warm-white)]">
      <div className="mx-auto max-w-[980px] px-5 lg:px-8">
        <p className="eyebrow text-center">Service Details</p>
        <h2 className="display-title mx-auto mt-5 max-w-3xl text-center">Choose support with total clarity.</h2>
        <div className="mt-14 divide-y divide-[var(--forest)]/10 border-y border-[var(--forest)]/10">
          {services.map((service) => {
            const isOpen = open === service.name;
            return (
              <article key={service.name} className="accordion-item">
                <button onClick={() => setOpen(isOpen ? "" : service.name)} aria-expanded={isOpen}>
                  <span><Icon name={service.icon} className="h-8 w-8" />{service.name}</span>
                  <em>{service.license}</em>
                  <strong>{isOpen ? "-" : "+"}</strong>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                      <div className="grid gap-8 pb-8 pt-2 md:grid-cols-[1.35fr_0.65fr]">
                        <div>
                          <p className="lead-copy text-base">{service.detail}</p>
                          <h3 className="mt-6 font-bold uppercase tracking-[0.14em]">Conditions treated</h3>
                          <ul className="mt-4 grid gap-2 text-[var(--text-secondary)]">
                            {service.conditions.map((condition) => <li key={condition}>- {condition}</li>)}
                          </ul>
                        </div>
                        <aside className="quick-facts">
                          <span>Licensed by</span><strong>{service.credential}</strong>
                          <span>Frequency</span><strong>{service.frequency}</strong>
                          <span>Includes</span><strong>Parent coaching</strong>
                          <button onClick={() => navigateTo("contact")}>Book Assessment -&gt;</button>
                          <a href={getWhatsAppUrl(`Hello JOT Wellness, I want to know more about ${service.name}.`)} target="_blank" rel="noreferrer">WhatsApp Us -&gt;</a>
                        </aside>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingTable() {
  const rows = [
    ["Single session", "Home therapy", "By assessment"],
    ["4 sessions", "Weekly rhythm", "Parent coaching included"],
    ["8 sessions", "Best value", "Monthly progress note"],
    ["Guided Growth", "12-month program", "Custom roadmap"],
  ];
  return (
    <section className="section-pad section-dark text-[var(--inverse)]">
      <div className="mx-auto max-w-[1000px] px-5 text-center lg:px-8">
        <p className="eyebrow text-[var(--gold)]">Transparent Pricing</p>
        <h2 className="display-title mt-5 text-[var(--inverse)]">No hidden fees. Parent coaching included.</h2>
        <div className="pricing-table mt-12 overflow-hidden rounded-[28px] border border-white/10">
          <div className="grid grid-cols-3 bg-[var(--gold)]/15 p-5 text-sm font-bold uppercase tracking-[0.16em] text-[var(--gold)]"><span>Plan</span><span>Best for</span><span>Includes</span></div>
          {rows.map((row) => <div key={row[0]} className="grid grid-cols-3 p-5 text-left text-white/78">{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}
        </div>
        <p className="mt-6 border-l-4 border-[var(--sage)] bg-white/6 p-5 text-left text-white/74">All pricing includes parent coaching and Delhi NCR travel. Exact recommendations are shared after assessment.</p>
      </div>
    </section>
  );
}

function ServiceModels() {
  const models = [
    ["Standalone Therapy", "Focused support for a specific area", "Best for targeted needs", "white"],
    ["Therapy + Guided Growth™", "Therapies coordinated into one developmental roadmap", "Best for families seeking full coordination", "featured"],
    ["Therapy + Holding Canvas™", "Integrated school-based support", "Best for students needing classroom alignment", "sage"],
  ];
  return (
    <section className="section-pad bg-[var(--warm-white)]">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <p className="eyebrow text-center">Service Models</p>
        <h2 className="display-title mx-auto mt-5 max-w-4xl text-center">Choose the support model that matches your child's next step.</h2>
        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:items-center">
          {models.map(([name, tagline, best, variant]) => (
            <article key={name} className={`model-card ${variant}`}>
              {variant === "featured" && <span className="popular-badge">Most Popular</span>}
              <h3>{name}</h3>
              <p>{tagline}</p>
              <ul>{["Licensed experts", "Parent coaching", "Progress review"].map((item) => <li key={item}>Included: {item}</li>)}</ul>
              <em>{best}</em>
              <button onClick={() => navigateTo("contact")}>Start -&gt;</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TherapistTeam() {
  return (
    <section className="section-pad bg-[var(--ivory)]">
      <div className="mx-auto max-w-[1520px] px-5 lg:px-8">
        <p className="eyebrow">Qualified Professionals</p>
        <h2 className="display-title mt-5">Professional expertise connected by one outcome-focused philosophy.</h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {therapists.map(([name, role, license, exp], index) => (
            <article key={name} className="therapist-card">
              <img src={[images.child, images.therapy, images.classroom, images.parent][index]} alt={name} />
              <div><h3>{name}</h3><p>{role}</p><span>{license}</span><strong>{exp}</strong><button>View Profile -&gt;</button></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuidedGrowthPage() {
  const outcomes = [
    ["One Program Owner", "One accountable professional oversees planning, delivery, communication, and progress monitoring."],
    ["Written Developmental Roadmap", "Clear goals, clear priorities, clear responsibilities, and measurable outcomes for home and school."],
    ["Coordinated Professionals", "Speech, OT, special education, behaviour support, psychology, and family guidance work from one plan."],
    ["Monthly Progress Reviews", "Progress is tracked, documented, discussed, and refined so families always know what happens next."],
  ];

  return (
    <>
      <PageHero eyebrow="Guided Growth™" title="India's First Outcome-Based Child Development System." text="Home-delivered, fully coordinated, and built for families who need direction—not disconnected sessions." image={images.parent} />
      <section className="section-pad bg-[var(--warm-white)]">
        <div className="mx-auto grid max-w-[1520px] gap-12 px-5 lg:grid-cols-[0.4fr_0.6fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start"><p className="eyebrow">One Child. One Plan.</p><h2 className="display-title mt-5">Everything connects to one goal: real-world progress.</h2><p className="lead-copy mt-7">Most families do not need more therapy sessions. They need a system that coordinates professionals, aligns goals, reduces parental burden, and focuses everyone on the same outcomes.</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            {outcomes.map(([title, text], index) => <article className="growth-step" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>
      <ProcessTimeline />
      <AssessmentSection />
    </>
  );
}

function HoldingCanvasPage() {
  const schoolBenefits = [
    "Comprehensive inclusion framework",
    "Teacher training and capacity building",
    "Assessment, IEP, review, and reporting protocols",
    "Parent engagement systems",
    "Reduced teacher burden",
    "Future-ready inclusion infrastructure",
  ];
  const studentBenefits = [
    "Developmental assessment",
    "Personalized inclusion roadmap",
    "Classroom success strategies",
    "Dedicated case coordination",
    "Monthly progress reviews",
    "Transition and future-readiness planning",
  ];

  return (
    <>
      <PageHero eyebrow="Holding Canvas™" title="India's First Outcome-Based School Inclusion Ecosystem." text="A school-embedded system that aligns students, families, teachers, specialists, and leadership around measurable student success." image={images.school} />
      <section className="section-pad bg-[var(--warm-white)]">
        <div className="mx-auto grid max-w-[1520px] gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div><p className="eyebrow">For Students</p><h2 className="display-title mt-5">Support that belongs inside the school ecosystem.</h2><p className="lead-copy mt-7">Holding Canvas is not a therapy program placed inside a school. It is a coordinated inclusion framework where every stakeholder works from one shared roadmap.</p><div className="mt-8 grid gap-3">{studentBenefits.map((item) => <div className="check-item text-[var(--forest)]" key={item}>✓ {item}</div>)}</div></div>
          <div className="rounded-[34px] bg-[var(--ivory)] p-8 shadow-[0_24px_70px_rgba(26,46,26,0.1)]"><p className="eyebrow">For Schools</p><h2 className="font-display text-5xl leading-none">Systems, not dependency.</h2><p className="lead-copy mt-5">Most schools receive recommendations. Holding Canvas creates implementation, documentation, teacher confidence, parent communication, and sustainable infrastructure.</p><div className="mt-8 grid gap-3">{schoolBenefits.map((item) => <div className="check-item text-[var(--forest)]" key={item}>✓ {item}</div>)}</div><button className="btn-forest mt-8" onClick={() => navigateTo("contact")}>Schedule School Consultation</button></div>
        </div>
      </section>
      <section className="section-pad section-dark text-[var(--inverse)]"><div className="mx-auto max-w-[1180px] px-5 text-center lg:px-8"><p className="eyebrow text-[var(--gold)]">Vision</p><blockquote className="philosophy-quote">"Inclusion is not a department. It is a culture, a system, and a commitment."</blockquote><p className="mx-auto mt-8 max-w-3xl leading-8 text-white/70">Holding Canvas helps schools move beyond accommodation and toward true inclusion where every child can participate, contribute, belong, and thrive.</p></div></section>
      <AssessmentSection />
    </>
  );
}


function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero-photo"><img src={images.founderAlt} alt="Khushal Singh" /></div>
        <div className="about-hero-content">
          <p className="eyebrow">Founder & Clinical Director</p>
          <h1>Khushal<br />Singh</h1>
          <div className="tagline-stack"><span>RCI Licensed Special Educator.</span><span>BACB-USA ABA Certified.</span><span>Karamveer Chakra Award Recipient.</span></div>
        </div>
      </section>
      <section className="section-pad bg-[var(--warm-white)]">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-5 lg:grid-cols-[1fr_320px] lg:px-8">
          <article className="founder-article">
            <p>For over seven years, Khushal Singh has worked with children, families, schools, and professionals across diverse developmental and educational settings. Again and again, he saw the same challenge: children receiving support from multiple experts who rarely coordinated, while parents carried the burden of connecting therapy, school, and home.</p>
            <blockquote>Fragmentation is the enemy of progress. Coordination is the architecture of transformation.</blockquote>
            <p>Progress slowed not because people lacked expertise, but because the system lacked coordination. JOT Wellness was built as the answer: one shared roadmap, one accountable direction, qualified professionals working together, and outcomes measured through everyday life.</p>
            <p>That philosophy became Guided Growth™ for families, Holding Canvas™ for schools, and Individual Therapy Services for targeted needs. The mission is simple: ethical practice, transparent communication, family partnership, and systems designed around each child's future.</p>
          </article>
          <aside className="quick-facts sticky top-28 self-start"><span>Credentials</span><strong>RCI Licensed Special Educator</strong><strong>BACB-USA ABA Certified</strong><strong>Karamveer Chakra Award Recipient</strong><strong>1200+ Families Served</strong><strong>7+ Years Leadership</strong><button onClick={() => navigateTo("contact")}>Schedule Consultation -&gt;</button></aside>
        </div>
      </section>
      <section className="section-pad section-dark text-[var(--inverse)]"><div className="mx-auto max-w-[1180px] px-5 text-center lg:px-8"><p className="eyebrow text-[var(--gold)]">Why JOT Exists</p><blockquote className="philosophy-quote">"Children do not grow in fragments. Their support shouldn't either."</blockquote><p className="mx-auto mt-8 max-w-3xl leading-8 text-white/70">Most families are not looking for more sessions. They are looking for answers, clarity, direction, confidence, and a team they can trust. JOT Wellness brings families, professionals, educators, and schools under one coordinated framework focused on meaningful outcomes.</p><div className="signature">Khushal Singh</div></div></section>
    </>
  );
}


function BlogPage({ slug }: { slug?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  if (slug) {
    const post = getBlogPostBySlug(slug);
    return post ? <BlogDetailPage post={post} /> : <BlogNotFound slug={slug} />;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = category === "All" || post.category === category;
    const matchesQuery = !normalizedQuery || [post.title, post.excerpt, post.category, post.author, ...post.tags].join(" ").toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <section className="blog-hero">
        <div className="mx-auto max-w-[1520px] px-5 pt-36 lg:px-8">
          <p className="eyebrow text-[var(--gold)]">Resources</p>
          <h1>Insights.</h1>
          <p>Practical resources for parents, caregivers, and schools navigating child development, inclusion, therapy, communication, learning, and emotional well-being.</p>
          <input aria-label="Search articles" placeholder="Search parent resources" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div>
            {blogCategories.map((cat) => (
              <button className={category === cat ? "active" : ""} key={cat} onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad bg-[var(--warm-white)]">
        <div className="mx-auto max-w-[1520px] px-5 lg:px-8">
          {filteredPosts.length ? <MagazineGrid posts={filteredPosts} /> : <EmptyBlogState query={query} category={category} />}
        </div>
      </section>
      <section className="section-pad bg-[var(--ivory)]"><div className="mx-auto max-w-[1180px] px-5 lg:px-8"><p className="eyebrow">Free Parent Resources</p><h2 className="display-title mt-5">Download tools for calmer next steps.</h2><div className="mt-12 grid gap-5 md:grid-cols-3">{resources.map((resource) => <article className="resource-card" key={resource}><div>PDF</div><h3>{resource}</h3><p>Actionable guidance from the JOT Wellness clinical team.</p><button>Download -&gt;</button></article>)}</div></div></section>
    </>
  );
}

function BlogDetailPage({ post }: { post: BlogPost }) {
  const relatedPosts = blogPosts.filter((item) => item.slug !== post.slug && item.category === post.category).slice(0, 3);

  return (
    <>
      <article className="blog-detail">
        <header className="blog-detail-hero noise-overlay">
          <img src={post.image} alt={post.imageAlt} />
          <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-36 lg:px-8">
            <button className="blog-back-link" onClick={() => navigateTo("blog")}>← All articles</button>
            <p className="eyebrow text-[var(--gold)]">{post.category}</p>
            <h1>{post.title}</h1>
            <p>{post.excerpt}</p>
            <div className="blog-detail-meta">
              <span>{post.author}</span>
              <span>{formatBlogDate(post.date)}</span>
              <span>{post.readingTime}</span>
            </div>
          </div>
        </header>
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-20 lg:grid-cols-[0.25fr_0.75fr] lg:px-8">
          <aside className="blog-detail-aside">
            <strong>In this article</strong>
            <span>{post.category}</span>
            {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </aside>
          <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
      </article>
      {relatedPosts.length > 0 && (
        <section className="section-pad section-dark text-[var(--inverse)]">
          <div className="mx-auto max-w-[1520px] px-5 lg:px-8">
            <p className="eyebrow text-[var(--gold)]">Related Reading</p>
            <h2 className="display-title mt-5 text-[var(--inverse)]">Continue learning.</h2>
            <MagazineGrid posts={relatedPosts} />
          </div>
        </section>
      )}
    </>
  );
}

function BlogNotFound({ slug }: { slug: string }) {
  return (
    <section className="section-pad bg-[var(--warm-white)] pt-36">
      <div className="mx-auto max-w-[900px] px-5 text-center lg:px-8">
        <p className="eyebrow">Article not found</p>
        <h1 className="display-title mt-5">We could not find that resource.</h1>
        <p className="lead-copy mt-6">No Markdown file currently publishes the slug <strong>{slug}</strong>.</p>
        <button className="btn-forest mt-8" onClick={() => navigateTo("blog")}>Back to Blog</button>
      </div>
    </section>
  );
}

function EmptyBlogState({ query, category }: { query: string; category: string }) {
  return (
    <div className="empty-blog-state">
      <p className="eyebrow">No articles found</p>
      <h2>Try another search.</h2>
      <p>No posts matched {query ? `"${query}"` : "your search"} in {category}.</p>
    </div>
  );
}


function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Let's Start Your Child's Journey." text="Book a family discovery consultation, schedule a school partnership call, or message our Delhi NCR care team." image={images.family} />
      <section className="section-pad bg-[var(--warm-white)]">
        <div className="mx-auto grid max-w-[1520px] gap-8 px-5 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="contact-card featured"><h2>Schedule Consultation</h2><AssessmentForm source="contact-assessment" /></div>
          <div className="grid gap-8">
            <div className="contact-card"><h2>General Inquiry</h2><p className="lead-copy">Ask about Guided Growth™, Holding Canvas™, individual therapy services, locations, or school partnerships.</p><button className="btn-forest mt-5">Send Inquiry -&gt;</button></div>
            <div className="contact-card"><h2>Direct Contact</h2><a href="tel:+917503191998">+91 75031 91998</a><a href="mailto:hello.jotwellness@gmail.com">hello.jotwellness@gmail.com</a><a href={getWhatsAppUrl("Hello JOT Wellness, I want to connect with your care team.")} target="_blank" rel="noreferrer">WhatsApp us</a></div>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-[1520px] px-5 lg:px-8"><div className="map-wrap"><iframe title="JOT Wellness Delhi NCR map" src="https://www.google.com/maps?q=New%20Delhi%20India&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><div>We serve Delhi NCR<br /><span>East Delhi, South Delhi, Noida, Gurugram, Ghaziabad</span></div></div></div>
      </section>
    </>
  );
}

function FaqPage() {
  const [tab, setTab] = useState(faqTabs[0].tab);
  const active = faqTabs.find((item) => item.tab === tab) || faqTabs[0];
  return (
    <>
      <PageHero eyebrow="FAQ" title="Your Questions, Answered." text="Everything parents want to know before starting therapy." image={images.child} />
      <section className="section-pad bg-[var(--warm-white)]"><div className="mx-auto max-w-[980px] px-5 lg:px-8"><div className="faq-tabs" role="tablist">{faqTabs.map((item) => <button role="tab" aria-selected={item.tab === tab} className={item.tab === tab ? "active" : ""} key={item.tab} onClick={() => setTab(item.tab)}>{item.tab}</button>)}</div><div className="mt-10 divide-y divide-[var(--forest)]/10 border-y border-[var(--forest)]/10">{active.items.map(([question, answer]) => <details key={question} className="faq-item"><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div><div className="mt-12 text-center"><h2 className="font-display text-5xl">Still have questions?</h2><div className="mt-6 flex justify-center gap-4"><a className="btn-forest" href={getWhatsAppUrl("Hello JOT Wellness, I have a question.")} target="_blank" rel="noreferrer">WhatsApp Us</a><button className="btn-gold" onClick={() => navigateTo("contact")}>Schedule Consultation</button></div></div></div></section>
    </>
  );
}

function AssessmentForm({ source, inverse = false }: { source: string; inverse?: boolean }) {
  const [form, setForm] = useState<LeadForm>(initialLeadForm);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    const lead = { ...form, source, submittedAt: new Date().toISOString() };
    try {
      if (db) await addDoc(collection(db, "assessmentLeads"), { ...lead, createdAt: serverTimestamp() });
      else saveLeadLocally(lead);
      pushAnalyticsEvent({ event: "lead_capture", source, concern: form.concern });
      setForm(initialLeadForm);
      setStatus("success");
    } catch {
      saveLeadLocally(lead);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={`assessment-form success ${inverse ? "inverse" : ""}`}>
        <h3>We will call you within 2 hours.</h3>
        <p>Watch for a confirmation call or WhatsApp message from the JOT Wellness care team.</p>
        <a className="btn-gold" href={getWhatsAppUrl("Hello JOT Wellness, I submitted the assessment form.")} target="_blank" rel="noreferrer">Open WhatsApp -&gt;</a>
      </div>
    );
  }

  return (
    <motion.form className={`assessment-form ${inverse ? "inverse" : ""}`} onSubmit={submitForm} variants={cardReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
      <div><h3>Schedule Your Discovery Consultation</h3><p>Tell us what support you need. We will guide the next step.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput label="Child's Name" name="childName" value={form.childName} onChange={updateField} />
        <FloatingInput label="Parent's Name" name="parentName" value={form.parentName} onChange={updateField} />
        <FloatingInput label="Phone Number" name="phone" value={form.phone} onChange={updateField} type="tel" />
        <FloatingInput label="Child's Age" name="age" value={form.age} onChange={updateField} />
      </div>
      <label className="select-field"><span>Primary Concern</span><select name="concern" value={form.concern} onChange={updateField} required><option value="">Select concern</option><option>Speech</option><option>Behavior</option><option>Learning</option><option>Motor</option><option>Sensory</option><option>Multiple</option><option>Other</option></select></label>
      <div><span className="time-label">Best Time to Call</span><div className="time-options">{["Morning", "Afternoon", "Evening", "Flexible"].map((time) => <button type="button" key={time} className={form.time === time ? "selected" : ""} onClick={() => setForm((current) => ({ ...current, time }))}>{time}<small>{time === "Morning" ? "9-12" : time === "Afternoon" ? "12-4" : time === "Evening" ? "4-6" : "Any"}</small></button>)}</div></div>
      <button className="btn-gold btn-arrow w-full" disabled={status === "saving"}>{status === "saving" ? "Booking..." : "Schedule Consultation"} <span className="arrow-icon">-&gt;</span></button>
      {status === "error" && <p className="text-sm font-semibold text-[var(--gold)]">Saved locally because the live CRM is unavailable. Please use WhatsApp for immediate support.</p>}
      <p className={inverse ? "text-xs text-white/55" : "text-xs text-[var(--text-secondary)]"}>{isFirebaseConfigured ? "Secure Firebase lead capture enabled." : "CRM-ready lead capture. Add Firebase keys for live database sync."}</p>
    </motion.form>
  );
}

function FloatingInput({ label, name, value, onChange, type = "text" }: { label: string; name: keyof LeadForm; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; type?: string }) {
  return <label className="floating-input"><input name={name} value={value} onChange={onChange} type={type} placeholder=" " required /><span>{label}</span></label>;
}

function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: string; text: string; image: string }) {
  return (
    <section className="page-hero noise-overlay">
      <img src={image} alt="JOT Wellness support" />
      <div className="mx-auto flex min-h-[60vh] max-w-[1520px] items-end px-5 pb-20 pt-32 lg:px-8">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 max-w-4xl">
          <motion.p variants={fadeUp} className="eyebrow text-[var(--gold)]">{eyebrow}</motion.p>
          <motion.h1 variants={fadeUp} className="display-title mt-5 text-[var(--inverse)]">{title}</motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-xl leading-9 text-white/76">{text}</motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function BrandLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand-logo ${inverse ? "inverse" : ""}`}>
      <img src={inverse ? "/jot-wellness-logo-inverse.png" : "/jot-wellness-logo.png"} alt="JOT Wellness - Beyond Labels" />
    </div>
  );
}

function Footer({ navigate }: { navigate: (page: PageKey) => void }) {
  return (
    <footer className="footer-dark noise-overlay">
      <div className="mx-auto grid max-w-[1520px] gap-12 px-5 py-16 lg:grid-cols-[0.45fr_0.55fr] lg:px-8">
        <div><BrandLogo inverse /><p className="mt-6 max-w-md leading-8 text-white/66">One Team. One Plan. Real Outcomes.</p></div>
        <div className="grid gap-8 sm:grid-cols-3"><FooterColumn title="Explore" items={navItems.slice(0, 4)} navigate={navigate} /><FooterColumn title="Support" items={navItems.slice(4)} navigate={navigate} /><div><h3>Locations</h3><p>East Delhi<br />South Delhi<br />Noida<br />Gurugram<br />Ghaziabad</p></div></div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items, navigate }: { title: string; items: Array<{ key: PageKey; label: string }>; navigate: (page: PageKey) => void }) {
  return <div><h3>{title}</h3>{items.map((item) => <button key={item.key} onClick={() => navigate(item.key)}>{item.label}</button>)}</div>;
}

function FloatingWhatsApp() {
  return <a className="floating-whatsapp" href={getWhatsAppUrl("Hello JOT Wellness, I would like to schedule a discovery consultation.")} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><span>Chat on WhatsApp</span><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.8 2 6.8L3.7 29l6.6-1.7c1.8 1 3.8 1.5 5.8 1.5 7.1 0 12.9-5.7 12.9-12.8C29 8.7 23.2 3 16 3Zm0 23.4c-1.9 0-3.6-.5-5.1-1.4l-.4-.2-3.9 1 1-3.8-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.7C5.6 10.2 10.3 5.6 16 5.6s10.4 4.6 10.4 10.3S21.7 26.4 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.5-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5 0-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4Z" /></svg></a>;
}

function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(false);
  useEffect(() => {
    const move = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
    const over = (event: MouseEvent) => setActive(Boolean((event.target as HTMLElement).closest("a,button,input,select,summary")));
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, []);
  return <div className={`custom-cursor ${active ? "active" : ""}`} style={{ "--x": `${position.x}px`, "--y": `${position.y}px` } as CSSProperties} aria-hidden="true"><span /></div>;
}

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const props = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "network") return <svg {...props}><circle cx="6" cy="7" r="3" /><circle cx="18" cy="7" r="3" /><circle cx="12" cy="18" r="3" /><path d="M8.5 8.5 11 15M15.5 8.5 13 15M9 7h6" /></svg>;
  if (name === "speech") return <svg {...props}><path d="M4 5.8A2.8 2.8 0 0 1 6.8 3h10.4A2.8 2.8 0 0 1 20 5.8v6.4a2.8 2.8 0 0 1-2.8 2.8H11l-5 4v-4.1A2.8 2.8 0 0 1 4 12.2Z" /><path d="M8 8h8M8 11h5" /></svg>;
  if (name === "hands") return <svg {...props}><path d="M7 11V5a2 2 0 1 1 4 0v6M11 10V4a2 2 0 1 1 4 0v8" /><path d="M15 11V7a2 2 0 1 1 4 0v6c0 5-3 8-8 8H9c-3 0-5-2-5-5v-4a2 2 0 1 1 4 0v2" /></svg>;
  if (name === "book") return <svg {...props}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 1 4 16.5Z" /><path d="M4 16.5A2.5 2.5 0 0 0 6.5 19H20M8 7h7M8 11h8" /></svg>;
  if (name === "ripple") return <svg {...props}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" /><path d="M3 12a9 9 0 0 1 18 0" /></svg>;
  if (name === "heart") return <svg {...props}><path d="M20.8 5.9c-1.6-2.1-4.7-2.2-6.5-.3L12 8l-2.3-2.4c-1.8-1.9-4.9-1.8-6.5.3-1.7 2.2-1.3 5.3.8 7.1l8 7 8-7c2.1-1.8 2.5-4.9.8-7.1Z" /></svg>;
  if (name === "school") return <svg {...props}><path d="M4 21V8l8-5 8 5v13" /><path d="M8 21v-7h8v7M8 10h.01M12 10h.01M16 10h.01" /></svg>;
  if (name === "shield") return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></svg>;
  if (name === "home") return <svg {...props}><path d="M3 11 12 4l9 7" /><path d="M5 10.5V21h14V10.5" /><path d="M9 21v-6h6v6" /></svg>;
  if (name === "chart") return <svg {...props}><path d="M4 19V5M4 19h16" /><path d="M8 16v-5M12 16V8M16 16v-9" /></svg>;
  if (name === "phone") return <svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>;
  return <svg {...props}><path d="M12 3l2.1 6.5H21l-5.5 4 2.1 6.5-5.6-4-5.6 4 2.1-6.5L3 9.5h6.9L12 3Z" /></svg>;
}