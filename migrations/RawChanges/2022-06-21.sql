ALTER TABLE `plan_licitacoes`   
 CHANGE `inicio_vig_garantia` `inicio_vig_garantia` VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL   COMMENT 'data vigência',
 CHANGE `fim_vig_garantia` `fim_vig_garantia` VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL   COMMENT 'data vigência';
ALTER TABLE `obras_licencas` CHANGE `id_ex_cont` `id_obra` INTEGER(10) UNSIGNED NOT NULL;
ALTER TABLE `obras_licencas` DROP FOREIGN KEY `vivazul_api_obras_licencas_id_ex_cont_foreign`;
ALTER TABLE `obras_licencas` ADD CONSTRAINT `vivazul_api_obras_licencas_id_ex_cont_foreign` FOREIGN KEY (`id_obra`) REFERENCES `vivazul_api`.`obras`(`id`) ON UPDATE CASCADE ON DELETE NO ACTION;
ALTER TABLE `cadastros` ADD `qualificacao` CHAR(2) AFTER `cadas_nome`;