export type Budget = {
  id: string;
  user_id: string;
  amount: number;
  last_alert_sent: string | null;
  last_alert_threshold?: 80 | 100 | null;
  created_at: string;
  updated_at: string;
};
