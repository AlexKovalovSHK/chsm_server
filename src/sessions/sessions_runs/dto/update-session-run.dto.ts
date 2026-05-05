import { PartialType } from '@nestjs/swagger';
import { CreateSessionRunDto } from './create-session-run.dto';

export class UpdateSessionRunDto extends PartialType(CreateSessionRunDto) {}
