-- Insérer des utilisateurs dans la table `users`
INSERT INTO users (email, name, firstname, validation_date, password)
VALUES
('tsiryrakotonirina23@gmail.com', 'Tsiry', 'Rakotonirina', now(), crypt('1234', gen_salt('bf')));

-- Insérer une ligne de données de test dans la table `user_token`
INSERT INTO user_token (creation_date, expiration_date, id_users)
VALUES
(now(), now() + interval '15 minutes', (SELECT id FROM users WHERE email = 'tsiryrakotonirina23@gmail.com'));    

UPDATE user_token SET expiration_date = now() + interval '15 minutes';

UPDATE users
SET password = '1234'
WHERE id = 'fd5c63a6-3e6c-49d5-8866-358bdf3419ba';


-- Rajo
INSERT INTO configuration (keys, valeurs) VALUES 
('pin_expiration_minute', '15');

INSERT INTO users (email, name, firstname, validation_date, password)
VALUES
('rajonarivony@gmail.com', 'Rajo', 'Rasolofonirina', now(), crypt('1234', gen_salt('bf')));
