import { useQuery } from '@tanstack/react-query';

export interface PublicSettings {
  admin_email: string;
  admin_whatsapp: string;
  admin_phone: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  min_order_amount: number;
  // Backend key is store_maintenance_mode — we map it here for clarity
  maintenance_mode: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_iban: string;
  delivery_fee: number;
  free_delivery_threshold: number;
}

const EMPTY: PublicSettings = {
  admin_email: '',
  admin_whatsapp: '',
  admin_phone: '',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  min_order_amount: 0,
  maintenance_mode: false,
  bank_name: '',
  bank_account_name: '',
  bank_account_number: '',
  bank_iban: '',
  delivery_fee: 0,
  free_delivery_threshold: 0,
};

async function fetchPublicSettings(): Promise<PublicSettings> {
  const res = await fetch('/api/v1/public/settings');
  if (!res.ok) return EMPTY;
  const json = await res.json();
  const d = json.data ?? json;
  return {
    admin_email:            String(d.admin_email            ?? ''),
    admin_whatsapp:         String(d.admin_whatsapp         ?? ''),
    admin_phone:            String(d.admin_phone            ?? ''),
    instagram_url:          String(d.instagram_url          ?? ''),
    facebook_url:           String(d.facebook_url           ?? ''),
    tiktok_url:             String(d.tiktok_url             ?? ''),
    min_order_amount:       Number(d.min_order_amount       ?? 0),
    maintenance_mode:       Boolean(d.store_maintenance_mode),  // correct backend key
    bank_name:              String(d.bank_name              ?? ''),
    bank_account_name:      String(d.bank_account_name      ?? ''),
    bank_account_number:    String(d.bank_account_number    ?? ''),
    bank_iban:              String(d.bank_iban              ?? ''),
    delivery_fee:           Number(d.delivery_fee           ?? 0),
    free_delivery_threshold: Number(d.free_delivery_threshold ?? 0),
  };
}

export function usePublicSettings() {
  const { data, isLoading } = useQuery<PublicSettings>({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
    gcTime:   10 * 60 * 1000,
    retry: 2,
    placeholderData: EMPTY,
  });

  return { settings: data ?? EMPTY, isLoading };
}
