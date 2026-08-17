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
      domainModules: 'Moduli di Dominio',
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
  },
};
