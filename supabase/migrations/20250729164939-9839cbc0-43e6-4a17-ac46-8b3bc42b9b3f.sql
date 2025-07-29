-- Inserir 25 pratos fictícios para teste em Lisboa
INSERT INTO public.dishes (name, description, image_url, meal_type, mood_tags, available_date) VALUES 
-- Lunch dishes
('Bifana Tradicional', 'Pão com carne de porco marinada, um clássico português', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'lunch', ARRAY['comfort', 'quick', 'traditional'], CURRENT_DATE),
('Francesinha do Porto', 'Sanduíche com carnes, queijo e molho especial', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800', 'lunch', ARRAY['hearty', 'comfort', 'indulgent'], CURRENT_DATE),
('Salada de Polvo', 'Polvo cozido com batata, cebola e azeite', 'https://images.unsplash.com/photo-1559847844-d96692b91ad8?w=800', 'lunch', ARRAY['fresh', 'light', 'seafood'], CURRENT_DATE),
('Bifes à Parmegiana', 'Escalopes panados com queijo e molho de tomate', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', 'lunch', ARRAY['comfort', 'hearty', 'cheese'], CURRENT_DATE),
('Açorda de Camarão', 'Prato alentejano com pão, camarão e coentros', 'https://images.unsplash.com/photo-1563379091339-03246962d96d?w=800', 'lunch', ARRAY['traditional', 'seafood', 'comfort'], CURRENT_DATE),
('Poke Bowl Salmão', 'Arroz, salmão, abacate e legumes frescos', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', 'lunch', ARRAY['healthy', 'fresh', 'modern'], CURRENT_DATE),
('Hambúrguer Artesanal', 'Burger de carne com ingredientes premium', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 'lunch', ARRAY['comfort', 'hearty', 'modern'], CURRENT_DATE),
('Sandes de Presunto', 'Pão artesanal com presunto ibérico e queijo', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', 'lunch', ARRAY['quick', 'premium', 'simple'], CURRENT_DATE),
('Curry de Legumes', 'Curry aromático com legumes da época', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800', 'lunch', ARRAY['spicy', 'vegetarian', 'exotic'], CURRENT_DATE),
('Wraps de Frango', 'Tortilha com frango grelhado e salada', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', 'lunch', ARRAY['healthy', 'quick', 'light'], CURRENT_DATE),
('Risotto de Cogumelos', 'Arroz cremoso com cogumelos selvagens', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', 'lunch', ARRAY['creamy', 'vegetarian', 'comfort'], CURRENT_DATE),
('Sushi Variado', 'Selecção de sushi e sashimi frescos', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', 'lunch', ARRAY['fresh', 'light', 'japanese'], CURRENT_DATE),

-- Dinner dishes  
('Bacalhau à Brás', 'Bacalhau desfiado com batata palha e ovos', 'https://images.unsplash.com/photo-1559847844-d96692b91ad8?w=800', 'dinner', ARRAY['traditional', 'comfort', 'portuguese'], CURRENT_DATE),
('Cozido à Portuguesa', 'Prato tradicional com carnes e legumes', 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800', 'dinner', ARRAY['traditional', 'hearty', 'comfort'], CURRENT_DATE),
('Polvo à Lagareiro', 'Polvo assado com batatas e azeite', 'https://images.unsplash.com/photo-1559847844-d96692b91ad8?w=800', 'dinner', ARRAY['seafood', 'traditional', 'premium'], CURRENT_DATE),
('Massas com Camarão', 'Linguine com camarão ao alho e vinho branco', 'https://images.unsplash.com/photo-1621996346565-e3dbc794d53a?w=800', 'dinner', ARRAY['seafood', 'italian', 'elegant'], CURRENT_DATE),
('Picanha Argentina', 'Carne grelhada com chimichurri', 'https://images.unsplash.com/photo-1615937691194-97dbd7b9be6a?w=800', 'dinner', ARRAY['meat', 'grilled', 'premium'], CURRENT_DATE),
('Caldeirada de Peixe', 'Ensopado tradicional de peixes variados', 'https://images.unsplash.com/photo-1559847844-d96692b91ad8?w=800', 'dinner', ARRAY['seafood', 'traditional', 'hearty'], CURRENT_DATE),
('Pizza Margherita', 'Pizza tradicional italiana com manjericão', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800', 'dinner', ARRAY['italian', 'comfort', 'vegetarian'], CURRENT_DATE),
('Ramen Tonkotsu', 'Sopa japonesa com caldo rico e ovo', 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=800', 'dinner', ARRAY['comfort', 'warming', 'asian'], CURRENT_DATE),
('Paella Valenciana', 'Arroz espanhol com frango e legumes', 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800', 'dinner', ARRAY['spanish', 'sharing', 'traditional'], CURRENT_DATE),
('Salmão Grelhado', 'Salmão com legumes e molho de limão', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 'dinner', ARRAY['healthy', 'light', 'seafood'], CURRENT_DATE),
('Lasanha Bolonhesa', 'Lasanha tradicional com molho de carne', 'https://images.unsplash.com/photo-1621996346565-e3dbc794d53a?w=800', 'dinner', ARRAY['italian', 'comfort', 'hearty'], CURRENT_DATE),
('Tacos Mexicanos', 'Tacos autênticos com carne e guacamole', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', 'dinner', ARRAY['spicy', 'mexican', 'sharing'], CURRENT_DATE),
('Robalo Assado', 'Peixe assado com ervas aromáticas', 'https://images.unsplash.com/photo-1559847844-d96692b91ad8?w=800', 'dinner', ARRAY['seafood', 'healthy', 'premium'], CURRENT_DATE);