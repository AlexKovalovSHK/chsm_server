export class CreateOrganizationDto {
  slug: string;
  name: string;
  domain?: string;
  googleWorkspaceId?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
}
