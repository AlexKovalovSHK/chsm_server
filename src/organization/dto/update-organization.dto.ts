export class UpdateOrganizationDto {
  name?: string;
  domain?: string;
  googleWorkspaceId?: string;
  classroomConfig?: Record<string, any>;
  telegramBotToken?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
}
