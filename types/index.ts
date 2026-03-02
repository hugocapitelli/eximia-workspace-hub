import type { CategoryId } from "@/lib/constants";

export interface App {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  url: string;
  logo_url: string | null;
  icon_emoji: string | null;
  category: CategoryId;
  credentials_enc: string | null;
  credentials_iv: string | null;
  sort_order: number;
  is_favorite: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Credentials {
  username: string;
  password: string;
  notes: string;
}
