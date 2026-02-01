<script lang="ts">
  import { onMount } from 'svelte';
  import Layout from './Layout.svelte';
  import ProfileList from './pages/ProfileList.svelte';
  import General from './pages/General.svelte';
  import About from './pages/About.svelte';
  import ImportExport from './pages/ImportExport.svelte';
  import NewProfile from './pages/NewProfile.svelte';
  import ProfileFixed from './pages/ProfileFixed.svelte';
  import ProfileSwitch from './pages/ProfileSwitch.svelte';
  import optionsStore from '$lib/stores/options.svelte';
  import i18nStore from '$lib/i18n.svelte';
  import type { Profile, FixedProfile, SwitchProfile } from '@anthropic-demo/switchyalpha-pac';

  let currentPage = $state('profiles');
  let editingProfile = $state<Profile | null>(null);

  onMount(async () => {
    await Promise.all([
      optionsStore.init(),
      i18nStore.init()
    ]);
  });

  function handleNavigate(page: string) {
    // Check if navigating to a profile
    if (page.startsWith('profile:')) {
      const profileName = page.slice(8);
      const profile = optionsStore.getProfile(profileName);
      if (profile) {
        editingProfile = profile;
        currentPage = `edit-${profile.profileType}`;
        return;
      }
    }
    currentPage = page;
    editingProfile = null;
  }

  function handleEditProfile(profile: Profile) {
    editingProfile = profile;
    currentPage = `edit-${profile.profileType}`;
  }

  function handleCreateProfile() {
    currentPage = 'new-profile';
  }

  function handleBackToList() {
    currentPage = 'profiles';
    editingProfile = null;
  }

  async function handleNewProfileSave(data: { name: string; profileType: string }) {
    let newProfile: Profile;
    
    if (data.profileType === 'FixedProfile') {
      newProfile = {
        name: data.name,
        profileType: 'FixedProfile',
        bypassList: [{ conditionType: 'BypassCondition', pattern: '<local>' }],
        color: '#99ccee',
        revision: Date.now().toString(16)
      } as FixedProfile;
    } else if (data.profileType === 'SwitchProfile') {
      newProfile = {
        name: data.name,
        profileType: 'SwitchProfile',
        defaultProfileName: 'direct',
        rules: [],
        color: '#99dd99',
        revision: Date.now().toString(16)
      } as SwitchProfile;
    } else {
      // Generic profile for PAC and RuleList types
      newProfile = {
        name: data.name,
        profileType: data.profileType as Profile['profileType'],
        color: '#ddbb99',
        revision: Date.now().toString(16)
      } as Profile;
    }
    
    await optionsStore.addProfile(newProfile);
    editingProfile = newProfile;
    currentPage = `edit-${data.profileType}`;
  }
</script>

<Layout {currentPage} onnavigate={handleNavigate}>
  {#if optionsStore.isLoading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if currentPage === 'profiles'}
    <ProfileList onedit={handleEditProfile} oncreate={handleCreateProfile} />
  {:else if currentPage === 'general'}
    <General />
  {:else if currentPage === 'about'}
    <About />
  {:else if currentPage === 'import-export'}
    <ImportExport />
  {:else if currentPage === 'new-profile'}
    <NewProfile onSave={handleNewProfileSave} onCancel={handleBackToList} />
  {:else if currentPage === 'edit-FixedProfile' && editingProfile}
    <ProfileFixed profile={editingProfile} onback={handleBackToList} />
  {:else if currentPage === 'edit-SwitchProfile' && editingProfile}
    <ProfileSwitch profile={editingProfile} onback={handleBackToList} />
  {:else if currentPage.startsWith('edit-') && editingProfile}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Edit: {editingProfile.name}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Profile editor for {editingProfile.profileType} coming soon.
      </p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <p class="text-gray-600 dark:text-gray-400">Page not found: {currentPage}</p>
    </div>
  {/if}
</Layout>
