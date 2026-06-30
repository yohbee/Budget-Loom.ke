
-- ============ ENUMS ============
CREATE TYPE public.transaction_type AS ENUM ('income','expense','savings','investment','transfer');
CREATE TYPE public.wallet_type AS ENUM ('cash','mobile_money','bank','credit_card','savings','business','crypto','other');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  currency text NOT NULL DEFAULT 'USD',
  monthly_income numeric(14,2) NOT NULL DEFAULT 0,
  starting_balance numeric(14,2) NOT NULL DEFAULT 0,
  onboarding_complete boolean NOT NULL DEFAULT false,
  financial_score int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid()=id) WITH CHECK (auth.uid()=id);

-- ============ WALLETS ============
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.wallet_type NOT NULL DEFAULT 'cash',
  currency text NOT NULL DEFAULT 'USD',
  balance numeric(14,2) NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#7c5cff',
  icon text NOT NULL DEFAULT 'wallet',
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallets" ON public.wallets FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX wallets_user_idx ON public.wallets(user_id);

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.transaction_type NOT NULL,
  icon text NOT NULL DEFAULT 'tag',
  color text NOT NULL DEFAULT '#7c5cff',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own categories" ON public.categories FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX categories_user_idx ON public.categories(user_id);

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  to_wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  type public.transaction_type NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  merchant text,
  tags text[] NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX tx_user_date_idx ON public.transactions(user_id, occurred_at DESC);
CREATE INDEX tx_wallet_idx ON public.transactions(wallet_id);

-- ============ BUDGETS ============
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  month date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own budgets" ON public.budgets FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX budgets_user_idx ON public.budgets(user_id, month);

-- ============ GOALS ============
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(14,2) NOT NULL,
  current_amount numeric(14,2) NOT NULL DEFAULT 0,
  target_date date,
  icon text NOT NULL DEFAULT 'target',
  color text NOT NULL DEFAULT '#22d3a0',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ COACH MESSAGES ============
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_messages TO authenticated;
GRANT ALL ON public.coach_messages TO service_role;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own coach" ON public.coach_messages FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX coach_user_idx ON public.coach_messages(user_id, created_at);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER wallets_touch BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep wallet balance in sync with transactions
CREATE OR REPLACE FUNCTION public.apply_tx_to_wallet() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE delta numeric;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.type IN ('income') THEN delta := NEW.amount;
    ELSIF NEW.type IN ('expense','savings','investment') THEN delta := -NEW.amount;
    ELSIF NEW.type='transfer' THEN
      UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
      IF NEW.to_wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.to_wallet_id;
      END IF;
      RETURN NEW;
    END IF;
    UPDATE public.wallets SET balance = balance + delta WHERE id = NEW.wallet_id;
    RETURN NEW;
  ELSIF TG_OP='DELETE' THEN
    IF OLD.type='income' THEN delta := -OLD.amount;
    ELSIF OLD.type IN ('expense','savings','investment') THEN delta := OLD.amount;
    ELSIF OLD.type='transfer' THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
      IF OLD.to_wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.to_wallet_id;
      END IF;
      RETURN OLD;
    END IF;
    UPDATE public.wallets SET balance = balance + delta WHERE id = OLD.wallet_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER tx_apply_wallet AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_tx_to_wallet();
