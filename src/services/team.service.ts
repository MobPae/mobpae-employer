import { httpClient } from "./http-client";

export interface TeamMember {
  id: string;
  role: string;
  status: string;
  officeCode: string | null;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    lastLogin: string | null;
  };
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  resendCount: number;
  lastSentAt: string | null;
  createdAt: string;
  invitedByUser: {
    email: string;
  };
}

export const teamService = {
  async listMembers(): Promise<TeamMember[]> {
    const { data } = await httpClient.get<TeamMember[]>("/employer-members");
    return data;
  },

  async updateRole(memberId: string, role: string) {
    const { data } = await httpClient.patch(`/employer-members/${memberId}/role`, {
      role,
    });
    return data;
  },

  async suspendMember(memberId: string) {
    const { data } = await httpClient.patch(`/employer-members/${memberId}/suspend`, {});
    return data;
  },

  async removeMember(memberId: string) {
    const { data } = await httpClient.delete(`/employer-members/${memberId}`);
    return data;
  },

  async listInvites(): Promise<PendingInvite[]> {
    const { data } = await httpClient.get<PendingInvite[]>("/employer-members/invites");
    return data;
  },

  async sendInvite(email: string, role: string) {
    const { data } = await httpClient.post("/employer-members/invites", {
      email,
      role,
    });
    return data;
  },

  async resendInvite(inviteId: string) {
    const { data } = await httpClient.post(`/employer-members/invites/${inviteId}/resend`, {});
    return data;
  },

  async revokeInvite(inviteId: string) {
    const { data } = await httpClient.delete(`/employer-members/invites/${inviteId}`);
    return data;
  },
};
