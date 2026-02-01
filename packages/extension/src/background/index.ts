// Background service worker for ZeroOmega
import { Profiles, type Profile, type OmegaOptions } from '@anthropic-demo/switchyalpha-pac';

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
  const profile = name === 'direct' || name === 'system'
    ? null
    : options ? Profiles.byName(name, options as unknown as Record<string, Profile>) : null;
  
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
    const fixedProfile = profile as any;
    const proxy = fixedProfile.fallbackProxy;
    
    if (proxy?.host) {
      // Convert bypassList from BypassCondition objects to strings
      const bypassConditions = fixedProfile.bypassList || [];
      const bypassList: string[] = bypassConditions
        .map((c: any) => c.pattern || c)
        .filter((p: any) => typeof p === 'string' && p.length > 0);
      
      console.log('Applying proxy:', {
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
      console.warn('Fixed profile has no fallbackProxy configured:', name);
    }
  }
  
  // Update badge
  updateBadge(name);
}

// Update extension badge
function updateBadge(profileName: string): void {
  const text = profileName === 'direct' ? 'D' 
    : profileName === 'system' ? 'S'
    : profileName.charAt(0).toUpperCase();
  
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#4A90D9' });
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
