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
    envMethod: 'VaultAgent CLI decrypts secrets locally and injects into environment',
    setupCommand: 'vaultagent run <token> -- claude',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor with integrated chat',
    envMethod: 'VaultAgent CLI injects API keys before launching Cursor',
    setupCommand: 'vaultagent run <token> -- cursor .',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    description: 'AI code editor by Codeium with Cascade agent',
    envMethod: 'VaultAgent CLI injects API keys before launching Windsurf',
    setupCommand: 'vaultagent run <token> -- windsurf .',
  },
  {
    id: 'aider',
    name: 'Aider',
    description: 'Terminal-based AI pair programming tool',
    envMethod: 'VaultAgent CLI injects OPENAI_API_KEY / ANTHROPIC_API_KEY into env',
    setupCommand: 'vaultagent run <token> -- aider',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'AI code completion and chat in VS Code',
    envMethod: 'VaultAgent CLI injects keys, then launch VS Code with Copilot',
    setupCommand: 'vaultagent run <token> -- code .',
  },
  {
    id: 'continue',
    name: 'Continue',
    description: 'Open-source AI code assistant for VS Code and JetBrains',
    envMethod: 'VaultAgent CLI injects keys, then launch VS Code with Continue',
    setupCommand: 'vaultagent run <token> -- code .',
  },
]

export const AGENT_IDS = SUPPORTED_AGENTS.map((a) => a.id)

export function getAgentById(id: string): AgentConfig | undefined {
  return SUPPORTED_AGENTS.find((a) => a.id === id)
}

export function isKnownAgent(name: string): boolean {
  return SUPPORTED_AGENTS.some((a) => a.id === name || a.name === name)
}
