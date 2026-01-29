import { generateText } from "ai";
import { createOllama } from "ai-sdk-ollama";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import {
  FIELD_DEFINITIONS,
  createZodFromDefinition,
} from "./field-definitions";
import { GOLDEN_VALUES, SYNONYM_MAP } from "./golden-values";
import { normalizeValue } from "./unit-normalizer";

export class SmartParser {
  private model: string;
  private ollama: any;

  private static FIELD_ALIASES: Record<string, string[]> = {
    Bauvolumen: [
      "bauvolumen",
      "druckgröße",
      "druckraum",
      "volumen",
      "abmessung",
      "größe",
      "300x",
      "250x",
      "x300",
      "x250",
      "raum",
    ],
    Produktfarbe: [
      "farbe",
      "farben",
      "finish",
      "color",
      "colour",
      "multicolor",
      "bunt",
    ],
    "Zusätzliche Funktionen": [
      "feature",
      "funktion",
      "besonderheit",
      "extra",
      "upgrade",
      "sensor",
      "touch",
      "ai",
    ],
    Bauraum: ["kammer", "bauraum", "gehäuse", "chamber", "beheizt"],
    Schnittstelle: [
      "usb",
      "lan",
      "wlan",
      "wifi",
      "sd-karte",
      "anschluss",
      "festplattenschnittstelle",
      "schnittstelle",
      "connection",
    ],
    "HDD Kapazität": [
      "hdd-kapazität",
      "festplattenkapazität",
      "kapazität",
      "storage",
    ],
    "SSD Speicherkapazität": [
      "ssd-kapazität",
      "speicherkapazität",
      "ssd",
      "solid state",
    ],
    "Kompatible Materialien": ["filament", "pla", "abs", "petg", "materialien"],
    Druckgeschwindigkeit: ["mm/s", "geschwindig", "tempo", "speed"],
    GPS: ["gps", "ortung", "glonass", "beidou", "galileo", "standort"],
    "Notruf-Funktion": [
      "sos",
      "notruf",
      "panik",
      "alarm",
      "sturz",
      "sicherheit",
    ],
    Bluetooth: ["bluetooth", " bt ", "bt5", "bt4"],
    WLAN: ["wlan", "wifi", "wi-fi", "wireless", "802.11"],
    NFC: ["nfc", "nahbereich", "near field"],
    Wasserschutz: [
      "wasserschutz",
      "wasserfest",
      "wasserdicht",
      "waterproof",
      "ip-zertifiziert",
    ],
    Netzwerk: ["4g", "5g", "lte", "3g", "netzwerk", "mobilfunk", "band"],
    "Sim-Karte": ["sim", "esim", "nano", "micro", "dual-sim", "kartenslot"],
    Autonivellierung: ["leveling", "nivellier", "touch", "auto", "sensor"],
    "KI-Kamera": ["kamera", "camera", "cam", "ai", "ki", "vision"],
    "Extruder-Typ": ["extruder", "direct", "sprite", "bowden", "flow"],
    Filamentdurchmesser: ["filament", "durchmesser", "1.75", "2.85", "ø"],
    "Maximale Schichtdicke": ["schicht", "layer", "dicke", "max", "auflösung"],
    Mindestschichtdicke: ["schicht", "layer", "dicke", "min", "auflösung"],
    Düsentemperatur: ["nozzle", "düse", "temp", "hotend", "grad"],
    "Heizbett-Temperatur": ["bed", "heizbett", "heiz", "plattform", "bett"],
    "Bauraum-Heizung": ["heizung", "bauraum", "beheizt", "chamber", "warm"],
    "ISO-Empfindlichkeit": ["iso", "empfindlichkeit", "lichtempfindlich"],
    "ISO-Empfindlichkeit (max)": ["iso max", "iso bis"],
    "ISO-Empfindlichkeit (min)": ["iso min", "iso ab"],
    "Megapixel insgesamt": ["megapixel", " mp ", "auflösung"],
    "Megapixel (ca.)": ["megapixel", " mp ", "auflösung"],
    "Maximale Bildauflösung": ["bildauflösung", "pixel", "auflösung"],
    "Kamera-Typ": [
      "systemkamera",
      "spiegellos",
      "dslr",
      "dslm",
      "kompaktkamera",
      "bridgekamera",
    ],
    Besonderheiten: [
      "feature",
      "funktion",
      "special",
      "besonderheit",
      "extra",
      "upgrade",
      "plug",
    ],
    // Consoles / Computing
    "Integrierter Kartenleser": [
      "kartenleser",
      "card reader",
      "sd slot",
      "microsd",
      "speichererweiterung",
    ],
    "Videospiel enthalten": [
      "spiel",
      "game",
      "bundle",
      "inklusive",
      "voucher",
      "code",
    ],
    "Kompatible Speicherkarten": [
      "speicherkarte",
      "memory card",
      "sd",
      "microsdxc",
    ],
    Bildschirmdiagonale: [
      "display",
      "screen",
      "bildschirm",
      "zoll",
      "inch",
      "diagonal",
    ],
    Plattform: [
      "konsole",
      "console",
      "system",
      "platform",
      "playstation",
      "xbox",
      "nintendo",
    ],
    Gewicht: ["gewicht", "weight", "masse", "g", "kg"],
    Tiefe: ["tiefe", "depth", "länge", "length", "tief"],
    Breite: ["breite", "width", "breit"],
    Höhe: ["höhe", "height", "hoch"],
    "Länge (mm)": ["länge", "length", "long", "mm"],
    Speicherkapazität: ["kapazität", "speicher", "storage", "festplatte"],
    "Interner Speichertyp": [
      "ddr",
      "gddr",
      "ram",
      "memory type",
      "speichertyp",
    ],
    Prozessor: ["cpu", "processor", "chip", "soc", "prozessor"],
    Grafikprozessorenfamilie: [
      "gpu",
      "grafik",
      "graphics",
      "radeon",
      "geforce",
      "nvidia",
      "amd",
    ],
    // Audio / Headphones
    "Kontinuierliche Audiowiedergabezeit": [
      "wiedergabe",
      "laufzeit",
      "battery",
      "playtime",
      "autonomie",
      "dauer",
      "stunden",
      "hours",
      "music",
      "play",
    ],
    Geräuschunterdrückung: [
      "anc",
      "noise",
      "geräusch",
      "cancelling",
      "active",
      "unterdrückung",
      "hybrid",
    ],
    "Kabellose Reichweite": [
      "reichweite",
      "range",
      "wireless",
      "meter",
      "radius",
      "connect",
    ],
    "Mikrofon-Typ": [
      "mikrofon",
      "mic",
      "mems",
      "omnidirection",
      "kugel",
      "pickup",
    ],
    "Mitgelieferte Kabel": [
      "kabel",
      "cable",
      "lieferumfang",
      "box",
      "usb",
      "charging",
      "included",
      "zubehör",
    ],
    "Akku-/Batterietyp": [
      "akku",
      "battery",
      "lithium",
      "li-ion",
      "mah",
      "polym",
    ],
    "Akku-/Batterietechnologie": [
      "akku",
      "battery",
      "lithium",
      "li-ion",
      "mah",
      "polym",
    ],
    Kopfhörerfrequenz: ["frequenz", "frequency", "hz", "khz", "response"],
    "Anzahl Prozessorkerne": ["core", "kerne", "cpu", "octa", "hexa", "quad"],
    Prozessortaktfrequenz: ["ghz", "takt", "frequency", "speed", "clock"],
    "Thermal Design Power (TDP)": ["tdp", "watt", "verlustleistung"],
  };

  private static CATEGORY_ALIASES: Record<string, Record<string, string[]>> = {
    // 3D Printers
    "3d-drucker": {
      Bauvolumen: ["bauvolumen", "druckgröße", "print size", "build volume"],
      Druckgeschwindigkeit: ["druckgeschwindigkeit", "print speed", "mm/s"],
      Düsentemperatur: ["nozzle temp", "düse", "düsentemperatur"],
    },
    // Consoles
    consoles: {
      Speicherkapazität: ["festplatte", "ssd", "speicher", "hdd"], // Prioritize storage over RAM
      "Interner Speichertyp": ["gddr6", "ssd-typ"],
    },
    // Smartphones
    smartphones: {
      Speicherkapazität: ["rom", "interner speicher", "storage"],
      "RAM-Kapazität": ["ram", "arbeitsspeicher"],
    },
  };

  constructor() {
    this.model = process.env.AI_MODEL || "qwen3:4b-instruct-2507-q4_K_M";
    const ollamaBaseUrl =
      process.env.OLLAMA_BASE_URL || "http://localhost:11434";

    this.ollama = createOllama({
      baseURL: ollamaBaseUrl,
    });

    console.log(
      `🧠 SmartParser Config: Provider=ai-sdk-ollama, Model=${this.model}`,
    );
    this.ensureLogDir();
  }

  private ensureLogDir() {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  }

