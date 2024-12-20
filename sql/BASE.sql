CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users(
   id UUID DEFAULT uuid_generate_v4(),
   email TEXT NOT NULL,
   name VARCHAR(50) ,
   firstname VARCHAR(50) ,
   validation_date TIMESTAMP,
   password TEXT NOT NULL,
   PRIMARY KEY(id),
   UNIQUE(email)
);

CREATE TABLE configuration(
   id SERIAL,
   keys VARCHAR(50) ,
   valeurs TEXT,
   PRIMARY KEY(id)
);

CREATE TABLE user_token(
   id SERIAL,
   token UUID NOT NULL DEFAULT uuid_generate_v4(),
   creation_date TIMESTAMP NOT NULL,
   expiration_date TIMESTAMP,
   id_users UUID NOT NULL,
   PRIMARY KEY(id),
   UNIQUE(token),
   FOREIGN KEY(id_users) REFERENCES users(id)
);

CREATE TABLE attempts(
   id SERIAL,
   date_next_attempt TIMESTAMP,
   count_attempt SMALLINT,
   id_users UUID NOT NULL,
   PRIMARY KEY(id),
   FOREIGN KEY(id_users) REFERENCES users(id)
);

CREATE TABLE user_pin(
   id SERIAL,
   pin TEXT NOT NULL,
   creation_date TIMESTAMP NOT NULL,
   expiration_date TIMESTAMP,
   id_users UUID NOT NULL,
   PRIMARY KEY(id),
   FOREIGN KEY(id_users) REFERENCES users(id)
);

CREATE TABLE password_change (
   id UUID DEFAULT uuid_generate_v4(),
   id_users UUID NOT NULL,
   password TEXT NOT NULL,
   validation_date TIMESTAMP NOT NULL DEFAULT (now() + interval '90 seconds'),
   FOREIGN KEY(id_users) REFERENCES users(id)
);