export interface DealerAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface DealerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  gstin?: string;
  status: 'pending' | 'approved' | 'rejected';
  address?: DealerAddress;
  categories?: Array<{ id: number; name: string }>;
  createdAt: string;
}

export interface UpdateDealerProfileRequest {
  name?: string;
  email?: string;
  businessName?: string;
  gstin?: string;
  address?: DealerAddress;
}
