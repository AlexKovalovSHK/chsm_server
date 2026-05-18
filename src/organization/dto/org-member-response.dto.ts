export class OrgMemberResponseDto {
  id: string;
  organizationId: string;
  userId: number;
  userMongoId: string;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  role: 'OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'VIEWER';
  createdAt: Date;
}
