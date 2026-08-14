export interface Rooster {
  id: string;
  wing_band_no: string;
  leg_band_no: string | null;
  breed: string;
  bloodline: string;
  date_of_birth: string;
  category: 'Stag' | 'Bullstag' | 'Cock' | 'Broodcock' | 'Broodhen';
  status: 'Available' | 'Sold' | 'Culled' | 'Deceased';
  price: number;
  marking_notes: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Supply {
  id: string;
  item_name: string;
  category: 'Feed' | 'Medicine' | 'Vaccine' | 'Equipment' | 'Other';
  quantity: number;
  unit: string;
  min_stock_alert: number;
  cost_per_unit: number;
  created_at: string;
}

export interface SaleRecord {
  id: string;
  rooster_id: string | null;
  buyer_name: string;
  sale_price: number;
  sale_date: string;
  notes: string | null;
  created_at: string;
  roosters?: Rooster;
}