export type Language = 'en' | 'am' | 'om';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Afaan Oromoo', nativeName: 'Afaan Oromoo', flag: '🇪🇹' },
];

export interface TranslationDictionary {
  // Common & Navigation
  common: {
    appTitle: string;
    appSubtitle: string;
    newArrival: string;
    auditStocktake: string;
    expenses: string;
    exportCsv: string;
    resetDemo: string;
    database: string;
    save: string;
    cancel: string;
    close: string;
    delete: string;
    edit: string;
    sell: string;
    revert: string;
    search: string;
    filter: string;
    all: string;
    loading: string;
    actions: string;
    notes: string;
    date: string;
    status: string;
    quantity: string;
    price: string;
    total: string;
    details: string;
    required: string;
    viewAuditHistory: string;
    revertToStock: string;
    currencySymbol: string;
    currencyName: string;
    workspaceDashboard: string;
    workspaceItems: string;
    itemsSubtitle: string;
    workspaceCounter: string;
    workspaceReports: string;
    navDashboard: string;
    navItems: string;
    navCounter: string;
    navReports: string;
    navMenu: string;
    auditSubtitle: string;
    settingsSubtitle: string;
    exportCsvSubtitle: string;
  };

  // Sync Pill
  sync: {
    synced: string;
    pendingCount: string;
    syncing: string;
    offlineMode: string;
    demoStorage: string;
    syncNow: string;
  };

  // Metric Cards
  metrics: {
    financialOverview: string;
    trueNetProfit: string;
    grossProfit: string;
    overhead: string;
    netLoss: string;
    margin: string;
    roi: string;
    revenueCostBreakdown: string;
    realizedRevenue: string;
    costOfSold: string;
    activeInventoryCost: string;
    activeRetailValue: string;
    unrealizedPotential: string;
    equipmentCountBalance: string;
    totalUnitsInShop: string;
    inStockOk: string;
    lowStockAlert: string;
    outOfStockAlert: string;
    timeframeToday: string;
    timeframeThisWeek: string;
    timeframeThisMonth: string;
    timeframeAllTime: string;
  };

  // Quick Add Bar
  quickAdd: {
    title: string;
    rapidIntake: string;
    namePlaceholder: string;
    costPlaceholder: string;
    sellPlaceholder: string;
    qtyTitle: string;
    unitTitle: string;
    addStock: string;
    adding: string;
    added: string;
    detailedForm: string;
    expectedProfit: string;
    autoRegisters: string;
  };

  // Filter Bar
  filters: {
    searchPlaceholder: string;
    tabAll: string;
    tabInStock: string;
    tabLowStock: string;
    tabOutOfStock: string;
    tabSold: string;
    categoryAll: string;
    brandAll: string;
    conditionAll: string;
    sortBy: string;
    sortLatest: string;
    sortOldest: string;
    sortName: string;
    sortNameDesc: string;
    sortPriceLowHigh: string;
    sortPriceHighLow: string;
    sortCostLowHigh: string;
    sortCostHighLow: string;
    sortProfit: string;
    sortProfitLowHigh: string;
    sortQuantity: string;
  };

  // Inventory Table
  table: {
    equipmentDetails: string;
    conditionStatus: string;
    purchaseCost: string;
    retailPrice: string;
    soldPrice: string;
    profitMargin: string;
    actions: string;
    unsold: string;
    totalCost: string;
    totalRetail: string;
    totalRevenue: string;
    noItemsFound: string;
    noItemsSubtext: string;
    resetFilters: string;
    distributionByCategory: string;
    categoriesRepresented: string;
  };

  // Equipment Item Intake Modal
  itemModal: {
    titleNew: string;
    titleEdit: string;
    stockIntake: string;
    updateMode: string;
    addedSessionCount: string;
    section1Title: string;
    section1Subtitle: string;
    equipmentName: string;
    equipmentNamePlaceholder: string;
    category: string;
    brand: string;
    brandHint: string;
    brandPlaceholder: string;
    model: string;
    modelPlaceholder: string;
    serialBarcode: string;
    autoGenerate: string;
    section2Title: string;
    purchasePricePerUnit: string;
    targetSellingPricePerUnit: string;
    markup: string;
    projectedProfitPrefix: string;
    projectedProfitPer: string;
    section3Title: string;
    section3Subtitle: string;
    unitOfMeasurement: string;
    customUnitPlaceholder: string;
    quantityArrived: string;
    lowStockAlert: string;
    reorderLevelHint: string;
    condition: string;
    stockStatus: string;
    shopLocation: string;
    shopLocationPlaceholder: string;
    arrivalDate: string;
    warrantyMonths: string;
    notesLabel: string;
    notesPlaceholder: string;
    keepTyping: string;
    registerEquipment: string;
    updateEquipment: string;
    registerAndAddAnother: string;
  };

  // Mark Sold Modal
  soldModal: {
    title: string;
    subtitle: string;
    availableBadge: string;
    unitCost: string;
    targetListedPrice: string;
    quantityToSell: string;
    maxUnits: string;
    presetOne: string;
    presetAll: string;
    sellingPricePerUnit: string;
    listedPriceRef: string;
    discountNotice: string;
    lossWarning: string;
    customerOptional: string;
    customerName: string;
    customerNamePlaceholder: string;
    customerPhone: string;
    customerPhonePlaceholder: string;
    saleDate: string;
    confirmSaleButton: string;
    fullSaleExplanation: string;
    partialSaleExplanation: string;
  };

