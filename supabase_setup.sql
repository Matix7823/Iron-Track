-- 1. Création de la table des profils
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  role text DEFAULT 'user'::text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modification de la table app_state pour lier les données à l'utilisateur
-- Attention : Si vous aviez déjà des données importantes, cette étape va les rendre inaccessibles (car nous changeons la clé primaire). 
-- Nous supprimons l'ancienne table pour en recréer une plus sécurisée par utilisateur.
DROP TABLE IF EXISTS public.app_state;
CREATE TABLE public.app_state (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Activation du RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour 'profiles'
-- Un utilisateur peut lire son propre profil
CREATE POLICY "Les utilisateurs peuvent lire leur propre profil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Un admin peut tout voir et tout modifier sur les profils
CREATE POLICY "Les admins peuvent lire tous les profils" 
ON public.profiles FOR SELECT 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Les admins peuvent modifier les profils" 
ON public.profiles FOR UPDATE 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Les admins peuvent supprimer les profils" 
ON public.profiles FOR DELETE 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );


-- 5. Politiques RLS pour 'app_state'
-- L'utilisateur ne peut insérer/sélectionner/modifier/supprimer que ses propres données
CREATE POLICY "Les utilisateurs peuvent voir leurs données" 
ON public.app_state FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent inserer leurs données" 
ON public.app_state FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs données" 
ON public.app_state FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs données" 
ON public.app_state FOR DELETE 
USING (auth.uid() = user_id);


-- 6. Trigger pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count int;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (new.id, new.email, 'admin', 'active');
  ELSE
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (new.id, new.email, 'user', 'pending');
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger n'existe pas déjà avant de le créer
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
