/**
 * Seed script — populates MongoDB Atlas with demo users, jobs, and applications.
 *
 * Usage:
 *   npm run seed          – adds data (skips if DB already has jobs)
 *   npm run seed:clear    – wipes all three collections first, then re-seeds
 */

import 'dotenv/config';
import mongoose  from 'mongoose';
import bcrypt    from 'bcryptjs';
import User        from '../models/User.js';
import Job         from '../models/Job.js';
import Application from '../models/Application.js';

const CLEAR = process.argv.includes('--clear');

// ── ANSI helpers ──────────────────────────────────────────────
const g = (s) => `\x1b[32m${s}\x1b[0m`; // green
const y = (s) => `\x1b[33m${s}\x1b[0m`; // yellow
const b = (s) => `\x1b[34m${s}\x1b[0m`; // blue
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// ── Seed data ─────────────────────────────────────────────────

const JOBS = [
  {
    title: 'Senior Frontend Engineer', company: 'Stripe',
    companyLogo: 'https://logo.clearbit.com/stripe.com',
    location: 'Remote', salary: '$140k–$180k', salaryMin: 140000, salaryMax: 180000,
    type: 'full-time', department: 'Engineering',
    description: "Build the financial infrastructure of the internet. You'll own large features end-to-end and collaborate closely with design and product.",
    requirements: ['5+ years React / TypeScript', 'Strong CSS fundamentals', 'Experience with design systems', 'Passion for performance'],
    url: 'https://stripe.com/jobs', source: 'manual',
    postedAt: daysAgo(2),
  },
  {
    title: 'Staff Software Engineer', company: 'Vercel',
    companyLogo: 'https://logo.clearbit.com/vercel.com',
    location: 'Remote', salary: '$160k–$200k', salaryMin: 160000, salaryMax: 200000,
    type: 'full-time', department: 'Engineering',
    description: 'Shape the future of frontend deployment. Work on the platform that millions of developers depend on every day.',
    requirements: ['7+ years software engineering', 'Expertise in Node.js or Go', 'Distributed systems experience', 'Open source contributor preferred'],
    url: 'https://vercel.com/careers', source: 'manual',
    postedAt: daysAgo(3),
  },
  {
    title: 'React Developer', company: 'Figma',
    companyLogo: 'https://logo.clearbit.com/figma.com',
    location: 'San Francisco, CA', salary: '$130k–$160k', salaryMin: 130000, salaryMax: 160000,
    type: 'full-time', department: 'Engineering',
    description: 'Help build the collaborative design tool used by over 4 million people. Work directly on the canvas rendering pipeline.',
    requirements: ['4+ years React', 'Canvas / WebGL experience', 'Strong algorithmic thinking', 'Passion for developer tools'],
    url: 'https://figma.com/careers', source: 'manual',
    postedAt: daysAgo(5),
  },
  {
    title: 'Product Engineer', company: 'Linear',
    companyLogo: 'https://logo.clearbit.com/linear.app',
    location: 'Remote', salary: '$120k–$150k', salaryMin: 120000, salaryMax: 150000,
    type: 'full-time', department: 'Engineering',
    description: "Join a small team obsessed with building beautiful, fast software. You'll work across the full stack on features that shape how teams work.",
    requirements: ['3+ years full-stack', 'TypeScript proficiency', 'Appreciation for good UX', 'Self-directed and autonomous'],
    url: 'https://linear.app/careers', source: 'manual',
    postedAt: daysAgo(7),
  },
  {
    title: 'Backend Engineer', company: 'Notion',
    companyLogo: 'https://logo.clearbit.com/notion.so',
    location: 'New York, NY', salary: '$135k–$165k', salaryMin: 135000, salaryMax: 165000,
    type: 'full-time', department: 'Engineering',
    description: 'Scale Notion to hundreds of millions of users. Own critical infrastructure that powers the all-in-one workspace.',
    requirements: ['4+ years backend engineering', 'Experience with Postgres or similar', 'Systems design skills', 'Java / Kotlin preferred'],
    url: 'https://notion.so/careers', source: 'manual',
    postedAt: daysAgo(8),
  },
  {
    title: 'Senior Full Stack Engineer', company: 'Loom',
    companyLogo: 'https://logo.clearbit.com/loom.com',
    location: 'Remote', salary: '$125k–$155k', salaryMin: 125000, salaryMax: 155000,
    type: 'full-time', department: 'Engineering',
    description: 'Make async video communication delightful. Work on the recording, sharing, and collaboration features used by 20M+ users.',
    requirements: ['4+ years full-stack', 'React + Node.js stack', 'Video / WebRTC knowledge a plus', 'Strong product instinct'],
    url: 'https://loom.com/careers', source: 'manual',
    postedAt: daysAgo(10),
  },
  {
    title: 'Systems Engineer', company: 'Cloudflare',
    companyLogo: 'https://logo.clearbit.com/cloudflare.com',
    location: 'Austin, TX', salary: '$145k–$185k', salaryMin: 145000, salaryMax: 185000,
    type: 'full-time', department: 'Infrastructure',
    description: 'Help run one of the largest networks on the planet. Work on the edge infrastructure that handles 20% of global web traffic.',
    requirements: ['5+ years systems / networking', 'C, Rust, or Go', 'TCP/IP and DNS fundamentals', 'Linux kernel familiarity'],
    url: 'https://cloudflare.com/careers', source: 'manual',
    postedAt: daysAgo(11),
  },
  {
    title: 'Developer Experience Engineer', company: 'GitHub',
    companyLogo: 'https://logo.clearbit.com/github.com',
    location: 'Remote', salary: '$150k–$190k', salaryMin: 150000, salaryMax: 190000,
    type: 'full-time', department: 'Engineering',
    description: 'Improve the day-to-day experience of the 100M+ developers on GitHub. Build tooling, APIs, and features that make devs more productive.',
    requirements: ['5+ years engineering', 'Passion for developer tooling', 'Experience with CI/CD pipelines', 'Open source track record'],
    url: 'https://github.com/about/careers', source: 'manual',
    postedAt: daysAgo(13),
  },
  {
    title: 'Senior Mobile Engineer (React Native)', company: 'Shopify',
    companyLogo: 'https://logo.clearbit.com/shopify.com',
    location: 'Remote', salary: '$130k–$160k', salaryMin: 130000, salaryMax: 160000,
    type: 'full-time', department: 'Engineering',
    description: "Help millions of entrepreneurs run their businesses from their phones. Own key surfaces in Shopify's merchant-facing mobile apps.",
    requirements: ['4+ years React Native', 'iOS / Android native experience', 'Strong TypeScript skills', 'Experience with offline-first architecture'],
    url: 'https://shopify.com/careers', source: 'manual',
    postedAt: daysAgo(14),
  },
  {
    title: 'Platform Engineer', company: 'Atlassian',
    companyLogo: 'https://logo.clearbit.com/atlassian.com',
    location: 'New York, NY', salary: '$140k–$175k', salaryMin: 140000, salaryMax: 175000,
    type: 'full-time', department: 'Infrastructure',
    description: 'Build the internal platform that powers Jira, Confluence, and Trello. Help engineering teams ship faster and more reliably.',
    requirements: ['5+ years platform / infra', 'Kubernetes and Helm', 'Terraform or Pulumi', 'Developer empathy'],
    url: 'https://atlassian.com/company/careers', source: 'manual',
    postedAt: daysAgo(16),
  },
  {
    title: 'Infrastructure Engineer', company: 'HashiCorp',
    companyLogo: 'https://logo.clearbit.com/hashicorp.com',
    location: 'Remote', salary: '$145k–$180k', salaryMin: 145000, salaryMax: 180000,
    type: 'full-time', department: 'Infrastructure',
    description: 'Help enterprises adopt infrastructure-as-code at scale. Work on Terraform Cloud and Vault internals.',
    requirements: ['5+ years infra engineering', 'Go programming language', 'Terraform or cloud-native tooling', 'Security mindset'],
    url: 'https://hashicorp.com/jobs', source: 'manual',
    postedAt: daysAgo(18),
  },
  {
    title: 'Data Engineer', company: 'Databricks',
    companyLogo: 'https://logo.clearbit.com/databricks.com',
    location: 'San Francisco, CA', salary: '$160k–$210k', salaryMin: 160000, salaryMax: 210000,
    type: 'full-time', department: 'Data',
    description: 'Build the Lakehouse that powers analytics for Fortune 500 companies. Work on petabyte-scale data pipelines.',
    requirements: ['4+ years data engineering', 'Apache Spark / Delta Lake', 'Python and SQL mastery', 'Distributed computing fundamentals'],
    url: 'https://databricks.com/company/careers', source: 'manual',
    postedAt: daysAgo(20),
  },
  {
    title: 'Senior Software Engineer', company: 'Confluent',
    companyLogo: 'https://logo.clearbit.com/confluent.io',
    location: 'Remote', salary: '$155k–$195k', salaryMin: 155000, salaryMax: 195000,
    type: 'full-time', department: 'Engineering',
    description: 'Build the event streaming platform for Fortune 500 companies based on Apache Kafka. Own mission-critical distributed systems.',
    requirements: ['5+ years distributed systems', 'Java or Scala', 'Deep Kafka knowledge preferred', 'Performance optimization experience'],
    url: 'https://confluent.io/careers', source: 'manual',
    postedAt: daysAgo(22),
  },
  {
    title: 'Cloud Engineer', company: 'Snowflake',
    companyLogo: 'https://logo.clearbit.com/snowflake.com',
    location: 'Remote', salary: '$170k–$220k', salaryMin: 170000, salaryMax: 220000,
    type: 'full-time', department: 'Infrastructure',
    description: 'Scale the Data Cloud to exabytes. Work on the multi-cloud storage and compute layer that enterprise customers depend on.',
    requirements: ['6+ years cloud engineering', 'AWS, Azure, and GCP', 'C++ or Java for performance work', 'Distributed query engines'],
    url: 'https://snowflake.com/careers', source: 'manual',
    postedAt: daysAgo(24),
  },
  {
    title: 'Open Source Engineer', company: 'Grafana Labs',
    companyLogo: 'https://logo.clearbit.com/grafana.com',
    location: 'Remote', salary: '$120k–$150k', salaryMin: 120000, salaryMax: 150000,
    type: 'full-time', department: 'Engineering',
    description: 'Work full-time on open source observability tooling used by millions of engineers worldwide.',
    requirements: ['4+ years engineering', 'Go programming language', 'Observability / metrics / logs / traces', 'Open source contribution history'],
    url: 'https://grafana.com/about/careers', source: 'manual',
    postedAt: daysAgo(26),
  },
  {
    title: 'Full Stack Engineer', company: 'Supabase',
    companyLogo: 'https://logo.clearbit.com/supabase.com',
    location: 'Remote', salary: '$110k–$140k', salaryMin: 110000, salaryMax: 140000,
    type: 'contract', department: 'Engineering',
    description: 'Help build the open source Firebase alternative. Work on the dashboard, CLI, and client libraries used by 500K+ developers.',
    requirements: ['3+ years full-stack', 'React and TypeScript', 'PostgreSQL depth', 'Open source mindset'],
    url: 'https://supabase.com/careers', source: 'manual',
    postedAt: daysAgo(28),
  },
  {
    title: 'Database Engineer', company: 'PlanetScale',
    companyLogo: 'https://logo.clearbit.com/planetscale.com',
    location: 'Remote', salary: '$130k–$165k', salaryMin: 130000, salaryMax: 165000,
    type: 'full-time', department: 'Engineering',
    description: 'Build the MySQL-compatible serverless database platform. Work on Vitess internals and the developer-facing API layer.',
    requirements: ['5+ years database engineering', 'MySQL / Vitess expertise', 'Go programming language', 'Sharding and horizontal scaling'],
    url: 'https://planetscale.com/careers', source: 'manual',
    postedAt: daysAgo(30),
  },
  {
    title: 'Site Reliability Engineer', company: 'Fly.io',
    companyLogo: 'https://logo.clearbit.com/fly.io',
    location: 'Remote', salary: '$125k–$160k', salaryMin: 125000, salaryMax: 160000,
    type: 'full-time', department: 'Infrastructure',
    description: 'Keep the global application platform running at the edge. Work on the orchestration layer and network infrastructure.',
    requirements: ['4+ years SRE / ops', 'Rust or Go', 'Anycast networking fundamentals', 'On-call experience'],
    url: 'https://fly.io/jobs', source: 'manual',
    postedAt: daysAgo(33),
  },
  {
    title: 'Developer Relations Engineer', company: 'Render',
    companyLogo: 'https://logo.clearbit.com/render.com',
    location: 'Remote', salary: '$115k–$145k', salaryMin: 115000, salaryMax: 145000,
    type: 'full-time', department: 'Engineering',
    description: 'Be the bridge between Render and the developer community. Build demos, write guides, and advocate for developer needs internally.',
    requirements: ['3+ years engineering', 'Public speaking / writing experience', 'Cloud deployment familiarity', 'Empathy for developers at all skill levels'],
    url: 'https://render.com/careers', source: 'manual',
    postedAt: daysAgo(36),
  },
  {
    title: 'Security Engineer', company: 'Tailscale',
    companyLogo: 'https://logo.clearbit.com/tailscale.com',
    location: 'Remote', salary: '$140k–$175k', salaryMin: 140000, salaryMax: 175000,
    type: 'full-time', department: 'Engineering',
    description: 'Make network security easy and invisible. Work on the WireGuard-based mesh VPN used by individuals and enterprises worldwide.',
    requirements: ['5+ years security engineering', 'WireGuard or VPN protocol knowledge', 'Go programming language', 'Cryptography fundamentals'],
    url: 'https://tailscale.com/careers', source: 'manual',
    postedAt: daysAgo(40),
  },
];

