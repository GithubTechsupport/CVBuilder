// Fictional example CV, used to seed the dashboard and for "Start from example".
// An optional headshot.jpg next to this file is used as the photo.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uid = () => randomUUID();

function section(preset, kind, title, column, extra = {}) {
  return {
    id: uid(),
    kind,
    preset,
    title,
    column,
    hidden: false,
    accentLine: false,
    content: '',
    entries: [],
    items: [],
    details: [],
    levels: [],
    listStyle: 'stacked',
    levelStyle: 'bar',
    fontScale: 1,
    ...extra,
  };
}

const entry = (title, subtitle, date, description, location = '') => ({
  id: uid(),
  title,
  subtitle,
  location,
  date,
  description,
});

const list = (...texts) => texts.map((text) => ({ id: uid(), text }));
const details = (...pairs) => pairs.map(([label, value]) => ({ id: uid(), label, value }));
const levels = (...pairs) => pairs.map(([name, level]) => ({ id: uid(), name, level }));
const bullets = (...items) => `<ul>${items.map((i) => `<li><p>${i}</p></li>`).join('')}</ul>`;

export async function buildExampleCV(id) {
  let photo = null;
  try {
    const jpg = await fs.readFile(path.join(__dirname, 'headshot.jpg'));
    photo = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  } catch {
    // Photo is optional.
  }
  const now = new Date().toISOString();

  return {
    id,
    name: 'CV – English (example)',
    template: 'monochrome',
    style: {
      palette: 'charcoal',
      accent: '#1a1a19',
      sidebarBg: '#1a1a19',
      sidebarText: '#ffffff',
      textColor: '#111111',
      headingFont: 'Lato',
      bodyFont: 'Lato',
      fontSize: 13,
      lineHeight: 1.54,
      spacing: 1,
      pageFormat: 'continuous',
      showPhoto: true,
      photoShape: 'square',
      sidebarWidth: 35,
    },
    profile: {
      firstName: 'Alex',
      lastName: 'Nordmann',
      headline: 'Student',
      email: '',
      phone: '',
      location: '',
      website: '',
      photo,
    },
    sections: [
      section('personal', 'details', 'Personal Information', 'sidebar', {
        details: details(
          ['Date of Birth', '01/01/2000'],
          ['Phone Number', '+47 000 00 000'],
          ['Mail', 'alex.nordmann@example.com'],
          ['Address', 'Eksempelveien 1, 0001 Oslo, Norway'],
        ),
      }),
      section('links', 'details', 'Links', 'sidebar', {
        accentLine: true,
        details: details(['LinkedIn:', 'linkedin.com/in/example'], ['GitHub:', 'github.com/example']),
      }),
      section('skills', 'list', 'Skills', 'sidebar', {
        accentLine: true,
        items: list('Frontend development', 'Backend development', 'Data analysis', 'Product development'),
      }),
      section('technologies', 'text', 'Technologies', 'sidebar', {
        content: '<p>JavaScript, TypeScript, React, Node, Express, Python, SQL, MongoDB, Docker</p>',
      }),
      section('languages', 'levels', 'Languages', 'sidebar', {
        accentLine: true,
        levels: levels(['Norwegian', 100], ['English', 90], ['Spanish', 40]),
      }),
      section('references', 'entries', 'References', 'sidebar', {
        accentLine: true,
        entries: [
          entry('Kari Hansen', 'Team Lead at Example AS', '', '<p>Available on request</p>'),
          entry('Ola Berg', 'Lecturer at Example University', '', '<p>Available on request</p>'),
        ],
      }),
      section('about', 'text', 'About me', 'main', {
        content:
          '<p>Analytical informatics student with hands-on experience in full-stack development and data-driven applications. Enjoys turning complex technical challenges into clear, functional solutions, and works well both independently and in teams.</p>',
      }),
      section('education', 'entries', 'Education', 'main', {
        entries: [
          entry(
            'Informatics (Masters)',
            'Example University',
            '2024 - 2026',
            '<p>Courses: Digital Business Development, Machine Learning, Qualitative Research Methods</p>',
          ),
          entry(
            'Informatics (Bachelors)',
            'Example University',
            '2021 - 2024',
            '<p>Courses: Object-oriented Programming, Algorithms and Data Structures, Information Security, Software Engineering with Project Work</p>',
          ),
        ],
      }),
      section('experience', 'entries', 'Work Experience', 'main', {
        entries: [
          entry(
            'Software Developer Intern',
            'Example Tech AS',
            'Jun 2025 - Aug 2025',
            '<p>Developed new features for an internal CRM system in close collaboration with product and marketing, in an agile team with frequently changing requirements.</p>',
            'Oslo',
          ),
          entry(
            'Teaching Assistant',
            'Example University',
            'Jan 2024 - Jun 2024',
            '<p>Led weekly group sessions, graded assignments and answered student questions in an introductory programming course.</p>',
            'Oslo',
          ),
        ],
      }),
      section('projects', 'entries', 'Projects', 'main', {
        entries: [
          entry(
            'Weather Activity App',
            'University project',
            'Mar 2024 - Jun 2024',
            '<p><strong>Mobile app for weather-based activity suggestions</strong><br>Android app that combines weather and map data to suggest activities based on local conditions.</p>' +
              bullets(
                'Integrated public weather and places APIs and transformed the data into structured input.',
                'Implemented map and route visualization with OpenStreetMap.',
                'Contributed to system modelling and agile project management.',
              ) +
              '<p><strong>Technologies:</strong> Kotlin, Jetpack Compose, REST APIs</p>',
          ),
        ],
      }),
    ],
    createdAt: now,
    updatedAt: now,
  };
}
