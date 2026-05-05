import { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Budget {
  id: string;
  name: string;
  currency: string;
  startDate: string;
  endDate: string;
  initialSaving: number;
}

interface BudgetContextValue {
  budget: Budget | null;
  loading: boolean;
  reload: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/budgets/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setBudget(data as Budget))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, tick, navigate]);

  return (
    <BudgetContext.Provider value={{ budget, loading, reload: () => setTick((t) => t + 1) }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used inside BudgetProvider');
  return ctx;
}
