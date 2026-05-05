import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionLevelDto } from './create-session-level.dto';

export class UpdateSessionLevelDto extends PartialType(CreateSessionLevelDto) {}