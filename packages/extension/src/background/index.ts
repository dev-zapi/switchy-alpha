// Background service worker for ZeroOmega
import {
  Profiles,
  generatePacScript,
  requestFromUrl,
  type Profile,
  type OmegaOptions,
  type FixedProfile,
  type PacProfile,
  type SwitchProfile,
  type RuleListProfile,
} from '@dev-zapi/switchyalpha-pac';
import { updateIconForProfile, getDisplayText } from './icon';
import { initTabsListenerWithUpdate, isMatchableUrl, getAllTabs } from './tabs';

console.log('ZeroOmega background service worker started');

// State
let options: OmegaOptions | null = null;
let currentProfileName = 'system';

// Default options
function getDefaultOptions(): OmegaOptions {
  return {
    '-schemaVersion': 2,
    '-startupProfileName': '',
    '-quickSwitchProfiles': [],
    '-refreshOnProfileChange': false,
    '-enableQuickSwitch': false,
    '-revertProxyChanges': false,
    '-showInspectMenu': true,
    '-downloadInterval': 1440,
    '+proxy': Profiles.create('proxy', 'FixedProfile'),
    '+auto switch': Profiles.create('auto switch', 'SwitchProfile'),
  } as OmegaOptions;
}

// Load options from storage
async function loadOptions(): Promise<OmegaOptions> {
  const stored = await chrome.storage.local.get(null);
  
  if (!stored || !stored['-schemaVersion']) {
    // First run - use defaults
    const defaults = getDefaultOptions();
    await chrome.storage.local.set(defaults);
    return defaults;
  }
  
  return stored as OmegaOptions;
}

// Apply a profile (set proxy settings)
async function applyProfile(name: string): Promise<void> {
  currentProfileName = name;
  await chrome.storage.local.set({ _currentProfileName: name });

  // Get profile
  const profile =
    name === 'direct' || name === 'system'
      ? null
      : options
        ? Profiles.byName(name, options as unknown as Record<string, Profile>)
        : null;

  if (name === 'direct') {
    // Direct connection - clear proxy
    await chrome.proxy.settings.set({
      value: { mode: 'direct' },
      scope: 'regular',
    });
  } else if (name === 'system') {
    // Use system proxy
    await chrome.proxy.settings.set({
      value: { mode: 'system' },
      scope: 'regular',
    });
  } else if (profile?.profileType === 'FixedProfile') {
    // Fixed proxy
    await applyFixedProfile(profile as FixedProfile);
  } else if (
    profile?.profileType === 'SwitchProfile' ||
    profile?.profileType === 'VirtualProfile'
  ) {
    // Switch profile - uses PAC script
    await applySwitchProfile(profile as SwitchProfile, name);
  } else if (
    profile?.profileType === 'RuleListProfile' ||
    profile?.profileType === 'AutoProxyRuleListProfile'
  ) {
    // Rule list profile - uses PAC script
    await applyRuleListProfile(profile as RuleListProfile, name);
  } else if (profile?.profileType === 'PacProfile') {
    // PAC profile
    await applyPacProfile(profile as PacProfile);
  } else {
    console.warn('Unknown or null profile type:', name, profile?.profileType);
  }

  // Update icon
  await updateIcon(name);
}

// Apply a FixedProfile
async function applyFixedProfile(profile: FixedProfile): Promise<void> {
  const proxy = profile.fallbackProxy;

  if (proxy?.host) {
    // Convert bypassList from BypassCondition objects to strings
    const bypassConditions = profile.bypassList || [];
    const bypassList: string[] = bypassConditions
      .map((c: any) => c.pattern || c)
      .filter((p: any) => typeof p === 'string' && p.length > 0);

    console.log('Applying fixed proxy:', {
      scheme: proxy.scheme || 'http',
      host: proxy.host,
      port: proxy.port || 8080,
      bypassList,
    });

    await chrome.proxy.settings.set({
      value: {
        mode: 'fixed_servers',
        rules: {
          singleProxy: {
            scheme: proxy.scheme || 'http',
            host: proxy.host,
            port: proxy.port || 8080,
          },
          bypassList,
        },
      },
      scope: 'regular',
    });
  } else {
    console.warn('Fixed profile has no fallbackProxy configured:', profile.name);
  }
}

// Apply a SwitchProfile using PAC script
async function applySwitchProfile(profile: SwitchProfile, name: string): Promise<void> {
  if (!options) {
    console.warn('No options loaded, cannot apply switch profile');
    return;
  }

  try {
    const pacScript = generatePacScript(
      options as unknown as Record<string, Profile>,
      name,
      { includeComments: true }
    );

    console.log('Applying PAC script for switch profile:', name);
    console.log('PAC script length:', pacScript.length);

    await chrome.proxy.settings.set({
      value: {
        mode: 'pac_script',
        pacScript: {
          data: pacScript,
        },
      },
      scope: 'regular',
    });
  } catch (e) {
    console.error('Failed to generate PAC script:', e);
  }
}

// Apply a RuleListProfile using PAC script
async function applyRuleListProfile(profile: RuleListProfile, name: string): Promise<void> {
  if (!options) {
    console.warn('No options loaded, cannot apply rule list profile');
    return;
  }

  try {
    const pacScript = generatePacScript(
      options as unknown as Record<string, Profile>,
      name,
      { includeComments: true }
    );

    console.log('Applying PAC script for rule list profile:', name);

    await chrome.proxy.settings.set({
      value: {
        mode: 'pac_script',
        pacScript: {
          data: pacScript,
        },
      },
      scope: 'regular',
    });
  } catch (e) {
    console.error('Failed to generate PAC script:', e);
  }
}

