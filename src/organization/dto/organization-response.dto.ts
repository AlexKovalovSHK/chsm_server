export class OrganizationResponseDto {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  googleWorkspaceId: string | null;
  plan: string;
  settings: Record<string, any>;
  createdAt: Date;
  membersCount?: number;
}
