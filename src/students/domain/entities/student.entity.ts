export class Student {
  private _id: string;
  private _userId: string;
  private _instrument: string;
  private _specialization: string;
  private _name: string;
  private _nameRu: string;
  private _city?: string;
  private _country?: string;
  private _telegramId?: string;
  private _classroomUserId?: string;
  private _enrolledAt: Date;

  constructor(props: {
    id: string;
    userId: string;
    instrument: string;
    specialization: string;
    name: string;
    nameRu: string;
    city?: string;
    country?: string;
    telegramId?: string;
    classroomUserId?: string;
    enrolledAt: Date;
  }) {
    this.validate(props);

    this._id = props.id;
    this._userId = props.userId;
    this._instrument = props.instrument;
    this._specialization = props.specialization;
    this._name = props.name;
    this._nameRu = props.nameRu;
    this._city = props.city;
    this._country = props.country;
    this._telegramId = props.telegramId;
    this._classroomUserId = props.classroomUserId;
    this._enrolledAt = props.enrolledAt;
  }

  private validate(props: any): void {
    if (!props.id) throw new Error('Student ID is required');
    if (!props.userId) throw new Error('User ID is required');
    if (!props.instrument) throw new Error('Instrument is required');
    if (!props.specialization) throw new Error('Specialization is required');
    if (!props.name) throw new Error('Name is required');
    if (!props.enrolledAt) throw new Error('Enrollment date is required');
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get instrument(): string {
    return this._instrument;
  }

  get specialization(): string {
    return this._specialization;
  }

  get name(): string {
    return this._name;
  }

  get nameRu(): string {
    return this._nameRu;
  }

  get city(): string | undefined {
    return this._city;
  }

  get country(): string | undefined {
    return this._country;
  }

  get telegramId(): string | undefined {
    return this._telegramId;
  }

  get classroomUserId(): string | undefined {
    return this._classroomUserId;
  }

  get enrolledAt(): Date {
    return this._enrolledAt;
  }

  // Setters / Update methods
  updateProfile(props: {
    instrument?: string;
    specialization?: string;
    name?: string;
    nameRu?: string;
    city?: string;
    country?: string;
    telegramId?: string;
    classroomUserId?: string;
    enrolledAt?: Date;
  }): void {
    if (props.instrument) this._instrument = props.instrument;
    if (props.specialization) this._specialization = props.specialization;
    if (props.name) this._name = props.name;
    if (props.nameRu) this._nameRu = props.nameRu;
    if (props.city !== undefined) this._city = props.city;
    if (props.country !== undefined) this._country = props.country;
    if (props.telegramId !== undefined) this._telegramId = props.telegramId;
    if (props.classroomUserId !== undefined)
      this._classroomUserId = props.classroomUserId;
    if (props.enrolledAt) this._enrolledAt = props.enrolledAt;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      instrument: this.instrument,
      specialization: this.specialization,
      name: this.name,
      nameRu: this.nameRu,
      city: this.city,
      country: this.country,
      telegramId: this.telegramId,
      classroomUserId: this.classroomUserId,
      enrolledAt: this.enrolledAt,
    };
  }
}
