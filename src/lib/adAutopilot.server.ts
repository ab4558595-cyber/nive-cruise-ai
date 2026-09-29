// Server-only: per-user Google Ads + Meta Ads connections, AI budget planning and real launches.
import { callModel, parseJsonLoose } from "./studio.server";

const GADS_VERSION = "v21";
const META_VERSION = "v21.0";

export type ChannelPlan = {
  enabled: boolean;
  share: number; // % of total budget
  dailyBudget: number; // account currency, whole units
  reason: string;
  headlines: string[];
  descriptions: string[];
  keywords?: string[];
  primaryText?: string;
  countries: string[];
  ageMin?: number;
  ageMax?: number;
};

export type CampaignPlan = {
  name: string;
  summary: string;
  google: ChannelPlan;
  meta: ChannelPlan;
};

function env(name: string): string | undefined {
  return process.env[name];
}

export function providerStatus() {
  return {
    google: Boolean(
      env("GOOGLE_ADS_DEVELOPER_TOKEN") &&
        (env("GOOGLE_ADS_CLIENT_ID") ?? env("GOOGLE_OAUTH_CLIENT_ID")) &&
        (env("GOOGLE_ADS_CLIENT_SECRET") ?? env("GOOGLE_OAUTH_CLIENT_SECRET")),
    ),
    meta: Boolean(env("META_APP_ID") && env("META_APP_SECRET")),
  };
}

function googleClient() {
  const id = env("GOOGLE_ADS_CLIENT_ID") ?? env("GOOGLE_OAUTH_CLIENT_ID");
  const secret = env("GOOGLE_ADS_CLIENT_SECRET") ?? env("GOOGLE_OAUTH_CLIENT_SECRET");
  const devToken = env("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!id || !secret || !devToken) throw new Error("Google Ads isn't switched on yet — the developer token is still pending.");
  return { id, secret, devToken };
}

function metaClient() {
  const id = env("META_APP_ID");
  const secret = env("META_APP_SECRET");
  if (!id || !secret) throw new Error("Meta Ads isn't switched on yet — the Meta app keys are missing.");
  return { id, secret };
}

// ---------- OAuth ----------
export function buildAuthUrl(provider: "google" | "meta", state: string, redirectUri: string) {
  if (provider === "google") {
    const { id } = googleClient();
    const p = new URLSearchParams({
      client_id: id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/adwords",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }
  const { id } = metaClient();
  const p = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri,
    state,
    scope: "ads_management,ads_read,pages_show_list,pages_read_engagement,business_management",
    response_type: "code",
  });
  return `https://www.facebook.com/${META_VERSION}/dialog/oauth?${p}`;
}

async function jsonOrThrow(res: Response, label: string) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${label} failed [${res.status}]: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

export async function exchangeCode(provider: "google" | "meta", code: string, redirectUri: string) {
  if (provider === "google") {
    const { id, secret, devToken } = googleClient();
    const tok = await jsonOrThrow(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      }),
      "Google sign-in",
    );
    if (!tok.refresh_token) throw new Error("Google did not return offline access — please try connecting again.");
    const list = await jsonOrThrow(
      await fetch(`https://googleads.googleapis.com/${GADS_VERSION}/customers:listAccessibleCustomers`, {
        headers: { Authorization: `Bearer ${tok.access_token}`, "developer-token": devToken },
      }),
      "Google Ads account lookup",
    );
    const first: string | undefined = list.resourceNames?.[0];
    if (!first) throw new Error("No Google Ads account found on this Google login.");
    return { refreshToken: tok.refresh_token as string, accountId: first.split("/")[1], accountName: `Google Ads ${first.split("/")[1]}` };
  }
  const { id, secret } = metaClient();
  const short = await jsonOrThrow(
    await fetch(`https://graph.facebook.com/${META_VERSION}/oauth/access_token?${new URLSearchParams({ client_id: id, client_secret: secret, redirect_uri: redirectUri, code })}`),
    "Meta sign-in",
  );
  const long = await jsonOrThrow(
    await fetch(`https://graph.facebook.com/${META_VERSION}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: id, client_secret: secret, fb_exchange_token: short.access_token })}`),
    "Meta long-lived token",
  );
  const accts = await jsonOrThrow(
    await fetch(`https://graph.facebook.com/${META_VERSION}/me/adaccounts?fields=account_id,name&access_token=${long.access_token}`),
    "Meta ad account lookup",
  );
  const a = accts.data?.[0];
  if (!a) throw new Error("No Meta ad account found on this Facebook login.");
  return { refreshToken: long.access_token as string, accountId: a.account_id as string, accountName: a.name as string };
}

