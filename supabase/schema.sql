-- Schema separado para campanhas (isolado do workshop)
CREATE SCHEMA IF NOT EXISTS campaigns;

-- Tabela principal de métricas diárias
CREATE TABLE IF NOT EXISTS campaigns.campaign_metrics (
  id            BIGSERIAL PRIMARY KEY,
  platform      TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  campaign_id   TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  product       TEXT,
  date          DATE NOT NULL,
  spend         NUMERIC(10,2) NOT NULL DEFAULT 0,
  impressions   INTEGER NOT NULL DEFAULT 0,
  clicks        INTEGER NOT NULL DEFAULT 0,
  ctr           NUMERIC(6,4) NOT NULL DEFAULT 0,
  cpc           NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversions   NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_per_conversion NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversion_event TEXT,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, campaign_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaigns.campaign_metrics(date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_platform ON campaigns.campaign_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_product ON campaigns.campaign_metrics(product);

-- RLS (leitura pública para o dashboard sem login)
ALTER TABLE campaigns.campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read" ON campaigns.campaign_metrics
  FOR SELECT USING (true);

-- Permissão de leitura para anon
GRANT USAGE ON SCHEMA campaigns TO anon, authenticated;
GRANT SELECT ON campaigns.campaign_metrics TO anon, authenticated;
