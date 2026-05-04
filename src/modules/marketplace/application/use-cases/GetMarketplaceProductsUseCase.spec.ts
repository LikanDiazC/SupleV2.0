import { GetMarketplaceProductsUseCase } from './GetMarketplaceProductsUseCase';

const mockRepo = {
  findAll: jest.fn(),
};

describe('GetMarketplaceProductsUseCase', () => {
  let uc: GetMarketplaceProductsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    uc = new GetMarketplaceProductsUseCase(mockRepo as any);
  });

  it('returns paginated products', async () => {
    mockRepo.findAll.mockResolvedValue({
      items: [{ id: '1', tienda: 'easy', titulo: 'Tornillo', sku: '123' }],
      total: 1,
    });

    const result = await uc.execute({ page: 1, limit: 50 });

    expect(mockRepo.findAll).toHaveBeenCalledWith({
      search: undefined,
      tienda: undefined,
      categoria: undefined,
      skip: 0,
      take: 50,
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
  });

  it('passes search and tienda filters', async () => {
    mockRepo.findAll.mockResolvedValue({ items: [], total: 0 });
    await uc.execute({ search: 'tornillo', tienda: 'sodimac', page: 2, limit: 50 });
    expect(mockRepo.findAll).toHaveBeenCalledWith({
      search: 'tornillo',
      tienda: 'sodimac',
      categoria: undefined,
      skip: 50,
      take: 50,
    });
  });
});
