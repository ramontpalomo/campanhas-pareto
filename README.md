# campanhas-pareto-vite

Dashboard de campanhas Meta Ads + Google Ads — versão Vite/React.

## ⚠️ IMPORTANTE

Este diretório contém o **build compilado** do dashboard correto (deploy Vercel `dpl_8KMkKXQJSQ4JkAgDZ7cN2ZfKYVpS`, 14/05/2026).

O source TypeScript original não foi encontrado no workspace — foi deployado diretamente sem commit.

**URL de produção:** https://campanhas-pareto.vercel.app

## Como fazer novo deploy

```bash
VERCEL_TOKEN=$(aws secretsmanager get-secret-value --secret-id "openclaw/fleet/pareto/tobi-pareto/mutable/vercel-token" --query SecretString --output text)
cd /home/node/.openclaw/workspace/campanhas-pareto-vite
VERCEL_ORG_ID=team_7jjO0ChERwUy5ZWWMOriHEJi \
VERCEL_PROJECT_ID=prj_Fc3YPCVtTnoJQuUWBcercfhjQ0Vy \
npx vercel --token "$VERCEL_TOKEN" --prod --yes
```

## Features do dashboard

- Abas por produto: Todos, Pareto AI, Pareto Agents, Pareto Content, OBM, Pareto Studio, Serviços de IA
- Filtro de período: 7 dias, 14 dias, 30 dias, Personalizado
- KPIs Meta Ads: Gasto, Leads, CPL, CPM, Freq. Média
- KPIs Google Ads: Gasto, Conversões, CPA, CPC
- Gráfico: Gasto Diário — Meta vs Google
- Gráfico: Conversões Diárias — Meta vs Google
- Tabela de campanhas com link direto para anúncios Meta Ads

## Próximas features planejadas

- [ ] Botão `+` para adicionar hotspots (marcações com linha pontilhada nos gráficos)
