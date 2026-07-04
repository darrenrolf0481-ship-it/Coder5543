export interface AgentSkill {
  id: string;
  name: string;
  category: string;
  iconName: string; // Named reference to Lucide icons
  description: string;
  rules: string[];
}

export const SKILL_CATEGORIES = [
  'Frontend Development',
  'Backend Development',
  'DevOps & Infrastructure',
  'Testing & QA',
  'Security & Cryptography',
  'AI/ML & Data Science',
] as const;

export const AGENT_SKILLS: AgentSkill[] = [
  // Frontend
  {
    id: 'next-15',
    name: 'Next.js 15 App Router',
    category: 'Frontend Development',
    iconName: 'Layers',
    description: 'Enforce strict architecture boundaries using the Next.js App Router paradigm.',
    rules: [
      'Prioritize React Server Components (RSC) as the default architecture state.',
      'Declare the "use client" directive strictly at the top of interactive leaf-nodes.',
      'Construct deep layouts using nested layouts (layout.tsx) for optimal state caching.',
      'Optimize remote imagery by defining hostname remote patterns in next.config.ts.'
    ]
  },
  {
    id: 'tailwind-v4',
    name: 'Tailwind CSS v4',
    category: 'Frontend Development',
    iconName: 'Code',
    description: 'Style fluid, high-contrast, beautiful web interfaces using modern Tailwind v4 engines.',
    rules: [
      'Utilize standard responsive prefixes (sm:, md:, lg:) rather than absolute widths.',
      'Import Tailwind exclusively using @import "tailwindcss" inside the main stylesheet.',
      'Avoid separate custom stylesheets or inline style attributes to maintain styling health.',
      'Enforce strong color contrast standards between text nodes and parent canvases.'
    ]
  },
  {
    id: 'framer-motion',
    name: 'Framer Motion Spring Engine',
    category: 'Frontend Development',
    iconName: 'Sparkles',
    description: 'Animate web modules dynamically using micro-interactions and smooth entering vectors.',
    rules: [
      'Import elements exclusively from "motion/react" to ensure strict compilation safety.',
      'Apply subtle enters (e.g. y: 15 to 0, opacity: 0 to 1) to eliminate visual jarring.',
      'Never overload state loops; use declarative motion properties for animations.'
    ]
  },

  // Backend
  {
    id: 'fastapi',
    name: 'FastAPI Microservices',
    category: 'Backend Development',
    iconName: 'Zap',
    description: 'Construct fast, secure API routes with automatic Swagger schema declarations.',
    rules: [
      'Enforce strict input/output object formats using Pydantic v2 schemas.',
      'Leverage async def parameters to achieve high-performance non-blocking I/O routing.',
      'Wrap dangerous third-party queries inside localized try-except validation blocks.'
    ]
  },
  {
    id: 'drizzle-pg',
    name: 'Drizzle ORM & PostgreSQL',
    category: 'Backend Development',
    iconName: 'Binary',
    description: 'Manage relational SQL databases, declare type-safe schemas, and construct queries.',
    rules: [
      'Declare PostgreSQL schemas inside centralized schema.ts files for tracking.',
      'Use strictly typed column properties to catch SQL mismatches at compilation time.',
      'Isolate heavy data joins and index high-frequency search properties.'
    ]
  },

  // DevOps
  {
    id: 'docker-containers',
    name: 'Docker Containerization',
    category: 'DevOps & Infrastructure',
    iconName: 'HardDrive',
    description: 'Pack applications securely inside lightweight, isolated container sandboxes.',
    rules: [
      'Design multi-stage Dockerfiles to strip development dependencies from final layers.',
      'Configure containers to execute under non-root users (e.g. node, alpine, custom app).',
      'Leverage alpine-based core layers to maintain minimal vulnerability surfaces.'
    ]
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions Orchestration',
    category: 'DevOps & Infrastructure',
    iconName: 'Workflow',
    description: 'Automate build testing, lint enforcement, and continuous deployments on push.',
    rules: [
      'Isolate steps and run typescript compilation checks before committing release states.',
      'Secure third-party actions by pinning precise SHA hashes rather than version tags.',
      'Implement modular artifact caching to reduce integration turnaround times.'
    ]
  },

  // Testing
  {
    id: 'jest-testing',
    name: 'Jest Unit Verification',
    category: 'Testing & QA',
    iconName: 'CheckSquare',
    description: 'Write deterministic assertions for computational utilities and core math nodes.',
    rules: [
      'Isolate business logic; completely mock external database or HTTP network requests.',
      'Construct descriptive test suites (describe/it blocks) for high codebase legibility.',
      'Verify boundary states (e.g. empty lists, negative values, null inputs) strictly.'
    ]
  },
  {
    id: 'playwright-e2e',
    name: 'Playwright E2E Flows',
    category: 'Testing & QA',
    iconName: 'Activity',
    description: 'Automate multi-browser flows, trace selector networks, and capture screenshots.',
    rules: [
      'Target elements securely using user-facing selectors (e.g. role, text, placeholders).',
      'Maintain separate storage states to parallelize independent authenticated user flows.'
    ]
  },

  // Security
  {
    id: 'firestore-rules',
    name: 'Firestore Security Hardening',
    category: 'Security & Cryptography',
    iconName: 'Shield',
    description: 'Design bulletproof document-level rule trees to secure Cloud Database stores.',
    rules: [
      'Deny all database read and write access patterns by default across the entire tree.',
      'Authorize write actions strictly by matching requesting user IDs against auth contexts.',
      'Validate field structures, object sizes, and required formats on incoming requests.'
    ]
  },
  {
    id: 'owasp-guard',
    name: 'OWASP Top 10 Guard',
    category: 'Security & Cryptography',
    iconName: 'Shield',
    description: 'Fortify web servers against injection, cross-site scripting, and credential leaks.',
    rules: [
      'Escape and sanitize user inputs before rendering them inside the document DOM.',
      'Verify that sensitive environment variables are strictly hidden from the client side.'
    ]
  },

  // AI & Data
  {
    id: 'llama-sdk',
    name: 'Llama & OpenRouter Integrations',
    category: 'AI/ML & Data Science',
    iconName: 'Sparkles',
    description: 'Interact with OpenRouter and local Ollama nodes running Llama models.',
    rules: [
      'Route LLM completions securely using server-side OpenRouter /api/v1/chat/completions endpoint.',
      'Access local LLMs securely by proxying request workflows to Ollama local daemon endpoints.',
      'Structure output data structures utilizing strict JSON schemas and system instructions.'
    ]
  },
  {
    id: 'd3-dataviz',
    name: 'D3.js Intelligent Plots',
    category: 'AI/ML & Data Science',
    iconName: 'Activity',
    description: 'Build mathematical, responsive SVG visualizations and coordinate projections.',
    rules: [
      'Bind SVG dimensions to local container sizes dynamically using ResizeObservers.',
      'Leverage scaleLinear or scaleTime ranges to display real-time streaming telemetry.'
    ]
  }
];
