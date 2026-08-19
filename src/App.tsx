import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { OverviewDashboard } from './modules/dashboard/OverviewDashboard.js';
import { PeopleView } from './modules/people/PeopleView.js';
import { PlacesView } from './modules/places/PlacesView.js';
import { EventsView } from './modules/events/EventsView.js';
import { KnowledgeView } from './modules/knowledge/KnowledgeView.js';
import { BuildingsView } from './modules/buildings/BuildingsView.js';
import { RelationshipGraphView } from './modules/graph/RelationshipGraphView.js';
import { ChronologyTimelineView } from './modules/timeline/ChronologyTimelineView.js';
import { DatabaseSchemaExplorerView } from './modules/schemas/DatabaseSchemaExplorerView.js';
import { EntityDetailDrawer } from './components/shared/EntityDetailDrawer.js';
import { GlobalSearchModal } from './components/search/GlobalSearchModal.js';
import { UnifiedSettingsModal, SettingsTabId } from './components/config/UnifiedSettingsModal.js';
import { AuthManagerModal } from './components/auth/AuthManagerModal.js';
import { LoginView } from './components/auth/LoginView.js';
import { api } from './services/api.js';
import {
  User,
  Role,
  ModuleInfo,
  InstanceConfig,
  AuditLogItem,
  TechnicalExtension,
} from './types/index.js';
import { Layers } from 'lucide-react';

