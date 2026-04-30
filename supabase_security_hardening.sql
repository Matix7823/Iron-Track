-- ==============================================================================
-- DURCISSEMENT DE LA SÉCURITÉ SUPABASE (Hardening)
-- Ce script ajoute des contraintes et renforce les politiques de sécurité (RLS)
-- ==============================================================================

-- 1. Validation de l'email au niveau de la base de données
-- Empêche l'insertion d'emails invalides directement dans la table profiles
ALTER TABLE public.profiles
ADD CONSTRAINT valid_email_format CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 2. Renforcement des politiques RLS (Row Level Security)
-- On s'assure explicitement que le rôle est 'authenticated' pour chaque action.
-- Cela empêche l'accès anonyme même s'il y avait un bug d'UID.

-- Pour la table profiles
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent lire leur propre profil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Les admins peuvent lire tous les profils" ON public.profiles;
CREATE POLICY "Les admins peuvent lire tous les profils" 
ON public.profiles FOR SELECT 
USING ( 
  auth.role() = 'authenticated' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' 
);

DROP POLICY IF EXISTS "Les admins peuvent modifier les profils" ON public.profiles;
CREATE POLICY "Les admins peuvent modifier les profils" 
ON public.profiles FOR UPDATE 
USING ( 
  auth.role() = 'authenticated' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' 
);

DROP POLICY IF EXISTS "Les admins peuvent supprimer les profils" ON public.profiles;
CREATE POLICY "Les admins peuvent supprimer les profils" 
ON public.profiles FOR DELETE 
USING ( 
  auth.role() = 'authenticated' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' 
);


-- Pour la table app_state
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs données" ON public.app_state;
CREATE POLICY "Les utilisateurs peuvent voir leurs données" 
ON public.app_state FOR SELECT 
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Les utilisateurs peuvent inserer leurs données" ON public.app_state;
CREATE POLICY "Les utilisateurs peuvent inserer leurs données" 
ON public.app_state FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs données" ON public.app_state;
CREATE POLICY "Les utilisateurs peuvent modifier leurs données" 
ON public.app_state FOR UPDATE 
USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Bloquer la suppression des données app_state si non souhaité (par sécurité)
-- Les utilisateurs ne devraient pas supprimer leur ligne principale app_state
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs données" ON public.app_state;
CREATE POLICY "Les utilisateurs ne peuvent pas supprimer leurs données" 
ON public.app_state FOR DELETE 
USING (false); -- Interdit la suppression par l'API cliente
