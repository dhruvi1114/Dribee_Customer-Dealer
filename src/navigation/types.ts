import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { Return } from '@/types/return';

// ── Root Stack ──
export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
};

// ── Auth Stack ──
export type AuthStackParamList = {
  Login: undefined;
  Otp: { phone: string };
  Register: undefined;
  DealerPending: undefined;
};

// ── App Bottom Tabs ──
export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  CatalogueTab: NavigatorScreenParams<CatalogueStackParamList>;
  ServicesTab: NavigatorScreenParams<ServicesStackParamList>;
  /** Cart + checkout + orders list live in the same stack; tab opens on `Cart`. */
  CartTab: NavigatorScreenParams<OrdersStackParamList>;
  // OrdersTab: NavigatorScreenParams<OrdersStackParamList>;
  QuotationsTab: NavigatorScreenParams<QuotationsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ── Home Stack ──
export type HomeStackParamList = {
  Home: undefined;
  Wishlist: undefined;
};

// ── Catalogue Stack ──
export type CatalogueStackParamList = {
  Catalogue: undefined;
  ProductDetail: { productId: string };
  Search: undefined;
  Wishlist: undefined;
};

// ── Services Stack ──
export type ServicesStackParamList = {
  ServiceCatalogue: undefined;
  BookService: { serviceId: string };
  MyBookings: undefined;
  BookingDetail: { bookingId: string };
  OtpGeneration: { bookingId: string };
  PartsApproval: { bookingId: string };
  Payment: { orderId?: string; bookingId?: string; amount: number };
  ManualPaymentUpload: {
    amount: number;
    orderId?: string;
    orderNumber?: string;
    bookingId?: string;
  };
  PaymentPending: { orderId?: string; bookingId?: string; orderNumber?: string };
  OrderSuccess: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    paymentMode: 'online' | 'manual' | 'cod';
  };
  JobRating: { bookingId: string };
  ServiceInvoice: { bookingId: string };
  Cancellation: { bookingId: string };
};

// ── Orders Stack ──
export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { orderId: string };
  Invoice: { orderId: string };
  Cart: undefined;
  Payment: { orderId?: string; bookingId?: string; amount: number };
  ManualPaymentUpload: {
    amount: number;
    orderId?: string;
    orderNumber?: string;
    bookingId?: string;
  };
  PaymentPending: { orderId?: string; bookingId?: string; orderNumber?: string };
  OrderSuccess: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    paymentMode: 'online' | 'manual' | 'cod';
  };
  ReturnSelectItems: { orderId: string };
  ReturnReason: { orderId: string; itemIds: string[] };
  ReturnPhotoUpload: {
    orderId: string;
    items: { id: string; returnReasonId: string; qty: number }[];
    notes?: string;
  };
  ReturnStatus: { returnId: string; initialReturn?: Return };
};

// ── Quotations Stack ──
export type QuotationsStackParamList = {
  Quotations: undefined;
  QuotationDetail: { quotationId: string };
};

// ── Profile Stack ──
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  Notifications: undefined;
  Wishlist: undefined;
  ReturnsList: undefined;
  /** Same screen as Orders stack — opened from returns list so Orders tab stays on orders. */
  ReturnStatus: { returnId: string; initialReturn?: Return };
};

// ── Screen prop helpers ──
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type AppTabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = NativeStackScreenProps<HomeStackParamList, T>;
export type CatalogueStackScreenProps<T extends keyof CatalogueStackParamList> = NativeStackScreenProps<CatalogueStackParamList, T>;
export type ServicesStackScreenProps<T extends keyof ServicesStackParamList> = NativeStackScreenProps<ServicesStackParamList, T>;
export type OrdersStackScreenProps<T extends keyof OrdersStackParamList> = NativeStackScreenProps<OrdersStackParamList, T>;
export type QuotationsStackScreenProps<T extends keyof QuotationsStackParamList> = NativeStackScreenProps<QuotationsStackParamList, T>;
export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = NativeStackScreenProps<ProfileStackParamList, T>;

// ── Global type declaration ──
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
