// Background service worker for ZeroOmega
import { Profiles, type Profile, type OmegaOptions } from '@anthropic-demo/onemega-pac';

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
      await chrome.proxy.settings.set({
        value: {
          mode: 'fixed_servers',
          rules: {
            singleProxy: {
              scheme: proxy.scheme || 'http',
              host: proxy.host,
              port: proxy.port || 8080,
            },
            bypassList: fixedProfile.bypassList || [],
          },
        },
        scope: 'regular',
      });
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
  (async () => {
    try {
      switch (message.action) {
        case 'getOptions':
          if (!options) {
            options = await loadOptions();
          }
          sendResponse({
            options,
            currentProfileName,
          });
          break;
          
        case 'setOptions':
          if (message.options) {
            options = message.options;
            await chrome.storage.local.set(options);
          }
          sendResponse({ success: true });
          break;
          
        case 'applyProfile':
          await applyProfile(message.profileName);
          sendResponse({ success: true });
          break;
          
        case 'importOptions':
          if (message.options) {
            await chrome.storage.local.clear();
            await chrome.storage.local.set(message.options);
            options = message.options;
          }
          sendResponse({ success: true });
          break;
          
        case 'resetOptions':
          await chrome.storage.local.clear();
          options = getDefaultOptions();
          await chrome.storage.local.set(options);
          await applyProfile('system');
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (e) {
      console.error('Message handler error:', e);
      sendResponse({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Initialize on startup
init();

export {};
