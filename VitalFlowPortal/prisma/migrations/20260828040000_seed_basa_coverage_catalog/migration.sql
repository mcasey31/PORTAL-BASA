INSERT INTO insurance_providers (id, name, code, "hisFinanciadorId") VALUES
 ('basa-fin-osde','OSDE','OSDE','basa-his-osde'),
 ('basa-fin-swiss','Swiss Medical','SWISS_MEDICAL','basa-his-swiss'),
 ('basa-fin-medicus','Medicus','MEDICUS','basa-his-medicus'),
 ('basa-fin-pami','PAMI','PAMI','basa-his-pami'),
 ('basa-fin-veteranos','Veteranos de Guerra','VETERANOS_GUERRA','basa-his-veteranos'),
 ('basa-fin-uom','UOM','UOM','basa-his-uom'),
 ('basa-fin-galeno','Galeno','GALENO','basa-his-galeno')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, "hisFinanciadorId" = EXCLUDED."hisFinanciadorId";

INSERT INTO insurance_plans (id, "insuranceProviderId", name, "hisPlanId") VALUES
 ('basa-plan-osde-210','basa-fin-osde','210','basa-his-osde-210'),
 ('basa-plan-osde-310','basa-fin-osde','310','basa-his-osde-310'),
 ('basa-plan-osde-410','basa-fin-osde','410','basa-his-osde-410'),
 ('basa-plan-swiss-sb03','basa-fin-swiss','SB03','basa-his-swiss-sb03'),
 ('basa-plan-swiss-sb04','basa-fin-swiss','SB04','basa-his-swiss-sb04'),
 ('basa-plan-swiss-sport','basa-fin-swiss','SPORT','basa-his-swiss-sport'),
 ('basa-plan-medicus-oro','basa-fin-medicus','Oro','basa-his-medicus-oro'),
 ('basa-plan-medicus-verde','basa-fin-medicus','Verde','basa-his-medicus-verde'),
 ('basa-plan-medicus-azul','basa-fin-medicus','Azul','basa-his-medicus-azul'),
 ('basa-plan-pami-unico','basa-fin-pami','Unico','basa-his-pami-unico'),
 ('basa-plan-veteranos-unico','basa-fin-veteranos','Unico','basa-his-veteranos-unico'),
 ('basa-plan-uom-unico','basa-fin-uom','Unico','basa-his-uom-unico'),
 ('basa-plan-galeno-oro','basa-fin-galeno','Oro','basa-his-galeno-oro'),
 ('basa-plan-galeno-azul','basa-fin-galeno','Azul','basa-his-galeno-azul'),
 ('basa-plan-galeno-verde','basa-fin-galeno','Verde','basa-his-galeno-verde')
ON CONFLICT (id) DO UPDATE SET "insuranceProviderId" = EXCLUDED."insuranceProviderId", name = EXCLUDED.name, "hisPlanId" = EXCLUDED."hisPlanId";
