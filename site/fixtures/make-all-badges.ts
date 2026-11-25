// Write fixtures/all-badges.xlsx, a mock LinkedIn export that earns every badge.
// It has the same sheets and columns as a real export. All values are strings, as in a real export.
// Run with `npm run fixtures` after you change a badge rule or the export format.
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

type Row = (string | null)[];

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(here, 'all-badges.xlsx');

// A fixed seed makes the output the same on each run.
let seed = 42;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const randInt = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

const DAYS = 365;
const start = Date.UTC(2025, 10, 25);
const day = (i: number) => new Date(start + i * 86_400_000);
const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
const end = day(DAYS - 1);

const slugs = [
  'shipping-faster-with-preview-environments', 'what-i-learned-from-100-code-reviews',
  'postgres-indexes-explained', 'my-first-year-as-a-devrel', 'the-case-for-boring-tech',
  'why-we-moved-off-kubernetes', 'how-to-write-a-good-readme', 'lessons-from-a-failed-launch',
  'career-advice-i-wish-i-had', 'debugging-a-memory-leak', 'hiring-junior-engineers',
  'conference-talk-recap', 'side-project-to-startup', 'remote-work-two-years-in',
  'how-i-take-notes', 'open-source-maintainer-burnout', 'the-best-feedback-i-got',
  'writing-docs-people-read', 'cron-jobs-done-right', 'my-desk-setup',
];

// The first post earns Viral. All posts have 10+ engagements for Thought leader.
const posts = Array.from({ length: 60 }, (_, i) => {
  const kind = i % 3 === 0 ? 'ugcPost' : 'share';
  const id = 7400000000000000000n + BigInt(i) * 2718281828459n;
  return {
    url: `https://www.linkedin.com/posts/jane-doe_${slugs[i % slugs.length]}-${kind}-${id}-${(1000 + i * 37).toString(36)}`,
    date: fmt(day(randInt(0, DAYS - 1))),
    type: ['Text', 'Image', 'Video', 'Article', 'Repost'][i % 5],
    engagements: i === 0 ? 4210 : Math.max(12, Math.round(2400 / (i + 1)) + randInt(0, 20)),
    impressions: i === 0 ? 412_000 : Math.round(180_000 / (i + 1)) + randInt(500, 3000),
  };
});

// Each day has engagements for Grindset. The impressions add up to more than 1M for Millionaire.
const engagementRows: Row[] = [['Date', 'Impressions', 'Engagements']];
let totalImpressions = 0;
for (let i = 0; i < DAYS; i++) {
  const impressions = randInt(2200, 4800);
  totalImpressions += impressions;
  engagementRows.push([fmt(day(i)), String(impressions), String(randInt(20, 140))]);
}

const discoveryRows: Row[] = [
  ['Overall Performance', `${fmt(day(0))} - ${fmt(end)}`],
  ['Impressions', String(totalImpressions)],
  ['Members reached', String(Math.round(totalImpressions * 0.31))],
];

const recentRows: Row[] = [[
  'Post URL', 'Post Publish Date', 'Post type', 'Impressions', 'Impressions (in-network)',
  'Impressions (out-of-network)', 'Members reached', 'Followers gained', 'Profile viewers',
  'Reactions', 'Comments', 'Reposts', 'Saves', 'Sends', 'Custom button engagements',
]];
for (const post of posts.slice(0, 3)) {
  const inNetwork = randInt(40, 95);
  recentRows.push([
    post.url, post.date, post.type, String(post.impressions), `${inNetwork}%`, `${100 - inNetwork}%`,
    String(Math.round(post.impressions * 0.6)), String(randInt(0, 40)), String(randInt(0, 30)),
    String(Math.round(post.engagements * 0.8)), String(Math.round(post.engagements * 0.12)),
    String(Math.round(post.engagements * 0.04)), String(randInt(0, 20)), String(randInt(0, 10)), '0',
  ]);
}

