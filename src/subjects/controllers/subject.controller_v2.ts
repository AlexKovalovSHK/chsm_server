import { ApiTags } from "@nestjs/swagger";
import { SubjectService } from "../service/subject.service";
import { Controller } from "@nestjs/common";


@ApiTags('Subjects')
@Controller('subjects/v2')
export class SubjectControllerV2 {
  constructor(private readonly subjectService: SubjectService) {}
}