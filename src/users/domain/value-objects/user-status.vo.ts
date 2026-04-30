export class UserStatus {
  static readonly ACTIVE = new UserStatus('active');
  static readonly BLOCKED = new UserStatus('blocked');
  static readonly KICKED = new UserStatus('kicked');
  static readonly LEAD = new UserStatus('lead');
  static readonly ARCHIVED = new UserStatus('archived');

  private constructor(private readonly value: string) {}

  static fromString(status: string): UserStatus {
    const validStatuses = ['active', 'blocked', 'kicked', 'lead', 'archived'];
    if (!validStatuses.includes(status)) {
      return UserStatus.ACTIVE; // Default fallback or could throw error
    }
    return new UserStatus(status);
  }

  equals(other: UserStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
