-- Inserir 5 perfis fictícios para teste (simulando utilizadores já registados)
INSERT INTO public.profiles (user_id, name, bio, city, availability, food_preferences, allergies, profile_picture_url) VALUES 
('11111111-1111-1111-1111-111111111111', 'Ana Silva', 'Adoro descobrir novos sabores! Sou vegetariana há 3 anos e procuro sempre opções criativas.', 'Lisboa', 'both', ARRAY['vegetarian', 'healthy', 'mediterranean'], ARRAY['nuts'], 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'),
('22222222-2222-2222-2222-222222222222', 'João Santos', 'Foodie apaixonado por cozinha tradicional portuguesa. Trabalho em Belém, livre ao almoço!', 'Lisboa', 'lunch', ARRAY['traditional', 'seafood', 'meat'], ARRAY[]::text[], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('33333333-3333-3333-3333-333333333333', 'Maria Costa', 'Estudante de nutrição. Gosto de pratos equilibrados mas também de indulgências ocasionais!', 'Lisboa', 'dinner', ARRAY['healthy', 'asian', 'fresh'], ARRAY['dairy'], 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'),
('44444444-4444-4444-4444-444444444444', 'Pedro Alves', 'Chef amador nos tempos livres. Sempre disposto a experimentar fusões e sabores internacionais.', 'Lisboa', 'both', ARRAY['spicy', 'exotic', 'modern'], ARRAY[]::text[], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'),
('55555555-5555-5555-5555-555555555555', 'Sofia Rodrigues', 'Digital nomad recém-chegada a Lisboa. Procuro experiências autênticas e boa companhia!', 'Lisboa', 'dinner', ARRAY['comfort', 'sharing', 'international'], ARRAY['gluten'], 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400');

-- Criar matching preferences para Lisboa (raio 10km)
INSERT INTO public.matching_preferences (user_id, min_age, max_age, max_distance_km, same_gender_only) VALUES 
('11111111-1111-1111-1111-111111111111', 22, 35, 10, false),
('22222222-2222-2222-2222-222222222222', 25, 40, 10, false),
('33333333-3333-3333-3333-333333333333', 20, 30, 10, false),
('44444444-4444-4444-4444-444444444444', 28, 45, 10, false),
('55555555-5555-5555-5555-555555555555', 25, 38, 10, false);