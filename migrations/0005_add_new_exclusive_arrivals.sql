-- Add the three new exclusive arrivals at the beginning of the catalogue.
-- Prices follow the existing exclusive price policy: Rs 1,750 / 2,550 / 4,500.
UPDATE products SET sort_order=sort_order+3,updated_at=CURRENT_TIMESTAMP WHERE active=1;
INSERT OR IGNORE INTO products (slug,name,category,active,sort_order) VALUES
('de-marj','DE MARJ','exclusive',1,1),
('de-ignite-oud','DE IGNITE OUD','exclusive',1,2),
('de-summer-oud','DE SUMMER OUD','exclusive',1,3);
INSERT OR IGNORE INTO product_prices (product_id,size_ml,price_pkr)
SELECT id,30,1750 FROM products WHERE slug IN ('de-marj','de-ignite-oud','de-summer-oud');
INSERT OR IGNORE INTO product_prices (product_id,size_ml,price_pkr)
SELECT id,50,2550 FROM products WHERE slug IN ('de-marj','de-ignite-oud','de-summer-oud');
INSERT OR IGNORE INTO product_prices (product_id,size_ml,price_pkr)
SELECT id,100,4500 FROM products WHERE slug IN ('de-marj','de-ignite-oud','de-summer-oud');
