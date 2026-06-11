-- Confirmar emails dos utilizadores criados
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN ('antoniommbaptista@gmail.com', 'admin@encivil.pt');

-- Atualizar perfis com nomes reais
UPDATE public.profiles
SET nome = 'António Baptista'
WHERE email = 'antoniommbaptista@gmail.com';

UPDATE public.profiles
SET nome = 'Administrador TI'
WHERE email = 'admin@encivil.pt';

-- CEO fica com role 'gestor' (leitura apenas)
UPDATE public.profiles
SET role = 'gestor'
WHERE email = 'antoniommbaptista@gmail.com';

-- Admin TI fica com role 'admin' (já é o padrão, mas confirmar)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@encivil.pt';
