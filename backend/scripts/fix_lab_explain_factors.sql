-- Fix factors_json shape expected by ExplanationStubFactory (attribute_code / shap_value / direction).
UPDATE tb_explanation
SET factors_json = '[{"attribute_code":"divida_aberta","value":1,"shap_value":-18.200000,"direction":"NEGATIVE","label":"Divida em aberto"},{"attribute_code":"qtd_negativacoes","value":2,"shap_value":-12.500000,"direction":"NEGATIVE","label":"Quantidade de negativacoes"},{"attribute_code":"baseline","value":650,"shap_value":42.700000,"direction":"POSITIVE","label":"Baseline do modelo"}]'
WHERE decision_id = 'd1000000-0000-4000-8000-000000000001';

UPDATE tb_explanation
SET factors_json = '[{"attribute_code":"divida_aberta","value":3,"shap_value":-85.000000,"direction":"NEGATIVE","label":"Divida em aberto"},{"attribute_code":"qtd_negativacoes","value":4,"shap_value":-40.000000,"direction":"NEGATIVE","label":"Quantidade de negativacoes"},{"attribute_code":"baseline","value":600,"shap_value":73.500000,"direction":"POSITIVE","label":"Baseline do modelo"}]'
WHERE decision_id = 'd1000000-0000-4000-8000-000000000002';

UPDATE tb_explanation
SET factors_json = '[{"attribute_code":"divida_aberta","value":0,"shap_value":20.000000,"direction":"POSITIVE","label":"Divida em aberto"},{"attribute_code":"qtd_negativacoes","value":0,"shap_value":15.000000,"direction":"POSITIVE","label":"Quantidade de negativacoes"},{"attribute_code":"baseline","value":700,"shap_value":66.000000,"direction":"POSITIVE","label":"Baseline do modelo"}]'
WHERE decision_id = 'd1000000-0000-4000-8000-000000000003';
