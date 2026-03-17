// ---------------------------------------------------------------------------
// Platform Macro Registry
// ---------------------------------------------------------------------------
// Each ad platform (DSP, ad server, exchange) uses different macro syntax
// for click tracking, cache busting, device IDs, etc. This registry maps
// platform names to their macro placeholder values.
//
// The macros are injected into the `_stAdParams` object in the ad tag.
// The ad platform replaces these placeholders at serve time.
// ---------------------------------------------------------------------------

export interface PlatformConfig {
  id: string
  name: string
  macros: Record<string, string>
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'adlib',
    name: 'ADLIB',
    macros: { click_url: '[ENCODED_CLICK_REDIRECT]', cachebuster: '[RANDOM_NUMBER]', deviceid: '[MOBILE_DEVICE_ID]' },
  },
  {
    id: 'adbutler',
    name: 'AdButler',
    macros: { click_url: '[TRACKING_LINK_ENCODED]', cachebuster: '[TIMESTAMP]', publisherId: '[PUBLISHER_ID]', deviceid: '' },
  },
  {
    id: 'adkernel',
    name: 'AdKernel',
    macros: { click_url: '{conversion}', cachebuster: '{cachebuster}', referral: '{domain}', dspCampaignId: '{campaign}', ad_Id: '{banner}', site: '{site_id}', app_id: '{app_id}', app_bundle: '{app_bundle}', app_domain: '{app_domain}', app_store_url: '{app_store_url}', COUNTRY_CODE: '{country}', PLATFORM_CARRIER: '{carrier}', cityId: '{city}', offer: '{offer}', ZIP_CODE: '{zip_code}', lng: '{long}', lat: '{lat}', IP_ADDRESS: '{ip}', ifa: '{ifa}', device_type: '{device_type}', PLATFORM_OS: '{os}', browser: '{browser}', userAgent: '{user_agent}', query: '{query}', publisherId: '{pub_id}', subid: '{subid}', source: '{source}', GDPR_APPLIES: '{gdpr}', timestamp: '{timestamp}', user_consent: '{user_consent}', referral_Url: '{url}', deviceid: '' },
  },
  {
    id: 'adtheorent',
    name: 'AdTheorent',
    macros: { click_url: '[ENCODEDCLICKURL]', cachebuster: '[TIMESTAMP]', lat: '[LATITUDE]', lng: '[LONGITUDE]', deviceid: '[ADTHEORENTID]', adExchange: '[ADEXCHANGE]', referral: '[PROPERTYNAME]' },
  },
  {
    id: 'adelphic',
    name: 'Adelphic',
    macros: { click_url: '${ADELPHIC_CLICK_REDIRECT_PROVIDED_ENC}', cachebuster: '${ADELPHIC_CACHE_BUSTER}', referral: '${ADELPHIC_SITELET_URL}', deviceid: '' },
  },
  {
    id: 'adform',
    name: 'Adform',
    macros: { click_url: '%%c1;cpdir=', cachebuster: '__ADFTIMESTAMP__', lat: '__ADFLAT__', lng: ' __ADFLNG__', referral: '__ADFREFERER__', deviceid: '__ADFDEVID__' },
  },
  {
    id: 'affle1',
    name: 'Affle 1',
    macros: { click_url: '|UR_ID|', cachebuster: '|RANDOM|', deviceid: '|ADVERTISING_ID|', site: '|PUBLISHER_ID|' },
  },
  {
    id: 'affle2',
    name: 'Affle 2',
    macros: { click_url: '%clickid%', cachebuster: '%ts%', deviceid: '%udid%', site: '%bundle%' },
  },
  {
    id: 'amobee',
    name: 'Amobee',
    macros: { click_url: '${AMG_CLICK_MACRO}', cachebuster: '${AMG_RND}', deviceid: '' },
  },
  {
    id: 'applift',
    name: 'AppLift',
    macros: { click_url: '{CLICK_URL}', cachebuster: '{TIMESTAMP}', deviceid: '{DEVICE_RAW_ID}' },
  },
  {
    id: 'basis',
    name: 'BASIS',
    macros: { click_url: '{clickMacro}', cachebuster: '{ts}', referral: '{domain}', deviceid: '{ifa}*', AUCTION_ID: '{auctionId}' },
  },
  {
    id: 'beeswax',
    name: 'BEESWAX',
    macros: { click_url: '{{CLICK_URL}}', cachebuster: '{{CACHEBUSTER}}', deviceid: '{{USER_ID}}', AUCTION_ID: '{{AUCTION_ID}}', AGE: '{{AGE}}', GENDER: '{{GENDER}}', IP_ADDRESS: '{{IP_ADDRESS}}', lat: '{{LAT}}', lng: '{{LONG}}', ZIP_CODE: '{{ZIP_CODE}}', METRO_CODE: '{{METRO_CODE}}', COUNTRY_CODE: '{{COUNTRY_CODE}}', DEVICE_MODEL: '{{DEVICE_MODEL}}', PLATFORM_OS: '{{PLATFORM_OS}}', PLATFORM_CARRIER: '{{PLATFORM_CARRIER}}' },
  },
  {
    id: 'bidease',
    name: 'Bidease',
    macros: { click_url: '{{.ClickURL}}', cachebuster: '{{time.Unix}}', deviceid: '{{.IFA}}' },
  },
  {
    id: 'brandzooka',
    name: 'Brandzooka',
    macros: { click_url: '%%TTD_CLK%%', cachebuster: '%%TTD_CACHEBUSTER%%', deviceid: '' },
  },
  {
    id: 'connectki',
    name: 'Connectki',
    macros: { click_url: '%%clickUrl%%', cachebuster: '%%cb%%', deviceid: '' },
  },
  {
    id: 'dv360',
    name: 'DV360',
    macros: { click_url: '${CLICK_URL}', cachebuster: '${CACHEBUSTER}', publisherId: '${BUNDLE_ID}', deviceid: '' },
  },
  {
    id: 'equativ',
    name: 'Equativ',
    macros: { click_url: '[sas_creativeClickUrl]', cachebuster: '[timestamp]', deviceid: '' },
  },
  {
    id: 'eskimi',
    name: 'Eskimi',
    macros: { click_url: '{CLICK_URL_ENC}', cachebuster: '{CACHEBUSTER}', deviceid: '' },
  },
  {
    id: 'gdn',
    name: 'GDN',
    macros: { click_url: '%%CLICK_URL_UNESC%%', cachebuster: '%%CACHEBUSTER%%', deviceid: '' },
  },
  {
    id: 'gam',
    name: 'Google Ad Manager',
    macros: { click_url: '%%CLICK_URL_UNESC%%', cachebuster: '%%CACHEBUSTER%%', deviceid: '%%ADVERTISING_IDENTIFIER_PLAIN%%' },
  },
  {
    id: 'gam-oop',
    name: 'Google Ad Manager - Out Of Page Ads',
    macros: { click_url: '%%CLICK_URL_UNESC%%', cachebuster: '%%CACHEBUSTER%%', impression: '%%VIEW_URL_UNESC%%', deviceid: '' },
  },
  {
    id: 'groundtruth',
    name: 'GroundTruth',
    macros: { click_url: '%%ENCODED_CLICKURL%%', cachebuster: '%%TIMESTAMP%%', deviceid: '%%USER_UID_OPTOUT%%', lat: '%%USER_GEO_LAT%%', lng: '%%USER_GEO_LONG%%', referral: '%%APP_SITE_PUB_NAME%%' },
  },
  {
    id: 'growthchannel',
    name: 'Growth Channel',
    macros: { click_url: '[UNENCODED_CLICK_REDIRECT]', cachebuster: '[RANDOM_NUMBER]', referral: '[BID_ATTR.site]', adExchange: '[BID_ATTR.exchange]', maid: '[MM_UUID]', deviceid: '' },
  },
  {
    id: 'iqm',
    name: 'IQM',
    macros: { click_url: '{IAA_TRACKING_CLICK_URL}', cachebuster: '{IAA_CACHE_BUSTER}', deviceid: '{IAA_DEVICE_ID}' },
  },
  {
    id: 'illumin',
    name: 'Illumin',
    macros: { click_url: '[CLICK_URL_ENCODED]', cachebuster: '[CACHEBUSTER]', deviceid: '' },
  },
  {
    id: 'inmobi',
    name: 'Inmobi',
    macros: { click_url: '$HTML_URL_ESC_CLICK_URL', cachebuster: '$CACHEBUSTER', impressionId: '$IMP_ID', deviceid: '' },
  },
  {
    id: 'ironsource',
    name: 'Iron Source',
    macros: { click_url: '[NO-MACRO]', cachebuster: '[CB]', deviceid: '[IFA]', referral: '[BUNDLE_ID]' },
  },
  {
    id: 'kayzen',
    name: 'Kayzen',
    macros: { click_url: '{CLICK_URL}', cachebuster: '{CACHEBUSTER}', deviceid: '' },
  },
  {
    id: 'kritter',
    name: 'Kritter',
    macros: { click_url: '[SECURE_CLICK_URL]&redirect=', cachebuster: '{{CACHEBUSTER}}', deviceid: '{{DEVICE_ID}}', referral: '{{REFERER}}', adExchange: '{{EXC_SSP}}', stateId: '{{STATE_ID}}', cityId: '{{CITY_ID}}', userAgent: '{{DEVICE_UA}}' },
  },
  {
    id: 'limelight',
    name: 'Limelight',
    macros: { click_url: '%%clickUrl%%', cachebuster: '%%cb%%', deviceid: '' },
  },
  {
    id: 'marsmedia',
    name: 'Mars Media',
    macros: { click_url: '${BEACON_CLICK_URL}', cachebuster: '${REQUEST_ID}', deviceid: '${O_DEVICE_IFA}' },
  },
  {
    id: 'mediasmart',
    name: 'Mediasmart',
    macros: { click_url: '%click_url_esc%', cachebuster: '%ts%', COUNTRY_CODE: '%country2%', referral: '%domain%', cityId: '%city%', stateId: '%region%', ZIP_CODE: '%zipcode%', lat: '%lat%', lng: '%lon%', deviceid: '%udid%', adExchange: '%exchange%' },
  },
  {
    id: 'pelmorex',
    name: 'Pelmorex',
    macros: { click_url: '%%CLICKTHROUGH_ESC%%', cachebuster: '%%TIMESTAMP%%', deviceid: '%%DEVICE_ID%%' },
  },
  {
    id: 'quantcast',
    name: 'Quantcast',
    macros: { click_url: '${CLICKESC}', cachebuster: '${CACHEBUSTER}', referral: '${SUBDOMAIN}${BUNDLE_ID}', deviceid: '' },
  },
  {
    id: 'remerge',
    name: 'Remerge',
    macros: { click_url: '{{ClickUrl.WithParams TargetUrl:TargetUrl}}', cachebuster: '%%NONE%%', deviceid: '' },
  },
  {
    id: 'roku',
    name: 'Roku',
    macros: { click_url: '[[[CLICKURL]]]', cachebuster: '[[[TIMESTAMP]]]', deviceid: '[[[GOOGLE_AD_ID]]][[[IDFA]]]' },
  },
  {
    id: 'sas360',
    name: 'SAS 360 Match',
    macros: { click_url: '%%CLICKURL%%', cachebuster: '%%RANDOM%%', referral: '%%REFERER%%', deviceid: '' },
  },
  {
    id: 'sabio',
    name: 'Sabio',
    macros: { click_url: '{CLICK_URL_NOLP}', cachebuster: '{TIMESTAMP}', deviceid: '{DEVICE_ID}' },
  },
  {
    id: 'simplifi',
    name: 'Simpli.fi',
    macros: { click_url: '{{clickMacro}}', cachebuster: '{{cachebuster}}', deviceid: '' },
  },
  {
    id: 'smartyads',
    name: 'Smartyads',
    macros: { click_url: '[CLICK_URL_ESC]', cachebuster: '[CB]', deviceid: '' },
  },
  {
    id: 'springserve',
    name: 'Springserve',
    macros: { click_url: '{{URL}}', cachebuster: '{{CACHEBUSTER}}', deviceid: '{{DEVICE_ID}}' },
  },
  {
    id: 'stackadapt',
    name: 'StackAdapt',
    macros: { click_url: '{SA_CLICK_URL_ENC}', cachebuster: '{timestamp}', deviceid: '{SA_DEVICE_ID}', referral: '{SA_REF_DOMAIN}' },
  },
  {
    id: 'thetradedesk',
    name: 'The Trade Desk',
    macros: { click_url: '%%TTD_CLK_ESC%%', cachebuster: '%%TTD_CACHEBUSTER%%', deviceid: '%%TTD_DEVICEID%%', site: '%%TTD_SITE%%', dspCampaignId: '%%TTD_CAMPAIGNID%%', dspCreativeId: '%%TTD_CREATIVEID%%', impressionId: '%%TTD_IMPRESSIONID%%', AD_GROUP_ID: '%%TTD_ADGROUPID%%' },
  },
  {
    id: 'verve',
    name: 'Verve',
    macros: { click_url: '${ClickURL}', cachebuster: '${ImpID}', deviceid: '${AID}${IDFA}', dspCampaignId: '${CampID}', dspCreativeId: '${CrID}' },
  },
  {
    id: 'vicinitymedia',
    name: 'Vicinity Media',
    macros: { click_url: '%%CLICK_URL_UNESC%%', cachebuster: '%%RANDOM%%', deviceid: '' },
  },
  {
    id: 'voltax',
    name: 'Voltax_Minute media',
    macros: { click_url: '{}', cachebuster: '{{.CacheBuster}}', HOSTNAME: '{{.Hostname}}', PAGE_URL: '{{.PageUrl}}', GDPR_APPLIES: '{{.GDPR}}', GDPR_CONSENT_STRING: '{{.GDPRConsent}}', PLAYER_WIDTH: '{{.PlayerWidth}}', PLAYER_HEIGHT: '{{.PlayerHeight}}', EXTERNAL_VIDEO_GUID: '{{.ExternalID}}', US_PRIVACY_STRING: '{{.USPrivacy}}', SUPPLY_CHAIN: '{{.SupplyChain}}', deviceid: '' },
  },
  {
    id: 'xandr',
    name: 'Xandr',
    macros: { click_url: '${CLICK_URL_ENC}', cachebuster: '${CACHEBUSTER}', referral: '${REFERER_URL_ENC}', deviceid: '${DEVICE_AAID}${DEVICE_APPLE_IDA}${DEVICE_IFA}' },
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    macros: { click_url: '{CLICKURLENC}', cachebuster: '{TIMESTAMP}', GDPR_APPLIES: '${GDPR}', deviceid: '' },
  },
  {
    id: 'yoose',
    name: 'Yoose',
    macros: { click_url: '%click_url_unesc%', cachebuster: '%ts%', deviceid: '' },
  },
  {
    id: 'zedo',
    name: 'Zedo',
    macros: { click_url: '%ZZDCLICK%', cachebuster: '%t', deviceid: '' },
  },
  {
    id: 'zeta',
    name: 'Zeta',
    macros: { click_url: '{clickprefix}', cachebuster: '{timestamp}', deviceid: '' },
  },
  {
    id: 'standard',
    name: 'Standard Tag',
    macros: { click_url: '', cachebuster: '', deviceid: '', referral: '' },
  },
]

/** Look up a platform by ID */
export function getPlatform(id: string): PlatformConfig | undefined {
  return PLATFORMS.find((p) => p.id === id)
}

/** Default platform used when none is selected */
export const DEFAULT_PLATFORM_ID = 'gam'
