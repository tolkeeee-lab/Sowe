export interface Transaction {
  id: string;
  phone: string;
  operator: 'mtn' | 'moov' | 'celtiis';
  type: 'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'appro_sim' | 'ajust_cash';
  amount: number;
  time: string;
  date: string; // YYYY-MM-DD
  category: string;
  isScamReported?: boolean;
  clientName?: string;
  note?: string; // Optional free-text note / observation
}

export interface VmClient {
  id: string;
  cabin_id: string;
  name: string;
  phone: string;
}