  private logMiss(fields: string[], title: string, category: string) {
    const logPath = path.join(process.cwd(), "logs", "enrichment_misses.csv");
    const timestamp = new Date().toISOString();
    const line = `"${timestamp}","${category}","${fields.join(";")}","${title.replace(/"/g, "'")}"\n`;
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, "Timestamp,Category,MissingFields,Title\n");
    }
    fs.appendFileSync(logPath, line);
  }

  async parseProductPage(
    rawText: string,
    productTitle: string,
    schema?: string[],
    example?: { title: string; specs: any },
    isVariant: boolean = false,
    category: string = "unknown",
  ): Promise<any> {
    // 1. Dynamic Pruning
    // STRATEGY: Smart Hybrid.
    // 1. If no schema (uncategorized), prune aggressively to find relevant fields.
    // 2. If schema exists but is HUGE (> 40 fields), prune lightly to save context.
    // 3. If schema is standard size (< 40), USE IT ALL (Trust the template).

    let initialPruned = schema || [];

    if (!schema || schema.length === 0) {
      initialPruned = this.pruneSchema(productTitle, rawText, []);
    } else if (schema.length > 40) {
      // "Light Pruning" - still use pruneSchema but maybe we trust it improves speed
      initialPruned = this.pruneSchema(productTitle, rawText, schema);
      console.log(
        `✂️ Hybrid Pruning: ${schema.length} -> ${initialPruned.length} fields`,
      );
    } else {
      initialPruned = schema;
      console.log(
        `🛡️ Trusted Schema: Using all ${initialPruned.length} fields.`,
      );
    }

    if (initialPruned.length === 0) return {};

    // 2. PASS 1: Deterministic Extraction (Rules/Regex)
    // 2. PASS 1: Deterministic Extraction (Rules/Regex)
    const deterministicSpecs = this.deterministicExtract(
      productTitle,
      rawText,
      initialPruned,
      example,
      category,
    );

    // 3. Prune schema for PASS 2 (Only what's still missing)
    const foundKeys = Object.keys(deterministicSpecs);
    const remainingFields = initialPruned.filter((f) => !foundKeys.includes(f));

    if (remainingFields.length === 0) {
      console.log("⚡️ PASS 1: All fields resolved deterministically.");
      console.log(
        `📊 Pass 1 Result:`,
        JSON.stringify(deterministicSpecs, null, 2),
      );
      return deterministicSpecs;
    }

    // 3b. Confidence Early-Exit
    const resolvedRate = foundKeys.length / initialPruned.length;
    const isHighConfidence = resolvedRate >= 0.7;
    const hasCoreSpecs = foundKeys.some((k: string) =>
      k.match(/farbe|material|volumen|abmessung|gewicht/i),
    );

    if (isHighConfidence && hasCoreSpecs && !process.env.STRICT_MODE) {
      console.log(
        `⚡️ PASS 1 Confidence Skip: Resolved ${foundKeys.length}/${initialPruned.length} fields. Skipping Pass 2.`,
      );
      console.log(
        `📊 Pass 1 Result:`,
        JSON.stringify(deterministicSpecs, null, 2),
      );
      return deterministicSpecs;
    }

    console.log(
      `📊 Pass 1 Preliminary:`,
      JSON.stringify(deterministicSpecs, null, 2),
    );

    // Still missing critical fields? Log them.
    this.logMiss(
      remainingFields,
      productTitle,
      schema && schema.length > 0 ? "provided" : "dynamic",
    );

    // 4. Build Strict Zod Schema for remaining fields
    const shape: any = {};
    const hintMap: string[] = [];

    if (remainingFields.length === 0) {
      console.log("⚡️ PASS 2 Skipped: All fields resolved.");
      return deterministicSpecs;
    }

    remainingFields.forEach((field) => {
      // 🌟 STRICT MODE: Use Blueprint Validator if available
      const def = FIELD_DEFINITIONS[field];
      if (def) {
        shape[field] = createZodFromDefinition(def).optional().nullable();

        // Add hint to prompt if it's an enum or has specific unit
        if (def.type === "enum" && def.options) {
          hintMap.push(
            `- ${field}: One of [${def.options.slice(0, 10).join(", ")}...]`,
          );
        } else if (def.unit) {
          hintMap.push(`- ${field}: Numeric in ${def.unit}`);
        }
      } else {
        // Fallback to Heuristics
        const type = example
          ? this.getFieldTypeFromReference(field, example.specs)
          : this.getFieldType(field);

        if (type === "BOOLEAN") {
          shape[field] = z.enum(["Ja", "Nein"]).optional().nullable();
        } else {
          shape[field] = z
            .union([z.string(), z.array(z.string())])
            .optional()
            .nullable();
        }
      }
    });
    const dynamicZodSchema = z.object(shape);

    // 5. Context Strategy: Smart Full Text
    // IF text is reasonable size (< 15000 chars), send IT ALL.
    // Qwen context is large, and pruning kills data.
    let context = "";
    if (rawText.length < 15000) {
      context = rawText; // 🚀 FULL CONTEXT MODE
    } else {
      context = this.getRelevantContext(rawText, remainingFields);
    }
    const examplePrompt = example
      ? `Template: ${JSON.stringify(Object.keys(example.specs).slice(0, 5))}\n`
      : "";

    // Inject Strict Field Hints
    const strictHints =
      hintMap.length > 0
        ? `\nSTRICT FORMAT RULES:\n${hintMap.join("\n")}\n`
        : "";

    // Use fast embedded model for speed
    const targetModel = (
      process.env.SMALL_AI_MODEL || "qwen3:4b-instruct"
    ).trim();

    try {
      console.log(
        `🤖 SmartParser: PASS 2 (LLM Fallback for ${remainingFields.length} fields: ${remainingFields.join(", ")})`,
      );
      console.log(`📡 Context Size: ${context.length} chars (Pruned)`);
      console.log(`🤖 SmartParser: Target Model: "${targetModel}"`);

      const controller = new AbortController();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          controller.abort();
          reject(new Error("LLM_TIMEOUT_5MIN"));
        }, 300000),
      );

      try {
        // Use generateText with JSON format - more reliable for Ollama than server-side JSON Schema
        const response = (await Promise.race([
          generateText({
            model: this.ollama(targetModel, {
              numCtx: 8192,
            }),
            temperature: 0,
            abortSignal: controller.signal,
            system: `Technical extractor. Extract exactly the requested keys from the text. Return a clean JSON object.`,
            prompt: `
              Analyze the following text and extract technical specifications.
              
              PRODUCT: "${productTitle}"
              CONTEXT: ${context}

              EXTRACT THESE KEYS:
              ${remainingFields
                .map((k) => {
                  const aliases = SmartParser.FIELD_ALIASES[k] || [];
                  const aliasStr =
                    aliases.length > 0
                      ? ` (aka: ${aliases.slice(0, 3).join(", ")})`
                      : "";
                  return `- ${k}${aliasStr}`;
                })
                .join("\n")}

              INSTRUCTIONS:
              1. Return a JSON object where keys are the field names.
              2. Extract the exact value found in the text.
              3. If a value is not found, OMIT the key from the JSON.
              4. Do not hypothesize or hallucinate.
              
              JSON:
            `,
          }),
          timeoutPromise,
        ])) as any;

        const rawAiText = response.text;
        const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON object found in response");
        const parsed = JSON.parse(jsonMatch[0]);

        if (process.env.DEBUG_PARSER) {
          console.log(
            "🤖 Raw AI Parsed Spec:",
            JSON.stringify(parsed, null, 2),
          );
        }

        // � Pre-filter: Remove common "not found" hallucinations before validation
        const notFoundPhrases = [
          "nicht angegeben",
          "nicht verfügbar",
          "keine angabe",
          "k.a.",
          "n/a",
          "not specified",
          "not available",
          "none",
          "unknown",
        ];

        for (const key of Object.keys(parsed)) {
          const val = String(parsed[key]).toLowerCase().trim();
          if (
            notFoundPhrases.includes(val) ||
            val === "-" ||
            val === "null" ||
            val === ""
          ) {
            delete parsed[key];
          }
        }

        // �🛡️ SOFT VALIDATION: Validate field by field so one failure doesn't kill the whole response
        const validated: any = {};
        for (const [key, val] of Object.entries(parsed)) {
          const fieldSchema = shape[key];
          if (!fieldSchema) continue; // Hallucinated key

          try {
            validated[key] = fieldSchema.parse(val);
          } catch (err: any) {
            console.warn(
              `⚠️ PASS 2: Validation failed for field "${key}" (Value: "${val}"). Reason: ${err.message}`,
            );
            // Drop this specific field but preserve others
          }
        }

        const aiSpecs = this.sanitizeSpecs(validated, remainingFields);
        const finalSpecs = { ...deterministicSpecs, ...aiSpecs };
        const combined = { ...deterministicSpecs, ...finalSpecs };

        const finalResults = this.validateAndCleanResult(combined);
        if (Object.keys(finalResults).length > 0) {
          console.log(
            `📊 Final Extraction Result:`,
            JSON.stringify(finalResults, null, 2),
          );
        }
        return finalResults;
      } catch (e: any) {
        console.warn(
          `⚠️ PASS 2: Primary attempt failed (${e.message}). Trying emergency loose fallback...`,
        );

        const looseResult = await generateText({
          model: this.ollama(targetModel, { numCtx: 4096 }),
          temperature: 0,
          system: "Technical extractor. Extract the requested keys as JSON.",
          prompt: `
            Analyze the following text and extract these technical specifications as JSON.
            
            PRODUCT: "${productTitle}"
            KEYS: ${remainingFields.join(", ")}
            CONTEXT: ${context}
            
            JSON:
          `,
        });

        const looseAiText = looseResult.text;
        const looseJsonMatch = looseAiText.match(/\{[\s\S]*\}/);
        if (!looseJsonMatch) throw new Error("No JSON found in loose fallback");
        const looseParsed = JSON.parse(looseJsonMatch[0]);
        const aiSpecs = this.sanitizeSpecs(looseParsed, remainingFields);
        const combined = { ...deterministicSpecs, ...aiSpecs };
        const finalResults = this.validateAndCleanResult(combined);
        if (Object.keys(finalResults).length > 0) {
          console.log(
            `📊 Final Extraction Result (Loose):`,
            JSON.stringify(finalResults, null, 2),
          );
        }
        return finalResults;
      }
    } catch (error: any) {
      if (error.message.includes("TIMEOUT")) {
        console.warn(
          `🕒 Timeout: Pass 2 failed to respond for "${targetModel}"`,
        );
      } else {
        console.error("❌ PASS 2: Failed:", error.message);
      }
      return deterministicSpecs;
    }
  }

  /**
   * Refines field type by looking at a high-quality reference
   */
  private getFieldTypeFromReference(
    field: string,
    referenceSpecs: any,
  ): "BOOLEAN" | "MEASUREMENT" | "OTHER" {
    const val = referenceSpecs[field];
    if (val === "Ja" || val === "Nein") {
      // PROHIBIT forcing certain fields to BOOLEAN based on reference
      const lower = field.toLowerCase();
      if (
        lower.includes("farbe") ||
        lower.includes("material") ||
        lower.includes("schnittstelle")
      ) {
        return "MEASUREMENT";
      }
      return "BOOLEAN";
    }

    // Check if it has units (Number + Unit)
    if (typeof val === "string" && /\d+[\s,.]*[a-zA-Z%]+/.test(val))
      return "MEASUREMENT";

    return this.getFieldType(field);
  }

  /**
   * Identifies if a field is a Boolean (Ja/Nein) or a Measurement (Text)
   */
  private getFieldType(field: string): "BOOLEAN" | "MEASUREMENT" | "OTHER" {
    const lower = field.toLowerCase();

    // Explicit Booleans
    const booleans = [
      "gps",
      "bluetooth",
      "wlan",
      "nfc",
      "mikrofon",
      "lautsprecher",
      "wasserschutz",
      "notruf",
      "sturzerkennung",
      "kamera",
      "led",
      "display",
      "beleuchtung",
      "touchscreen",
      "sensor",
      "radio",
      "video",
      "blitz",
      "glonass",
      "beidou",
      "galileo",
      "sos",
      "nvme",
      "hdr",
      "reflex",
      "g-sync",
      "freesync",
      "raytracing",
      "dlss",
      "fsr",
      "wifi",
      "anc",
      "geräuschunterdrückung",
      "unterdrückung",
    ];

    // Explicit Exclusions (Contains keyword but isn't a boolean)
    const exclusions = [
      "dauer",
      "zeit",
      "kapazität",
      "version",
      "typ",
      "größe",
      "auflösung",
      "leistung",
      "stärke",
      "standard",
      "standards",
      "gewicht",
      "breite",
      "höhe",
      "tiefe",
      "dicke",
      "pixel",
      "volt",
      "zoom",
      "hertz",
      "hz",
      "watt",
      "gramm",
      "kg",
      "farbe",
      "material",
      "schnittstelle",
      "anschluss",
      "audio",
      "strom",
      "spannung",
      "frontkamera",
      "pixel",
    ];

    if (exclusions.some((exc) => lower.includes(exc))) return "MEASUREMENT";
    if (booleans.some((bool) => lower.includes(bool))) return "BOOLEAN";

    return "OTHER";
  }

  /**
   * Identifies if a field is likely a boolean based on its name and source text.
   */
  private detectBoolean(field: string, source: string): boolean {
    const lowerField = field.toLowerCase();
    const lowerSource = source.toLowerCase();
    const title = lowerSource.split("\n")[0];

    // 1. Only allow highly confident fields for generic presence check
    const genericFields = [
      "wlan",
      "bluetooth",
      "wifi",
      "gps",
      "nfc",
      "touchscreen",
      "kamera",
      "mikrofon",
      "lautsprecher",
      "anc",
    ];
    if (genericFields.includes(lowerField)) {
      const positiveMarkers = [
        "ja",
        "yes",
        "vorhanden",
        "true",
        "wlan",
        "bluetooth",
        "wifi",
        "nfc",
        "anc",
        "touch",
      ];
      return positiveMarkers.some((m) => title.includes(m));
    }

    // 2. For all other fields (e.g. "Videospiel enthalten"), we REQUIRE a title-match
    // with very specific keywords (excluding generic "bundle" which is ambiguous)
    if (lowerField.includes("enthalten") || lowerField.includes("integriert")) {
      const positiveMarkers = ["inklusive", "mit voucher", "mit spiel"];
      return positiveMarkers.some((m) => title.includes(m));
    }

    return false;
  }

  /**
   * Specifically looks for "Key: Value" patterns in the source text.
   * This is HIGH CONFIDENCE extraction.
   */
  private extractLabeledValue(
    field: string,
    source: string,
    type:
      | "numeric"
      | "enum"
      | "pattern"
      | "boolean"
      | "BOOLEAN"
      | "MEASUREMENT",
    options?: { units?: string[]; pattern?: string; enumOptions?: string[] },
    aliases?: string[],
  ): string | null {
    const fieldLower = field.toLowerCase();
    const sourceLower = source.toLowerCase();

    // 1. Create a list of potential labels for this field
    const labels = Array.from(new Set([fieldLower, ...(aliases || [])]));
    const def = FIELD_DEFINITIONS[field];
    if (def?.sample) {
      def.sample.forEach((s) => labels.push(s.toLowerCase()));
    }

    // 2. Search for Label: Value pattern
    for (const label of labels) {
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Look for label followed by optional whitespace and colon/equals and more optional whitespace
      const labelRegex = new RegExp(
        `(?:^|[\\n\\s\\.\\,])\\s*${escapedLabel}\\s*[:=]\\s*(.{1,100})`,
        "i",
      );

      const multiValueFields = [
        "Produktfarbe",
        "Betriebssystem",
        "Zusätzliche Funktionen",
      ];
      let potentialVal;
      const match = source.match(labelRegex);
      if (multiValueFields.includes(field)) {
        potentialVal = match?.[1]?.split(/[\n\r;|]|\.(?!\d)/)[0]?.trim();
      } else {
        potentialVal = match?.[1]
          ?.split(/[\n\r;|]|\.(?!\d)|,(?!\d)/)[0]
          ?.trim();
      }

      if (!potentialVal) {
        // Try reversed: (Value Label) - e.g. "445g Gewicht"
        // We look for a numeric value at the end of the prefix
        const unitPattern = (def?.units || [])
          .filter((u) => u.toLowerCase() !== label.toLowerCase())
          .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");
        const reversedRegex = new RegExp(
          `(\\b\\d+(?:[.,]\\d+)*\\s*(?:${unitPattern})?)\\s+${escapedLabel}\\b`,
          "i",
        );
        const revMatch = source.match(reversedRegex);
        if (revMatch) {
          potentialVal = revMatch[1].split(/[\n\r;]|,(?!\d)/)[0].trim();
        }
      }

      if (potentialVal) {
        // Validation based on type
        if (type === "numeric") {
          const uniqueUnits = [
            "mah",
            "tdp",
            "dpi",
            "lux",
            "nit",
            "cd/m²",
            "ms",
            "db",
          ];
          const unitPattern = (options?.units || uniqueUnits)
            .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|");
          const valMatch = potentialVal.match(
            new RegExp(`^(\\d+(?:[.,]\\d+)*)\\s*(${unitPattern})?\\b`, "i"),
          );
          if (valMatch) return valMatch[0];
        } else if (type === "pattern" && options?.pattern) {
          const valMatch = potentialVal.match(new RegExp(options.pattern, "i"));
          if (valMatch) return valMatch[0];
        }

        // Final fallback for all types if a potential value was matched but not specifically validated
        return potentialVal;
      }
    }

    return null;
  }

  private isNegated(match: string, source: string, index?: number): boolean {
    const lowSource = source.toLowerCase();
    const lowMatch = match.toLowerCase();

    // Look at context around the match (30 chars before)
    const matchIdx = index !== undefined ? index : lowSource.indexOf(lowMatch);
    if (matchIdx === -1) return false;

    const contextBefore = lowSource.substring(
      Math.max(0, matchIdx - 30),
      matchIdx,
    );
    const contextAfter = lowSource.substring(
      matchIdx + lowMatch.length,
      Math.min(lowSource.length, matchIdx + lowMatch.length + 30),
    );

    const negativeMarkers = [
      "nein",
      "no",
      "not",
      "nicht",
      "kein",
      "ohne",
      "deactivated",
      "off",
      "false",
      "without",
      "exclude",
    ];

    const cleanAfter = contextAfter.replace(/^[^a-z0-9]+/i, "").trim();

    // Check if any negative marker appears close to the match
    // specifically as a "Value" for a "Key: Value" pattern or prefix
    return (
      negativeMarkers.some((m) => cleanAfter.startsWith(m)) ||
      negativeMarkers.some((m) =>
        new RegExp(`\\b${m}\\b`, "i").test(contextBefore),
      )
    );
  }

  /**
   * PASS 1: Deterministic Rules (Title-Greedy)
   */
  public deterministicExtract(
    title: string,
    text: string,
    fields: string[],
    example?: { title: string; specs: any },
    category: string = "unknown",
  ): any {
    const specs: any = {};
    const lowerTitle = title.toLowerCase();
    const lowerText = text.toLowerCase();
    const fullSource = `${lowerTitle} ${lowerText}`;

    // 1. Static Rules (Universal Tech)
    const unifiedRules: Record<
      string,
      {
        patterns: (string | RegExp)[];
        value:
          | string
          | ((m: string, source?: string, index?: number) => string);
      }
    > = {
      GPS: {
        patterns: ["gps", "ortung", "glonass", "beidou", "galileo"],
        value: (m, source, idx) =>
          this.isNegated(m, source || "", idx) ? "Nein" : "Ja",
      },
      "Videospiel enthalten": {
        patterns: ["inklusive spiel", "game included", "voucher", "mit spiel"],
        value: "Ja",
      },
      Bluetooth: {
        patterns: ["bluetooth", "\\bbt\\b", "bt5", "bt4"],
        value: (m, source, idx) =>
          this.isNegated(m, source || "", idx) ? "Nein" : "Ja",
      },
      WLAN: {
        patterns: ["wlan", "wifi", "wi-fi", "802.11"],
        value: (m, source, idx) =>
          this.isNegated(m, source || "", idx) ? "Nein" : "Ja",
      },
      NFC: {
        patterns: ["nfc", "nahbereich"],
        value: (m, source, idx) =>
          this.isNegated(m, source || "", idx) ? "Nein" : "Ja",
      },
      "Anzahl Prozessorkerne": {
        patterns: [
          /\b(\d+)[\W_]?core\s+cpu\b/i,
          /cpu\s*[:=]\s*(\d+)\s*kern/i,
          /\b(\d+)[-\s]core\b/i,
          /octa-core/i,
          /hexa-core/i,
          /quad-core/i,
        ],
        value: (m) => {
          if (m.toLowerCase().includes("octa")) return "8";
          if (m.toLowerCase().includes("hexa")) return "6";
          if (m.toLowerCase().includes("quad")) return "4";
          const num = m.match(/\d+/);
          return num ? num[0] : "1";
        },
      },
      Netzwerk: {
        patterns: ["5g", "4g", "lte", "3g"],
        value: (m) => m.toLowerCase(),
      },
      Ladegeschwindigkeit: {
        patterns: [" laden", " charging", "\\d+\\s*w\\b", "\\d+\\s*watt\\b"],
        value: (m) => {
          const val = m.match(/(\d+)/)?.[1];
          return val ? `${val} W` : "Ja";
        },
      },
      "Anzahl HDMI-Anschlüsse": {
        patterns: [
          /(\d+)\s*(?:x)?\s*hdmi/i,
          "hdmi-anschluss:?\\s*(\\d+)",
          "hdmi\\s*(?:(?:anschluss|port|schnittstelle)s?)?\\s*[:=]\\s*(\\d+)",
        ],
        value: (m) => (m.match(/\d+/) || ["1"])[0],
      },
      "Anzahl DisplayPort Anschlüsse": {
        patterns: [
          /(\d+)\s*(?:x)?\s*displayport/i,
          /displayport-anschluss:?\\s*(\d+)/i,
          /displayport\\s*(?:(?:anschluss|port|schnittstelle)s?)?\\s*[:=]\\s*(\d+)/i,
        ],
        value: (m) => (m.match(/\d+/) || ["1"])[0],
      },
      "Videospeicher-Kapazität": {
        patterns: [/\b(\d+)\s*(?:gb|g)\b\s*g?ddr/i, /\b(\d+)\s*gb\s*vram\b/i],
        value: (m) => {
          const num = m.match(/\d+/);
          return num ? `${num[0]} GB` : m;
        },
      },
      "Maximale Schleuderdrehzahl": {
        patterns: [/\b(\d+)\s*(?:u\/min|rpm)\b/i],
        value: (m) => {
          const num = m.match(/\d+/);
          return num ? `${num[0]} RPM` : m;
        },
      },
      "HDMI-Version": {
        patterns: [/hdmi\s*(\d+\.\d+[a-z]?)/i, /versio\s*(\d+\.\d+[a-z]?)/i],
        value: (m) => {
          const v = m.match(/(\d+\.\d+[a-z]?)/i);
          return v ? v[1].toLowerCase() : m;
        },
      },
      Prozessor: {
        patterns: [
          "m\\d\\s*(?:pro|max|ultra)?",
          "ryzen\\s*\\d",
          "intel\\s*core",
          "dimensity",
          "snapdragon",
        ],
        value: (m) => m.charAt(0).toUpperCase() + m.slice(1),
      },
      GPU: {
        patterns: [
          "rtx\\s*\\d{4}\\s*(?:ti|super)?",
          "rx\\s*\\d{4}\\s*xt?",
          "geforce\\s*rtx\\s*\\d{4}\\s*(?:ti|super)?",
          "radeon\\s*rx\\s*\\d{4}\\s*xt?",
          "geforce",
          "radeon",
        ],
        value: (m) => m.toUpperCase(),
      },
      "Interner Speichertyp": {
        patterns: [/\b(g?ddr[3-6][x]?)\b/i, /\blpddr[4-5][x]?\b/i, "sdram"],
        value: (m) => m.toUpperCase(),
      },
      Speicherdatenübertragungsrate: {
        patterns: ["\\b\\d+\\s?mhz\\b", "\\b\\d+\\s?mt/s\\b"],
        value: (m) => {
          const val = m.match(/(\d+)/)?.[1];
          return `${val} MT/s`; // Tech: DDR means MHz label usually refers to MT/s
        },
      },
      Lesegeschwindigkeit: {
        patterns: [
          "lesegeschwindigkeit[:\\s]*(\\d+(?:[.,]\\d+)?)?\\s*mb/s",
          "read[:\\s]*(\\d+(?:[.,]\\d+)?)?\\s*mb/s",
          "lesen[:\\s]*(\\d+(?:[.,]\\d+)?)?\\s*mb/s",
          "(\\d+(?:[.,]\\d+)?)/(?:\\d+(?:[.,]\\d+)?)\\s*mb/s", // e.g. 1000/800 MB/s
        ],
        value: (m) => {
          const val = m.match(/(\d+(?:[.,]\d+)?)/)?.[1];
          return val ? `${val} MB/s` : m;
        },
      },
      Schreibgeschwindigkeit: {
        patterns: [
          "schreibgeschwindigkeit[:\\s]*(\\d+(?:[.,]\\d+)?)?\\s*mb/s",
          "write[:\\s]*(\\d+(?:[.,]\\d+)?)?\\s*mb/s",
          "schreiben[:\\s]*(\\d+(?:[.,]\\d+)?)?\\s*mb/s",
          "(?:\\d+(?:[.,]\\d+)?)/(\\d+(?:[.,]\\d+)?)\\s*mb/s", // e.g. 1000/800 MB/s
        ],
        value: (m) => {
          const val =
            m.split("/").length > 1
              ? m.split("/")[1].match(/(\d+(?:[.,]\d+)?)/)?.[1]
              : m.match(/(\d+(?:[.,]\\d+)?)/)?.[1];
          return val ? `${val} MB/s` : m;
        },
      },
      Geräuschunterdrückung: {
        patterns: [
          "anc",
          "geräuschunterdrückung",
          "noise cancelling",
          "noise cancellation",
        ],
        value: "Ja",
      },
      ECC: {
        patterns: ["\\bnon-ecc\\b", "\\bno-ecc\\b", "\\becc\\b"],
        value: (m) => (m.toLowerCase().includes("non") ? "Nein" : "Ja"),
      },
      "CAS Latenz": {
        patterns: ["\\bcl\\s?\\d+(?:-\\d+)*\\b"],
        value: (m) => m.toUpperCase().replace(/\s/g, ""),
      },
      "Memory Formfaktor": {
        patterns: [
          "\\bu-?dimm\\b",
          "\\bs[ou]-?dimm\\b",
          "\\bdimm\\b",
          "\\br-?dimm\\b",
          "\\blrd-?dimm\\b",
        ],
        value: (m) => m.toUpperCase().replace("-", ""),
      },
      Speicherspannung: {
        patterns: ["\\b(\\d+(?:[.,]\\d+)?)\\s*v\\b"],
        value: (m) => m.toLowerCase().replace(/\s/g, ""),
      },
      Speicherrangfolge: {
        patterns: ["\\b\\d+rx\\d+\\b"],
        value: (m) => m.toUpperCase(),
      },
      Modulkonfiguration: {
        patterns: [
          "\\b(\\d+)\\s*[x*]\\s*(\\d+)\\s?(gb|tb)\\b",
          "kit\\s*\\(?(\\d+)\\s*[x*]\\s*(\\d+)\\)?",
        ],
        value: (m) =>
          m
            .toUpperCase()
            .replace(/\s/g, "")
            .replace("KIT", "")
            .replace("(", "")
            .replace(")", ""),
      },
      "Speicherlayout (Module x Größe)": {
        patterns: [
          "\\b(\\d+)\\s*[x*]\\s*(\\d+)\\s?(gb|tb)\\b",
          "kit\\s*\\(?(\\d+)\\s*[x*]\\s*(\\d+)\\)?",
        ],
        value: (m) =>
          m
            .toUpperCase()
            .replace(/\s/g, "")
            .replace("KIT", "")
            .replace("(", "")
            .replace(")", ""),
      },
      "Gepufferter Speichertyp": {
        patterns: [
          "\\bunbuffered\\b",
          "\\bbuffered\\b",
          "\\bregistered\\b",
          "\\bungepuffert\\b",
          "\\bgepuffert\\b",
        ],
        value: (m) => {
          const low = m.toLowerCase();
          if (low.includes("un")) return "Unbuffered";
          if (low.includes("reg")) return "Registered";
          return "Buffered";
        },
      },

      "Kompatible Materialien": {
        patterns: ["pla", "abs", "petg", "tpu", "nylon", "pva", "asa"],
        value: (m) => m.toLowerCase(),
      },
      Autonivellierung: {
        patterns: [
          "auto leveling",
          "autonivellierung",
          "cr touch",
          "bl touch",
          "sensor",
          "nivellier",
        ],
        value: "Ja",
      },
      "Extruder-Typ": {
        patterns: [
          "direct drive",
          "sprite",
          "bowden",
          "direktantrieb",
          "dual z",
        ],
        value: (m) =>
          m.toLowerCase().includes("direct") ||
          m.toLowerCase().includes("direkt")
            ? "Direct Drive"
            : m.charAt(0).toUpperCase() + m.slice(1),
      },
      "KI-Kamera": {
        patterns: ["ai-kamera", "ki-kamera", "ai-camera", "kamera", "cam"],
        value: "Ja",
      },
      "Bauraum-Heizung": {
        patterns: [
          "beheizter druckraum",
          "kammerheizung",
          "bauraumheizung",
          "chamber heat",
        ],
        value: "Ja",
      },
      Besonderheiten: {
        patterns: [
          "servo-motoren",
          "plug-&-play",
          "cfs",
          "multimaterial",
          "multicolor",
          "16 farben",
        ],
        value: (m) => m.toUpperCase(),
      },
      "Eingebautes Display": {
        patterns: ["touchscreen", "display", "bildschirm", "lcd", "oled"],
        value: "Ja",
      },
      "Automatische Nivellierung": {
        patterns: [
          "auto leveling",
          "auto-leveling",
          "automatische nivellierung",
          "cr-touch",
          "bltouch",
          "sensor",
          "nivellier",
        ],
        value: "Ja",
      },
      "ISO-Empfindlichkeit": {
        patterns: [
          "iso\\s*(\\d+(?:[.,]\\d+)?(?:(?:\\s*-\\s*|\\/)\\d+(?:[.,]\\d+)?)?)",
        ],
        value: (m) => m.toUpperCase(),
      },
      "Megapixel insgesamt": {
        patterns: ["(\\d+(?:[.,]\\d+)?)\\s*(?:mp|megapixel)"],
        value: (m) =>
          m.toLowerCase().replace("megapixel", "MP").replace("mp", "MP"),
      },
      "Kamera-Typ": {
        patterns: [
          "systemkamera",
          "spiegellos",
          "dslr",
          "dslm",
          "kompaktkamera",
          "bridgekamera",
        ],
        value: (m) => m.charAt(0).toUpperCase() + m.slice(1),
      },
      Gewicht: {
        patterns: ["\\b\\d+(?:[.,]\\d+)?\\s?(?:g|kg|gramm)\\b"],
        value: (m) => m.toLowerCase(),
      },
      Bildschirmdiagonale: {
        patterns: [/\b\d+(?:[.,]\d+)?\s?(?:"|zoll|inch|cm)/i],
        value: (m) => m.toLowerCase().replace("inch", '"').replace("zoll", '"'),
      },
      "Display-Auflösung": {
        patterns: ["\\b\\d{3,5}\\s*[x*]\\s*\\d{3,5}\\b"],
        value: (m) => m.toLowerCase().replace(" ", ""),
      },
      Bildschirmauflösung: {
        patterns: ["\\b\\d{3,5}\\s*[x*]\\s*\\d{3,5}\\b"],
        value: (m) => m.toLowerCase().replace(" ", ""),
      },
      "Akku-/Batteriekapazität": {
        patterns: ["\\b\\d+\\s?mah\\b", "\\b\\d+\\s?wh\\b"],
        value: (m) => m.toUpperCase().replace(/\s/g, ""),
      },
      Akkulaufzeit: {
        patterns: [/\b(\d+)\s?(?:h|stunden|hours)\b/i],
        value: (m) => {
          const num = m.match(/\d+/);
          return num ? `${num[0]} h` : m;
        },
      },
      Wasserschutz: {
        patterns: ["\\bip\\d{2}\\b"],
        value: (m) => m.toUpperCase(),
      },
      "IP-Schutzklasse": {
        patterns: ["\\bip\\d{2}\\b"],
        value: (m) => m.toUpperCase(),
      },
      Energieeffizienzklasse: {
        patterns: [
          /Energieeffizienzklasse\s*[:=]?\s*([A-G](\+\+\+)?)\b/i,
          /\bKlasse\s*([A-G](\+\+\+)?)\b/i,
          /\b[A-G](\+\+\+)?\b/i,
        ],
        value: (m) => m.toUpperCase().replace("KLASSE", "").trim(),
      },
      Geräuschemissionsklasse: {
        patterns: [
          /Geräuschemissionsklasse\s*[:=]?\s*([A-D])\b/i,
          /Noise\s*[:=]?\s*Klasse\s*([A-D])\b/i,
          /Lärmwert\s*[:=]?\s*([A-D])\b/i,
        ],
        value: (m) => {
          const match = m.match(/[A-D]/i);
          return match ? match[0].toUpperCase() : m;
        },
      },
      "Prozessor Lithografie": {
        patterns: [/\b(\d+)\s?nm\b/i, /fertigung\s*[:=]?\s*(\d+)\s?nm/i],
        value: (m) => {
          const num = m.match(/\d+/);
          return num ? `${num[0]} nm` : m;
        },
      },
      "USB-Anschluss": {
        patterns: ["usb-c", "usb type-c", "micro-usb", "lightning"],
        value: (m) => m.toUpperCase(),
      },
      "Integrierter Kartenleser": {
        patterns: ["kartenleser", "card reader", "sd-slot", "tf-card"],
        value: "Ja",
      },
      // --- NEW OPTIMIZED RULES ---
      "Anzahl Lüfter": {
        patterns: [
          /(\d+)\s*(?:x|mal)?\s*(?:\d+mm)?\s*(?:lüfter|fan|fans)/i, // "3x Lüfter", "2 fans"
          /(?:lüfter|fans)\s*[:=]\s*(\d+)/i,
        ],
        value: (m) => {
          const num = m.match(/\d+/);
          return num ? num[0] : "1";
        },
      },
      Produktfarbe: {
        patterns: [
          /\s-\s([a-zA-ZäöüÄÖÜß\s]+)$/, // Title Suffix: " - Himmelblau"
          /\bfarbe\s*[:=]\s*([^;\n\.]+)/i,
          /\bfarben\s*[:=]\s*([^;\n\.]+)/i,
          /\bcolor\s*[:=]\s*([^;\n\.]+)/i,
          /\bschwarz\b/i,
          /\bweiß\b/i,
          /\bgrau\b/i,
          /\bsilber\b/i,
          /\brot\b/i,
          /\bblau\b/i,
          /\bgrün\b/i,
          /\bgold\b/i,
          /\banthrazit\b/i,
          /\btürkis\b/i,
          /\bblack\b/i,
          /\bwhite\b/i,
          /\bgrey\b/i,
          /\bgray\b/i,
          /\bsilver\b/i,
          /\bred\b/i,
          /\bblue\b/i,
          /\bgreen\b/i,
          /\bgold\b/i,
          /\bmitternacht\b/i, // Midnight
          /\bpolaristern\b/i, // Starlight
          /\bspace\s?grau\b/i,
          /\bspace\s?grey\b/i,
        ],
        value: (m, source, index) => {
          // Check for Title Suffix Match (group 1)
          const suffixMatch = m.match(/\s-\s([a-zA-ZäöüÄÖÜß\s]+)$/);
          if (
            suffixMatch &&
            index &&
            source &&
            index + m.length === source.length
          ) {
            // Verify it is at end of title?
            // Regex $ ensures end of string (if matched against title).
            // But 'm' passed here is just the matched string?
            // No, m is the full match usually.
            return suffixMatch[1].trim();
          }
          if (m.startsWith(" - ")) return m.replace(" - ", "").trim();

          // Basic translation
          const map: Record<string, string> = {
            black: "Schwarz",
            white: "Weiß",
            grey: "Grau",
            gray: "Grau",
            silver: "Silber",
            red: "Rot",
            blue: "Blau",
            green: "Grün",
            yellow: "Gelb",
            gold: "Gold",
            pink: "Rosa",
            purple: "Lila",
            brown: "Braun",
            beige: "Beige",
            turquoise: "Türkis",
            anthracite: "Anthrazit",
            midnight: "Mitternacht",
            starlight: "Polarstern",
          };
          const lower = m.toLowerCase();
          return map[lower] || lower.charAt(0).toUpperCase() + lower.slice(1);
        },
      },
      Speicherkapazität: {
        patterns: [
          // Explicit Label
          /(?:ssd|hdd|speicher|kapazität)\s*[:=]\s*(\d+\s*(?:tb|gb|mb|rom))/i,
          // Large sizes (likely storage) - Safe to be loose
          /\b((?:256|512|960|1000|2000)\s*(?:gb|mb))\b/i,
          /\b((?:1|2|4|8)\s*tb)\b/i,
          // Small sizes REQUIRING context (to avoid RAM confusion)
          /\b((?:16|32|64|128)\s*(?:gb|mb))(?:\s+[^,\n]+)?\s+(?:ssd|hdd|festplatte|speicher|storage|flash|rom)/i,
          // Apple/Generic Style: (..., 256 GB) that is NOT near RAM
          /\b(\d+\s*(?:gb|tb))\s*[)-](?!\s*arbeitsspeicher|\s*ram)/i,
          /(?<!arbeitsspeicher.{0,20})(\b(?:256|512|960|1024)\s*gb)/i,
        ],
        value: (m) => {
          const match = m.match(/(\d+\s*(?:gb|mb|tb))/i);
          return match ? match[0].toUpperCase().replace(/\s/g, "") : m;
        },
      },
      Gesamtspeicherkapazität: {
        patterns: [
          /Gesamtspeicherkapazität\s*[:=]\s*(\d+\s*(?:gb|tb))/i,
          /(\d+\s*(?:gb|tb))\s*ssd\b/i,
          /\b(\d+\s*(?:gb|tb))\s*[)-](?!\s*arbeitsspeicher|\s*ram)/i,
        ],
        value: (m) => {
          const match = m.match(/\d+\s*(?:gb|tb)/i);
          return match ? match[0].toUpperCase().replace(/\s/g, "") : m;
        },
      },
      "Arbeitsspeicher (RAM)": {
        patterns: [
          /(\d+\s?gb)\s+(?:gemeinsamer\s+)?arbeitsspeicher/i,
          /(\d+\s?gb)\s+unified\s+memory/i,
          /(\d+\s?gb)\s+ram/i,
          /ram\s*[:=]\s*(\d+\s?gb)/i,
        ],
        value: (m) => {
          const size = m.match(/(\d+\s?gb)/i);
          return size ? size[1].toUpperCase().replace(/\s/g, "") : m;
        },
      },

      "Anzahl Grafikkartenkerne": {
        patterns: [
          /\b(\d+)[\W_]?core\s+gpu\b/i,
          /gpu\s*[:=]\s*(\d+)\s*kern/i,
          /(\d+)[\W_]?core\s+gpu/i,
        ],
        value: (m) => {
          const num = m.match(/\d+/);
          return num ? num[0] : m;
        },
      },
      "WLAN Standard": {
        patterns: [/wlan\s?6e?/i, /wifi\s?6e?/i, /802\.11\s?ax/i],
        value: "Wi-Fi 6E",
      },
      "Bluetooth-Version": {
        patterns: [/bluetooth\s?5\.?3?/i], // Matches "Bluetooth 5.3"
        value: "5.3",
      },
      Schnittstellen: {
        patterns: [
          /thunderbolt\s?4/i,
          /usb[\W_]?4/i,
          /magsafe/i,
          /kopfhöreranschluss/i,
        ],
        value: (m) => {
          if (/thunderbolt/i.test(m)) return "Thunderbolt 4";
          if (/magsafe/i.test(m)) return "MagSafe 3";
          return m; // Should map better
        },
      },
      Frontkamera: {
        patterns: [/12\s?mp/i, /center\s+stage/i],
        value: "12 MP",
      },
      "Display-Technologie": {
        patterns: [/liquid\s+retina/i, /retina\s+display/i],
        value: "Liquid Retina",
      },
      "HDD Kapazität": {
        patterns: [
          /\b(\d+\s*(?:gb|tb))(?:\s+\w+){0,3}\s+(?:hdd|festplatte|drive|hard\s*drive)\b/i,
          /HDD-Kapazität\s*[:=]\s*(\d+\s*(?:gb|tb))/i,
        ],
        value: (m) => {
          const match = m.match(/\d+\s*(?:gb|tb)/i);
          return match ? match[0].toUpperCase() : m;
        },
      },
      "SSD Speicherkapazität": {
        patterns: [
          /\b(\d+\s*(?:gb|tb))\s*ssd\b/i,
          /SSD-Speicherkapazität\s*[:=]\s*(\d+\s*(?:gb|tb))/i,
        ],
        value: (m) => {
          const match = m.match(/\d+\s*(?:gb|tb)/i);
          return match ? match[0].toUpperCase() : m;
        },
      },
      "Interne Speicherkapazität": {
        patterns: [
          /interner\s+speicher\s*[:=]\s*(\d+\s*(?:gb|tb))/i,
          /(\d+\s*(?:gb|tb))\s+rom/i,
        ],
        value: (m) => {
          const match = m.match(/\d+\s*(?:gb|tb)/i);
          return match ? match[0].toUpperCase() : m;
        },
      },
      "HDD Geschwindigkeit": {
        patterns: [/\b(\d+)\s*(?:rpm|u\/min)\b/i],
        value: (m) => {
          const num = m.match(/\d+/);
          return num ? `${num[0]} RPM` : m;
        },
      },
      Schnittstelle: {
        patterns: [
          /\b(sata|pcie|usb|nvme|thunderbolt|sas|m\.2|serial ata)\s*(?:iii|ii|i)?\b/i,
          /schnittstelle\s*[:=]\s*([^;|.]+)/i,
        ],
        value: (m) => m.toUpperCase(),
      },
      "HDD Größe": {
        patterns: [/\b(3\.5|2\.5|1\.8)\s*(?:"|zoll\b|inch\b)/i],
        value: (m) => {
          const match = m.match(/\d\.\d/);
          return match ? `${match[0]}"` : m;
        },
      },
      Betriebssystem: {
        patterns: [
          /\b(windows|macos|android|ios|linux|chromeos|ipados)\b/i,
          /betriebssystem\s*[:=]\s*([^;|.]+)/i,
        ],
        value: (m) => {
          const low = m.toLowerCase();
          if (low.includes("win")) return "Windows";
          if (low.includes("macos")) return "macOS";
          if (low.includes("android")) return "Android";
          if (low.includes("ios")) return "iOS";
          if (low.includes("linux")) return "Linux";
          return m.charAt(0).toUpperCase() + m.slice(1);
        },
      },
      Prozessorsockel: {
        patterns: [
          /\b(lga\s*\d+|am\d|s?tr\d|socket\s*[a-z0-9]+)\b/i,
          /sockel\s*[:=]\s*([^;|.]+)/i,
        ],
        value: (m) => m.toUpperCase(),
      },
    };

    // 🌟 PRE-PASS: Dimension Pattern (WxDxH) - ONLY IF LABELED
    const dimPattern =
      /(?:Abmessungen|Maße|Größe|Dimensions?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/i;
    const dimMatch = fullSource.match(dimPattern);

    if (dimMatch) {
      const [_, w, d, h, unit] = dimMatch;
      const dims: Record<string, string> = {
        Breite: w,
        Tiefe: d,
        Höhe: h,
        Verpackungsbreite: w,
        Verpackungstiefe: d,
        Verpackungshöhe: h,
      };
      fields.forEach((f) => {
        if (dims[f]) {
          const normed = normalizeValue(`${dims[f]} ${unit}`, "mm");
          if (normed) {
            specs[f] = `${normed.value.toString().replace(".", ",")} mm`;
          }
        }
      });
    }

    // Setup Category Context
    const categorySpecific = SmartParser.CATEGORY_ALIASES[category] || {};

    for (const field of fields) {
      // Skip if already found by pre-pass
      if (specs[field]) continue;

      const def = FIELD_DEFINITIONS[field];
      const fieldLower = field.toLowerCase();

      // Resolve Aliases: Category Specific > Global > Default
      let fieldAliases = [fieldLower];
      if (categorySpecific[field]) {
        fieldAliases = categorySpecific[field]; // Override with specific context
      } else if (SmartParser.FIELD_ALIASES[field]) {
        fieldAliases = SmartParser.FIELD_ALIASES[field];
      }

      const type =
        def?.type ||
        (example
          ? this.getFieldTypeFromReference(field, example.specs)
          : this.getFieldType(field));

      // --- STEP 1: LABELED EXTRACTION (Highest Confidence) ---

      const labeledTitle = this.extractLabeledValue(
        field,
        lowerTitle,
        type as any,
        {
          units: def?.units,
          pattern: (def as any)?.pattern,
          enumOptions: def?.options,
        },
        fieldAliases,
      );
      if (labeledTitle) {
        specs[field] = this.normalizeAIValue(field, labeledTitle);
      } else {
        const labeledText = this.extractLabeledValue(
          field,
          lowerText,
          type as any,
          {
            units: def?.units,
            pattern: (def as any)?.pattern,
            enumOptions: def?.options,
          },
          fieldAliases,
        );
        if (labeledText) {
          specs[field] = this.normalizeAIValue(field, labeledText);
        }
      }

      // --- STEP 2: GOLDEN RULES (Pattern based with word boundaries) ---
      if (!specs[field]) {
        const rule = unifiedRules[field];
        if (rule) {
          for (const p of rule.patterns) {
            let regex: RegExp;

            if (p instanceof RegExp) {
              regex = p;
            } else if (typeof p === "string") {
              if (p.startsWith("\\b") || p.endsWith("\\b")) {
                regex = new RegExp(p, "i");
              } else {
                regex = new RegExp(`\\b${p}\\b`, "i");
              }
            } else {
              continue;
            }

            // A. Check Title first
            const titleMatch = lowerTitle.match(regex);
            if (titleMatch) {
              const matchedPart = titleMatch[1] || titleMatch[0];
              const newVal =
                typeof rule.value === "function"
                  ? rule.value(matchedPart, fullSource, titleMatch.index)
                  : rule.value;

              if (field === "Produktfarbe") {
                if (!specs[field]) {
                  specs[field] = newVal;
                } else if (!specs[field].includes(newVal)) {
                  specs[field] += `, ${newVal}`;
                }
              } else if (!specs[field]) {
                specs[field] = newVal;
                break;
              }
            }

            // B. Check Text ONLY if it's a very specific tech rule
            const highConfidenceFields = [
              "GPU",
              "Prozessor",
              "Netzwerk",
              "Bluetooth",
              "WLAN",
              "NFC",
              "GPS",
              "Anzahl Grafikkartenkerne",
              "WLAN Standard",
              "Bluetooth-Version",
              "Schnittstellen",
              "Frontkamera",
              "Display-Technologie",
              "Bildschirmdiagonale",
              "HDMI-Version",
              "ISO-Empfindlichkeit",
              "Megapixel insgesamt",
              "Megapixel (ca.)",
              "Kamera-Typ",
              "Produktfarbe",
              "Gewicht",
              "Interner Speichertyp",
              "Speicherkapazität",
              "Gesamtspeicherkapazität",
              "Interne Speicherkapazität",
              "Speicherdatenübertragungsrate",
              "Lesegeschwindigkeit",
              "Schreibgeschwindigkeit",
              "Prozessortaktfrequenz",
              "Ladegeschwindigkeit",
              "Spannung",
              "Akkulaufzeit",
              "Maximale Bildwiederholrate",
              "Prozessor Lithografie",
              "Geräuschemissionsklasse",
              "USB-Version",
              "ECC",
              "CAS Latenz",
              "Memory Formfaktor",
              "Speicherspannung",
              "Speicherrangfolge",
              "Speicherlayout (Module x Größe)",
              "Gepufferter Speichertyp",
              "Anzahl HDMI-Anschlüsse",
              "Anzahl DisplayPort Anschlüsse",
              "Videospeicher-Kapazität",
              "Maximale Schleuderdrehzahl",
              "Energieeffizienzklasse",
              "Geräuschemissionsklasse",
              "Anzahl Prozessorkerne",
              "Anzahl Lüfter",
              "Breite",
              "Höhe",
              "Tiefe",
              "Verpackungsbreite",
              "Verpackungshöhe",
              "Verpackungstiefe",
              "SSD Speicherkapazität",
              "HDD Kapazität",
              "HDD Geschwindigkeit",
              "HDD Größe",
              "Schnittstelle",
              "Prozessorsockel",
              "Betriebssystem",
              "Bildschirmdiagonale",
              "Display-Auflösung",
              "Bildschirmauflösung",
              "Akku-/Batteriekapazität",
              "Betriebssystem",
              "Wasserschutz",
              "IP-Schutzklasse",
              "USB-Anschluss",
              "Integrierter Kartenleser",
              "Geräuschunterdrückung",
            ];

            if (highConfidenceFields.includes(field)) {
              const textMatch = lowerText.match(regex);
              if (textMatch) {
                const matchedPart = textMatch[1] || textMatch[0];
                const newVal =
                  typeof rule.value === "function"
                    ? rule.value(
                        matchedPart,
                        fullSource,
                        lowerTitle.length + 1 + (textMatch.index || 0),
                      )
                    : rule.value;

                if (field === "Produktfarbe") {
                  if (!specs[field]) {
                    specs[field] = newVal;
                  } else if (!specs[field].includes(newVal)) {
                    specs[field] += `, ${newVal}`;
                  }
                } else if (!specs[field]) {
                  specs[field] = newVal;
                  break;
                }
              }
            }
          }
        }
      }

      // --- STEP 3: STRICT NUMERIC (Only for highly unique/unambiguous units) ---
      if (!specs[field] && def?.type === "numeric") {
        const uniqueUnits = [
          "mah",
          "tdp",
          "dpi",
          "lux",
          "nit",
          "cd/m²",
          "ms",
          "db",
          "mm/s",
          "°c",
          "mp",
          "megapixel",
          "iso",
          "mb/s",
          "gb/s",
          "mt/s",
          "hz",
          "mhz",
          "ghz",
          "w",
          "w",
          "watt",
          "v",
          "h",
          "cl",
          "mah",
          "wh",
          "mm",
          "cm",
          "g",
          "kg",
        ];
        const units = def.units || [];
        const unitsToMatch = units.filter((u) =>
          uniqueUnits.includes(u.toLowerCase()),
        );

        if (unitsToMatch.length > 0) {
          const unitPattern = unitsToMatch
            .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|");

          const regex = new RegExp(
            `(\\b\\d+(?:[.,]\\d+)*)\\s*(${unitPattern})\\b`,
            "i",
          );

          // Numeric search is ONLY allowed in TITLE to avoid noise in text
          const match = lowerTitle.match(regex);
          if (match) {
            const val = `${match[1]} ${match[2]}`;
            specs[field] = this.normalizeAIValue(field, val);
          }
        }
      }

      // --- STEP 4: STRICT BOOLEAN ---
      const isBool = (type as string).toLowerCase() === "boolean";
      if (!specs[field] && isBool) {
        if (this.detectBoolean(field, fullSource)) {
          if (
            field === "Videospiel enthalten" &&
            !lowerTitle.match(/bundle|inklusive|game|spiel/)
          ) {
            continue;
          }
          specs[field] = "Ja";
        }
      }

      // --- STEP 5: CROSS-VALIDATION (Maintain Reference-Level Consistency) ---
      // If we found a value but we ALSO have a high-quality example (e.g. Icecat/Intel)
      // for this exact product, we prioritize the example's precise formatting
      if (example?.specs?.[field] && specs[field]) {
        const refVal = String(example.specs[field]).toLowerCase();
        const foundVal = String(specs[field]).toLowerCase();

        // A. Digits match? (Strictly trust formatting)
        if (refVal.replace(/\D/g, "") === foundVal.replace(/\D/g, "")) {
          specs[field] = example.specs[field];
        }
        // B. Keyword Semantic match? (e.g. "DDR4 SDRAM" and "DDR4")
        else {
          const refWords = refVal.split(/[\s/-]/).filter((w) => w.length > 2);
          const foundWords = foundVal
            .split(/[\s/-]/)
            .filter((w) => w.length > 2);
          if (
            refWords.length > 0 &&
            refWords.every((rw) => foundVal.includes(rw))
          ) {
            specs[field] = example.specs[field]; // Reference is more detailed
          } else if (
            foundWords.length > 0 &&
            foundWords.every((fw) => refVal.includes(fw))
          ) {
            specs[field] = example.specs[field]; // Reference is authoritative
          }
        }
      }

      // Final step for each field in Pass 1: Polish and Normalize
      if (specs[field]) {
        specs[field] = this.normalizeAIValue(field, specs[field]);
      } else if (specs[field] === undefined) {
        specs[field] = null;
      }
    }

    const resolvedCount = Object.values(specs).filter((v) => v !== null).length;
    if (resolvedCount > 0) {
      console.log(`⚡️ PASS 1 (STRICT): Resolved ${resolvedCount} fields.`);
    }

    return specs;
  }

  private pruneSchema(
    productTitle: string,
    rawText: string,
    schema: string[],
  ): string[] {
    const productLower = productTitle.toLowerCase();
    const textLower = rawText.toLowerCase();
    const fullSource = `${productLower} ${textLower}`;
    const pruned = new Set<string>();

    const coreFields = [
      "Produktfarbe",
      "Gewicht",
      "Breite",
      "Höhe",
      "Tiefe",
      "Abmessungen",
      "Hersteller",
      "Modell",
      "Produkttyp",
    ];

    coreFields.forEach((f) => {
      if (schema.includes(f)) pruned.add(f);
    });

    schema.forEach((field) => {
      const fieldLower = field.toLowerCase();
      // Use static FIELD_ALIASES
      const fieldAliases = SmartParser.FIELD_ALIASES[field] || [fieldLower];

      if (fieldAliases.some((a) => fullSource.includes(a.toLowerCase()))) {
        pruned.add(field);
        return;
      }

      // 1. Direct match
      if (fullSource.includes(fieldLower)) {
        pruned.add(field);
        return;
      }

      // 2. Keyword match
      const keywords = fieldLower
        .split(/[\s\-\/\(\)]+/)
        .filter((k) => k.length >= 3);

      if (keywords.some((k) => fullSource.includes(k))) {
        pruned.add(field);
        return;
      }

      // 3. Alias match (Check other canonical fields)
      for (const [canonical, terms] of Object.entries(
        SmartParser.FIELD_ALIASES,
      )) {
        if (
          fieldLower.includes(canonical.toLowerCase()) ||
          canonical.toLowerCase().includes(fieldLower)
        ) {
          if (terms.some((t) => fullSource.includes(t.toLowerCase()))) {
            pruned.add(field);
            break;
          }
        }
      }

      // 4. Special Title-Greedy Check
      const techUnits = [
        "khz",
        "ghz",
        "mhz",
        "watt",
        "mah",
        "mp",
        "dpi",
        "lux",
        "nit",
        "db",
        "mm/s",
        "°c",
        "mm",
      ];
      if (techUnits.some((u) => productTitle.toLowerCase().includes(u))) {
        const unitToField: Record<string, string[]> = {
          "mm/s": ["geschwindigkeit"],
          watt: ["leistung"],
          gb: ["speicher", "ram"],
          tb: ["speicher"],
          hz: ["rate", "frequenz"],
          mp: ["auflösung"],
          mah: ["kapazität", "akku"],
        };

        for (const [unit, fieldsToKeep] of Object.entries(unitToField)) {
          if (
            productTitle.toLowerCase().includes(unit) &&
            fieldsToKeep.some((fk) => fieldLower.includes(fk))
          ) {
            pruned.add(field);
            return;
          }
        }

        if (
          fieldLower.includes("leistung") ||
          fieldLower.includes("frequenz") ||
          fieldLower.includes("auflösung") ||
          fieldLower.includes("decoder") ||
          fieldLower.includes("klang") ||
          fieldLower.includes("kanal")
        ) {
          pruned.add(field);
        }
      }
    });

    const result = Array.from(pruned);
    console.log(
      `✂️ Pruned schema for "${productTitle.slice(0, 30)}...": ${schema.length} -> ${result.length} fields`,
    );
    return result;
  }

  private getRelevantContext(text: string, fields: string[]): string {
    const textLower = text.toLowerCase();
    const ranges: { start: number; end: number }[] = [];
    const windowSize = 120; // Laser focus optimization

    fields.forEach((field) => {
      const aliases = SmartParser.FIELD_ALIASES[field] || [field.toLowerCase()];
      aliases.forEach((alias: string) => {
        let pos = textLower.indexOf(alias.toLowerCase());
        while (pos !== -1) {
          ranges.push({
            start: Math.max(0, pos - windowSize / 2),
            end: Math.min(text.length, pos + alias.length + windowSize / 2),
          });
          pos = textLower.indexOf(alias.toLowerCase(), pos + 1);
        }
      });
    });

    if (ranges.length === 0) return text.slice(0, 800); // Fallback

    // Sort and Merge Ranges
    ranges.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    if (ranges.length > 0) {
      let current = ranges[0];
      for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].start <= current.end) {
          current.end = Math.max(current.end, ranges[i].end);
        } else {
          merged.push(current);
          current = ranges[i];
        }
      }
      merged.push(current);
    }

    // Build context
    let context = "";
    merged.forEach((range) => {
      context += " ... " + text.slice(range.start, range.end);
    });

    return context.length > 1024 ? context.slice(0, 1024) + "..." : context;
  }

  /**
   * Pre-processes raw Keepa/Scraped data to increase signal-to-noise ratio.
   * OPTIMIZED for Small Models (4B): High density, structured format.
   */
  public preprocessData(
    title: string,
    rawDescription: string,
    features: string[],
  ): string {
    const cleanLine = (l: string) => l.replace(/<[^>]*>?/gm, "").trim();

    // 1. Clean & Dedup Features (Limit to top 10 to avoid noise)
    const cleanFeatures = Array.from(new Set(features.map(cleanLine)))
      .filter((f) => f.length > 5 && f.length < 200)
      .slice(0, 10);

    // 2. Filter Description for "Spec-Density"
    // Strategy: Keep lines that look like "Key: Value" or dense specs
    const techRegex =
      /\d+(?:\.\d+)?\s*(?:gb|mb|tb|watt|w |hz|ghz|mhz|cm|mm|kg|g |v |ah|mah|wh|pixel|mp|dpi|nit|zoll|inch|")/i;

    // Split by newlines, but also handle mashed text slightly better if needed
    // For now, Keepa descriptions usually have some line breaks or HTML we stripped
    const descLines = (rawDescription || "").split(/[\n\r]+/);

    const denseLines = descLines.map(cleanLine).filter((l) => {
      if (l.length < 3) return false;

      // A. Explicit Spec Line (Golden Signal)
      // e.g. "Color: Black", "Width: 20cm"
      if (l.includes(":") && l.length < 100) return true;

      // B. Dense Technical Line
      if (techRegex.test(l) && l.length < 150) return true;

      // C. Specific keywords
      const lower = l.toLowerCase();
      return (
        lower.includes("farbe") ||
        lower.includes("material") ||
        lower.includes("dimension") ||
        lower.includes("weight") ||
        lower.includes("model")
      );
    });

    // 3. Construct Clean Markdown (Maximize signal, minimize tokens)
    let processed = `# PRODUCT: ${title}\n\n`;

    // Prioritize Description (often has the real spec table) over generic features
    if (denseLines.length > 0) {
      // Use up to 40 lines of dense context (~500 tokens)
      processed += `## SPECIFICATION CONTEXT:\n${denseLines
        .slice(0, 50)
        .join("\n")}\n\n`;
    }

    if (cleanFeatures.length > 0) {
      processed += `## KEY FEATURES:\n- ${cleanFeatures.join("\n- ")}\n`;
    }

    // Soft Cap at ~2000 chars to be safe for 4k/8k models
    return processed.length > 2500
      ? processed.slice(0, 2500) + "..."
      : processed;
  }

  /**
   * 🛡️ Anti-Hallucination Guardrails
   * Detects and removes suspicious patterns like looped values or bad dimension data.
   */
  private validateAndCleanResult(
    specs: Record<string, any>,
  ): Record<string, any> {
    const cleaned = { ...specs };
    const values = Object.values(cleaned).map((v) =>
      String(v).toLowerCase().trim(),
    );

    // 1. Detect Infinite Repetition (Same value > 4 times)
    // Ignore booleans ("ja", "nein", "true", "false")
    const valueCounts: Record<string, number> = {};
    for (const val of values) {
      if (["ja", "nein", "true", "false"].includes(val)) continue;
      // Also ignore very short numbers "0", "1"
      if (val.length < 2) continue;
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    }

    Object.entries(valueCounts).forEach(([val, count]) => {
      if (count >= 4) {
        console.warn(
          `🛡️ Guardrail: Detected repetition loop for "${val}" (${count}x). Wiping.`,
        );
        // Remove all keys with this value
        Object.keys(cleaned).forEach((key) => {
          if (String(cleaned[key]).toLowerCase().trim() === val) {
            delete cleaned[key];
          }
        });
      }
    });

    // 2. Detect Dimension Hallucination (Width == Height == Depth)
    // It's physically rare for non-cubes, and often a sign of "3.5 mm" connector confusion
    const w = cleaned["Breite"];
    const h = cleaned["Höhe"];
    const d = cleaned["Tiefe"];

    if (w && h && d && w === h && h === d) {
      // Check if it looks like a connector size or small value
      if (String(w).includes("mm") || String(w).includes("cm")) {
        console.warn(
          `🛡️ Guardrail: Width=Height=Depth="${w}". Suspicious cube. Wiping dimensions.`,
        );
        delete cleaned["Breite"];
        delete cleaned["Höhe"];
        delete cleaned["Tiefe"];
        delete cleaned["Verpackungsbreite"];
        delete cleaned["Verpackungstiefe"];
        delete cleaned["Verpackungshöhe"];
      }
    }

    // 3. Audio Jack Hallucination (3.5mm assigned to dimensions)
    const badDimensionValues = ["3.5 mm", "3,5 mm", "3.5mm", "3,5mm"];
    ["Breite", "Höhe", "Tiefe", "Verpackungsbreite"].forEach((dimKey) => {
      const val = cleaned[dimKey];
      if (val && badDimensionValues.includes(String(val).trim())) {
        console.warn(
          `🛡️ Guardrail: '${dimKey}' has suspicious audio-jack value. Wiping.`,
        );
        delete cleaned[dimKey];
      }
    });

    // 4. Physical Sanity Checks (Min/Max from Field Definitions)
    // This kills hallucinations like "20kg smartphone" or "230V RAM"
    Object.keys(cleaned).forEach((key) => {
      const def = FIELD_DEFINITIONS[key];
      const val = cleaned[key];
      if (def?.type === "numeric" && val) {
        const normed = normalizeValue(String(val), def.baseUnit || "");
        if (normed) {
          // A. Min/Max check
          if (def.min !== undefined && normed.value < def.min) {
            console.warn(
              `🛡️ Guardrail: '${key}' value ${normed.value} too low (min ${def.min}). Wiping.`,
            );
            delete cleaned[key];
            return;
          } else if (def.max !== undefined && normed.value > def.max) {
            console.warn(
              `🛡️ Guardrail: '${key}' value ${normed.value} too high (max ${def.max}). Wiping.`,
            );
            delete cleaned[key];
            return;
          }

          // B. "Zero/Ghost" check: Wipe "0" values for physical properties that shouldn't be zero
          const zeroForbidden = [
            "Gewicht",
            "Breite",
            "Höhe",
            "Tiefe",
            "Speicherkapazität",
            "Gesamtleistung",
          ];
          if (
            normed.value === 0 &&
            zeroForbidden.some((f) => key.includes(f))
          ) {
            console.warn(
              `🛡️ Guardrail: '${key}' cannot be zero. Considered ghost value. Wiping.`,
            );
            delete cleaned[key];
            return;
          }

          // C. Unit-Field Compatibility Check
          // e.g. "Gewicht" should not have "W" or "V"
          const unitForbidden: Record<string, string[]> = {
            Gewicht: ["W", "V", "Hz", "mAh"],
            Speicherkapazität: ["V", "W", "Hz"],
            Spannung: ["kg", "g", "mm"],
            Leistung: ["kg", "g", "V"],
          };
          for (const [fieldPart, badUnits] of Object.entries(unitForbidden)) {
            if (key.includes(fieldPart) && badUnits.includes(normed.unit)) {
              console.warn(
                `🛡️ Guardrail: Unit mismatch! '${key}' cannot have unit '${normed.unit}'. Wiping.`,
              );
              delete cleaned[key];
              return;
            }
          }
        }
      }
    });

    // 5. Final Empty Object Pass
    Object.keys(cleaned).forEach((key) => {
      const val = cleaned[key];
      if (
        val &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        Object.keys(val).length === 0
      ) {
        delete cleaned[key];
      }
    });

    return cleaned;
  }

  private sanitizeSpecs(specs: any, activeFields: string[]): any {
    if (!specs) return null;

    // Robustly flatten any { value: "..." } or nested { value: "..." } or single-key hallucinations
    const flatten = (obj: any): any => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;

      const entries = Object.entries(obj);
      if (entries.length === 1) {
        // AI often wraps results in a single-key object. Extract its value.
        return flatten(entries[0][1]);
      }

      // Otherwise, recurse through keys
      const result: any = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = flatten(v);
      }
      return result;
    };

    // Final Polish: Normalize categorical values and scrub hallucinations
    const polished: any = {};
    for (const [key, val] of Object.entries(specs)) {
      const flattenedVal = flatten(val);
      const normalized = this.normalizeAIValue(key, flattenedVal);
      polished[key] = normalized;

      // 🎨 UNIVERSAL ORIGINAL PRESERVATION
      // If we standardized the value (Golden Value or Unit Conversion) and it differs significantly
      // from the source, we save the original. This allows "Search by Standard" but "Display Original".
      // We skip this for simple formatting changes (e.g. 1.0 -> 1,0 or "black" -> "Black")
      if (typeof flattenedVal === "string" && normalized) {
        const original = flattenedVal.trim();
        const normStr = String(normalized);

        // Threshold: If strings differ by more than just casing/punctuation/decimal style
        // e.g. "Midnight Black" vs "Schwarz" (YES)
        // e.g. "1.5 V" vs "1,5 V" (NO)
        const simplifiedOriginal = original
          .toLowerCase()
          .replace(/[.,\s]/g, "");
        const simplifiedNorm = normStr.toLowerCase().replace(/[.,\s]/g, "");

        if (simplifiedOriginal !== simplifiedNorm) {
          // Special handling for Golden Values (Colors, OS) - Use readable name
          if (GOLDEN_VALUES[key]) {
            polished[`Name der ${key}`] = original;
          } else {
            // Generic backup for tech fields
            polished[`${key} (Original)`] = original;
          }
        }
      }
    }

    // MULTI-VALUE ALIGNMENT:
    // If a field contains multiple values (comma or semicolon separated),
    // sort them and ensure consistent spacing.
    for (const [key, val] of Object.entries(polished)) {
      if (
        typeof val === "string" &&
        (val.includes(";") || val.includes(", "))
      ) {
        const parts = val
          .split(/;\s*|,\s+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        if (parts.length > 1) {
          polished[key] = Array.from(new Set(parts)).sort().join(", ");
        }
      }
    }

    return this.cleanObject(polished, activeFields);
  }

  private normalizeAIValue(key: string, val: any): any {
    if (val === null || val === undefined) return val;
    // If it's an object that didn't get flattened, it's junk for a specific field
    if (typeof val === "object" && !Array.isArray(val)) return null;
    const type = this.getFieldType(key);
    const lowVal = String(val).toLowerCase().trim();
    const lowKey = key.toLowerCase();

    // 0. CANONICAL NORMALIZATION (Golden Values)
    // Check if this field has a strict set of allowed values for filters
    if (GOLDEN_VALUES[key]) {
      // A. Check Synonyms
      if (SYNONYM_MAP[key] && SYNONYM_MAP[key][lowVal]) {
        return SYNONYM_MAP[key][lowVal];
      }

      // B. Case-Insensitive Match against Golden Values
      const exactMatch = GOLDEN_VALUES[key].find(
        (gv) => gv.toLowerCase() === lowVal,
      );
      if (exactMatch) return exactMatch;

      // C. Multi-Value or Partial Match for Multi-Selects (e.g. "Rot, Blau" or "Windows 11 Home 64-bit")
      if (key === "Betriebssystem" || key === "Produktfarbe") {
        const parts = lowVal.split(/[,;]/).map((p) => p.trim());
        const matches = parts
          .map((p) => {
            return (
              GOLDEN_VALUES[key].find((gv) => gv.toLowerCase() === p) ||
              GOLDEN_VALUES[key].find((gv) => p.includes(gv.toLowerCase()))
            );
          })
          .filter(Boolean) as string[];

        if (matches.length > 0) {
          return Array.from(new Set(matches)).sort().join(", ");
        }
      }
    }

    // 1. Map Categorical/Wrapped strings to Booleans
    // HARDEN: Always catch True/False strings regardless of field
    if (lowVal === "true" || lowVal === "false") {
      return lowVal === "true" ? "Ja" : "Nein";
    }

    if (type === "BOOLEAN" || type === "OTHER") {
      // If it's a known boolean field or could be one
      const booleanDef = FIELD_DEFINITIONS[key];
      if (type === "OTHER" && booleanDef?.type !== "boolean") {
        // Only trust OTHER if it's explicitly defined as boolean in field-definitions
        // skip
      } else {
        // If AI returns the name of the feature (e.g. "Fernbedienung" for "Fernbedienung enthalten")
        // or common anchor words, map to "Ja"
        if (
          lowVal === "nein" ||
          lowVal === "no" ||
          lowVal === "0" ||
          lowVal === "off" ||
          lowVal === "not" ||
          lowVal.includes("nicht") ||
          lowVal.includes("kein") ||
          lowVal.includes("not available") ||
          lowVal.includes("unavailable")
        ) {
          return "Nein";
        }

        const anchors = [
          "ja",
          "yes",
          "vorhanden",
          "inklusive",
          "mit",
          "1",
          lowKey.replace(" enthalten", "").trim(),
        ];
        if (anchors.some((a) => lowVal === a || lowVal.includes(a))) {
          return "Ja";
        }
      }
    }

    // 2. Scrub technical hallucinations (e.g. "Bluetooth-Version": "Bluetooth")
    // Technical fields should have numbers/versions, not just repeat the field name
    if (
      lowKey.includes("-version") ||
      lowKey.includes(" usb") ||
      lowKey.includes(" hdmi")
    ) {
      // If the value is just a substring of the key name and contains no numbers
      if (lowKey.includes(lowVal) && !/\d/.test(lowVal)) {
        return null; // Considered a junk hallucination
      }
    }

    // 3. Range & Decimal Standardization
    // Standardize "10 bis 20 mm" or "10-20mm" to "10 - 20 mm"
    if (lowVal.includes("bis") || lowVal.includes("-")) {
      const rangeMatch = lowVal.match(
        /(\d+(?:[.,]\d+)?)\s*(?:bis|-)\s*(\d+(?:[.,]\d+)?)\s*([a-z"°%]+)?/i,
      );
      if (rangeMatch) {
        const start = rangeMatch[1].replace(".", ",");
        const end = rangeMatch[2].replace(".", ",");
        const unit = rangeMatch[3] ? ` ${rangeMatch[3].trim()}` : "";
        return `${start} - ${end}${unit}`;
      }
    }

    // 4. Unit Enforcement: If it's a numeric field and AI returned just a number, append base unit
    const def = FIELD_DEFINITIONS[key];
    if (def?.type === "numeric" && def.baseUnit) {
      // If the value is a pure number or decimal (e.g. "350", "1.75")
      if (/^\d+(?:[.,]\d+)?$/.test(lowVal)) {
        val = `${val} ${def.baseUnit}`;
      }

      const normed = normalizeValue(val, def.baseUnit);
      if (normed) {
        // PREFERRED CASING & SYMBOL MAP
        const symbolMap: Record<string, string> = {
          v: "V",
          w: "W",
          hz: "Hz",
          mhz: "MHz",
          ghz: "GHz",
          mah: "mAh",
          wh: "Wh",
          "mt/s": "MT/s",
          "mm/s": "mm/s",
          "mb/s": "MB/s",
          "gb/s": "GB/s",
          "°c": "°C",
          mp: "MP",
          db: "dB",
          dpi: "DPI",
          gb: "GB",
          mb: "MB",
          zoll: "Zoll",
          h: "h",
        };

        const displayUnit = symbolMap[normed.unit.toLowerCase()] || normed.unit;
        // Force German decimal format (3.5 -> 3,5)
        const displayValue = normed.value.toString().replace(".", ",");
        return `${displayValue} ${displayUnit}`;
      }
    }

    // 4. Specialized Field Formatting
    if (key === "CAS Latenz") {
      // Ensure "CL" prefix and no spaces
      let cleanCl = lowVal.replace("cl", "").replace(/\s/g, "");
      if (/^\d+(?:-\d+)*$/.test(cleanCl)) {
        return `CL${cleanCl.toUpperCase()}`;
      }
    }

    return val;
  }

  private cleanObject(obj: any, activeFields?: string[]): any {
    if (Array.isArray(obj)) {
      const cleanedArr = obj
        .map((item) => this.cleanObject(item, activeFields))
        .filter((item) => {
          if (item === null || item === undefined) return false;
          if (typeof item === "string" && this.isJunkValue(item, undefined))
            return false;
          if (typeof item === "object" && Object.keys(item).length === 0)
            return false;
          return true;
        });
      return cleanedArr.length > 0 ? cleanedArr : null;
    }

    if (typeof obj === "object" && obj !== null) {
      // SCRUB: If the object contains "error" or "reason" keys, it's AI meta-data/hallucination
      if (obj.error || obj.reason || obj.explanation) {
        return null;
      }

      const cleanedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.cleanObject(value, activeFields);
        const type = this.getFieldType(key);

        if (
          cleanedValue !== null &&
          cleanedValue !== undefined &&
          !(
            typeof cleanedValue === "string" &&
            this.isJunkValue(cleanedValue, type)
          ) &&
          !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
          !(
            typeof cleanedValue === "object" &&
            Object.keys(cleanedValue).length === 0
          )
        ) {
          cleanedObj[key] = cleanedValue;
        }
      }
      return Object.keys(cleanedObj).length > 0 ? cleanedObj : null;
    }

    return obj;
  }

  private isJunkValue(val: string, type?: string): boolean {
    const junkTerms = [
      "nicht",
      "n/a",
      "unavailable",
      "empty",
      "specified",
      "angegeben",
      "spezifiziert",
      "explizit",
      "keine",
      "none",
      "n.a.",
      "null",
      "undefined",
    ];
    const lowVal = val.toLowerCase().trim();

    // IF NOT A BOOLEAN, "Nein" IS JUNK
    if (type && type !== "BOOLEAN" && lowVal === "nein") return true;

    if (!lowVal || lowVal === "" || lowVal === "-" || lowVal === "?")
      return true;
    return (
      junkTerms.some((term) => lowVal.includes(term)) && lowVal.length < 30
    );
  }
}
