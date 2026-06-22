export interface Transaction {
  id: string;
  phone: string;
  operator: 'mtn' | 'moov' | 'celtiis';
  type: 'deposit' | 'withdrawal' | 'credit' | 'forfait' | 'appro_sim' | 'ajust_cash' | 'saisie_rapide';
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

export interface CabinNote {
  id: string;
  text: string;       // Free text: "dépôt mtn 30000", "retrait moov 5000", etc.
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  author: string;     // role: 'proprio', 'employe', 'vm', etc.
}