export function App() {
  // Global State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('dashboard');
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [config, setConfig] = useState<InstanceConfig | null>(null);
  const [mapsExtensionActive, setMapsExtensionActive] = useState<boolean>(true);
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  // Modals & Drawers State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('general');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick Create Trigger for Domain Views
  const [quickCreateType, setQuickCreateType] = useState<string | null>(null);

  // Fetch full system state
  const refreshSystemData = useCallback(async () => {
    try {
      const authRes = await api.auth.me();
      if (!authRes || !authRes.user) {
        setCurrentUser(null);
        setIsAuthChecking(false);
        return;
      }

      setCurrentUser(authRes.user);

      const [
        modulesRes,
        configRes,
        extList,
        auditLogs,
        metrics,
        peopleList,
        placesRes,
        eventsList,
        knowledgeList,
        buildingsList,
      ] = await Promise.all([
        api.core.getActiveModules(),
        api.core.getConfig(),
        api.extensions.list(),
        api.core.getAuditLog({ limit: 10 }),
        api.core.getSystemMetrics(),
        api.people.list(),
        api.places.list(),
        api.events.list(),
        api.knowledge.list(),
        api.buildings.list(),
      ]);

      setModules(modulesRes.active_modules);
      setConfig(configRes);

      const mapsExt = extList.find((e) => e.code === 'maps');
      setMapsExtensionActive(Boolean(mapsExt?.is_enabled));

      setRecentAuditLogs(auditLogs);
      setSystemMetrics(metrics);

      setEntityCounts({
        people: peopleList.length,
        places: placesRes.places.length,
        events: eventsList.length,
        knowledge: knowledgeList.length,
        buildings: buildingsList.length,
      });
    } catch {
      // Unauthenticated session
      setCurrentUser(null);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshSystemData();
  }, [refreshSystemData]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsAuthOpen(false);
        setSelectedEntityId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick create handler from dashboard
  const handleQuickCreate = (type: string) => {
    if (type === 'person') {
      setActiveModuleId('people');
    } else if (type === 'place') {
      setActiveModuleId('places');
    } else if (type === 'event') {
      setActiveModuleId('events');
    } else if (type === 'knowledge') {
      setActiveModuleId('knowledge');
    } else if (type === 'building') {
      setActiveModuleId('buildings');
    }
    setQuickCreateType(type);
  };

  const handleSelectEntityFromSearch = (id: string, moduleName: string) => {
    setSelectedEntityId(id);
    if (moduleName) {
      setActiveModuleId(moduleName);
    }
  };

  const openSettingsWithTab = (tab: SettingsTabId = 'general') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Layers className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white tracking-wide">LifeHub</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">Initializing secure session...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshSystemData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header with Consolidated Settings Gear */}
      <Header
        currentUser={currentUser}
        config={config}
        mapsExtensionActive={mapsExtensionActive}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => openSettingsWithTab('general')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeModuleId={activeModuleId}
          onSelectModule={(mod) => setActiveModuleId(mod)}
          modules={modules}
          entityCounts={entityCounts}
          mapsExtensionActive={mapsExtensionActive}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenConfig={() => openSettingsWithTab('general')}
          onOpenSettingsTab={(tab) => openSettingsWithTab(tab)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto">
            {activeModuleId === 'dashboard' && (
              <OverviewDashboard
                config={config}
                modules={modules}
                entityCounts={entityCounts}
                mapsExtensionActive={mapsExtensionActive}
                onNavigate={(mod) => setActiveModuleId(mod)}
                onOpenQuickCreate={handleQuickCreate}
                onOpenExtensions={() => openSettingsWithTab('extensions')}
                onOpenConfig={() => openSettingsWithTab('general')}
                onOpenSystemOps={() => openSettingsWithTab('system')}
                onOpenAuditLog={() => openSettingsWithTab('audit')}
                onOpenSearch={() => setIsSearchOpen(true)}
                recentAuditLogs={recentAuditLogs}
                systemMetrics={systemMetrics}
              />
            )}

            {activeModuleId === 'schemas' && (
              <DatabaseSchemaExplorerView
                onSelectEntity={(id, mod) => {
                  setSelectedEntityId(id);
                  if (mod) setActiveModuleId(mod);
                }}
              />
            )}

            {activeModuleId === 'graph' && (
              <RelationshipGraphView
                onSelectEntity={(id) => setSelectedEntityId(id)}
              />
            )}

            {activeModuleId === 'timeline' && (
              <ChronologyTimelineView
                onSelectEntity={(id) => setSelectedEntityId(id)}
              />
            )}

            {activeModuleId === 'people' && (
              <PeopleView
                onSelectEntity={(id) => setSelectedEntityId(id)}
                openCreateTrigger={quickCreateType === 'person'}
                onResetCreateTrigger={() => setQuickCreateType(null)}
              />
            )}

            {activeModuleId === 'places' && (
              <PlacesView
                onSelectEntity={(id) => setSelectedEntityId(id)}
                mapsExtensionActive={mapsExtensionActive}
                onOpenExtensions={() => openSettingsWithTab('extensions')}
                openCreateTrigger={quickCreateType === 'place'}
                onResetCreateTrigger={() => setQuickCreateType(null)}
              />
            )}

            {activeModuleId === 'events' && (
              <EventsView
                onSelectEntity={(id) => setSelectedEntityId(id)}
                openCreateTrigger={quickCreateType === 'event'}
                onResetCreateTrigger={() => setQuickCreateType(null)}
              />
            )}

            {activeModuleId === 'knowledge' && (
              <KnowledgeView
                onSelectEntity={(id) => setSelectedEntityId(id)}
                openCreateTrigger={quickCreateType === 'knowledge'}
                onResetCreateTrigger={() => setQuickCreateType(null)}
              />
            )}

            {activeModuleId === 'buildings' && (
              <BuildingsView
                onSelectEntity={(id) => setSelectedEntityId(id)}
                openCreateTrigger={quickCreateType === 'building'}
                onResetCreateTrigger={() => setQuickCreateType(null)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Universal Entity Detail Drawer */}
      <EntityDetailDrawer
        entityId={selectedEntityId}
        onClose={() => {
          setSelectedEntityId(null);
          refreshSystemData();
        }}
        onEntityClick={(id) => setSelectedEntityId(id)}
      />

      {/* Global Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectEntity={handleSelectEntityFromSearch}
      />

      {/* Unified Settings Hub Modal (Gear Icon) */}
      <UnifiedSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsInitialTab}
        onConfigSaved={refreshSystemData}
      />

      {/* Multi-User & Role Governance */}
      <AuthManagerModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserSwitched={(user) => {
          setCurrentUser(user);
          refreshSystemData();
        }}
        onLogout={() => {
          setCurrentUser(null);
        }}
      />
    </div>
  );
}

export default App;
