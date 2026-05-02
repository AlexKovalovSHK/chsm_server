import { UserID } from './value-objects/user-id.vo';
import { UserStatus } from './value-objects/user-status.vo';
import { UserRole } from './value-objects/user-role.vo';

export interface UserProps {
  id: UserID;
  firstName: string;
  lastName: string;
  username?: string;
  tel?: string;
  photoUrl?: string;
  email?: string;
  tgId?: string;
  role: UserRole;
  status: UserStatus;
  courses: string[];
  lastSeenTaskIds: string[];
  xp: number;
  level: number;
  googleTokens?: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };
  languageCode?: string;
  registrationStep: string;
  isVerified: boolean;
  isPremium: boolean;
  platformId?: string;
  metadata: Record<string, unknown>;
  _sourceUser?: string;
  _sourceTg?: string;
  _mergedAt?: Date;
  password?: string;
  googleId?: string;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: Omit<UserProps, 'id' | 'status' | 'role' | 'xp' | 'level' | 'courses' | 'lastSeenTaskIds' | 'registrationStep' | 'isVerified' | 'isPremium' | 'metadata'> & Partial<UserProps>): User {
    const id = props.id ?? UserID.generate();
    return new User({
      ...props,
      id,
      firstName: props.firstName,
      lastName: props.lastName,
      role: props.role ?? UserRole.STUDENT,
      status: props.status ?? UserStatus.ACTIVE,
      courses: props.courses ?? [],
      lastSeenTaskIds: props.lastSeenTaskIds ?? [],
      xp: props.xp ?? 0,
      level: props.level ?? 1,
      registrationStep: props.registrationStep ?? 'new',
      isVerified: props.isVerified ?? false,
      isPremium: props.isPremium ?? false,
      metadata: props.metadata ?? {},
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get id(): UserID { return this.props.id; }
  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get username(): string | undefined { return this.props.username; }
  get tel(): string | undefined { return this.props.tel; }
  get photoUrl(): string | undefined { return this.props.photoUrl; }
  get email(): string | undefined { return this.props.email; }
  get tgId(): string | undefined { return this.props.tgId; }
  get role(): UserRole { return this.props.role; }
  get status(): UserStatus { return this.props.status; }
  get courses(): string[] { return this.props.courses; }
  get lastSeenTaskIds(): string[] { return this.props.lastSeenTaskIds; }
  get xp(): number { return this.props.xp; }
  get level(): number { return this.props.level; }
  get googleTokens() { return this.props.googleTokens; }
  get languageCode(): string | undefined { return this.props.languageCode; }
  get registrationStep(): string { return this.props.registrationStep; }
  get isVerified(): boolean { return this.props.isVerified; }
  get isPremium(): boolean { return this.props.isPremium; }
  get platformId(): string | undefined { return this.props.platformId; }
  get metadata(): Record<string, unknown> { return this.props.metadata; }
  get _sourceUser(): string | undefined { return this.props._sourceUser; }
  get _sourceTg(): string | undefined { return this.props._sourceTg; }
  get _mergedAt(): Date | undefined { return this.props._mergedAt; }
  get password(): string | undefined { return this.props.password; }
  get googleId(): string | undefined { return this.props.googleId; }

  // Business Methods
  linkGoogle(email: string, tokens: any, profile?: any) {
    this.props.email = email;
    this.props.googleTokens = tokens;
    if (profile?.id) this.props.googleId = profile.id;
    if (profile?.picture) this.props.photoUrl = profile.picture;
    if (profile?.given_name) this.props.firstName = profile.given_name;
    if (profile?.family_name) this.props.lastName = profile.family_name;
    this.props.isVerified = true;
    this.props.status = UserStatus.ACTIVE;
  }

  addXp(amount: number): { newXp: number; newLevel: number; isLevelUp: boolean } {
    const oldLevel = this.props.level;
    this.props.xp += amount;
    this.props.level = Math.floor(this.props.xp / 100) + 1;
    
    return {
      newXp: this.props.xp,
      newLevel: this.props.level,
      isLevelUp: this.props.level > oldLevel,
    };
  }

  archive() {
    this.props.status = UserStatus.ARCHIVED;
  }

  activate() {
    this.props.status = UserStatus.ACTIVE;
  }

  updateProfile(firstName: string, lastName: string) {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
  }

  updateDetails(props: Partial<Omit<UserProps, 'id' | 'role' | 'status' | 'xp' | 'level'>> & { status?: string, role?: string }) {
    const { status, role, ...other } = props;
    if (status) this.props.status = UserStatus.fromString(status);
    if (role) this.props.role = UserRole.fromString(role);
    Object.assign(this.props, other);
  }

  changeRole(role: UserRole) {
    this.props.role = role;
  }

  setPassword(passwordHash: string) {
    this.props.password = passwordHash;
  }

  toJSON() {
    return {
      id: this.props.id.toString(),
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      username: this.props.username,
      tel: this.props.tel,
      photoUrl: this.props.photoUrl,
      email: this.props.email,
      tgId: this.props.tgId,
      role: this.props.role.toString(),
      status: this.props.status.toString(),
      courses: this.props.courses,
      lastSeenTaskIds: this.props.lastSeenTaskIds,
      xp: this.props.xp,
      level: this.props.level,
      googleTokens: this.props.googleTokens,
      languageCode: this.props.languageCode,
      registrationStep: this.props.registrationStep,
      isVerified: this.props.isVerified,
      isPremium: this.props.isPremium,
      platformId: this.props.platformId,
      metadata: this.props.metadata,
      _sourceUser: this.props._sourceUser,
      _sourceTg: this.props._sourceTg,
      _mergedAt: this.props._mergedAt,
      googleId: this.props.googleId,
    };
  }
}
