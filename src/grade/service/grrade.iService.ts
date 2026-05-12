import { GradeDto } from "../dto/grade.dto";
import { CreateGradeDto } from "../dto/new-grade.dto";


export interface GradeIService {
    createNewGrade(dto: CreateGradeDto): Promise<GradeDto>;
    getGradeList(): Promise<GradeDto[]>;
    getGradeListBySubjectId(id: string): Promise<GradeDto[]>;
    getGradeListByStudentId(studentId: string): Promise<GradeDto[]>;
    getGeradeById(id: string): Promise<GradeDto>;
    updateGradeById(dto: GradeDto): Promise<GradeDto>
    deleteGradeById(docId: number): Promise<boolean>
}