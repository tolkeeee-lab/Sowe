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
  text: string;       // Description or note
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  author: string;     // role: 'proprio', 'employe', 'vm', etc.
  env?: 'cabine' | 'vm'; // Workspace environment tag
  entry_type?: 'memo' | 'apport' | 'sortie';
  person_name?: string; // Person involved (Propriétaire, Caissier, Livreure, etc.)
  amount?: number;      // Amount in FCFA
  method?: 'cash' | 'mtn' | 'moov' | 'celtiis';
}

export interface Debt {
  id: string;
  cabin_id: string;
  client_name: string;
  amount: number;
  due_date?: string; // YYYY-MM-DD
  phone?: string;
  status: 'non_paye' | 'paye';
  type: 'depot_a_rendre' | 'credit_client' | 'transfert_proprio_cash' | 'transfert_proprio_sim' | 'autre';
  operator?: 'mtn' | 'moov' | 'celtiis';
  created_at?: string;
}

export interface Inventory {
  id: string;
  cabin_id: string;
  created_by: string;
  system_mtn: number;
  physical_mtn: number;
  system_moov: number;
  physical_moov: number;
  system_celtiis: number;
  physical_celtiis: number;
  system_cash: number;
  physical_cash: number;
  created_at: string;
  creator_name?: string; // Loaded dynamically
}

