/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't let `next dev` write an AGENTS.md: its one rule (read the bundled
  // Next 16 docs first) lives in CLAUDE.md, the only notes file this repo keeps.
  agentRules: false,
};

export default nextConfig;