// Apply a PacProfile
async function applyPacProfile(profile: PacProfile): Promise<void> {
  if (profile.pacUrl) {
    // Use PAC URL directly
    console.log('Applying PAC URL:', profile.pacUrl);

    await chrome.proxy.settings.set({
      value: {
        mode: 'pac_script',
        pacScript: {
          url: profile.pacUrl,
        },
      },
      scope: 'regular',
    });
  } else if (profile.pacScript) {
    // Use inline PAC script
    console.log('Applying inline PAC script');

    await chrome.proxy.settings.set({
      value: {
        mode: 'pac_script',
        pacScript: {
          data: profile.pacScript,
        },
      },
      scope: 'regular',
    });
  } else {
    console.warn('PAC profile has no URL or script:', profile.name);
  }
}

/**
 * Get the current active profile
 */
function getCurrentProfile(): Profile | null {
  if (currentProfileName === 'direct') {
    return Profiles.builtinProfiles['+direct'];
  }
  if (currentProfileName === 'system') {
    return Profiles.builtinProfiles['+system'];
  }
  if (options) {
    return Profiles.byName(currentProfileName, options as unknown as Record<string, Profile>) || null;
  }
  return null;
}

/**
 * Match a URL against the current profile and get the result profile
 */
function matchUrlToProfile(url: string): { profile: Profile; resultProfile?: Profile } | null {
  const currentProfile = getCurrentProfile();
  if (!currentProfile) return null;

  // For non-inclusive profiles (DirectProfile, FixedProfile, SystemProfile),
  // the result is the profile itself
  if (!Profiles.isInclusive(currentProfile)) {
    return { profile: currentProfile };
  }

  // For inclusive profiles (SwitchProfile, RuleListProfile), match against rules
  try {
    const request = requestFromUrl(url);
    const match = Profiles.match(currentProfile, request);

    if (match) {
      // Get the result profile
      const resultProfile = Profiles.byName(
        match.profileName,
        options as unknown as Record<string, Profile>
      );
      return {
        profile: currentProfile,
        resultProfile: resultProfile || undefined,
      };
    }
  } catch (e) {
    console.debug('Failed to match URL:', e);
  }

  return { profile: currentProfile };
}

/**
 * Update the browser icon for a specific tab based on URL matching
 */
async function updateIconForTab(tabId: number, url: string): Promise<void> {
  const match = matchUrlToProfile(url);
  if (!match) return;

  const { profile, resultProfile } = match;

  // Get result color if there's a match to a different profile
  const resultColor = resultProfile && resultProfile.name !== profile.name
    ? resultProfile.color
    : undefined;

  await updateIconForProfile(profile, resultColor, tabId);
}

/**
 * Update icons for all tabs
 */
async function updateAllTabsIcon(): Promise<void> {
  const currentProfile = getCurrentProfile();
  if (!currentProfile) return;

  // Get all tabs
  const tabs = await getAllTabs();

  // Update icon for each tab
  for (const { tabId, url } of tabs) {
    if (isMatchableUrl(url)) {
      await updateIconForTab(tabId, url);
    }
  }

  // Also set the default icon (for new tabs, etc.)
  await updateIconForProfile(currentProfile);
}

// Update extension icon (replaces old badge system)
async function updateIcon(profileName: string): Promise<void> {
  // Update all tab icons
  await updateAllTabsIcon();
}

// Initialize
async function init(): Promise<void> {
  options = await loadOptions();
  
  // Load saved current profile
  const stored = await chrome.storage.local.get('_currentProfileName');
  currentProfileName = stored._currentProfileName || 'system';
  
  // Apply startup profile if configured
  const startupProfile = options['-startupProfileName'];
  if (startupProfile) {
    await applyProfile(startupProfile);
  } else {
    await applyProfile(currentProfileName);
  }

  // Initialize tab listeners for dynamic icon updates
  await initTabsListenerWithUpdate((tabId, url) => {
    updateIconForTab(tabId, url).catch((e) => {
      console.debug('Failed to update icon for tab:', e);
    });
  });
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ZeroOmega installed');
    init();
  } else if (details.reason === 'update') {
    console.log('ZeroOmega updated');
    init();
  }
});

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle async operations properly
  const handleMessage = async () => {
    try {
      switch (message.action) {
        case 'getOptions':
          if (!options) {
            options = await loadOptions();
          }
          return {
            options,
            currentProfileName,
          };
          
        case 'setOptions':
          if (message.options) {
            options = message.options;
            // Clear storage first to remove deleted profiles, then set new options
            await chrome.storage.local.clear();
            await chrome.storage.local.set(options);
            // Re-apply current profile with new settings
            await applyProfile(currentProfileName);
          }
          return { success: true };
          
        case 'applyProfile':
          await applyProfile(message.profileName);
          return { success: true };
          
        case 'importOptions':
          if (message.options) {
            await chrome.storage.local.clear();
            await chrome.storage.local.set(message.options);
            options = message.options;
          }
          return { success: true };
          
        case 'resetOptions':
          await chrome.storage.local.clear();
          options = getDefaultOptions();
          await chrome.storage.local.set(options);
          await applyProfile('system');
          return { success: true };
          
        default:
          return { error: 'Unknown action' };
      }
    } catch (e) {
      console.error('Message handler error:', e);
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };
  
  // Call async handler and send response
  handleMessage().then(sendResponse).catch((error) => {
    console.error('Message handler failed:', error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  });
  
  return true; // Keep message channel open for async response
});

// Initialize on startup
init();

export {};
