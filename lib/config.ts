// Product mapping — maps campaign name patterns to product labels
export const PRODUCT_MAP: Record<string, string> = {
  'agents': 'Agents',
  'content': 'Content',
  'obm': 'OBM / AI Budget',
  'ai budget': 'OBM / AI Budget',
  'platform': 'Platform',
  'studio': 'Studio',
  'serviços de ia': 'Serviços de IA',
  'servicos de ia': 'Serviços de IA',
  'certificação': 'Certificação',
  'certificacao': 'Certificação',
}

export function detectProduct(campaignName: string): string {
  const lower = campaignName.toLowerCase()
  for (const [key, label] of Object.entries(PRODUCT_MAP)) {
    if (lower.includes(key)) return label
  }
  return 'Outros'
}

// Conversion event descriptions per campaign pattern
export const CONVERSION_EVENTS: Record<string, string> = {
  'agents': 'Lead (formulário)',
  'content': 'Lead (formulário)',
  'obm': 'Lead (formulário)',
  'ai budget': 'Lead (formulário)',
  'platform': 'Adição ao Carrinho',
  'studio': 'Lead (formulário)',
  'serviços de ia': 'Lead (formulário)',
  'servicos de ia': 'Lead (formulário)',
  'certificação': 'Compra',
  'certificacao': 'Compra',
}

export function detectConversionEvent(campaignName: string): string {
  const lower = campaignName.toLowerCase()
  for (const [key, label] of Object.entries(CONVERSION_EVENTS)) {
    if (lower.includes(key)) return label
  }
  return 'Lead'
}

// Column tooltips
export const COLUMN_TOOLTIPS = {
  spend: 'Total investido no período selecionado (R$)',
  impressions: 'Número de vezes que o anúncio foi exibido',
  clicks: 'Cliques totais no anúncio (incluindo todos os tipos)',
  ctr: 'Click-Through Rate: % de impressões que geraram clique. Referência saudável: >2% (Meta), >5% (Google Search)',
  cpc: 'Custo Por Clique médio (R$)',
  conversions: 'Número de conversões registradas. O evento varia por campanha — veja a coluna Evento.',
  cost_per_conversion: 'Custo por conversão (R$). Quanto custou cada lead, compra ou adição ao carrinho.',
  conversion_event: 'Qual ação o pixel/tag está contando como conversão nesta campanha',
}

export const PRODUCTS_ORDER = [
  'Agents',
  'Content',
  'OBM / AI Budget',
  'Platform',
  'Studio',
  'Serviços de IA',
  'Certificação',
  'Outros',
]

export const PRODUCT_COLORS: Record<string, string> = {
  'Agents': '#6366f1',
  'Content': '#22c55e',
  'OBM / AI Budget': '#f59e0b',
  'Platform': '#3b82f6',
  'Studio': '#ec4899',
  'Serviços de IA': '#ef4444',
  'Certificação': '#8b5cf6',
  'Outros': '#94a3b8',
}
