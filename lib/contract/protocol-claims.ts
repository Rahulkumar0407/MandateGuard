import type { ProtocolClaim } from "./types";

/**
 * M10-E4 Protocol Claim Discipline Matrix.
 *
 * Grounded verification of external commerce/agent protocols.
 * Under no circumstances should MandateGuard claim compliance with standards
 * unless explicitly verified and fully implemented according to official specifications.
 */
export const PROTOCOL_CLAIMS: Record<string, ProtocolClaim> = {
  UCP: {
    protocol: "UCP",
    name: "Unified Commerce Protocol",
    status: "PARTIALLY_COMPATIBLE",
    summary:
      "Compatible with machine-readable structured offer descriptors, product catalog attributes, and checkout contract payloads. Does not implement proprietary distributed UCP multi-node router network RPCs.",
    supportedCapabilities: [
      "Structured product/offer taxonomy",
      "Explicit machine-readable pricing and currency terms",
      "Deterministic entitlement and delivery declarations",
      "Immutable snapshot referencing with content hashes",
    ],
    unsupportedCapabilities: [
      "Decentralized multi-hub payment settlement protocol",
      "Proprietary UCP mesh networking",
    ],
    safePresentationClaim:
      "Compatible with UCP structured product & offer schema definitions.",
  },
  ACP: {
    protocol: "ACP",
    name: "Agentic Commerce Protocol",
    status: "PARTIALLY_COMPATIBLE",
    summary:
      "Compatible with agent-readable offer discovery, intent mapping, structured SLA commitments, and authorization boundary gating. Does not implement multi-party agent escrow relays.",
    supportedCapabilities: [
      "Agent-readable catalog & offer discovery",
      "Untrusted text boundary isolation (prompt injection immunity)",
      "Deterministic hard-constraint evaluation",
      "Gated mutation execution with human/policy authorization",
    ],
    unsupportedCapabilities: [
      "Multi-agent autonomous token escrow",
      "Peer-to-peer agent negotiation protocol",
    ],
    safePresentationClaim:
      "Designed for agentic commerce with isolated machine-readable contracts.",
  },
  AP2: {
    protocol: "AP2",
    name: "Agent Payment Protocol",
    status: "NOT_IMPLEMENTED",
    summary:
      "AP2 specifies a delegated tokenized credential execution scheme between autonomous wallets. MandateGuard uses Razorpay Test Mode subscriptions and deterministic mutation boundaries instead.",
    supportedCapabilities: [],
    unsupportedCapabilities: [
      "Autonomous hardware enclave wallet signing",
      "AP2 decentralized token vouchers",
    ],
    safePresentationClaim:
      "Not implemented (uses Razorpay recurring mandate authorization instead).",
  },
  MCP: {
    protocol: "MCP",
    name: "Model Context Protocol",
    status: "NOT_RELEVANT",
    summary:
      "MCP is a general-purpose JSON-RPC transport protocol for LLM tool calling and resource sharing. It is not a commerce domain protocol for pricing, subscriptions, or mandates.",
    supportedCapabilities: [
      "Can expose contracts as MCP resources if needed by an MCP server host",
    ],
    unsupportedCapabilities: [
      "Commerce domain logic (out of scope for MCP spec)",
    ],
    safePresentationClaim:
      "MCP is a tool-calling protocol, not a financial/commerce standard.",
  },
};

/**
 * Guidelines for presenting claims to judges, merchants, and users.
 */
export const CLAIM_SAFETY_GUIDELINES = {
  SAFE_CLAIMS: [
    "Agent-readable commerce contract",
    "Designed for agentic commerce",
    "Compatible with the documented fields and capabilities we implement",
    "Untrusted catalog text cannot modify authoritative commercial terms or payment boundaries in tested scenarios",
    "Independent external agent adapter produces identical commercial results to internal buyer brain",
  ],
  UNSAFE_CLAIMS: [
    "Fully UCP compliant",
    "Fully ACP compliant",
    "AP2 certified",
    "Immune to all prompt injection",
    "Impossible to attack",
  ],
};