// ---------- AI planning ----------
const PLANNER = `You are Nive's paid-ads strategist. Split a total ad budget between Google Search and Meta
(Facebook/Instagram) feed ads for the stated goal and produce ready-to-launch creative.
Return STRICT JSON:
{"name":string,"summary":string,
 "google":{"enabled":bool,"share":number,"reason":string,"headlines":[string x8, each <=30 chars],
   "descriptions":[string x3, each <=90 chars],"keywords":[string x10-15],"countries":[ISO2]},
 "meta":{"enabled":bool,"share":number,"reason":string,"headlines":[string x3, <=40 chars],
   "descriptions":[string x2, <=30 chars],"primaryText":string (<=125 chars),"countries":[ISO2],"ageMin":number,"ageMax":number}}
Rules: google.share + meta.share = 100 across enabled channels. Disable a channel (share 0) when it is not
available or clearly a bad fit. Search intent products lean Google; visual/impulse products lean Meta.
Very small budgets should use ONE channel only. Never invent claims, prices or guarantees.`;

export async function planCampaign(input: {
  goal: string; landingUrl: string; audience: string; currency: string; totalBudget: number; days: number;
  available: { google: boolean; meta: boolean };
}): Promise<CampaignPlan> {
  const raw = await callModel(
    PLANNER,
    `Goal: ${input.goal}\nLanding page: ${input.landingUrl}\nAudience & market: ${input.audience}\nTotal budget: ${input.totalBudget} ${input.currency} over ${input.days} days\nChannels the user connected: google=${input.available.google}, meta=${input.available.meta}`,
    true,
  );
  const p = parseJsonLoose<CampaignPlan>(raw);
  const chans = ["google", "meta"] as const;
  for (const c of chans) {
    p[c] = { ...(p[c] ?? ({} as ChannelPlan)) };
    if (!input.available[c]) { p[c].enabled = false; p[c].share = 0; }
    p[c].headlines ??= []; p[c].descriptions ??= []; p[c].countries = (p[c].countries ?? ["IN"]).slice(0, 10);
  }
  const totalShare = chans.reduce((s, c) => s + (p[c].enabled ? p[c].share || 0 : 0), 0) || 1;
  for (const c of chans) {
    const share = p[c].enabled ? Math.round(((p[c].share || 0) / totalShare) * 100) : 0;
    p[c].share = share;
    p[c].dailyBudget = Math.max(0, Math.floor((input.totalBudget * share) / 100 / input.days));
  }
  return p;
}

// ---------- Launch: Google Ads (Search) ----------
async function googleAccessToken(refreshToken: string) {
  const { id, secret } = googleClient();
  const t = await jsonOrThrow(
    await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: refreshToken, client_id: id, client_secret: secret, grant_type: "refresh_token" }),
    }),
    "Google token refresh",
  );
  return t.access_token as string;
}

export async function launchGoogle(conn: { refresh_token: string; account_id: string }, plan: CampaignPlan, landingUrl: string, currency: string) {
  const { devToken } = googleClient();
  const token = await googleAccessToken(conn.refresh_token);
  const cid = conn.account_id;
  const base = `https://googleads.googleapis.com/${GADS_VERSION}/customers/${cid}`;
  const headers = { Authorization: `Bearer ${token}`, "developer-token": devToken, "Content-Type": "application/json" };
  const call = async (path: string, body: unknown, label: string) =>
    jsonOrThrow(await fetch(`${base}/${path}`, { method: "POST", headers, body: JSON.stringify(body) }), label);

  const acct = await call("googleAds:search", { query: "SELECT customer.currency_code FROM customer" }, "Account currency");
  const acctCur = acct.results?.[0]?.customer?.currencyCode;
  if (acctCur && acctCur !== currency) throw new Error(`Your Google Ads account uses ${acctCur}, but the budget is in ${currency}. Re-plan in ${acctCur}.`);

  const g = plan.google;
  const stamp = Date.now().toString(36);
  const budget = await call("campaignBudgets:mutate", { operations: [{ create: { name: `${plan.name} budget ${stamp}`, amountMicros: String(g.dailyBudget * 1_000_000), deliveryMethod: "STANDARD", explicitlyShared: false } }] }, "Create budget");
  const budgetRn = budget.results[0].resourceName;
  const camp = await call("campaigns:mutate", { operations: [{ create: {
    name: `${plan.name} ${stamp}`, status: "PAUSED", advertisingChannelType: "SEARCH", campaignBudget: budgetRn,
    maximizeClicks: {}, containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
    networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false },
  } }] }, "Create campaign");
  const campRn = camp.results[0].resourceName;

  const geo = await call("geoTargetConstants:suggest", { countryCode: g.countries[0] ?? "IN", locationNames: { names: g.countries } }, "Find locations").catch(() => ({}));
  const geoIds: string[] = (geo.geoTargetConstantSuggestions ?? []).map((s: { geoTargetConstant?: { resourceName: string } }) => s.geoTargetConstant?.resourceName).filter(Boolean).slice(0, 10);
  if (geoIds.length) await call("campaignCriteria:mutate", { operations: geoIds.map((rn) => ({ create: { campaign: campRn, location: { geoTargetConstant: rn } } })) }, "Set locations");

  const ag = await call("adGroups:mutate", { operations: [{ create: { name: `${plan.name} ad group`, campaign: campRn, status: "ENABLED", type: "SEARCH_STANDARD" } }] }, "Create ad group");
  const agRn = ag.results[0].resourceName;
  const kws = (g.keywords ?? []).slice(0, 20);
  if (kws.length) await call("adGroupCriteria:mutate", { operations: kws.map((text) => ({ create: { adGroup: agRn, status: "ENABLED", keyword: { text: text.slice(0, 80), matchType: "PHRASE" } } })) }, "Add keywords");
  await call("adGroupAds:mutate", { operations: [{ create: { adGroup: agRn, status: "ENABLED", ad: { finalUrls: [landingUrl], responsiveSearchAd: {
    headlines: g.headlines.slice(0, 15).map((t) => ({ text: t.slice(0, 30) })),
    descriptions: g.descriptions.slice(0, 4).map((t) => ({ text: t.slice(0, 90) })),
  } } } }] }, "Create ad");
  // Switch on only after every piece exists.
  await call("campaigns:mutate", { operations: [{ update: { resourceName: campRn, status: "ENABLED" }, updateMask: "status" }] }, "Enable campaign");
  return { campaign: campRn, dailyBudget: g.dailyBudget };
}

