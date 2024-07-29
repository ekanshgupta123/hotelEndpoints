import { Test, TestingModule } from '@nestjs/testing';
import { ResController } from './res.controller';
import { ResService } from './res.service';

describe('AppController', () => {
  let controller: ResController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ResController],
      providers: [ResService],
    }).compile();

    controller = app.get<ResController>(ResController);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
