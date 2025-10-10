import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  const mockTransactionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findItemsByTransaction: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    mockTransactionsService.findAll.mockReset();
    mockTransactionsService.findOne.mockReset();
    mockTransactionsService.findItemsByTransaction.mockReset();
    mockTransactionsService.create.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
