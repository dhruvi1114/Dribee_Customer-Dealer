export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'closed';

export interface QuoteItem {
  id: string;
  productName: string;
  variantName: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  createdAt: string;
  expiresAt?: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  notes?: string;
  rejectionReason?: string;
}

export interface QuotationListParams {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
}


export interface RejectQuoteRequest {
  reason: string;
}
