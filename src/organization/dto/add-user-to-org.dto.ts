export class AddUserToOrgDto {
  userId: number;
  role: 'OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'VIEWER';
}
