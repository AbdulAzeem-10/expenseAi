import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getAccounts } from "@/lib/services/accounts";
import { getBudget } from "@/lib/services/budgets";
import { getTransactions } from "@/lib/services/transactions";
import { useSupabase } from "@/hooks/useSupabase";

export function useFinanceData() {
  const { user } = useUser();
  const supabase = useSupabase();
  const userId = user?.id;
  const enabled = Boolean(userId);
  const accounts = useQuery({ queryKey: queryKeys.accounts(userId), enabled, queryFn: () => getAccounts(supabase, userId!) });
  const transactions = useQuery({ queryKey: queryKeys.transactions(userId), enabled, queryFn: () => getTransactions(supabase, userId!) });
  const budget = useQuery({ queryKey: queryKeys.budget(userId), enabled, queryFn: () => getBudget(supabase, userId!) });
  return { user, supabase, accounts, transactions, budget };
}
