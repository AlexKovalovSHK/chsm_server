export class AcademicYearEntity {
  id: string;
  label: string;
  startsAt: Date;
  endsAt: Date;

  constructor(partial: Partial<AcademicYearEntity>) {
    Object.assign(this, partial);
  }
}
