export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  variants: string[];
  compatibleMachines: string[];
  initials: string;
  volumeSlabs?: Array<{ minQty: number; discount: number }>;
}

export interface OrderItem {
  productId: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
}

export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'returned';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  address: string;
  timeline: Array<{ step: string; timestamp: string; completed: boolean }>;
}

export type BookingStatus =
  | 'pending_assignment'
  | 'assigned'
  | 'in_progress'
  | 'ready_to_resume'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  bookingId: string;
  serviceName: string;
  machineType: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  priority: 'normal' | 'urgent';
  address: string;
  pro?: { name: string; phone: string; initials: string };
  otp?: string;
  parts?: Array<{ name: string; price: number; available: boolean; included: boolean }>;
  serviceFee: number;
  total?: number;
}

export type NotificationType = 'order' | 'offer' | 'alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  date: string;
  unread: boolean;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quotation {
  id: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  items: Array<{ name: string; qty: number; unitPrice: number }>;
  subtotal: number;
  gst: number;
  total: number;
  status: QuotationStatus;
  linkedOrderId?: string;
}

export interface Service {
  id: string;
  name: string;
  machineType: string;
  description: string;
  normalPrice: number;
  urgentPrice: number;
  initials: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Bosch Oil Filter OF-2345',
    brand: 'Bosch',
    category: 'Engine',
    price: 450,
    originalPrice: 560,
    inStock: true,
    rating: 4.5,
    reviewCount: 128,
    description: 'Premium oil filter for extended engine life. Fits most 4-cylinder engines manufactured after 2015.',
    variants: ['Standard', 'Heavy Duty'],
    compatibleMachines: ['Honda City', 'Maruti Swift', 'Hyundai i20'],
    initials: 'OF',
    volumeSlabs: [{ minQty: 10, discount: 5 }, { minQty: 30, discount: 10 }],
  },
  {
    id: 'p2',
    name: 'ACDelco Air Filter AF-1122',
    brand: 'ACDelco',
    category: 'Filters',
    price: 320,
    inStock: true,
    rating: 4.2,
    reviewCount: 89,
    description: 'High-efficiency air filter for cleaner combustion and better mileage.',
    variants: ['Standard'],
    compatibleMachines: ['Tata Nexon', 'Kia Seltos', 'MG Hector'],
    initials: 'AF',
    volumeSlabs: [{ minQty: 20, discount: 8 }],
  },
  {
    id: 'p3',
    name: 'Brembo Brake Pad BP-5500',
    brand: 'Brembo',
    category: 'Brakes',
    price: 1850,
    originalPrice: 2100,
    inStock: true,
    rating: 4.8,
    reviewCount: 256,
    description: 'High-performance ceramic brake pads for superior stopping power.',
    variants: ['Front', 'Rear', 'Front + Rear'],
    compatibleMachines: ['BMW 3 Series', 'Audi A4', 'Mercedes C-Class'],
    initials: 'BP',
  },
  {
    id: 'p4',
    name: 'Exide Battery EB-65AH',
    brand: 'Exide',
    category: 'Electrical',
    price: 5200,
    inStock: true,
    rating: 4.4,
    reviewCount: 312,
    description: '65Ah maintenance-free battery with 36-month warranty.',
    variants: ['65Ah', '75Ah', '88Ah'],
    compatibleMachines: ['All vehicles'],
    initials: 'EB',
    volumeSlabs: [{ minQty: 5, discount: 3 }, { minQty: 10, discount: 6 }],
  },
  {
    id: 'p5',
    name: 'NGK Spark Plug SP-7890',
    brand: 'NGK',
    category: 'Engine',
    price: 280,
    inStock: true,
    rating: 4.6,
    reviewCount: 445,
    description: 'Iridium spark plug for improved fuel efficiency and performance.',
    variants: ['Standard', 'Iridium', 'Platinum'],
    compatibleMachines: ['Maruti Suzuki', 'Hyundai', 'Honda'],
    initials: 'SP',
    volumeSlabs: [{ minQty: 50, discount: 12 }],
  },
  {
    id: 'p6',
    name: 'Mann Fuel Filter FF-3344',
    brand: 'Mann',
    category: 'Filters',
    price: 560,
    inStock: false,
    rating: 4.3,
    reviewCount: 67,
    description: 'High-flow fuel filter for diesel engines.',
    variants: ['Diesel', 'Petrol'],
    compatibleMachines: ['Mahindra XUV', 'Toyota Fortuner', 'Ford Endeavour'],
    initials: 'FF',
  },
  {
    id: 'p7',
    name: 'Valeo Clutch Plate CP-2211',
    brand: 'Valeo',
    category: 'Engine',
    price: 3400,
    originalPrice: 3900,
    inStock: true,
    rating: 4.1,
    reviewCount: 44,
    description: 'OEM-quality clutch plate for smooth engagement.',
    variants: ['180mm', '200mm', '215mm'],
    compatibleMachines: ['Maruti Alto', 'Hyundai Santro', 'Wagon R'],
    initials: 'CP',
  },
  {
    id: 'p8',
    name: 'Denso Alternator DA-9900',
    brand: 'Denso',
    category: 'Electrical',
    price: 8750,
    inStock: true,
    rating: 4.7,
    reviewCount: 33,
    description: '90A alternator for reliable charging system.',
    variants: ['70A', '90A', '120A'],
    compatibleMachines: ['Toyota Innova', 'Honda CR-V', 'Mitsubishi Pajero'],
    initials: 'DA',
    volumeSlabs: [{ minQty: 3, discount: 4 }],
  },
  {
    id: 'p9',
    name: 'Mahle Piston Kit PK-4455',
    brand: 'Mahle',
    category: 'Engine',
    price: 12500,
    inStock: true,
    rating: 4.5,
    reviewCount: 18,
    description: 'Precision-machined piston set for 4-cylinder engines.',
    variants: ['Standard', '+0.25mm', '+0.50mm'],
    compatibleMachines: ['Maruti 800', 'Zen', 'Alto'],
    initials: 'PK',
  },
  {
    id: 'p10',
    name: 'Continental Timing Belt TB-6677',
    brand: 'Continental',
    category: 'Engine',
    price: 1200,
    originalPrice: 1500,
    inStock: true,
    rating: 4.4,
    reviewCount: 92,
    description: 'OEM-spec timing belt for precise valve timing.',
    variants: ['Standard', 'With Tensioner Kit'],
    compatibleMachines: ['Volkswagen Polo', 'Skoda Rapid', 'Audi A3'],
    initials: 'TB',
    volumeSlabs: [{ minQty: 15, discount: 7 }],
  },
  {
    id: 'p11',
    name: 'Delphi ABS Sensor AS-8811',
    brand: 'Delphi',
    category: 'Brakes',
    price: 2100,
    inStock: true,
    rating: 4.2,
    reviewCount: 55,
    description: 'Wheel speed sensor for ABS systems.',
    variants: ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'],
    compatibleMachines: ['Hyundai Creta', 'Kia Sonet', 'Venue'],
    initials: 'AS',
  },
  {
    id: 'p12',
    name: 'Hella Headlamp Bulb HB-1234',
    brand: 'Hella',
    category: 'Electrical',
    price: 680,
    inStock: true,
    rating: 4.0,
    reviewCount: 201,
    description: 'H4 halogen bulb for bright and wide beam pattern.',
    variants: ['H4', 'H7', 'H11'],
    compatibleMachines: ['All vehicles with H-type headlamps'],
    initials: 'HB',
    volumeSlabs: [{ minQty: 10, discount: 5 }, { minQty: 25, discount: 9 }],
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    orderNumber: 'ORD-2024-001',
    date: '15 Apr 2024',
    items: [
      { productId: 'p1', name: 'Bosch Oil Filter OF-2345', variant: 'Standard', qty: 5, price: 450 },
      { productId: 'p3', name: 'Brembo Brake Pad BP-5500', variant: 'Front', qty: 2, price: 1850 },
    ],
    subtotal: 5950,
    discount: 300,
    gst: 830,
    total: 6480,
    status: 'delivered',
    paymentMethod: 'UPI',
    paymentStatus: 'paid',
    address: '42, MG Road, Bengaluru - 560001',
    timeline: [
      { step: 'Placed', timestamp: '15 Apr, 10:30 AM', completed: true },
      { step: 'Confirmed', timestamp: '15 Apr, 11:15 AM', completed: true },
      { step: 'Processing', timestamp: '15 Apr, 02:00 PM', completed: true },
      { step: 'Dispatched', timestamp: '16 Apr, 09:00 AM', completed: true },
      { step: 'Delivered', timestamp: '17 Apr, 04:30 PM', completed: true },
    ],
  },
  {
    id: 'o2',
    orderNumber: 'ORD-2024-002',
    date: '18 Apr 2024',
    items: [
      { productId: 'p4', name: 'Exide Battery EB-65AH', variant: '65Ah', qty: 1, price: 5200 },
      { productId: 'p5', name: 'NGK Spark Plug SP-7890', variant: 'Iridium', qty: 4, price: 280 },
    ],
    subtotal: 6320,
    discount: 0,
    gst: 759,
    total: 7079,
    status: 'dispatched',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'paid',
    address: '12, Koramangala 5th Block, Bengaluru - 560095',
    timeline: [
      { step: 'Placed', timestamp: '18 Apr, 09:00 AM', completed: true },
      { step: 'Confirmed', timestamp: '18 Apr, 10:30 AM', completed: true },
      { step: 'Processing', timestamp: '18 Apr, 03:00 PM', completed: true },
      { step: 'Dispatched', timestamp: '19 Apr, 08:00 AM', completed: true },
      { step: 'Delivered', timestamp: '', completed: false },
    ],
  },
  {
    id: 'o3',
    orderNumber: 'ORD-2024-003',
    date: '20 Apr 2024',
    items: [
      { productId: 'p2', name: 'ACDelco Air Filter AF-1122', variant: 'Standard', qty: 10, price: 320 },
    ],
    subtotal: 3200,
    discount: 256,
    gst: 353,
    total: 3297,
    status: 'placed',
    paymentMethod: 'Online',
    paymentStatus: 'paid',
    address: '8, Indiranagar 100ft Road, Bengaluru - 560038',
    timeline: [
      { step: 'Placed', timestamp: '20 Apr, 08:45 AM', completed: true },
      { step: 'Confirmed', timestamp: '', completed: false },
      { step: 'Processing', timestamp: '', completed: false },
      { step: 'Dispatched', timestamp: '', completed: false },
      { step: 'Delivered', timestamp: '', completed: false },
    ],
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    bookingId: 'BKG-2024-001',
    serviceName: 'AC Service & Gas Refill',
    machineType: 'AC',
    date: '22 Apr 2024',
    timeSlot: '10:00 AM - 12:00 PM',
    status: 'in_progress',
    priority: 'normal',
    address: '42, MG Road, Bengaluru - 560001',
    pro: { name: 'Ramesh Kumar', phone: '+91 9876543210', initials: 'RK' },
    otp: '7483',
    parts: [
      { name: 'Refrigerant Gas R32', price: 1200, available: true, included: true },
      { name: 'AC Filter', price: 350, available: true, included: true },
      { name: 'Capacitor', price: 800, available: false, included: false },
    ],
    serviceFee: 599,
    total: 2149,
  },
  {
    id: 'b2',
    bookingId: 'BKG-2024-002',
    serviceName: 'Washing Machine Repair',
    machineType: 'Washing Machine',
    date: '25 Apr 2024',
    timeSlot: '02:00 PM - 04:00 PM',
    status: 'pending_assignment',
    priority: 'urgent',
    address: '12, Koramangala 5th Block, Bengaluru - 560095',
    serviceFee: 799,
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'order',
    title: 'Order Dispatched!',
    message: 'Your order ORD-2024-002 has been dispatched. Expected delivery by 21 Apr.',
    time: '2 hours ago',
    date: 'Today',
    unread: true,
  },
  {
    id: 'n2',
    type: 'offer',
    title: 'Flash Sale: 20% off on Filters',
    message: 'Use code FILTER20 to get 20% off on all filter products. Valid till midnight.',
    time: '5 hours ago',
    date: 'Today',
    unread: true,
  },
  {
    id: 'n3',
    type: 'alert',
    title: 'Service Booking Confirmed',
    message: 'Your AC service booking for 22 Apr, 10:00 AM has been confirmed.',
    time: 'Yesterday, 3:00 PM',
    date: 'Yesterday',
    unread: false,
  },
  {
    id: 'n4',
    type: 'order',
    title: 'Order Delivered Successfully',
    message: 'Your order ORD-2024-001 has been delivered. Rate your experience.',
    time: 'Yesterday, 4:30 PM',
    date: 'Yesterday',
    unread: false,
  },
  {
    id: 'n5',
    type: 'offer',
    title: 'New Arrivals in Electrical',
    message: '12 new electrical parts added. Check out the latest Hella and Denso products.',
    time: '3 days ago',
    date: 'Earlier',
    unread: false,
  },
];

