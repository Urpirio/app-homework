import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EnrollStudentDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  classroomId?: string;
}
