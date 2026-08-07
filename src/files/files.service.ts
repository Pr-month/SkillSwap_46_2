import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  buildFileResponse(file: Express.Multer.File) {
    return {
    url: `/public/uploads/${file.filename}`,
  };
}
}