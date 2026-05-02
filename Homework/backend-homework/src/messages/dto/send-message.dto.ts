export class SendMessageDto {
  text: string;
  attachment?: {
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize?: number;
  };
}
