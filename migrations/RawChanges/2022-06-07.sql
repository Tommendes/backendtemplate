ALTER TABLE plan_licitacoes ADD exercicio CHAR(4) NOT NULL AFTER updated_at, ADD mes CHAR(2) NOT NULL AFTER exercicio;
UPDATE plan_licitacoes SET exercicio = 2022;
ALTER TABLE plan_contratacoes ADD exercicio CHAR(4) NOT NULL AFTER updated_at, ADD mes CHAR(2) NOT NULL AFTER exercicio;
UPDATE plan_contratacoes SET exercicio = 2022;