export const MOCK_ADDRESSES: Address[] = [
  {
    id: 'a1',
    label: 'Home',
    fullName: 'Rajesh Kumar',
    phone: '+91 9876543210',
    line1: '42, MG Road',
    line2: 'Near Trinity Metro',
    city: 'Bengaluru',
    pincode: '560001',
    isDefault: true,
  },
  {
    id: 'a2',
    label: 'Office',
    fullName: 'Rajesh Kumar',
    phone: '+91 9876543210',
    line1: '12, Koramangala 5th Block',
    city: 'Bengaluru',
    pincode: '560095',
    isDefault: false,
  },
  {
    id: 'a3',
    label: 'Other',
    fullName: 'Sunita Kumar',
    phone: '+91 9988776655',
    line1: '8, Indiranagar 100ft Road',
    line2: 'Opp. Leela Palace',
    city: 'Bengaluru',
    pincode: '560038',
    isDefault: false,
  },
];

export const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: 'q1',
    quoteNumber: 'QUO-2024-001',
    date: '10 Apr 2024',
    validUntil: '25 Apr 2024',
    items: [
      { name: 'Bosch Oil Filter OF-2345', qty: 50, unitPrice: 420 },
      { name: 'NGK Spark Plug SP-7890', qty: 100, unitPrice: 255 },
    ],
    subtotal: 46500,
    gst: 5580,
    total: 52080,
    status: 'sent',
  },
  {
    id: 'q2',
    quoteNumber: 'QUO-2024-002',
    date: '12 Apr 2024',
    validUntil: '27 Apr 2024',
    items: [
      { name: 'Exide Battery EB-65AH', qty: 10, unitPrice: 4900 },
    ],
    subtotal: 49000,
    gst: 5880,
    total: 54880,
    status: 'accepted',
    linkedOrderId: 'ORD-2024-004',
  },
  {
    id: 'q3',
    quoteNumber: 'QUO-2024-003',
    date: '15 Apr 2024',
    validUntil: '30 Apr 2024',
    items: [
      { name: 'ACDelco Air Filter AF-1122', qty: 30, unitPrice: 295 },
      { name: 'Mann Fuel Filter FF-3344', qty: 20, unitPrice: 520 },
    ],
    subtotal: 19250,
    gst: 2310,
    total: 21560,
    status: 'draft',
  },
  {
    id: 'q4',
    quoteNumber: 'QUO-2024-004',
    date: '1 Apr 2024',
    validUntil: '16 Apr 2024',
    items: [
      { name: 'Brembo Brake Pad BP-5500', qty: 20, unitPrice: 1750 },
    ],
    subtotal: 35000,
    gst: 4200,
    total: 39200,
    status: 'expired',
  },
];

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'AC Service & Gas Refill',
    machineType: 'AC',
    description: 'Complete AC service including gas top-up, filter cleaning, and cooling check.',
    normalPrice: 599,
    urgentPrice: 899,
    initials: 'AC',
  },
  {
    id: 's2',
    name: 'Washing Machine Repair',
    machineType: 'Washing Machine',
    description: 'Full diagnosis and repair of washing machine issues — motor, drum, or electrical.',
    normalPrice: 499,
    urgentPrice: 799,
    initials: 'WM',
  },
  {
    id: 's3',
    name: 'Refrigerator Service',
    machineType: 'Refrigerator',
    description: 'Cooling repair, gas refill, compressor check, and thermostat calibration.',
    normalPrice: 699,
    urgentPrice: 999,
    initials: 'RF',
  },
  {
    id: 's4',
    name: 'Generator Maintenance',
    machineType: 'Generator',
    description: 'Preventive maintenance including oil change, filter check, and load testing.',
    normalPrice: 899,
    urgentPrice: 1299,
    initials: 'GN',
  },
  {
    id: 's5',
    name: 'Microwave Repair',
    machineType: 'Microwave',
    description: 'Diagnosis and repair of heating, turntable, and electrical issues.',
    normalPrice: 399,
    urgentPrice: 649,
    initials: 'MW',
  },
  {
    id: 's6',
    name: 'Water Purifier Service',
    machineType: 'Water Purifier',
    description: 'Filter replacement, UV check, and membrane cleaning for RO purifiers.',
    normalPrice: 349,
    urgentPrice: 549,
    initials: 'WP',
  },
];

export const MOCK_BANNERS = [
  { id: 'ban1', title: 'Monsoon Sale', subtitle: 'Up to 30% off on Engine Parts', cta: 'Shop Now' },
  { id: 'ban2', title: 'Bulk Orders', subtitle: 'Extra 15% off on orders above ₹50,000', cta: 'Order Now' },
  { id: 'ban3', title: 'New Arrivals', subtitle: 'Latest Bosch & Denso parts in stock', cta: 'Explore' },
];

export const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'Engine', icon: 'Settings' },
  { id: 'cat2', name: 'Filters', icon: 'Filter' },
  { id: 'cat3', name: 'Brakes', icon: 'Disc' },
  { id: 'cat4', name: 'Electrical', icon: 'Zap' },
  { id: 'cat5', name: 'Tyres', icon: 'Circle' },
  { id: 'cat6', name: 'Body', icon: 'Square' },
];