// ---------- Launch: Meta (Facebook / Instagram) ----------
export async function launchMeta(conn: { refresh_token: string; account_id: string }, plan: CampaignPlan, landingUrl: string, currency: string) {
  const token = conn.refresh_token;
  const act = `act_${conn.account_id}`;
  const g = `https://graph.facebook.com/${META_VERSION}`;
  const post = async (path: string, params: Record<string, unknown>, label: string) => {
    const body = new URLSearchParams({ access_token: token });
    for (const [k, v] of Object.entries(params)) body.set(k, typeof v === "string" ? v : JSON.stringify(v));
    return jsonOrThrow(await fetch(`${g}/${path}`, { method: "POST", body }), label);
  };
  const info = await jsonOrThrow(await fetch(`${g}/${act}?fields=currency&access_token=${token}`), "Ad account");
  if (info.currency && info.currency !== currency) throw new Error(`Your Meta ad account uses ${info.currency}, but the budget is in ${currency}. Re-plan in ${info.currency}.`);
  const pages = await jsonOrThrow(await fetch(`${g}/me/accounts?fields=id,name&access_token=${token}`), "Facebook Pages");
  const pageId = pages.data?.[0]?.id;
  if (!pageId) throw new Error("Meta ads need a Facebook Page. Create one, then reconnect Meta.");

  const m = plan.meta;
  const camp = await post(`${act}/campaigns`, { name: plan.name, objective: "OUTCOME_TRAFFIC", status: "PAUSED", special_ad_categories: [] }, "Create Meta campaign");
  const adset = await post(`${act}/adsets`, {
    name: `${plan.name} audience`, campaign_id: camp.id, daily_budget: String(m.dailyBudget * 100),
    billing_event: "IMPRESSIONS", optimization_goal: "LINK_CLICKS", bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: { geo_locations: { countries: m.countries }, age_min: m.ageMin ?? 18, age_max: m.ageMax ?? 65 },
    status: "ACTIVE",
  }, "Create Meta ad set");
  const creative = await post(`${act}/adcreatives`, {
    name: `${plan.name} creative`,
    object_story_spec: { page_id: pageId, link_data: { link: landingUrl, message: m.primaryText ?? m.descriptions[0] ?? "", name: m.headlines[0] ?? plan.name, description: m.descriptions[0] ?? "", call_to_action: { type: "LEARN_MORE", value: { link: landingUrl } } } },
  }, "Create Meta creative");
  await post(`${act}/ads`, { name: `${plan.name} ad`, adset_id: adset.id, creative: { creative_id: creative.id }, status: "ACTIVE" }, "Create Meta ad");
  await post(camp.id, { status: "ACTIVE" }, "Enable Meta campaign");
  return { campaign: camp.id as string, dailyBudget: m.dailyBudget };
}

export async function pauseGoogle(conn: { refresh_token: string; account_id: string }, campRn: string) {
  const { devToken } = googleClient();
  const token = await googleAccessToken(conn.refresh_token);
  await jsonOrThrow(await fetch(`https://googleads.googleapis.com/${GADS_VERSION}/customers/${conn.account_id}/campaigns:mutate`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "developer-token": devToken, "Content-Type": "application/json" },
    body: JSON.stringify({ operations: [{ update: { resourceName: campRn, status: "PAUSED" }, updateMask: "status" }] }),
  }), "Pause Google campaign");
}

export async function pauseMeta(conn: { refresh_token: string }, id: string) {
  await jsonOrThrow(await fetch(`https://graph.facebook.com/${META_VERSION}/${id}`, { method: "POST", body: new URLSearchParams({ access_token: conn.refresh_token, status: "PAUSED" }) }), "Pause Meta campaign");
}