  // Operating Expenses Modal
  expensesModal: {
    modalTitle: string;
    modalSubtitle: string;
    totalOverhead: string;
    logNewExpense: string;
    expenseTitle: string;
    expenseTitlePlaceholder: string;
    category: string;
    amount: string;
    paymentMethod: string;
    expenseDate: string;
    notes: string;
    notesPlaceholder: string;
    recordExpenseButton: string;
    recentExpenses: string;
    searchExpensesPlaceholder: string;
    allCategories: string;
    noExpensesFound: string;
    noExpensesSubtext: string;
    deleteExpenseConfirm: string;
  };

  // Audit & Stocktake Modal
  auditModal: {
    modalTitle: string;
    modalSubtitle: string;
    tabPhysicalStocktake: string;
    tabActivityTrail: string;
    stocktakeTitle: string;
    stocktakeSubtitle: string;
    quickAllMatch: string;
    autoMatchesCount: string;
    filterMismatchOnly: string;
    columnEquipment: string;
    columnExpectedSystem: string;
    columnCountedPhysical: string;
    columnVariance: string;
    columnCostDiscrepancy: string;
    columnReconcile: string;
    reconciledBadge: string;
    reconcileSelected: string;
    reconcileAllMismatches: string;
    perfectStockTitle: string;
    perfectStockSubtext: string;
    activityTitle: string;
    activitySubtitle: string;
    exportAuditCsv: string;
    filterByItem: string;
    allEquipmentItems: string;
    noActivityFound: string;
  };

  // System Settings Modal (Profile, Display Mode, Password/Security)
  settingsModal: {
    title: string;
    subtitle: string;
    tabProfile: string;
    tabAppearance: string;
    tabSecurity: string;
    shopName: string;
    shopNamePlaceholder: string;
    managerName: string;
    managerNamePlaceholder: string;
    phoneNumber: string;
    phoneNumberPlaceholder: string;
    currency: string;
    currencyValue: string;
    currencyHint: string;
    cloudStatus: string;
    statusActive: string;
    statusOffline: string;
    cloudConnectedDesc: string;
    cloudLocalDesc: string;
    defaultBadge: string;
    language: string;
    appearanceMode: string;
    lightMode: string;
    darkMode: string;
    modeDescription: string;
    securityTitle: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordHint: string;
    saveSuccess: string;
    passwordMismatch: string;
    wrongCurrentPassword: string;
    saveButton: string;
    closeButton: string;
  };

  // Database / Cloud Sync Modal
  dbModal: {
    title: string;
    subtitle: string;
    cloudConnected: string;
    localDemoMode: string;
    projectUrl: string;
    anonKey: string;
    connectCloud: string;
    switchToLocal: string;
    testConnection: string;
  };

  // Categories
  categories: {
    householdGoods: string;
    housewares: string;
    domesticEquipment: string;
  };

  // Conditions
  conditions: {
    new: string;
    open_box: string;
    refurbished: string;
    used_like_new: string;
    used_good: string;
    used_fair: string;
    for_parts: string;
  };

  // Statuses
  statuses: {
    in_stock: string;
    sold: string;
    reserved: string;
    damaged: string;
    returned: string;
  };

  // Units
  units: {
    pcs: { singular: string; plural: string; label: string };
    set: { singular: string; plural: string; label: string };
    box: { singular: string; plural: string; label: string };
    pack: { singular: string; plural: string; label: string };
    pair: { singular: string; plural: string; label: string };
    ctn: { singular: string; plural: string; label: string };
    dz: { singular: string; plural: string; label: string };
    roll: { singular: string; plural: string; label: string };
    kg: { singular: string; plural: string; label: string };
    m: { singular: string; plural: string; label: string };
    customOption: string;
  };

  // Expense Categories
  expenseCategories: {
    rent: string;
    utilities: string;
    transport: string;
    wages: string;
    supplies: string;
    maintenance: string;
    other: string;
  };

  // Payment Methods
  paymentMethods: {
    cash: string;
    telebirr: string;
    cbe_birr: string;
    bank_transfer: string;
  };

  // Audit Actions
  auditActions: {
    item_created: string;
    item_updated: string;
    price_changed: string;
    item_sold: string;
    partial_sale: string;
    reverted_to_stock: string;
    item_deleted: string;
    stocktake_adjustment: string;
    expense_created: string;
  };

  // Toast Notifications
  toasts: {
    addedEquipment: string;
    updatedEquipment: string;
    deletedEquipment: string;
    recordedSale: string;
    revertedStock: string;
    recordedExpense: string;
    deletedExpense: string;
    loadedCatalog: string;
    reconciledCount: string;
    connectedSupabase: string;
    switchedDemo: string;
    deleteItemTitle: string;
    deleteItemWarning: string;
    deleteItemConfirm: string;
    deleting: string;
  };

  // Dashboard View
  dashboard: {
    welcomeSubtitle: string;
    stockAlertsTitle: string;
    allStockHealthy: string;
    allStockHealthyDesc: string;
    itemsNeedAttention: string;
    leftInStock: string;
    outOfStockLabel: string;
    viewInCounter: string;
    categorySummaryTitle: string;
    noCategoryData: string;
    recentItemsTitle: string;
    noRecentItems: string;
    openCounter: string;
    profitLossTitle: string;
    potentialProfit: string;
    totalValuation: string;
    itemsCountLabel: string;
    inventorySectionTitle: string;
    reportsSectionTitle: string;
  };

  // Footer
  footer: {
    systemInfo: string;
  };
}
