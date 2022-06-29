ALTER TABLE cadastros ADD tipo_cadastro TINYINT(1) NOT NULL AFTER updated_at;
ALTER TABLE plan_adesoes DROP FOREIGN KEY vivazul_api_plan_adesoes_id_ua_foreign;
ALTER TABLE plan_adesoes   
  ADD COLUMN id_cadastro INT(10) UNSIGNED NOT NULL AFTER id_plan_licit,
  ADD CONSTRAINT vivazul_api_plan_adesoes_id_cadastro_foreign FOREIGN KEY (id_cadastro) REFERENCES cadastros(id) ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE cadastros ADD cod_ibge VARCHAR(255) NOT NULL AFTER patrimonio;
ALTER TABLE plan_adesoes DROP cod_ibge;
ALTER TABLE exec_itens DROP n_item, ADD id_item INTEGER(10) UNSIGNED NOT NULL;

ALTER TABLE exec_desembolsos DROP FOREIGN KEY vivazul_api_exec_desembolsos_id_ex_etp_foreign; 
ALTER TABLE exec_desembolsos ADD CONSTRAINT vivazul_api_exec_desembolsos_id_ex_etp_foreign FOREIGN KEY (id_ex_etP) REFERENCES exec_etapas(id) ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE exec_desembolsos DROP FOREIGN KEY vivazul_api_exec_desembolsos_id_ex_etp_foreign; 
ALTER TABLE exec_desembolsos ADD CONSTRAINT vivazul_api_exec_desembolsos_id_ex_etp_foreign FOREIGN KEY (id_ex_etP) REFERENCES exec_etapas(id) ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE obras_acompans CHANGE desc_servico desc_servico VARCHAR(1024) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;
ALTER TABLE conv_cancels CHANGE motivo motivo VARCHAR(1024) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;
ALTER TABLE plan_licitacoes CHANGE objeto objeto VARCHAR(1024) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;
ALTER TABLE exec_alteracoes CHANGE just_tipo_aditivo just_tipo_aditivo VARCHAR(1024) CHARSET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE exec_aditivos CHANGE just_tipo_aditivo just_tipo_aditivo VARCHAR(1024) CHARSET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE exec_itens CHANGE descricao descricao VARCHAR(1024) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL; 
ALTER TABLE exec_itens CHANGE unid_medida unid_medida VARCHAR(100) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL; 