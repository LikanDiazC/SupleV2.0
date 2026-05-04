import { AddToCartUseCase } from './AddToCartUseCase';

const mockCartRepo = {
  findByUser: jest.fn(),
  createCart: jest.fn(),
  findItemInCart: jest.fn(),
  addItem: jest.fn(),
  incrementItem: jest.fn(),
};

describe('AddToCartUseCase', () => {
  let uc: AddToCartUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    uc = new AddToCartUseCase(mockCartRepo as any);
  });

  it('creates a new cart if user has none', async () => {
    mockCartRepo.findByUser.mockResolvedValue(null);
    mockCartRepo.createCart.mockResolvedValue({ id: 'cart-1' });
    mockCartRepo.findItemInCart.mockResolvedValue(null);
    mockCartRepo.addItem.mockResolvedValue({ id: 'item-1', productId: 'prod-1', quantity: 2 });

    const result = await uc.execute('user-1', 'tenant-1', 'prod-1', 2);

    expect(mockCartRepo.createCart).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(mockCartRepo.addItem).toHaveBeenCalledWith('cart-1', 'prod-1', 2);
    expect(result.quantity).toBe(2);
  });

  it('increments quantity if item already exists in cart', async () => {
    mockCartRepo.findByUser.mockResolvedValue({ id: 'cart-1' });
    mockCartRepo.findItemInCart.mockResolvedValue({ id: 'item-1', quantity: 1 });
    mockCartRepo.incrementItem.mockResolvedValue({ id: 'item-1', productId: 'prod-1', quantity: 3 });

    const result = await uc.execute('user-1', 'tenant-1', 'prod-1', 2);

    expect(mockCartRepo.createCart).not.toHaveBeenCalled();
    expect(mockCartRepo.incrementItem).toHaveBeenCalledWith('item-1', 2);
    expect(result.quantity).toBe(3);
  });
});
