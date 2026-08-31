import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(() => {
    service = new FilesService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildFileResponse', () => {
    it('returns a public URL built from the stored filename', () => {
      const file = {
        filename: 'image-123.webp',
      } as Express.Multer.File;

      expect(service.buildFileResponse(file)).toEqual({
        url: '/public/uploads/image-123.webp',
      });
    });

    it('uses filename instead of original file metadata', () => {
      const file = {
        filename: 'generated-name.png',
        originalname: 'user-photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      expect(service.buildFileResponse(file)).toEqual({
        url: '/public/uploads/generated-name.png',
      });
    });
  });
});
