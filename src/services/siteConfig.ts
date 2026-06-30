import { defaultSiteConfig, normalizeSiteConfig, SiteConfig } from '../content/siteContent';
import { supabase } from './supabase';

export const APP_STATE_TABLE = 'site_config';
export const APP_STATE_ID = 'maya-massoterapia-admin-state';

export const loadSiteConfigFromDatabase = async (): Promise<SiteConfig> => {
  const { data, error } = await supabase
    .from(APP_STATE_TABLE)
    .select('config')
    .eq('id', APP_STATE_ID)
    .maybeSingle();

  if (error || !data?.config) return defaultSiteConfig;

  const state = data.config as { siteConfig?: Partial<SiteConfig> };
  return normalizeSiteConfig(state.siteConfig);
};

export const saveSiteConfigToDatabase = async (siteConfig: SiteConfig) => {
  await supabase.from(APP_STATE_TABLE).upsert({
    id: APP_STATE_ID,
    config: { siteConfig: normalizeSiteConfig(siteConfig) },
    updated_at: new Date().toISOString(),
  });
};