const byEngagements = [...posts].sort((a, b) => b.engagements - a.engagements).slice(0, 50);
const byImpressions = [...posts].sort((a, b) => b.impressions - a.impressions).slice(0, 50);
const topRows: Row[] = [
  ['Maximum of 50 posts available to include in this list', null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  ['Post URL', 'Post Publish Date', 'Engagements', '', 'Post URL', 'Post Publish Date', 'Impressions'],
];
for (let i = 0; i < 50; i++) {
  const e = byEngagements[i];
  const m = byImpressions[i];
  topRows.push([e.url, e.date, String(e.engagements), '', m.url, m.date, String(m.impressions)]);
}

// 3 to 8 new followers each day add up to more than 1,000 for Community builder.
const followerRows: Row[] = [
  [`Total followers on ${fmt(end)}`, '18450'],
  [null, null],
  ['Date', 'New followers'],
];
for (let i = 0; i < DAYS; i++) followerRows.push([fmt(day(i)), String(randInt(3, 8))]);

const demographics: Record<string, string[]> = {
  Company: ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark Industries', 'Wayne Enterprises', 'Pied Piper', 'Vandelay Industries', 'Soylent'],
  Location: ['San Francisco Bay Area', 'New York City Metropolitan Area', 'Greater Seattle Area', 'Greater London', 'Bengaluru', 'Greater Boston', 'Austin, Texas Metropolitan Area', 'Toronto, Ontario', 'Los Angeles Metropolitan Area', 'Berlin Metropolitan Area'],
  'Company size': ['10,001+ employees', '1001-5000 employees', '51-200 employees', '201-500 employees', '11-50 employees', '5001-10,000 employees', '501-1000 employees', '2-10 employees', '1 employee'],
  Seniority: ['Senior', 'Entry', 'Director', 'Manager', 'VP', 'Owner', 'CXO', 'Partner', 'Training'],
  'Job title': ['Software Engineer', 'Senior Software Engineer', 'Founder', 'Product Manager', 'Engineering Manager', 'Developer Advocate', 'Data Scientist', 'Recruiter', 'Chief Technology Officer', 'Student'],
  Industry: ['Software Development', 'IT Services and IT Consulting', 'Technology, Information and Internet', 'Financial Services', 'Higher Education', 'Computer and Network Security', 'Staffing and Recruiting', 'Hospitals and Health Care', 'Advertising Services', 'Venture Capital and Private Equity Funds'],
};
function demographicRows(limit: number): Row[] {
  const rows: Row[] = [['Top Demographics', 'Value', 'Percentage']];
  for (const [category, values] of Object.entries(demographics)) {
    values.slice(0, limit).forEach((value, i) => {
      rows.push([category, value, i < 3 ? `${30 - i * 9}%` : '< 1%']);
    });
  }
  return rows;
}

function sheet(rows: Row[], widths: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = widths.map((wch) => ({ wch }));
  return ws;
}

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet(discoveryRows, [20, 24]), 'DISCOVERY');
XLSX.utils.book_append_sheet(workbook, sheet(engagementRows, [11, 12, 12]), 'ENGAGEMENT');
XLSX.utils.book_append_sheet(workbook, sheet(recentRows, [79, 18, 10, 12, 25, 29, 16, 17, 16, 10, 9, 8, 7, 7, 26]), 'MOST RECENT POSTS');
XLSX.utils.book_append_sheet(workbook, sheet(topRows, [79, 18, 12, 7, 79, 18, 12]), 'TOP POSTS');
XLSX.utils.book_append_sheet(workbook, sheet(followerRows, [30, 14]), 'FOLLOWERS');
XLSX.utils.book_append_sheet(workbook, sheet(demographicRows(10), [17, 37, 11]), 'AUDIENCE DEMOGRAPHICS');
XLSX.utils.book_append_sheet(workbook, sheet(demographicRows(9), [17, 37, 11]), 'CONTENT DEMOGRAPHICS');
writeFileSync(output, XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