// ── Helpers ───────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Main ──────────────────────────────────────────────────────

async function seed() {
  const start = Date.now();
  console.log(b('\n  Job Dashboard — Atlas Seed Script\n'));

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
    family: 4,
  });
  console.log(g('  ✓ Connected to MongoDB Atlas'));

  // ── Guard: skip if data exists and --clear wasn't passed ──
  if (!CLEAR) {
    const count = await Job.countDocuments();
    if (count > 0) {
      console.log(y(`\n  ⚠  Database already contains ${count} job(s).`));
      console.log(dim('     Run  npm run seed:clear  to wipe and re-seed.\n'));
      await mongoose.disconnect();
      return;
    }
  }

  // ── Clear ──────────────────────────────────────────────────
  if (CLEAR) {
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
    ]);
    console.log(y('  ✓ Cleared users, jobs, and applications'));
  }

  // ── Users ──────────────────────────────────────────────────
  const salt    = await bcrypt.genSalt(12);
  const adminPw = await bcrypt.hash('Admin123!', salt);
  const demoPw  = await bcrypt.hash('Demo1234!', salt);

  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@jobhub.io', password: adminPw, role: 'admin' },
    { name: 'Alex Johnson', email: 'demo@jobhub.io',  password: demoPw,  role: 'user'  },
  ]);
  console.log(g(`  ✓ Created ${users.length} users`));

  // ── Jobs ───────────────────────────────────────────────────
  const jobs = await Job.insertMany(JOBS);
  console.log(g(`  ✓ Created ${jobs.length} jobs`));

  // ── Applications (for the demo user) ──────────────────────
  const demoUser = users.find((u) => u.email === 'demo@jobhub.io');

  const applications = await Application.insertMany([
    {
      user: demoUser._id, company: jobs[0].company, role: jobs[0].title,
      location: jobs[0].location, salary: jobs[0].salary, type: 'Full-time',
      url: jobs[0].url, status: 'interview',
      appliedAt: daysAgo(5), notes: 'Had a great first call with the recruiter.',
    },
    {
      user: demoUser._id, company: jobs[1].company, role: jobs[1].title,
      location: jobs[1].location, salary: jobs[1].salary, type: 'Full-time',
      url: jobs[1].url, status: 'pending',
      appliedAt: daysAgo(8),
    },
    {
      user: demoUser._id, company: jobs[2].company, role: jobs[2].title,
      location: jobs[2].location, salary: jobs[2].salary, type: 'Full-time',
      url: jobs[2].url, status: 'offer',
      appliedAt: daysAgo(14), notes: 'Offer received! Negotiating salary.',
    },
    {
      user: demoUser._id, company: jobs[3].company, role: jobs[3].title,
      location: jobs[3].location, salary: jobs[3].salary, type: 'Full-time',
      url: jobs[3].url, status: 'rejected',
      appliedAt: daysAgo(20), notes: 'They went with someone more senior.',
    },
    {
      user: demoUser._id, company: jobs[4].company, role: jobs[4].title,
      location: jobs[4].location, salary: jobs[4].salary, type: 'Full-time',
      url: jobs[4].url, status: 'pending',
      appliedAt: daysAgo(3),
    },
  ]);
  console.log(g(`  ✓ Created ${applications.length} applications for ${demoUser.name}`));

  // ── Summary ────────────────────────────────────────────────
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(b(`\n  ✅ Seed complete in ${elapsed}s\n`));

  console.log('  Demo credentials');
  console.log(dim('  ─────────────────────────────────────────'));
  console.log(`  Admin  ${b('admin@jobhub.io')}   password: ${b('Admin123!')}`);
  console.log(`  User   ${b('demo@jobhub.io')}    password: ${b('Demo1234!')}`);
  console.log(dim('  ─────────────────────────────────────────\n'));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('\n  ❌ Seed failed:', err.message);
  process.exit(1);
});
