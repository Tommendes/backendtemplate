ALTER TABLE plan_contratacoes ADD data_pub_edital VARCHAR (255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL;

ALTER TABLE exec_contratos ADD garantia CHAR(1) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL,
ADD tipo_garantia CHAR(1) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL,
ADD inicio_vig_garantia VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL, 
ADD fim_vig_garantia VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL;

ALTER TABLE exec_metas CHANGE qtd_meta qtd_meta VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL;

ALTER TABLE conv_aditivos CHANGE data_pub data_pub VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL,
CHANGE ato_pub ato_pub VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL,
CHANGE vei_pub vei_pub CHAR(1) CHARSET utf8mb4 COLLATE utf8mb4_general_ci NULL;