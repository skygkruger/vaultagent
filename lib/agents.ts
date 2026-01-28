// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SUPPORTED AGENT DEFINITIONS
//  Central config for all supported AI coding agents
// ═══════════════════════════════════════════════════════════════

export interface AgentConfig {
  id: string
  name: string
  description: string
  envMethod: string
  setupCommand: string
}

export const SUPPORTED_AGENTS: AgentConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Anthropic CLI agent for terminal-based coding',
    envMethod: 'Reads ANTHROPIC_API_KEY from environment variables',
    setupCommand: 'export VAULTAGENT_TOKEN=va_sess_xxx && claude',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor with integrated chat',
    envMethod: 'Reads env vars or configure via Cursor Settings > Models',
    setupCommand: 'export VAULTAGENT_TOKEN=va_sess_xxx && cursor .',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    description: 'AI code editor by Codeium with Cascade agent',
    envMethod: 'Reads environment variables at launch',
    setupCommand: 'export VAULTAGENT_TOKEN=va_sess_xxx && windsurf .',
  },
  {
    id: 'aider',
    name: 'Aider',
    description: 'Terminal-based AI pair programming tool',
    envMethod: 'Reads OPENAI_API_KEY / ANTHROPIC_API_KEY from env',
    setupCommand: 'export VAULTAGENT_TOKEN=va_sess_xxx && aider',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'AI code completion and chat in VS Code',
    envMethod: 'VS Code extension reads from environment',
    setupCommand: 'export VAULTAGENT_TOKEN=va_sess_xxx && code .',
  },
  {
    id: 'continue',
    name: 'Continue',
    description: 'Open-source AI code assistant for VS Code and JetBrains',
    envMethod: '~/.continue/config.json or environment variables',
    setupCommand: 'export VAULTAGENT_TOKEN=va_sess_xxx && code .',
  },
]

export const AGENT_IDS = SUPPORTED_AGENTS.map((a) => a.id)

export function getAgentById(id: string): AgentConfig | undefined {
  return SUPPORTED_AGENTS.find((a) => a.id === id)
}

export function isKnownAgent(name: string): boolean {
  return SUPPORTED_AGENTS.some((a) => a.id === name || a.name === name)
}
