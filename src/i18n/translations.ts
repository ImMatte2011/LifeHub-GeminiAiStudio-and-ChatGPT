export type Language = 'en' | 'it';

export interface TranslationDictionary {
  // Navigation & Common
  common: {
    dashboard: string;
    people: string;
    places: string;
    events: string;
    knowledge: string;
    buildings: string;
    schemas: string;
    graph: string;
    timeline: string;
    search: string;
    settings: string;
    extensions: string;
    theme: string;
    backup: string;
    auditLog: string;
    systemOps: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    apply: string;
    loading: string;
    success: string;
    error: string;
    active: string;
    disabled: string;
    enabled: string;
    yes: string;
    no: string;
    actions: string;
    view: string;
    details: string;
    filter: string;
    all: string;
    total: string;
    records: string;
    tables: string;
    schemasCount: string;
    refresh: string;
    language: string;
    italian: string;
    english: string;
    selectLanguage: string;
  };
  // Header
  header: {
    searchPlaceholder: string;
    quickSearchShortcut: string;
    modularEngine: string;
    extensionsTooltip: string;
    paletteTooltip: string;
    backupTooltip: string;
    configTooltip: string;
    auditTooltip: string;
    telemetryTooltip: string;
    profileTooltip: string;
  };
  // Sidebar
  sidebar: {
    domainModules: string;
    crossViews: string;
    systemSettings: string;
    backupExport: string;
    quickOverview: string;
    multiDbViewer: string;
    relationshipNetwork: string;
    activityFeed: string;
    instanceSpecs: string;
    hardwareHost: string;
    engineStatus: string;
    activeCount: string;
    overview: string;
    dbAndSchemas: string;
    entityGraph: string;
    chronology: string;
    people: string;
    places: string;
    events: string;
    knowledge: string;
    buildings: string;
    fallbackMaps: string;
    decoupledCore: string;
    decoupledDesc: string;
    configureInstance: string;
  };
  // Settings / Instance Config Modal
  configModal: {
    title: string;
    yamlFile: string;
    subtitle: string;
    visualTab: string;
    yamlTab: string;
    presets: string;
    instanceIdentity: string;
    instanceName: string;
    hostEnv: string;
    instanceDesc: string;
    languagePreference: string;
    languageDesc: string;
    activeLanguage: string;
    domainModules: string;
    activeModulesCount: string;
    requiresExt: string;
    techExtensions: string;
    decoupledInfra: string;
    systemGovernance: string;
    multiUserMode: string;
    multiUserDesc: string;
    defaultRole: string;
    memberRole: string;
    editorRole: string;
    adminRole: string;
    openRegistration: string;
    openRegDesc: string;
    yamlSource: string;
    copyYaml: string;
    copied: string;
    saveChanges: string;
    saving: string;
    configSavedSuccess: string;
  };
  // Unified Settings Hub
  settingsModal: {
    title: string;
    subtitle: string;
    tabGeneral: string;
    tabDatabase: string;
    tabBackup: string;
    tabLanguage: string;
    tabTheme: string;
    tabExtensions: string;
    tabAudit: string;
    tabSystem: string;
    dbEngineTitle: string;
    dbEngineDesc: string;
    cloudSqlOption: string;
    cloudSqlDesc: string;
    cloudSqlActiveBadge: string;
    localDbOption: string;
    localDbDesc: string;
    localDbActiveBadge: string;
    localFilePath: string;
    localFilePathHelp: string;
    autoSyncLocal: string;
    autoSyncDesc: string;
    switchEngineSuccess: string;
    activeDbInstance: string;
    cloudRegion: string;
    connectionStatus: string;
    connected: string;
    ready: string;
    exportLocalDb: string;
    importLocalDb: string;
  };
  // Backup & Export Panel
  backupPanel: {
    title: string;
    subtitle: string;
    fullBackupTitle: string;
    fullBackupDesc: string;
    downloadFullJson: string;
    exportFormatModular: string;
    exportPeopleVcf: string;
    exportPlacesGeoJson: string;
    exportEventsIcs: string;
    exportKnowledgeJson: string;
    importRestoreTitle: string;
    importRestoreDesc: string;
    selectFileToRestore: string;
    restoreSuccess: string;
    restoreError: string;
    dragDropFile: string;
    snapshotHistory: string;
    createManualSnapshot: string;
    snapshotCreated: string;
  };
  // Database & Schemas Explorer
  schemasExplorer: {
    title: string;
    subtitle: string;
    activeDatabase: string;
    switchDatabase: string;
    createNewDb: string;
    dualViewToggle: string;
    singleView: string;
    splitView: string;
    splitViewDesc: string;
    tableColumns: string;
    liveRecords: string;
    relationships: string;
    ddlSql: string;
    searchSchemas: string;
    selectSchemaPrompt: string;
    selectSchemaLeft: string;
    selectSchemaRight: string;
    noRecordsFound: string;
    totalColumns: string;
    foreignKeys: string;
    primaryKey: string;
    nullable: string;
    defaultValue: string;
    dataType: string;
    columnName: string;
    copySql: string;
    sqlCopied: string;
    erArchitecture: string;
    erSubtitle: string;
  };
  // Extensions
  extensionsModal: {
    title: string;
    subtitle: string;
    allExtensions: string;
    activeOnly: string;
    filterSearch: string;
    activate: string;
    deactivate: string;
    dependencyNotice: string;
  };
  // Theme Modal
  themeModal: {
    title: string;
    subtitle: string;
    selectPalette: string;
    customRadius: string;
    preview: string;
    applyTheme: string;
  };
  // Dashboard Quick Launcher Hub
  dashboardHub: {
    welcome: string;
    quickAccessSubtitle: string;
    searchPrompt: string;
    totalEntities: string;
    categoryDomains: string;
    categoryCrossViews: string;
    categorySystem: string;
    peopleTitle: string;
    peopleDesc: string;
    placesTitle: string;
    placesDesc: string;
    eventsTitle: string;
    eventsDesc: string;
    knowledgeTitle: string;
    knowledgeDesc: string;
    buildingsTitle: string;
    buildingsDesc: string;
    graphTitle: string;
    graphDesc: string;
    timelineTitle: string;
    timelineDesc: string;
    schemasTitle: string;
    schemasDesc: string;
    configTitle: string;
    configDesc: string;
    extensionsTitle: string;
    extensionsDesc: string;
    systemOpsTitle: string;
    systemOpsDesc: string;
    auditTitle: string;
    auditDesc: string;
  };
  peopleView?: {
    title: string;
    subtitle: string;
    addPerson: string;
    searchPlaceholder: string;
  };
  placesView?: {
    title: string;
    subtitle: string;
    addPlace: string;
    searchPlaceholder: string;
  };
  eventsView?: {
    title: string;
    subtitle: string;
    addEvent: string;
    searchPlaceholder: string;
  };
  buildingsView?: {
    title: string;
    subtitle: string;
    addBuilding: string;
    searchPlaceholder: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    common: {
      dashboard: 'Overview',
      people: 'People & Contacts',
      places: 'Places & Maps',
      events: 'Events & Chronology',
      knowledge: 'Knowledge & Meta',
      buildings: 'Facilities & Buildings',
      schemas: 'DB & Schemas',
      graph: 'Entity Graph',
      timeline: 'Chronology',
      search: 'Search',
      settings: 'Settings & Config',
      extensions: 'Extensions',
      theme: 'Theme Palette',
      backup: 'Backup & Export',
      auditLog: 'Audit Log',
      systemOps: 'System & Hardware',
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      close: 'Close',
      apply: 'Apply',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      active: 'Active',
      disabled: 'Disabled',
      enabled: 'Enabled',
      yes: 'Yes',
      no: 'No',
      actions: 'Actions',
      view: 'View',
      details: 'Details',
      filter: 'Filter',
      all: 'All',
      total: 'Total',
      records: 'records',
      tables: 'tables',
      schemasCount: 'schemas',
      refresh: 'Refresh',
      language: 'Language / Lingua',
      italian: 'Italiano (Italian)',
      english: 'English (Inglese)',
      selectLanguage: 'Select Language',
    },
    header: {
      searchPlaceholder: 'Search entities, tags, places, JSONB schema...',
      quickSearchShortcut: '⌘K',
      modularEngine: 'Modular Multi-Domain Engine • Raspberry Pi 4',
      extensionsTooltip: 'Extension System Manager',
      paletteTooltip: 'Customize Color Palette & Theme',
      backupTooltip: 'Database Backup & JSON/SQL Export',
      configTooltip: 'Instance Configuration (instance.yaml)',
      auditTooltip: 'System Audit Log & Traceability',
      telemetryTooltip: 'Hardware & Database Telemetry',
      profileTooltip: 'Multi-User & Role Governance',
    },
    sidebar: {
      domainModules: 'Domain Modules',
      crossViews: 'Cross-Domain Views',
      systemSettings: 'System & Control Center',
      backupExport: 'Backup & Export',
      quickOverview: 'Instance Telemetry & Hub',
      multiDbViewer: 'Multi-Database & Interactive Schema Viewer',
      relationshipNetwork: 'Universal Relationship Network',
      activityFeed: 'Unified Activity Feed',
      instanceSpecs: 'Instance Architecture',
      hardwareHost: 'Raspberry Pi 4 • 8GB',
      engineStatus: 'Engine Online • Low Overhead',
      activeCount: 'active',
      overview: 'Overview',
      dbAndSchemas: 'DB & Schemas',
      entityGraph: 'Entity Graph',
      chronology: 'Chronology',
      people: 'People & Contacts',
      places: 'Places & Maps',
      events: 'Events & Chronology',
      knowledge: 'Knowledge & Meta',
      buildings: 'Facilities & Buildings',
      fallbackMaps: 'Fallback mode (maps off)',
      decoupledCore: 'Decoupled Core',
      decoupledDesc: 'Core never imports domain modules or extensions. Domains plug into universal core.entities.',
      configureInstance: 'Configure Instance',
    },
    configModal: {
      title: 'Instance Configuration',
      yamlFile: 'instance.yaml',
      subtitle: 'Declarative specification for active domain modules, optional extensions, language, and host environment parameters.',
      visualTab: 'Visual Interface',
      yamlTab: 'Raw YAML',
      presets: 'Presets:',
      instanceIdentity: 'Instance Identity & Environment',
      instanceName: 'Instance Name',
      hostEnv: 'Host Hardware / Environment',
      instanceDesc: 'Instance Description & Tagline',
      languagePreference: 'Interface Language / Lingua dell\'Interfaccia',
      languageDesc: 'Choose whether LifeHub is displayed in English or Italian. Changes apply immediately.',
      activeLanguage: 'Active Language',
      domainModules: 'Domain Modules Activation',
      activeModulesCount: 'active',
      requiresExt: 'Requires:',
      techExtensions: 'Technical Extensions State',
      decoupledInfra: 'Decoupled Infrastructure',
      systemGovernance: 'System & Multi-User Governance',
      multiUserMode: 'Multi-User Mode',
      multiUserDesc: 'Allow multiple user logins',
      defaultRole: 'Default User Role',
      memberRole: 'Member (Read & Create)',
      editorRole: 'Editor (Full Edit)',
      adminRole: 'Administrator (System Ops)',
      openRegistration: 'Open Registration',
      openRegDesc: 'Self-sign up allowed',
      yamlSource: 'YAML Specification Source',
      copyYaml: 'Copy YAML',
      copied: 'Copied!',
      saveChanges: 'Save & Apply Configuration',
      saving: 'Saving...',
      configSavedSuccess: 'Instance configuration applied and saved successfully!',
    },
    settingsModal: {
      title: 'LifeHub Control Center & Settings',
      subtitle: 'Manage system architecture, database storage engines (Cloud SQL vs Local File), language, theme, extensions, and audit logs.',
      tabGeneral: 'General & YAML',
      tabDatabase: 'Database & Storage',
      tabBackup: 'Backup & Export',
      tabLanguage: 'Language & i18n',
      tabTheme: 'Theme & Palette',
      tabExtensions: 'Extensions',
      tabAudit: 'Audit Log',
      tabSystem: 'Hardware & Telemetry',
      dbEngineTitle: 'Active Storage & Database Engine',
      dbEngineDesc: 'Select whether LifeHub stores information in Google Cloud SQL (PostgreSQL) or a local standalone database file on your PC or Raspberry Pi.',
      cloudSqlOption: 'Google Cloud SQL (PostgreSQL)',
      cloudSqlDesc: 'Fully managed relational database cluster with Drizzle ORM, multi-schema isolation, and high availability.',
      cloudSqlActiveBadge: 'Cloud SQL Active',
      localDbOption: 'Local Database File (PC / Raspberry Pi / SQLite)',
      localDbDesc: 'Standalone file-based storage (.sqlite / .db). Perfect for local Raspberry Pi nodes, air-gapped homelabs, and zero-cloud deployments.',
      localDbActiveBadge: 'Local Storage Active',
      localFilePath: 'Local Database File Path',
      localFilePathHelp: 'Path on the host machine or Raspberry Pi filesystem (e.g., /var/lib/lifehub/data.sqlite or ./data/lifehub.sqlite)',
      autoSyncLocal: 'Automatic Disk Write Sync',
      autoSyncDesc: 'Immediately flush changes to local disk storage on write.',
      switchEngineSuccess: 'Storage engine switched successfully!',
      activeDbInstance: 'Active Database Catalog',
      cloudRegion: 'Cloud Region: europe-west2 (London)',
      connectionStatus: 'Engine Connection Status',
      connected: 'Connected',
      ready: 'Ready',
      exportLocalDb: 'Export Local DB Snapshot',
      importLocalDb: 'Import Database File',
    },
    backupPanel: {
      title: 'Database Backup & Data Portability',
      subtitle: 'Create full database snapshots, export individual domain modules into standard formats (JSON, vCard, iCal, GeoJSON), or restore from backup files.',
      fullBackupTitle: 'Full System Snapshot',
      fullBackupDesc: 'Export all tables, schema structures, entities, and WAL logs into a single JSON or SQLite archive.',
      downloadFullJson: 'Download Full JSON Backup',
      exportFormatModular: 'Modular Data Export',
      exportPeopleVcf: 'Contacts (vCard .vcf)',
      exportPlacesGeoJson: 'Places (GeoJSON)',
      exportEventsIcs: 'Calendar (iCalendar .ics)',
      exportKnowledgeJson: 'Knowledge Base (JSON)',
      importRestoreTitle: 'Import & Restore Data',
      importRestoreDesc: 'Upload a previously exported LifeHub backup file (.json) to restore entities and configuration.',
      selectFileToRestore: 'Select Backup File',
      restoreSuccess: 'Data restored successfully into database!',
      restoreError: 'Failed to parse and restore backup file',
      dragDropFile: 'Drag and drop JSON backup file here, or click to browse',
      snapshotHistory: 'Snapshot History & Recovery Points',
      createManualSnapshot: 'Create Snapshot Point',
      snapshotCreated: 'Snapshot created and stored locally',
    },
    schemasExplorer: {
      title: 'Multi-Database & Schema Explorer',
      subtitle: 'Interactive inspection of PostgreSQL schemas, tables, constraints, live records, foreign keys, and 50/50 dual split-screen comparison.',
      activeDatabase: 'Active Database',
      switchDatabase: 'Switch Database',
      createNewDb: 'New Database',
      dualViewToggle: '50/50 Split View',
      singleView: 'Single View',
      splitView: 'Dual Split Screen',
      splitViewDesc: 'Compare two schemas side by side',
      tableColumns: 'Columns & Types',
      liveRecords: 'Live Records',
      relationships: 'Relationships & FK',
      ddlSql: 'PostgreSQL DDL SQL',
      searchSchemas: 'Search tables, schemas, columns...',
      selectSchemaPrompt: 'Select a schema or table to inspect structure and data.',
      selectSchemaLeft: 'Select Left Schema',
      selectSchemaRight: 'Select Right Schema',
      noRecordsFound: 'No records found in this table.',
      totalColumns: 'Columns',
      foreignKeys: 'Foreign Keys',
      primaryKey: 'Primary Key',
      nullable: 'Nullable',
      defaultValue: 'Default',
      dataType: 'Data Type',
      columnName: 'Column Name',
      copySql: 'Copy SQL',
      sqlCopied: 'SQL Copied!',
      erArchitecture: 'Architectural Domain Map (ER Topology)',
      erSubtitle: 'Master core.entities hub connecting all modular domains and shared services.',
    },
    extensionsModal: {
      title: 'Technical Extension System',
      subtitle: 'Manage decoupled infrastructure extensions (PostGIS, Leaflet, Trigram Search, Graph).',
      allExtensions: 'All Extensions',
      activeOnly: 'Active Only',
      filterSearch: 'Filter extensions...',
      activate: 'Activate',
      deactivate: 'Deactivate',
      dependencyNotice: 'Required by active domain modules.',
    },
    themeModal: {
      title: 'Visual Theme Customizer',
      subtitle: 'Select accent color palettes and border-radius styles.',
      selectPalette: 'Color Palettes',
      customRadius: 'Border Radius',
      preview: 'Live Preview',
      applyTheme: 'Save Theme',
    },
    peopleView: {
      title: 'People & Address Book',
      subtitle: 'Registry of contacts, organizations, and linked entities.',
      addPerson: 'Add Person',
      searchPlaceholder: 'Search people by name, company, email or notes...',
    },
    placesView: {
      title: 'Places & Geo Registry',
      subtitle: 'Geographical nodes, spatial metadata, and interactive map.',
      addPlace: 'Add Place',
      searchPlaceholder: 'Search places by name, category, address or coords...',
    },
    eventsView: {
      title: 'Events & Temporal Calendar',
      subtitle: 'Temporal timeline, participants, places, and scheduling.',
      addEvent: 'New Event',
      searchPlaceholder: 'Search by title, description or participants...',
    },
    buildingsView: {
      title: 'Buildings & Real Estate Assets',
      subtitle: 'Real estate assets, facilities, floors, and assigned managers.',
      addBuilding: 'Add Building',
      searchPlaceholder: 'Search building by name, code, or type...',
    },
    dashboardHub: {
      welcome: 'LifeHub Quick Launcher',
      quickAccessSubtitle: 'Fast direct navigation to all modules, cross-entity views, and system tools.',
      searchPrompt: 'Search entities, tags, places...',
      totalEntities: 'Total Indexed Entities',
      categoryDomains: 'Personal & Content Modules',
      categoryCrossViews: 'Cross-Domain & Relational Views',
      categorySystem: 'Administration & System Tools',
      peopleTitle: 'People & Contacts',
      peopleDesc: 'Address book, relationships, companies, and roles',
      placesTitle: 'Places & Maps',
      placesDesc: 'Geographic nodes, coordinates, maps, and POIs',
      eventsTitle: 'Events & Calendar',
      eventsDesc: 'Meetings, deadlines, participants, and schedule',
      knowledgeTitle: 'Knowledge & Catalogs',
      knowledgeDesc: 'Books, hardware, software, recipes, and dynamic schemas',
      buildingsTitle: 'Facilities & Buildings',
      buildingsDesc: 'Real estate assets, floors, facilities, and managers',
      graphTitle: 'Entity Relationship Graph',
      graphDesc: 'Interactive visual network of connected entities',
      timelineTitle: 'Unified Chronology',
      timelineDesc: 'Chronological timeline of all historical and scheduled events',
      schemasTitle: 'Database & Schema Explorer',
      schemasDesc: 'Explore physical database tables, columns, indexes, and live records',
      configTitle: 'Instance Configuration',
      configDesc: 'Manage instance.yaml, roles, permissions, and identity',
      extensionsTitle: 'Technical Extensions',
      extensionsDesc: 'Manage PostGIS, pg_trgm, Timescale, and pgvector plugins',
      systemOpsTitle: 'Telemetry & Host Hardware',
      systemOpsDesc: 'Raspberry Pi 4 CPU temp, memory usage, and SSD storage',
      auditTitle: 'Audit Log & Security',
      auditDesc: 'Complete traceable audit trail, logins, and WAL security logs',
    },
  },
  it: {
    common: {
      dashboard: 'Panoramica',
      people: 'Persone e Contatti',
      places: 'Luoghi e Mappe',
      events: 'Eventi e Cronologia',
      knowledge: 'Conoscenza e Meta',
      buildings: 'Edifici e Strutture',
      schemas: 'DB e Schemi',
      graph: 'Grafo Relazioni',
      timeline: 'Cronologia',
      search: 'Cerca',
      settings: 'Impostazioni e Config',
      extensions: 'Estensioni',
      theme: 'Tema e Palette',
      backup: 'Backup ed Esportazione',
      auditLog: 'Registro Audit',
      systemOps: 'Sistema e Hardware',
      save: 'Salva Modifiche',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      create: 'Crea',
      close: 'Chiudi',
      apply: 'Applica',
      loading: 'Caricamento in corso...',
      success: 'Operazione riuscita',
      error: 'Errore',
      active: 'Attivo',
      disabled: 'Disabilitato',
      enabled: 'Abilitato',
      yes: 'Sì',
      no: 'No',
      actions: 'Azioni',
      view: 'Visualizza',
      details: 'Dettagli',
      filter: 'Filtra',
      all: 'Tutti',
      total: 'Totale',
      records: 'record',
      tables: 'tabelle',
      schemasCount: 'schemi',
      refresh: 'Aggiorna',
      language: 'Lingua / Language',
      italian: 'Italiano (Italian)',
      english: 'English (Inglese)',
      selectLanguage: 'Seleziona Lingua',
    },
    header: {
      searchPlaceholder: 'Cerca entità, tag, luoghi, proprietà JSONB...',
      quickSearchShortcut: '⌘K',
      modularEngine: 'Motore Modulare Multi-Dominio • Raspberry Pi 4',
      extensionsTooltip: 'Gestore Estensioni Tecniche',
      paletteTooltip: 'Personalizza Palette Colori e Tema',
      backupTooltip: 'Backup Database ed Export JSON/SQL',
      configTooltip: 'Configurazione Istanza (instance.yaml)',
      auditTooltip: 'Registro di Audit e Tracciabilità',
      telemetryTooltip: 'Telemetria Hardware e Database',
      profileTooltip: 'Gestione Utenti e Ruoli',
    },
    sidebar: {
      domainModules: 'Moduli Personali',
      crossViews: 'Viste Trasversali',
      systemSettings: 'Impostazioni & Sistema',
      backupExport: 'Backup ed Esportazione',
      quickOverview: 'Telemetria Istanza e Hub',
      multiDbViewer: 'Multi-Database e Visualizzatore Schemi',
      relationshipNetwork: 'Rete Universale delle Relazioni',
      activityFeed: 'Feed Cronologico Unificato',
      instanceSpecs: 'Architettura Istanza',
      hardwareHost: 'Raspberry Pi 4 • 8GB',
      engineStatus: 'Motore Online • Risorse Ottimizzate',
      activeCount: 'attivi',
      overview: 'Panoramica',
      dbAndSchemas: 'DB e Schemi',
      entityGraph: 'Grafo Relazioni',
      chronology: 'Cronologia',
      people: 'Persone e Contatti',
      places: 'Luoghi e Mappe',
      events: 'Eventi e Cronologia',
      knowledge: 'Conoscenza e Meta',
      buildings: 'Edifici e Strutture',
      fallbackMaps: 'Modalità di ripiego (mappe disattivate)',
      decoupledCore: 'Core Disaccoppiato',
      decoupledDesc: 'Il Core non importa mai moduli di dominio o estensioni. I domini si agganciano a core.entities universale.',
      configureInstance: 'Configura Istanza',
    },
    configModal: {
      title: 'Configurazione dell\'Istanza',
      yamlFile: 'instance.yaml',
      subtitle: 'Specifica dichiarativa per i moduli di dominio attivi, estensioni opzionali, lingua e parametri dell\'ambiente host.',
      visualTab: 'Interfaccia Visuale',
      yamlTab: 'YAML Diretto',
      presets: 'Preimpostazioni:',
      instanceIdentity: 'Identità Istanza ed Ambiente',
      instanceName: 'Nome Istanza',
      hostEnv: 'Hardware Host / Ambiente',
      instanceDesc: 'Descrizione e Slogan Istanza',
      languagePreference: 'Lingua dell\'Interfaccia (Language)',
      languageDesc: 'Scegli la lingua in cui visualizzare l\'applicazione (Italiano o Inglese). Le modifiche hanno effetto immediato.',
      activeLanguage: 'Lingua Attiva',
      domainModules: 'Attivazione Moduli di Dominio',
      activeModulesCount: 'attivi',
      requiresExt: 'Richiede:',
      techExtensions: 'Stato Estensioni Tecniche',
      decoupledInfra: 'Infrastruttura Disaccoppiata',
      systemGovernance: 'Sistema e Governance Multi-Utente',
      multiUserMode: 'Modalità Multi-Utente',
      multiUserDesc: 'Consenti l\'accesso a più utenti simultanei',
      defaultRole: 'Ruolo Utente Predefinito',
      memberRole: 'Membro (Lettura e Creazione)',
      editorRole: 'Editor (Modifica Completa)',
      adminRole: 'Amministratore (Operazioni di Sistema)',
      openRegistration: 'Registrazione Aperta',
      openRegDesc: 'Consenti auto-registrazione ai nuovi utenti',
      yamlSource: 'Sorgente Specifica YAML',
      copyYaml: 'Copia YAML',
      copied: 'Copiato!',
      saveChanges: 'Salva ed Applica Configurazione',
      saving: 'Salvataggio in corso...',
      configSavedSuccess: 'Configurazione dell\'istanza applicata e salvata con successo!',
    },
    settingsModal: {
      title: 'Pannello di Controllo e Impostazioni',
      subtitle: 'Gestisci l\'architettura dell\'istanza, la scelta del database (Cloud SQL vs File Locale/SQLite), lingua, tema grafico, estensioni e log di sistema.',
      tabGeneral: 'Generale & YAML',
      tabDatabase: 'Database & Storage',
      tabBackup: 'Backup & Esportazione',
      tabLanguage: 'Lingua & Traduzione',
      tabTheme: 'Tema e Palette',
      tabExtensions: 'Estensioni',
      tabAudit: 'Registro Audit',
      tabSystem: 'Hardware & Telemetria',
      dbEngineTitle: 'Motore di Storage e Database Attivo',
      dbEngineDesc: 'Scegli se LifeHub deve salvare le informazioni su Google Cloud SQL (PostgreSQL gestito) o direttamente su file locale (.sqlite / .db) sul tuo PC o Raspberry Pi.',
      cloudSqlOption: 'Google Cloud SQL (PostgreSQL)',
      cloudSqlDesc: 'Cluster di database relazionale ad alta disponibilità con Drizzle ORM, isolamento multi-schema ed estensioni PostGIS/pg_trgm.',
      cloudSqlActiveBadge: 'Cloud SQL Attivo',
      localDbOption: 'Database Locale (File PC / Raspberry Pi / SQLite)',
      localDbDesc: 'Archiviazione standalone su file locale (.sqlite). Ideale per Raspberry Pi standalone, homelab offline e configurazioni senza cloud.',
      localDbActiveBadge: 'Storage Locale Attivo',
      localFilePath: 'Percorso File Database Locale',
      localFilePathHelp: 'Percorso sul file system dell\'host o Raspberry Pi (es. /var/lib/lifehub/data.sqlite oppure ./data/lifehub.sqlite)',
      autoSyncLocal: 'Sincronizzazione Automatica su Disco',
      autoSyncDesc: 'Scrive immediatamente ogni modifica sul file di database locale.',
      switchEngineSuccess: 'Motore di storage modificato con successo!',
      activeDbInstance: 'Catalogo Database Attivo',
      cloudRegion: 'Regione Cloud: europe-west2 (Londra)',
      connectionStatus: 'Stato Connessione Motore',
      connected: 'Connesso',
      ready: 'Pronto',
      exportLocalDb: 'Esporta Snapshot DB Locale',
      importLocalDb: 'Importa File Database',
    },
    backupPanel: {
      title: 'Backup Database e Portabilità Dati',
      subtitle: 'Crea snapshot completi del database, esporta singoli moduli in formati aperti standard (JSON, vCard, iCal, GeoJSON) o ripristina da file di backup.',
      fullBackupTitle: 'Snapshot Completo del Sistema',
      fullBackupDesc: 'Esporta tutte le tabelle, strutture di schema, entità e registri WAL in un unico file JSON o SQLite.',
      downloadFullJson: 'Scarica Backup Completo JSON',
      exportFormatModular: 'Esportazione Modulare Dati',
      exportPeopleVcf: 'Contatti (vCard .vcf)',
      exportPlacesGeoJson: 'Luoghi (GeoJSON)',
      exportEventsIcs: 'Calendario (iCalendar .ics)',
      exportKnowledgeJson: 'Base di Conoscenza (JSON)',
      importRestoreTitle: 'Importazione e Ripristino Dati',
      importRestoreDesc: 'Carica un file di backup LifeHub precedentemente esportato (.json) per ripristinare le entità e la configurazione.',
      selectFileToRestore: 'Seleziona File di Backup',
      restoreSuccess: 'Dati ripristinati con successo nel database!',
      restoreError: 'Impossibile leggere o ripristinare il file di backup',
      dragDropFile: 'Trascina qui il file di backup JSON o fai clic per selezionarlo',
      snapshotHistory: 'Cronologia Snapshot e Punti di Ripristino',
      createManualSnapshot: 'Crea Punto di Snapshot',
      snapshotCreated: 'Snapshot creato e archiviato localmente',
    },
    schemasExplorer: {
      title: 'Multi-Database & Schema Explorer',
      subtitle: 'Ispezione interattiva degli schemi PostgreSQL, tabelle, vincoli, record reali, chiavi esterne e visualizzazione divisa a metà 50/50.',
      activeDatabase: 'Database Attivo',
      switchDatabase: 'Cambia Database',
      createNewDb: 'Nuovo Database',
      dualViewToggle: 'Schermo Diviso 50/50',
      singleView: 'Vista Singola',
      splitView: 'Vista Divisa 50/50',
      splitViewDesc: 'Confronta due schemi fianco a fianco',
      tableColumns: 'Colonne e Tipi',
      liveRecords: 'Dati Reali',
      relationships: 'Relazioni e FK',
      ddlSql: 'Script DDL PostgreSQL',
      searchSchemas: 'Cerca tabelle, schemi, colonne...',
      selectSchemaPrompt: 'Seleziona uno schema o una tabella per ispezionarne struttura e dati.',
      selectSchemaLeft: 'Seleziona Schema Sinistro',
      selectSchemaRight: 'Seleziona Schema Destro',
      noRecordsFound: 'Nessun record presente in questa tabella.',
      totalColumns: 'Colonne',
      foreignKeys: 'Chiavi Esterne',
      primaryKey: 'Chiave Primaria',
      nullable: 'Nullable',
      defaultValue: 'Valore Predefinito',
      dataType: 'Tipo di Dato',
      columnName: 'Nome Colonna',
      copySql: 'Copia SQL',
      sqlCopied: 'SQL Copiato!',
      erArchitecture: 'Mappa Topologica del Dominio (Architettura ER)',
      erSubtitle: 'Hub master core.entities che collega tutti i moduli di dominio e i servizi condivisi.',
    },
    extensionsModal: {
      title: 'Sistema Estensioni Tecniche',
      subtitle: 'Gestisci le estensioni infrastrutturali disaccoppiate (PostGIS, Leaflet, Ricerca Trigrammi, Grafo).',
      allExtensions: 'Tutte le Estensioni',
      activeOnly: 'Solo Attive',
      filterSearch: 'Filtra estensioni...',
      activate: 'Attiva',
      deactivate: 'Disattiva',
      dependencyNotice: 'Richiesta dai moduli di dominio attivi.',
    },
    themeModal: {
      title: 'Personalizzazione Tema Grafico',
      subtitle: 'Seleziona le palette di colore d\'accento e lo stile dei bordi.',
      selectPalette: 'Palette Colori',
      customRadius: 'Raggio dei Bordi',
      preview: 'Anteprima in Tempo Reale',
      applyTheme: 'Salva Tema',
    },
    peopleView: {
      title: 'Persone e Rubrica Contatti',
      subtitle: 'Registro contatti, organizzazioni e relazioni tra entità.',
      addPerson: 'Aggiungi Persona',
      searchPlaceholder: 'Cerca per nome, cognome, azienda, email o note...',
    },
    placesView: {
      title: 'Luoghi e Registro Spaziale',
      subtitle: 'Nodi geografici, metadati di posizione e mappa interattiva.',
      addPlace: 'Aggiungi Luogo',
      searchPlaceholder: 'Cerca luoghi per nome, categoria, indirizzo o coordinate...',
    },
    eventsView: {
      title: 'Eventi e Calendario Temporale',
      subtitle: 'Cronologia, partecipanti, luoghi e pianificazione temporale.',
      addEvent: 'Nuovo Evento',
      searchPlaceholder: 'Cerca per titolo, descrizione o partecipanti...',
    },
    buildingsView: {
      title: 'Edifici e Asset Immobiliari',
      subtitle: 'Asset immobiliari, strutture, piani e responsabili assegnati.',
      addBuilding: 'Aggiungi Edificio',
      searchPlaceholder: 'Cerca edificio per nome, codice o tipologia...',
    },
    dashboardHub: {
      welcome: 'LifeHub Quick Launcher',
      quickAccessSubtitle: 'Accesso rapido e diretto a tutti i moduli, viste relazionali e strumenti di sistema.',
      searchPrompt: 'Cerca entità, tag, luoghi...',
      totalEntities: 'Entità Totali Indicizzate',
      categoryDomains: 'Moduli Personali e Contenuti',
      categoryCrossViews: 'Viste Trasversali e Rete Dati',
      categorySystem: 'Amministrazione e Strumenti di Sistema',
      peopleTitle: 'Persone e Contatti',
      peopleDesc: 'Rubrica, relazioni, aziende e ruoli professionali',
      placesTitle: 'Luoghi e Mappe',
      placesDesc: 'Nodi geografici, coordinate PostGIS, mappe e POI',
      eventsTitle: 'Eventi e Calendario',
      eventsDesc: 'Appuntamenti, riunioni, partecipanti e scadenze',
      knowledgeTitle: 'Conoscenza e Schemi',
      knowledgeDesc: 'Libri, hardware, software, ricette e tipi dinamici',
      buildingsTitle: 'Edifici e Strutture',
      buildingsDesc: 'Asset immobiliari, locali, piani e gestori',
      graphTitle: 'Grafo delle Relazioni',
      graphDesc: 'Rete visiva interattiva dei collegamenti tra entità',
      timelineTitle: 'Cronologia Unificata',
      timelineDesc: 'Flusso temporale unificato di tutti gli eventi storici e futuri',
      schemasTitle: 'Database e Schema Explorer',
      schemasDesc: 'Esplora tabelle fisiche, colonne, indici e record live',
      configTitle: 'Configurazione Istanza',
      configDesc: 'Gestione instance.yaml, ruoli, permessi e identità',
      extensionsTitle: 'Estensioni Tecniche',
      extensionsDesc: 'Gestione plugin PostGIS, pg_trgm, Timescale e pgvector',
      systemOpsTitle: 'Telemetria e Hardware Host',
      systemOpsDesc: 'Temperatura CPU Raspberry Pi 4, RAM e disco SSD',
      auditTitle: 'Registro Audit e Sicurezza',
      auditDesc: 'Tracciabilità transazioni, accessi di sicurezza e log WAL',
    },
  },
};
