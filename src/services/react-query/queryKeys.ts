export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
  // Cart and product queries are warehouse-scoped — pricing, stock, and
  // availability differ per warehouse, so cached entries must not bleed across
  // warehouse switches. `all` is the prefix used to invalidate every warehouse
  // at once when the active warehouse changes.
  cart: {
    all: ['cart'] as const,
    detail: (warehouseId: number | null) => [...queryKeys.cart.all, warehouseId, 'detail'] as const,
  },
  wishlist: {
    all: ['wishlist'] as const,
    detail: () => [...queryKeys.wishlist.all, 'detail'] as const,
  },
  storefront: {
    all: ['storefront'] as const,
    list: (warehouseId: number | null, filters?: Record<string, unknown>) =>
      [...queryKeys.storefront.all, warehouseId, 'list', filters] as const,
    detail: (warehouseId: number | null, id: string | number) =>
      [...queryKeys.storefront.all, warehouseId, 'detail', id] as const,
    deliveryContext: () => [...queryKeys.storefront.all, 'delivery-context'] as const,
  },
  catalogue: {
    all: ['catalogue'] as const,
    list: (warehouseId: number | null, filters?: Record<string, unknown>) =>
      [...queryKeys.catalogue.all, warehouseId, 'list', filters] as const,
    detail: (warehouseId: number | null, id: string | number) =>
      [...queryKeys.catalogue.all, warehouseId, 'detail', id] as const,
    variants: (warehouseId: number | null, id: string | number) =>
      [...queryKeys.catalogue.all, warehouseId, 'variants', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.orders.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.quotes.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.quotes.all, 'detail', id] as const,
  },
  returns: {
    all: ['returns'] as const,
    list: () => [...queryKeys.returns.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.returns.all, 'detail', id] as const,
  },
  services: {
    all: ['services'] as const,
    catalogue: () => [...queryKeys.services.all, 'catalogue'] as const,
    bookings: (filters?: Record<string, unknown>) => [...queryKeys.services.all, 'bookings', filters] as const,
    bookingDetail: (id: string) => [...queryKeys.services.all, 'booking', id] as const,
    bookingInvoice: (id: string) => [...queryKeys.services.all, 'booking', id, 'invoice'] as const,
    jobDetail: (id: string) => [...queryKeys.services.all, 'job', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (page?: number) => [...queryKeys.notifications.all, 'list', page] as const,
  },
  master: {
    all: ['master'] as const,
    categories: () => [...queryKeys.master.all, 'categories'] as const,
    brands: () => [...queryKeys.master.all, 'brands'] as const,
    returnReasons: () => [...queryKeys.master.all, 'return-reasons'] as const,
    paymentMethods: () => [...queryKeys.master.all, 'payment-methods'] as const,
    orderSettings: () => [...queryKeys.master.all, 'order-settings'] as const,
    cities: () => [...queryKeys.master.all, 'cities'] as const,
    zones: () => [...queryKeys.master.all, 'zones'] as const,
    areas: () => [...queryKeys.master.all, 'areas'] as const,
  },
  dealer: {
    all: ['dealer'] as const,
    profile: () => [...queryKeys.dealer.all, 'profile'] as const,
  },
  addresses: {
    all: ['addresses'] as const,
    list: () => [...queryKeys.addresses.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.addresses.all, 'detail', id] as const,
  },
};
