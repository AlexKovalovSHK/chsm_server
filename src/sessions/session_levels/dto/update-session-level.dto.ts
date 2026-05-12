import { PartialType } from '@nestjs/swagger';
import { CreateSessionLevelDto } from './create-session-level.dto';

export class UpdateSessionLevelDto extends PartialType(CreateSessionLevelDto) {}
