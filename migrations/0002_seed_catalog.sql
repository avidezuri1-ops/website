-- Seed the existing 22-item Avidezuri catalogue and Karachi delivery areas.
-- Product prices are copied from the current storefront configuration.
INSERT OR IGNORE INTO products (slug,name,category,active,sort_order) VALUES
('de-wanted','DE WANTED','budget',1,1),
('de-night','DE NIGHT','exclusive',1,2),
('de-flora','DE FLORA','budget',1,3),
('de-swim','DE SWIM','exclusive',1,4),
('de-creventus','DE CREVENTUS','budget',1,5),
('de-movement','DE MOVEMENT','budget',1,6),
('de-angel','DE ANGEL','exclusive',1,7),
('de-aleesha','DE ALEE’SHA','exclusive',1,8),
('de-bomb','DE BOMB','budget',1,9),
('de-ocean','DE OCEAN','budget',1,10),
('in-de-sea','IN DE SEA','budget',1,11),
('de-sav-wild','DE SAV WILD','budget',1,12),
('de-true-bond','DE TRUE BOND','budget',1,13),
('de-aqua','DE AQUA','exclusive',1,14),
('de-cristal-rouge','DE CRISTAL ROUGE','exclusive',1,15),
('de-desire','DE DESIRE','exclusive',1,16),
('de-women','DE WOMEN','exclusive',1,17),
('de-leather','DE LEATHER','budget',1,18),
('de-fantasy','DE FANTASY','exclusive',1,19),
('de-mountain','DE MOUNTAIN','exclusive',1,20),
('de-black','DE BLACK','exclusive',1,21),
('de-noir','DE NOIR','exclusive',1,22);

INSERT OR IGNORE INTO product_prices (product_id,size_ml,price_pkr)
SELECT id,30,CASE category WHEN 'exclusive' THEN 1750 ELSE 1450 END FROM products;
INSERT OR IGNORE INTO product_prices (product_id,size_ml,price_pkr)
SELECT id,50,CASE category WHEN 'exclusive' THEN 2550 ELSE 1750 END FROM products;
INSERT OR IGNORE INTO product_prices (product_id,size_ml,price_pkr)
SELECT id,100,CASE category WHEN 'exclusive' THEN 4500 ELSE 2250 END FROM products;

INSERT OR IGNORE INTO delivery_zones (city,area,fee_pkr,active) VALUES
('Karachi','Saddar',200,1),('Karachi','Clifton',200,1),('Karachi','DHA (Defence)',200,1),
('Karachi','PECHS',200,1),('Karachi','Tariq Road',200,1),('Karachi','Gulshan-e-Iqbal',200,1),
('Karachi','Gulistan-e-Jauhar',200,1),('Karachi','North Nazimabad',200,1),('Karachi','Nazimabad',200,1),
('Karachi','Federal B Area',200,1),('Karachi','Garden',200,1),('Karachi','Bahadurabad',200,1),
('Karachi','Korangi',300,1),('Karachi','Landhi',300,1),('Karachi','Malir',300,1),
('Karachi','Shah Faisal Colony',300,1),('Karachi','Scheme 33',300,1),('Karachi','Gulshan-e-Maymar',300,1),
('Karachi','North Karachi',300,1),('Karachi','New Karachi',300,1),('Karachi','Orangi Town',300,1),
('Karachi','SITE',300,1),('Karachi','Liaquatabad',300,1),('Karachi','Lyari',300,1),
('Karachi','Baldia',300,1),('Karachi','Keamari',300,1),
('Karachi','Bin Qasim',400,1),('Karachi','Steel Town',400,1),('Karachi','Gadap',400,1),
('Karachi','Surjani Town',400,1),('Karachi','Hawksbay',400,1),('Karachi','Manghopir',400,1),
('Karachi','Bahria Town Karachi',400,1),('Karachi','DHA City',400,1),('Karachi','Gulshan-e-Hadeed',400,1),
('Karachi','Other area in Karachi',400,1);