import { IsBoolean } from 'class-validator';

export class NotificationPreferencesDto {
  @IsBoolean()
  assignments: boolean;

  @IsBoolean()
  grades: boolean;

  @IsBoolean()
  messages: boolean;

  @IsBoolean()
  system: boolean;

  @IsBoolean()
  deadlines: boolean;

  @IsBoolean()
  emailNotifications: boolean;
}
