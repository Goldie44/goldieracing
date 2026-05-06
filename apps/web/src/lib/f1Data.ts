// Goldie F1 2023 - Static data extracted from Excel

export const calendar = [
  { id: 1, name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", date: "2023-03-05", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 2, name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", date: "2023-03-19", type: "équilibre", strategy: "flancs+suspension" },
  { id: 3, name: "Australian Grand Prix", circuit: "Albert Park Circuit", date: "2023-04-02", type: "équilibre", strategy: "flancs+suspension" },
  { id: 4, name: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", date: "2023-04-30", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 5, name: "Miami Grand Prix", circuit: "Miami International Autodrome", date: "2023-05-07", type: "équilibre", strategy: "flancs+suspension" },
  { id: 6, name: "Monaco Grand Prix", circuit: "Circuit de Monaco", date: "2023-05-28", type: "Déportance", strategy: "packaero" },
  { id: 7, name: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", date: "2023-06-04", type: "équilibre", strategy: "flancs+suspension" },
  { id: 8, name: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", date: "2023-06-18", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 9, name: "Austrian Grand Prix", circuit: "Red Bull Ring", date: "2023-07-02", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 10, name: "British Grand Prix", circuit: "Silverstone Circuit", date: "2023-07-09", type: "équilibre", strategy: "flancs+suspension" },
  { id: 11, name: "Hungarian Grand Prix", circuit: "Hungaroring", date: "2023-07-23", type: "Déportance", strategy: "packaero" },
  { id: 12, name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", date: "2023-07-30", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 13, name: "Dutch Grand Prix", circuit: "Circuit Zandvoort", date: "2023-08-27", type: "équilibre", strategy: "flancs+suspension" },
  { id: 14, name: "Italian Grand Prix", circuit: "Autodromo di Monza", date: "2023-09-03", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 15, name: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", date: "2023-09-17", type: "Déportance", strategy: "packaero" },
  { id: 16, name: "Japanese Grand Prix", circuit: "Suzuka Circuit", date: "2023-09-24", type: "équilibre", strategy: "flancs+suspension" },
  { id: 17, name: "Qatar Grand Prix", circuit: "Lusail International Circuit", date: "2023-10-08", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 18, name: "US Grand Prix", circuit: "Circuit of the Americas", date: "2023-10-22", type: "équilibre", strategy: "flancs+suspension" },
  { id: 19, name: "Mexico City Grand Prix", circuit: "Autódromo Hermanos Rodríguez", date: "2023-10-29", type: "équilibre", strategy: "flancs+suspension" },
  { id: 20, name: "São Paulo Grand Prix", circuit: "Interlagos", date: "2023-11-05", type: "équilibre", strategy: "flancs+suspension" },
  { id: 21, name: "Las Vegas Grand Prix", circuit: "Las Vegas Street Circuit", date: "2023-11-18", type: "Rapide", strategy: "chassis+fondplat" },
  { id: 22, name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", date: "2023-12-26", type: "équilibre", strategy: "flancs+suspension" },
  { id: 23, name: "Pre-season Testing", circuit: "Bahrain International Circuit", date: "2023-02-23", type: "Test", strategy: "tous" },
];

export const circuitTypes = {
  "Rapide": { count: 8, color: "chart-2", label: "Rapide" },
  "équilibre": { count: 13, color: "chart-3", label: "Équilibre" },
  "Déportance": { count: 3, color: "chart-1", label: "Déportance" },
};

export const stock = [
  { piece: "Châssis", count: 4, racesPerPiece: 6, capacity: 24, understock: 2, costFab: 1100000, costUnit: 550000, lifespan: 6, daysToMake: 9 },
  { piece: "Aileron avant", count: 5, racesPerPiece: 4, capacity: 20, understock: 1, costFab: 225000, costUnit: 225000, lifespan: 3, daysToMake: 3 },
  { piece: "Aileron arrière", count: 3, racesPerPiece: 2.5, capacity: 7.5, understock: 3, costFab: 825000, costUnit: 275000, lifespan: 4, daysToMake: 3 },
  { piece: "Flancs", count: 5, racesPerPiece: 4.5, capacity: 22.5, understock: 1, costFab: 450000, costUnit: 450000, lifespan: 5, daysToMake: 5 },
  { piece: "Fond plat", count: 4, racesPerPiece: 3, capacity: 12, understock: 2, costFab: 800000, costUnit: 400000, lifespan: 5, daysToMake: 5 },
  { piece: "Suspension", count: 6, racesPerPiece: 8, capacity: 48, understock: 0, costFab: 600000, costUnit: 100000, lifespan: 8, daysToMake: 7 },
];

export const performance = {
  velocity: {
    topSpeed: { value: 107.96, label: "Vitesse max" },
    acceleration: { value: 2.89, label: "Accélération" },
    drsEfficiency: { value: 0.59, label: "Efficacité DRS" },
  },
  bop: {
    velocity: { current: 107.96, label: "Vélocité" },
    cornering: { current: 2.89, label: "Virage" },
    components: { current: 0.59, label: "Composants" },
    overall: { current: 37.15, label: "Global" },
  },
  scores: {
    mauh: 5.7,
    hs: 76,
  }
};

export const budgetSections = [
  {
    section: "Développement de pièces",
    color: "hsl(43, 96%, 56%)",
    items: [
      { label: "Châssis", spent: null, allocated: null },
      { label: "Aileron avant", spent: null, allocated: null },
      { label: "Aileron arrière", spent: null, allocated: null },
      { label: "Flancs", spent: null, allocated: null },
      { label: "Fond plat", spent: null, allocated: null },
      { label: "Suspension", spent: null, allocated: null },
    ],
    spentTotal: 0,
    allocatedTotal: 45302506,
  },
  {
    section: "Recherche de pièces",
    color: "hsl(210, 60%, 50%)",
    items: [
      { label: "Châssis", spent: null, allocated: null },
      { label: "Aileron avant", spent: null, allocated: null },
      { label: "Aileron arrière", spent: null, allocated: null },
      { label: "Flancs", spent: null, allocated: null },
      { label: "Fond plat", spent: null, allocated: null },
      { label: "Suspension", spent: null, allocated: null },
    ],
    spentTotal: 0,
    allocatedTotal: 59175000,
  },
  {
    section: "Salaires du personnel",
    color: "hsl(150, 60%, 45%)",
    items: [],
    spentTotal: 3534506,
    allocatedTotal: 9862500,
  },
  {
    section: "\u00c9quipe d'ingénierie",
    color: "hsl(280, 60%, 55%)",
    items: [],
    spentTotal: 792000,
    allocatedTotal: null,
  },
  {
    section: "\u00c9quipe de prospection",
    color: "hsl(30, 80%, 55%)",
    items: [],
    spentTotal: 126000,
    allocatedTotal: 16900000,
  },
  {
    section: "\u00c9quipe des stands",
    color: "hsl(0, 72%, 51%)",
    items: [],
    spentTotal: 600000,
    allocatedTotal: 2816667,
  },
  {
    section: "Achats d'urgence",
    color: "hsl(15, 80%, 55%)",
    items: [],
    spentTotal: 23600000,
    allocatedTotal: null,
  },
  {
    section: "Installations",
    color: "hsl(200, 60%, 50%)",
    items: [],
    spentTotal: 16650000,
    allocatedTotal: null,
  },
];

// Keep for backward compatibility
export const budgetAllocation = [
  { category: "Développement", amount: 45302506, percentage: 33 },
  { category: "Recherche", amount: 59175000, percentage: 42 },
  { category: "Salaires", amount: 3534506, percentage: 3 },
  { category: "Achats urgence", amount: 23600000, percentage: 17 },
  { category: "Installations", amount: 16650000, percentage: 12 },
];

export const totalBudget = 139200000;
export const usedBudget = 93897494;

export const staff = [
  {
    role: "Responsable Aéro",
    skills: [
      { name: "Grande vitesse", value: 85 },
      { name: "Gestion débit d'air", value: 86 },
      { name: "Delta DRS", value: 87 },
      { name: "Refroidissement", value: 87 },
    ]
  },
  {
    role: "Directeur Technique",
    skills: [
      { name: "Aileron avant", value: 80 },
      { name: "Suspension", value: 80 },
      { name: "Châssis", value: 81 },
      { name: "Flancs", value: 81 },
    ]
  },
  {
    role: "Ingénieur de Course 1",
    skills: [
      { name: "Sang-froid", value: 79 },
      { name: "Retour", value: 85 },
      { name: "Communications", value: 86 },
    ]
  },
  {
    role: "Ingénieur de Course 2",
    skills: [
      { name: "Communications", value: 84 },
      { name: "Retour", value: 83 },
      { name: "Sang-froid", value: 92 },
    ]
  },
  {
    role: "Directeur Sportif",
    skills: [
      { name: "Leadership", value: 86 },
      { name: "Entraînement", value: 88 },
      { name: "Aptitude", value: 90 },
      { name: "Procédures", value: 97 },
    ]
  },
];

export const tireStrategy = {
  soft: { avgTime: 79.37, laps: 37, degradation: 0.09, color: "#ef4444" },
  medium: { avgTime: 79.96, laps: 52, degradation: 0.06, color: "#eab308" },
  hard: { avgTime: 80.00, laps: 60, degradation: 0.05, color: "#f8fafc" },
};

export const developmentUpdates = [
  { race: "Pre-season", atr: "ATR1", parts: ["Aileron avant", "Fond plat", "Aileron arrière"] },
  { race: "Course 2", atr: "ATR2", parts: ["Suspension", "Châssis"] },
  { race: "Course 5", atr: "ATR3", parts: ["Flancs", "Fond plat"] },
  { race: "Course 8", atr: "ATR4", parts: ["Aileron avant", "Aileron arrière"] },
  { race: "Course 12", atr: "ATR5", parts: ["Châssis", "Suspension"] },
  { race: "Course 16", atr: "ATR6", parts: ["Aileron avant", "Fond plat"] },
  { race: "Course 20", atr: "ATR7", parts: ["Flancs", "Aileron arrière"] },
];