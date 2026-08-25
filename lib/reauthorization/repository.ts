import type { ReauthorizationRequest } from "./types";

export interface ReauthorizationRepository {
  createRequest(request: ReauthorizationRequest): Promise<ReauthorizationRequest>;
  getRequestById(id: string): Promise<ReauthorizationRequest | null>;
  getPendingRequestByEnvelopeId(
    envelopeId: string,
  ): Promise<ReauthorizationRequest | null>;
  listRequestsByUserId(userId: string): Promise<ReauthorizationRequest[]>;
  updateRequest(
    id: string,
    updates: Partial<ReauthorizationRequest>,
  ): Promise<ReauthorizationRequest>;
}

export class InMemoryReauthorizationRepository
  implements ReauthorizationRepository
{
  private requests = new Map<string, ReauthorizationRequest>();

  async createRequest(
    request: ReauthorizationRequest,
  ): Promise<ReauthorizationRequest> {
    this.requests.set(request.id, { ...request });
    return { ...request };
  }

  async getRequestById(id: string): Promise<ReauthorizationRequest | null> {
    const r = this.requests.get(id);
    return r ? { ...r } : null;
  }

  async getPendingRequestByEnvelopeId(
    envelopeId: string,
  ): Promise<ReauthorizationRequest | null> {
    for (const r of this.requests.values()) {
      if (r.envelopeId === envelopeId && r.state === "MIGRATION_PENDING") {
        return { ...r };
      }
    }
    return null;
  }

  async listRequestsByUserId(
    userId: string,
  ): Promise<ReauthorizationRequest[]> {
    const list: ReauthorizationRequest[] = [];
    for (const r of this.requests.values()) {
      if (r.userId === userId) list.push({ ...r });
    }
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async updateRequest(
    id: string,
    updates: Partial<ReauthorizationRequest>,
  ): Promise<ReauthorizationRequest> {
    const existing = this.requests.get(id);
    if (!existing) {
      throw new Error(`Reauthorization request '${id}' not found.`);
    }
    const updated: ReauthorizationRequest = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.requests.set(id, updated);
    return { ...updated };
  }
}
