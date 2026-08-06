/**
 * Central content for The Well Church demo site.
 *
 * Values marked `// REAL` were pulled from the church's live site
 * (thewellvegas.org). Values marked `// PLACEHOLDER` are tasteful stand-ins for
 * the pitch and should be replaced with real content before launch.
 */

export const church = {
  name: 'The Well Church', // REAL
  tagline: 'Loving People · Teaching Truth', // REAL
  city: 'Henderson, Nevada', // REAL
  address: {
    street: '800 Cadiz Avenue', // REAL
    cityStateZip: 'Henderson, NV 89015', // REAL
  },
  phone: '(702) 400-9438', // REAL
  phoneHref: 'tel:+17024009438',
  email: 'hello@thewellvegas.org', // PLACEHOLDER — confirm real address
  mapQuery: '800 Cadiz Avenue, Henderson, NV 89015',
  social: {
    facebook: 'https://www.facebook.com/thewellvegas', // REAL handle
    instagram: 'https://www.instagram.com/thewellvegas', // REAL handle
    youtube: 'https://www.youtube.com/@thewellvegas', // REAL handle
  },
} as const;

export const nav = [
  { label: 'Who We Are', href: '/who-we-are' },
  { label: 'What We Do', href: '/what-we-do' },
  { label: 'Connect', href: '/connect' },
  { label: 'Events', href: '/events' },
  { label: 'Give', href: '/give' },
] as const;

export const serviceTimes = {
  // REAL
  inPerson: ['8:30 AM', '10:00 AM', '11:30 AM'],
  online: '10:00 AM',
  note: 'Childcare & Well Kids at all three services',
} as const;

/** The 5 pillars of faith — REAL */
export const pillars = [
  {
    name: 'Bible Study',
    blurb: 'Truth, taught clearly — Scripture as the foundation for everyday life.',
  },
  { name: 'Prayer', blurb: 'A people who talk with God, together and on their own.' },
  { name: 'Worship', blurb: 'Wholehearted response to who God is, every gathering.' },
  { name: 'Fellowship', blurb: 'Real community — doing life shoulder to shoulder.' },
  {
    name: 'Sharing Our Faith',
    blurb: 'Carrying the hope we’ve found out into Henderson and beyond.',
  },
] as const;

/** Ministries — REAL names, PLACEHOLDER descriptions */
export const ministries = [
  {
    name: 'Well Groups',
    blurb: 'Small groups meeting across the valley all week — where church gets personal.',
    href: '/what-we-do',
  },
  {
    name: 'Well Kids',
    blurb: 'Safe, fun, Bible-based environments for kids at every Sunday service.',
    href: '/what-we-do',
  },
  {
    name: 'Youth',
    blurb: 'Middle and high schoolers growing in faith and friendship.',
    href: '/what-we-do',
  },
  {
    name: 'Worship',
    blurb: 'A team leading the room into authentic, present worship.',
    href: '/what-we-do',
  },
  {
    name: 'Baptism',
    blurb: 'Taking your next step of faith? We’ll walk you through it.',
    href: '/connect',
  },
  {
    name: 'Missions',
    blurb: 'Serving our city and the world — the Gospel with hands and feet.',
    href: '/what-we-do',
  },
] as const;

/** Events — PLACEHOLDER content for the demo */
export const events = [
  {
    title: 'Sunday Gatherings',
    date: 'Every Sunday',
    time: '8:30 · 10:00 · 11:30 AM',
    location: 'The Well Church · 800 Cadiz Ave',
    blurb: 'Three identical services — come to whichever fits your morning.',
    tag: 'Weekly',
  },
  {
    title: 'Well Groups Kickoff',
    date: 'Rolling · All Seasons',
    time: 'Various',
    location: 'Homes across Henderson',
    blurb: 'New season, new groups. Find your people and get connected.',
    tag: 'Community',
  },
  {
    title: 'Baptism Sunday',
    date: 'Quarterly',
    time: 'During services',
    location: 'The Well Church',
    blurb: 'Made a decision to follow Jesus? Make it public. We’ll celebrate with you.',
    tag: 'Next Step',
  },
  {
    title: 'Nights of Worship',
    date: 'Seasonal',
    time: '7:00 PM',
    location: 'The Well Church',
    blurb: 'An evening set aside for extended worship and prayer as a church family.',
    tag: 'Worship',
  },
] as const;

/** Leadership — PLACEHOLDER (church site did not expose staff names) */
export const leadership = [
  { name: 'Lead Pastor', role: 'Lead Pastor', initials: 'TW' },
  { name: 'Executive Pastor', role: 'Executive Pastor', initials: 'TW' },
  { name: 'Worship Pastor', role: 'Worship & Creative', initials: 'TW' },
  { name: 'Next Gen Pastor', role: 'Well Kids & Youth', initials: 'TW' },
] as const;

/** Watch-anywhere apps — REAL */
export const apps = ['iOS', 'Android', 'Amazon Fire', 'Roku'] as const;

/**
 * Images the <SectionStage> can display, one per staged section. Each must match
 * a `data-stage-src` on a section. Add church photos here (and on their sections)
 * as they arrive — e.g. '/photos/worship.png' on the "What We Do" section.
 */
export const stageImages = ['/logo.png'] as const;
