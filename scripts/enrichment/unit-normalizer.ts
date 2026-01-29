/**
 * 📏 Unit Normalization Library
 *
 * Provides standard conversion factors and logic to normalize
 * physical product specifications into base units (e.g. "10 cm" -> 100).
 */

export interface NormalizedValue {
  raw: string;
  value: number;
  unit: string;
}

export const UNIT_GROUPS: Record<string, string[]> = {
  length: ["mm", "cm", "m", "inch", '"', "zoll", "nm"],
  weight: ["g", "kg", "mg", "t", "oz", "lb"],
  frequency: ["hz", "khz", "mhz", "ghz"],
  capacity: ["mb", "gb", "tb", "kb"],
  power: ["w", "kw", "mw"],
  current_capacity: ["mah", "ah"],
  energy: ["wh"],
  pressure: ["bar", "mbar", "pa", "psi"],
  time: ["h", "min", "s"],
  flow: ["l/h", "l/min"],
  print_speed: ["ipm", "ppm"],
  rotation: ["rpm", "u/min"],
  data_rate: ["mt/s", "gt/s", "mb/s", "gb/s"],
  noise: ["db", "dba"],
  voltage: ["v", "kv", "mv"],
};

export const CONVERSION_RATES: Record<string, number> = {
  // --- LENGTH (Base: mm) ---
  mm: 1,
  cm: 10,
  m: 1000,
  inch: 25.4,
  '"': 25.4,
  zoll: 25.4,
  nm: 0.000001,

  // --- WEIGHT (Base: g) ---
  g: 1,
  kg: 1000,
  mg: 0.001,

  // --- FREQUENCY (Base: Hz) ---
  hz: 1,
  khz: 1000,
  mhz: 1000000,
  ghz: 1000000000,

  // --- CAPACITY (Base: MB) ---
  kb: 0.0009765625,
  mb: 1,
  gb: 1024,
  tb: 1048576,

  // --- POWER (Base: W) ---
  w: 1,
  kw: 1000,
  mw: 0.001,

  // --- CURRENT CAPACITY (Base: mAh) ---
  mah: 1,
  ah: 1000,

  // --- ENERGY (Base: Wh) ---
  wh: 1,

  // --- PRESSURE (Base: bar) ---
  bar: 1,
  mbar: 0.001,
  pa: 0.00001,
  psi: 0.0689476,

  // --- TIME (Base: h) ---
  h: 1,
  min: 1 / 60,
  s: 1 / 3600,

  // --- FLOW RATE (Base: l/h) ---
  "l/h": 1,
  "l/min": 60,

  // --- PRINT SPEED (Base: ipm) ---
  ipm: 1,
  ppm: 1,

  // --- ROTATION (Base: RPM) ---
  rpm: 1,
  "u/min": 1,

  // --- DATA RATE (Base: MT/s) ---
  "mt/s": 1,
  "gt/s": 1000,
  "mb/s": 1,
  "gb/s": 1024,

  // --- NOISE (Base: dB) ---
  db: 1,
  dba: 1,

  // --- VOLTAGE (Base: V) ---
  v: 1,
  kv: 1000,
  mv: 0.001,
};

export function normalizeValue(
  raw: string,
  targetBaseUnit: string,
): NormalizedValue | null {
  if (!raw || !targetBaseUnit) return null;

  const target = targetBaseUnit.toLowerCase().trim();

  // 1. Clean the input
  const cleanRaw = raw
    .trim()
    .replace(/\.(?=\d{3}(\s|$|[a-zA-Z]))/g, "")
    .replace(",", ".");

  // 2. Regex to separate Value from Unit
  const match = cleanRaw.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z/%"°]+)?/);
  if (!match) return null;

  const valStr = match[1];
  const unitStr = (match[2] || "").toLowerCase().trim();

  if (unitStr === target) {
    return { raw, value: parseFloat(valStr), unit: target };
  }

  // 🛡️ TYPE SAFETY: Only allow conversion within the same physical category
  const getCategory = (u: string) =>
    Object.keys(UNIT_GROUPS).find((cat) => UNIT_GROUPS[cat].includes(u));

  const sourceCategory = getCategory(unitStr);
  const targetCategory = getCategory(target);

  if (!sourceCategory || sourceCategory !== targetCategory) {
    // Cross-category conversion is a hallucination risk (e.g. 3h -> 3Hz)
    return null;
  }

  const factor = CONVERSION_RATES[unitStr];
  const targetFactor = CONVERSION_RATES[target];

  if (factor && targetFactor) {
    const val = parseFloat(valStr);
    return {
      raw,
      value: val * (factor / targetFactor),
      unit: target,
    };
  }

  return null;
}
