ALTER TABLE conv_convenios ADD mes CHAR(2) AFTER ano;

ALTER TABLE adj_licitacoes ADD fracassada CHAR(1) AFTER data_adj;

ALTER TABLE exec_contratos CHANGE id_cadastro id_cadastro INT(10) UNSIGNED NULL COMMENT 'Contratado'; 

ALTER TABLE exec_metas CHANGE valor valor DOUBLE(11,2) NOT NULL;

ALTER TABLE exec_desembolsos CHANGE valor valor DOUBLE(11,2) NOT NULL;