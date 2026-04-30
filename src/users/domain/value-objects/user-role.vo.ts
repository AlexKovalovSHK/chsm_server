export class UserRole {
  static readonly STUDENT = new UserRole('student');
  static readonly ADMIN = new UserRole('admin');
  static readonly TEACHER = new UserRole('teacher');

  private constructor(private readonly value: string) {}

  static fromString(role: string): UserRole {
    const validRoles = ['student', 'admin', 'teacher'];
    if (!validRoles.includes(role)) {
      return UserRole.STUDENT; // Default fallback
    }
    return new UserRole(role);
  }

  equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
