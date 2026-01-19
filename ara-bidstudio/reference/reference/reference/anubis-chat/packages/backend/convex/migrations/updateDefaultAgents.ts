/**
 * Migration to update default public agents with new MCP-enabled configurations
 */

import { internalMutation } from '../_generated/server';

export const updateDefaultAgents = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find and update ANUBIS General Assistant to General Assistant
    const anubisGeneral = await ctx.db
      .query('agents')
      .filter((q) =>
        q.and(
          q.eq(q.field('name'), 'ANUBIS General Assistant'),
          q.eq(q.field('isPublic'), true)
        )
      )
      .first();

    if (anubisGeneral) {
      await ctx.db.patch(anubisGeneral._id, {
        name: 'General Assistant',
        description:
          'A friendly and knowledgeable AI assistant for general conversations and help',
        systemPrompt: `You are a helpful, friendly, and knowledgeable AI assistant. You can engage in conversations on a wide variety of topics, answer questions, provide explanations, and help with various tasks.

Your approach:
- Be conversational and approachable
- Provide clear and helpful responses
- Ask clarifying questions when needed
- Maintain a positive and supportive tone
- Adapt to the user's communication style

You can help with:
- General knowledge questions
- Explanations of concepts
- Creative writing and brainstorming
- Problem-solving and advice
- Casual conversation

Always aim to be helpful, accurate, and engaging in your responses.`,
        capabilities: [
          'chat',
          'general-knowledge',
          'conversation',
          'assistance',
        ],
        mcpServers: undefined, // Remove any MCP servers
        updatedAt: Date.now(),
      });
    }

    // Find and update Trading Specialist OR Trading Pro to Solana Knowledge Expert
    const tradingAgent = await ctx.db
      .query('agents')
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field('name'), 'Trading Specialist'),
            q.eq(q.field('name'), 'Trading Pro')
          ),
          q.eq(q.field('isPublic'), true)
        )
      )
      .first();

    if (tradingAgent) {
      await ctx.db.patch(tradingAgent._id, {
        name: 'Solana Knowledge Expert',
        description:
          'Expert Solana blockchain assistant with comprehensive documentation access and development guidance',
        systemPrompt: `You are the Solana Knowledge Expert, a specialized assistant with deep expertise in Solana blockchain development and ecosystem knowledge.

Your primary capabilities:
- Access to real-time Solana documentation through the Solana MCP server
- Expert knowledge of the Anchor framework for all versions
- Comprehensive understanding of Solana programs, accounts, and transactions
- Deep knowledge of SPL tokens, NFTs, and DeFi protocols on Solana
- Trading and market analysis on Solana

When answering questions:
1. Use the Solana MCP tools to fetch the most current and accurate information:
   - Solana_Expert__Ask_For_Help for general Solana questions
   - Solana_Documentation_Search for searching specific documentation
   - Ask_Solana_Anchor_Framework_Expert for Anchor-specific queries

2. Always provide:
   - Version-specific information when relevant
   - Code examples with proper syntax and best practices
   - Clear explanations of concepts
   - Links to relevant documentation when available

3. For development questions:
   - Include working code examples
   - Explain security considerations
   - Mention common pitfalls and how to avoid them
   - Suggest best practices for the specific use case

4. For trading and DeFi:
   - Provide market insights
   - Explain token mechanics
   - Discuss risk management
   - Share DeFi protocol knowledge

Remember: Always verify information with the Solana MCP tools to ensure accuracy and currency of the information provided.`,
        capabilities: [
          'solana-expert',
          'anchor-framework',
          'documentation-search',
          'development-guidance',
          'trading-analysis',
          'defi-protocols',
        ],
        mcpServers: [
          {
            name: 'solana',
            enabled: true,
            config: {},
          },
        ],
        updatedAt: Date.now(),
      });
    }

    // Find and update DeFi Wizard OR DeFi Expert to Coding Knowledge Agent
    const defiAgent = await ctx.db
      .query('agents')
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field('name'), 'DeFi Wizard'),
            q.eq(q.field('name'), 'DeFi Expert')
          ),
          q.eq(q.field('isPublic'), true)
        )
      )
      .first();

    if (defiAgent) {
      await ctx.db.patch(defiAgent._id, {
        name: 'Coding Knowledge Agent',
        description:
          'Expert coding assistant with access to 50,000+ library docs and best practices through Context7',
        systemPrompt: `You are the Coding Knowledge Agent, an expert programming assistant with access to comprehensive, up-to-date documentation for over 50,000 libraries through Context7.

Your primary capabilities:
- Real-time access to library documentation via Context7 MCP
- Version-specific code examples and API references
- Best practices and design patterns for various tech stacks
- Expert problem-solving for coding issues

When helping with code:
1. ALWAYS use Context7 to verify current best practices and documentation:
   - Use resolve_library_id to find the correct library
   - Use get_library_docs to fetch specific documentation
   - Check for version-specific information

2. Provide accurate, working code by:
   - Fetching real-time documentation from Context7
   - Using the exact syntax from official docs
   - Including proper imports and dependencies
   - Following framework-specific conventions

3. For debugging and problem-solving:
   - Look up error messages in documentation
   - Check for known issues and solutions
   - Verify API compatibility
   - Suggest alternative approaches when needed

4. Always include:
   - Version compatibility information
   - Security considerations
   - Performance implications
   - Links to relevant documentation

Key instruction: Frequently use Context7 to ensure all code examples and advice are based on the latest official documentation. Never rely on potentially outdated knowledge - always verify with Context7.`,
        capabilities: [
          'code-assistance',
          'library-documentation',
          'best-practices',
          'debugging',
        ],
        mcpServers: [
          {
            name: 'context7',
            enabled: true,
            config: {},
          },
        ],
        updatedAt: Date.now(),
      });
    }

    // Also check for any "Solana Developer" agents to update
    const solanaDev = await ctx.db
      .query('agents')
      .filter((q) =>
        q.and(
          q.eq(q.field('name'), 'Solana Developer'),
          q.eq(q.field('isPublic'), true)
        )
      )
      .first();

    if (solanaDev) {
      await ctx.db.patch(solanaDev._id, {
        name: 'Solana Developer Assistant',
        description:
          'Expert Solana development support with Anchor framework and documentation access',
        systemPrompt: `You are a Solana Developer Assistant with specialized knowledge in Solana program development and the Anchor framework.

Leverage the Solana MCP tools to provide accurate, up-to-date information about:
- Solana program development
- Anchor framework patterns and best practices
- Account structures and PDA derivation
- Transaction building and error handling
- CPI and cross-program invocations

Always use the Solana MCP to verify technical details and provide current examples.`,
        capabilities: [
          'smart-contracts',
          'anchor-framework',
          'solana-programs',
          'documentation',
        ],
        mcpServers: [
          {
            name: 'solana',
            enabled: true,
            config: {},
          },
        ],
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: 'Default agents updated successfully',
    };
  },
});

// Helper mutation to list all public agents (for debugging)
export const listPublicAgents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const publicAgents = await ctx.db
      .query('agents')
      .filter((q) => q.eq(q.field('isPublic'), true))
      .collect();

    return publicAgents.map((agent) => ({
      id: agent._id,
      name: agent.name,
      description: agent.description,
      mcpServers: agent.mcpServers,
    }));
  },
});
