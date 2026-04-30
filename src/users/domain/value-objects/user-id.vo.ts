import { randomUUID } from 'crypto';

export class UserID {
  private constructor(private readonly value: string) {}

  static generate(): UserID {
    return new UserID(randomUUID());
  }

  static fromString(id: string): UserID {
    return new UserID(id);
  }

  equals(other: UserID): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
