import { z } from "zod";
import { StandardEnums, StandardPatterns } from "./standard-patterns";

export type FieldType = "boolean" | "numeric" | "enum" | "text" | "pattern";

export interface FieldValidator {
  type: FieldType;
  unit?: string; // @deprecated Use units[] instead
  units?: string[]; // List of allowed units (e.g. ["mm", "cm", "m"])
  baseUnit?: string; // The normalized unit (e.g. "mm")
  min?: number;
  max?: number;
  options?: string[]; // If allowUnknown is true, these become examples
  pattern?: string; // Regex for validation
  allowUnknown?: boolean; // If true, valid is NOT restricted to options
  sample?: string[]; // Just for context/docs
}

/**
 * 🏭 Generator: Creates Zod Schema from Blueprint
 */
export function createZodFromDefinition(def: FieldValidator): z.ZodTypeAny {
  let schema: z.ZodTypeAny = z.string();

  switch (def.type) {
    case "pattern": {
      let patternSource = def.pattern || "";
      if (patternSource) {
        // DETECT POISONED PLACEHOLDER: Many fields were incorrectly
        // initialized with a storage capacity pattern.
        // We detect this and relax it if the field doesn't look like a capacity field.
        const isStoragePattern = patternSource.includes("GB|TB|MB|KB");
        const isActuallyStorageField =
          /kapazität|speicher|size|größe|ram|flash/i.test(def.pattern || "") ||
          /kapazität|speicher|size|größe|ram|flash/i.test(
            def.options?.[0] || "",
          );

        if (isStoragePattern && !isActuallyStorageField) {
          // Safety valve: allow any string for poisoned fields
          schema = z.string();
          break;
        }

        // Strip strict anchors to allow AI qualifiers like "ca.", "bis zu", etc.
        const loosePattern = patternSource
          .replace(/^\^/, ".*")
          .replace(/\$$/, ".*");
        schema = z.string().regex(new RegExp(loosePattern, "i"));
      }
      break;
    }

    case "enum": {
      if (def.options && def.options.length > 0) {
        if (def.allowUnknown) {
          schema = z.string();
        } else {
          // Allow loose string matching for enums to avoid Zod failure.
          // We check if the response contains any of the valid options.
          schema = z.string().refine(
            (val) => {
              const lowerVal = val.toLowerCase();
              return def.options!.some((opt) =>
                lowerVal.includes(opt.toLowerCase()),
              );
            },
            { message: `Must contain one of: ${def.options.join(", ")}` },
          );
        }
      }
      break;
    }

    case "numeric": {
      const allowedUnits = (def.units || (def.unit ? [def.unit] : [])).filter(
        (u) => u.length > 0,
      );
      let numericPattern: string;

      if (allowedUnits.length > 0) {
        const escapedUnits = allowedUnits
          .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");
        // REMOVED \b: Special characters like ° in °C are not "word characters",
        // so word boundaries \b fail when used before/after them.
        numericPattern = ".*(\\d+([.,]\\d+)?)\\s*(" + escapedUnits + ")?.*";
      } else {
        // Pure numeric (counts, levels, etc.)
        numericPattern = ".*(\\d+([.,]\\d+)?).*";
      }

      schema = z.string().regex(new RegExp(numericPattern, "i"));

      // Refinement: Check bounds (min/max)
      if (def.min !== undefined || def.max !== undefined) {
        schema = schema.refine(
          (val) => {
            // Extract number: replace comma with dot, remove non-numeric
            const numStr = (val as string)
              .replace(",", ".")
              .replace(/[^0-9.]/g, "");
            const num = parseFloat(numStr);
            if (isNaN(num)) return false; // Regex passes, so this shouldn't happen, but safety first

            if (def.min !== undefined && num < def.min) return false;
            if (def.max !== undefined && num > def.max) return false;
            return true;
          },
          {
            message:
              "Value must be between " +
              (def.min ?? "-inf") +
              " and " +
              (def.max ?? "inf"),
          },
        );
      }
      break;
    }

    case "boolean": {
      schema = z
        .preprocess(
          (val) => {
            if (typeof val !== "string") return val;
            const low = val.toLowerCase().trim();
            if (
              [
                "ja",
                "yes",
                "true",
                "1",
                "vorhanden",
                "inklusive",
                "checked",
                "mit",
              ].includes(low)
            )
              return "Ja";
            if (
              [
                "nein",
                "no",
                "false",
                "0",
                "nicht vorhanden",
                "unchecked",
                "ohne",
              ].includes(low)
            )
              return "Nein";
            return val;
          },
          z.enum(["Ja", "Nein"]),
        )
        .catch("Nein" as any);
      break;
    }
  }
  return schema;
}

/**
 * 🛡️ FIELD DEFINITIONS (Restored & Smart-Enriched)
 * Automatically generated from category-templates.json
 */

export const FIELD_DEFINITIONS: Record<string, FieldValidator> = {
  "3G/4G USB Modem-Kompatibilität": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "80 Plus Zertifizierung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "AC Eingangsfrequenz": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "AC Eingangsspannung": {
    type: "numeric",
    units: ["V"],
    baseUnit: "V",
  },
  "AC-Netzadapter": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "AF-Hilfslicht": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "AF-Lock": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "AF-Messfeldwahl": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "AF-Objekterkennung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "AMD FreeSync": {
    type: "boolean",
  },
  "ATX Stromstecker (24-pol.)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "ATX-Version": {
    type: "pattern",
    pattern: "^(ATX\\s*)?\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  "AUX-Eingang": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Abmessungen Gebläse (B x T x H)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Akku-/Batteriebetriebsdauer": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Akku-/Batteriekapazität": {
    type: "numeric",
    units: ["mAh", "Wh", "Ah"],
    baseUnit: "mAh",
    sample: ["Batteriekapazität", "Akku-Kapazität"],
  },
  Ladegeschwindigkeit: {
    type: "numeric",
    units: ["W", "Watt"],
    baseUnit: "W",
    sample: ["25W Laden", "45 W"],
  },
  "Akku-/Batterietechnologie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Akku-/Batterietyp": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Akkuladezeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Akkulaufzeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Akkulaufzeit (CIPA Standard)": {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  "Akkulaufzeit in Zyklen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Akkulaufzeit pro Zyklus": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Akkus/Batterien enthalten": {
    type: "boolean",
  },
  "Akustisches System": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Anlaufstrom: {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Antennen-Design": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Anti-Staub Funktion": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Anzahl DVI-D-Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl DVI-I-Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl DisplayPort Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl Ethernet-LAN-Anschlüsse (RJ-45)": {
    type: "numeric",
    unit: "",
  },
  "Anzahl HDMI-Anschlüsse": {
    type: "enum",
    options: ["0", "1", "2", "3", "4"],
  },
  "Anzahl Lüfter": {
    type: "numeric",
    unit: "",
  },
  "Anzahl Mini DisplayPorts": {
    type: "numeric",
    unit: "",
  },
  "Anzahl Mini-HDMI-Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl Molex Anschlüsse 4pin": {
    type: "numeric",
    unit: "",
  },
  "Anzahl PCI Express Stromstecker 6+2pin": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Anzahl Prozessorkerne": {
    type: "numeric",
    unit: "",
  },
  "Anzahl RF Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl SATA Stromstecker": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Anzahl Slots": {
    type: "numeric",
    units: ["slots", "slot"],
    baseUnit: "slots",
  },
  "Anzahl Thunderbolt 3 Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl USB 2.0 Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl USB 2.0 Schnittstellen": {
    type: "numeric",
    unit: "",
  },
  "Anzahl USB 2.0 Typ-C Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl USB 3.2 Gen 1 (3.1 Gen 1) Typ-A Ports": {
    type: "numeric",
    unit: "",
  },
  "Anzahl USB 3.2 Gen 1 (3.1 Gen 1) Typ-C Ports": {
    type: "numeric",
    unit: "",
  },
  "Anzahl VGA (D-Sub) Anschlüsse": {
    type: "numeric",
    unit: "",
  },
  "Anzahl Wärmerohre": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der 2,5&quot; Erweiterungseinschübe": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der 3,5&quot; Erweiterungseinschübe": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der Antennen": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der Erweiterungsslots": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der Farben des Displays": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der HDD Köpfe": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der Lautsprecher": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der M.2 (M)-Steckplätze": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der Messzonen": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der Scroll-Rollen": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der Speichersteckplätze": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Anzahl der aspärischen Linsen": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der unterstützten Speicherlaufwerke": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Anzahl der unterstützten hinteren Lüfter (max.)": {
    type: "numeric",
    unit: "",
  },
  "Anzahl der unterstützten oberen Lüfter (max.)": {
    type: "numeric",
    unit: "",
  },
  "Anzahl eingebauter Lautsprecher": {
    type: "numeric",
    unit: "",
  },
  "Anzahl enthaltener Produkte": {
    type: "numeric",
    unit: "",
  },
  "Anzahl unterstützter Akkus/Batterien": {
    type: "numeric",
    unit: "",
  },
  "Anzahl unterstützter unterer Lüfter (max.)": {
    type: "numeric",
    unit: "",
  },
  "Anzahl unterstützter vorderer Lüfter (max.)": {
    type: "numeric",
    unit: "",
  },
  "Apple AirPlay 2-Unterstützung": {
    type: "boolean",
  },
  "Arbeitsspeicher (RAM)": {
    type: "numeric",
    units: ["GB", "TB", "MB", "KB"],
    baseUnit: "GB",
  },
  "Arbeitsspeicher Typ": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Armbandfarbe: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Audio Kanäle": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Audio Return Channel (ARC)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Audio-Chip": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Audio-System": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Audioanschlüsse: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Audioausgang: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Auflösung Frontkamera (numerisch)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Auflösung Rückkamera (numerisch)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Auflösung bei Capture Geschwindigkeit": {
    type: "numeric",
    units: ["fps", "bps", "Mbps", "Gbps"],
    baseUnit: "fps",
  },
  Aufnahmemodi: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Aufwärmzeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Ausgangsspannung: {
    type: "numeric",
    units: ["V"],
    baseUnit: "V",
  },
  Ausgangsstrom: {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Ausklappbarer Bildschirm": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Autofokus (AF)-Modi": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Autofokus (AF)-Punkte": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Automatische Abschaltung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Automatische Belichtungsspeicherung (AE)": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Automatische Kanalsuchlauf": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Autonivellierung: {
    type: "boolean",
  },
  "BIOS-Speichergröße": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "BIOS-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bass-Justage": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Batterie enthalten": {
    type: "boolean",
  },
  Batteriebetrieben: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Batteriekapazität (Wattstunden)": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Batteriestandsanzeige: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bauraum-Heizung": {
    type: "boolean",
  },
  Bauvolumen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Beleuchtung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Beleuchtungs-LED": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Belichtungskorrektur: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Belichtungsmessung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Belichtungssteuerung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Belichtungstyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Benutzerdefinierte Medienbreite": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Benutzerdefinierte Medienlänge": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Benutzerhandbuch: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Beschleunigungsmesser: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Besonderheiten: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Betriebsspannung: {
    type: "numeric",
    units: ["V"],
    baseUnit: "V",
  },
  Betriebstemperatur: {
    type: "numeric",
    units: ["°C"],
  },
  "Bewegung Auflösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bewegungerfassungs Technologie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildbearbeitung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildprozessor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bildschirmauflösung (numerisch)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildschirmdiagonale: {
    type: "numeric",
    units: ["Zoll", '"', "inch", "cm"],
    baseUnit: "Zoll",
  },
  "Bildschirmdiagonale (cm)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildschirmform: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildschirmtechnologie: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bildsensorgröße (B x H)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildstabilisator: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildstile: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bildverarbeitungsverfahren: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bildwinkel, horizontal": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bildwinkel, vertikal": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Blendfreier Bildschirm": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Blitz-Modi": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Blitzbelichtungskorrektur: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Blitzbelichtungskorrekturbereich: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Blitzladezeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Blitzlicht-Messwertspeicherung": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Blitzsynchronzeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Bluetooth: {
    type: "boolean",
  },
  "Blutsauerstoff-Sensor": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Breite: {
    type: "numeric",
    min: 0,
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Breite (ohne Standfuß)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Breite der Speicherschnittstelle": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Breite der Standhalterung": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Brennweitenbereich: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bus-betrieben": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Bytes pro Sektor": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "CAS Latenz": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "CPU Stecker (4+4 pin)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "CPU Ventilatorstecker": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "CPU-Leistung Kabellänge": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  CUDA: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "CUDA-Kerne": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Code des Europäischen Produktregisters für die Energiekennzeichnung (EPREL)":
    {
      type: "enum",
      allowUnknown: true,
      options: [],
    },
  "Common Interface Plus (CI+) Version": {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  "Common interface (CI)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Common interface Plus (CI+)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Controller enthalten": {
    type: "boolean",
  },
  "DHCP-Server": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "DMZ-Unterstützung": {
    type: "boolean",
  },
  "DSL-WAN": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Datenübertragungsrate: {
    type: "numeric",
    units: ["Mbps", "Gbps", "MB/s", "GB/s"],
    baseUnit: "Mbps",
  },
  "Desktop-Ständer": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Dicke: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Digital-Audio-Optical-In": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Digitaler Zoom": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Digitales Signalformatsystem": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Dioptrienausgleich: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Dioptrienausgleich (D-D)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "DirectX-Version": {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  Direktdruck: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Display: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Display-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [
      "OLED",
      "AMOLED",
      "Super AMOLED",
      "Retina",
      "Liquid Retina",
      "IPS",
      "LCD",
      "TFT",
      "VA",
      "TN",
      "QLED",
      "Mini-LED",
    ],
  },
  "Display-Auflösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Display-Seitenverhältnis": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "DisplayPorts-Version": {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  "Doppelseitiger Druck": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Dreh- und schwenkbares Display": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Druck der ersten Seite (Farbe, normal)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Druck der ersten Seite (Schwarz, normal)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Druckauflösung schwarz": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Drucken: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Druckfarben: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Druckgeschwindigkeit: {
    type: "numeric",
    units: ["mm/s"],
    baseUnit: "mm/s",
  },
  Drucktechnologie: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Dual-Link-DVI": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Duplex Druckmodus": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Duplex-Kopie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Duplexfunktion: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Durchmesser Wärmerohre": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Durchmesser unterstützte Unterlüfter": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Durchmesser unterstützte Vorderseitenlüfter": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Durchmesser unterstützter Rückseitenlüfter": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Durchschnittlicher Stromverbrauch beim Drucken": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Durchschnittlicher Stromverbrauch beim Kopieren": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Dynamisches DNS (DDNS)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Düsentemperatur: {
    type: "numeric",
    units: ["°C"],
    baseUnit: "°C",
  },
  ECC: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "ECC-Kompatibilität": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "EPS Stromstecker (8-pin)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "ESRB-Bewertung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Effizienz: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Ein-/Ausschalter": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Eingabe Farbtiefe": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Eingabegerät: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Eingebaute Audio-Decoder": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Eingebaute Lautsprecher": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Eingebauter Prozessor": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Eingebautes Display": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Eingebautes Grafikkartenmodell": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Eingebautes Mikrofon": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Einstellbare Höhe (max.)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Elektromagnetische Verträglichkeit": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Elektronischer Programmführer (EPG)": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Empfohlene Nutzung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Empfohlene Platzierung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Empfohlene Systemvoraussetzungen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Empfohlene monatliche Auslastung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Empfohlener Betriebstemperaturbereich": {
    type: "numeric",
    units: ["°C"],
  },
  "Energieeffizienzklasse (HDR)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Energieeffizienzklasse (SDR)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Energieeffizienzskala: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Energiequelle: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Energieschutzeigenschaften: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Energieverbrauch: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Energieverbrauch (HDR) pro 1.000 Stunden": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Energieverbrauch (SDR) pro 1.000 Stunden": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Energieverbrauch (bereit)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Energieverbrauch (idle)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Energy Star Typischer Stromverbrauch (TEC)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  Entwickler: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Equalizer: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Equalizer Modi": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Ersatzpatronen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Ethernet LAN Datentransferraten": {
    type: "numeric",
    units: ["Mbps", "Gbps", "MB/s"],
    baseUnit: "Mbps",
  },
  "Ethernet Schnittstellen Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Ethernet-WAN": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Ethernet/LAN": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Extruder-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Farbdisplay: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Farbe: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Farbraumstandard: {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  Faxen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Fernbedienung enthalten": {
    type: "boolean",
  },
  Filamentdurchmesser: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Firewall: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Flash Card Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Flimmerfreie Technologie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Flüssigkeitskühlungsfähigkeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Fokus: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Fokuseinstellung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Formfaktor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Foto Auflösung(en)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Fotoeffekte: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Fotopapiergrößen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Front Panel Audiostecker": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Frontkamera: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Frontkamera-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Funktioniert mit Amazon Alexa": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Fußfarbe: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  GLONASS: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  GPS: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  GPU: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Galileo: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Garantiekarte: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Geeignet für": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Gehäusefarbe: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Gehäusegröße: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Genre: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "G-Sync": {
    type: "boolean",
  },
  "Gepufferter Speichertyp": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Gerätebreite (inkl. Standfuß)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Gerätehöhe (inkl. Standfuß)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Geräteschnittstelle: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Gerätetiefe (inkl. Standfuß)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Gerätetyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Geräuschemission (betriebsbereit)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Geräuschpegel (hohe Geschwindigkeit)": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  "Geräuschpegel (langsame Geschwindigkeit)": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  Geräuschunterdrückung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Gesamte Ausgabekapazität": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Gesamte Papierkapazität": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Gesamter Kohlendioxid-Fußabdruck (kg of CO2e)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Gesamtleistung: {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  Gesamtspeicherkapazität: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Gesamtzahl der Papierzuführungen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Gewicht: {
    type: "numeric",
    min: 0,
    units: ["g", "kg", "mg", "t", "oz", "lb"],
    baseUnit: "g",
  },
  "Gewicht (inklusive Standfuß)": {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Gewicht (innerer) Versandkarton": {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Gewicht (mit Batterie)": {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Gewicht (ohne Standfuß)": {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Gewicht Soundbar": {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Gleichstrom-Anschluss (DC)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  Grafikkarte: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Grafikkarte-Familie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Grafikkartenspeichertyp: {
    type: "enum",
    options: ["GDDR7", "GDDR6X", "GDDR6", "GDDR5X", "GDDR5", "HBM2", "HBM3"],
    allowUnknown: true,
  },
  Grafikprozessorenfamilie: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Grundkörper Material": {
    type: "enum",
    allowUnknown: true,
    options: [
      "Aluminium",
      "Glas",
      "Kunststoff",
      "Polycarbonat",
      "Edelstahl",
      "Keramik",
      "Titan",
      "Leder",
      "Silikon",
    ],
  },
  "Größe des Bildsensors": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "HD-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  HDCP: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "HDD Geschwindigkeit": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  "HDD Größe": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "HDD Kapazität": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  HDMI: {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  "HDMI-Steckverbindertyp": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "HP GTIN (EAN/UPC)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "HP-Segment": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Hallsensor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Handgelenkauflage: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Headset-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Heizbett-Temperatur": {
    type: "numeric",
    units: ["°C"],
    baseUnit: "°C",
  },
  "Heizungs-Breite": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Heizungs-Höhe": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Heizungs-Tiefe": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Helligkeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Helligkeit (cd/m²)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Helligkeit (typisch)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Helligkeitseinstellung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Herausgeber: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Herzfrequenzmonitor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "High Dynamic Range Video (HDR) Unterstützung": {
    type: "boolean",
  },
  Hintergrundbeleuchtung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Histogramm: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Hybrid Broadcast Broadband TV (HbbTV)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Höhe: {
    type: "numeric",
    min: 0,
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Höhe (ohne Standfuß)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Höhenverstellung: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "ISO-A-Formate (A0...A9)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "ISO-B-Formate": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "ISO-Empfindlichkeit": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "ISO-Empfindlichkeit (max)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "ISO-Empfindlichkeit (min)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Impedanz: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Installierte Lüfter hinten": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Installiertes Betriebssystem": {
    type: "enum",
    allowUnknown: true,
    options: [
      "Android",
      "iOS",
      "Windows 11 Home",
      "Windows 11 Pro",
      "Windows 10 Home",
      "Windows 10 Pro",
      "macOS",
      "ChromeOS",
      "Linux",
      "FreeDOS",
      "Ubuntu",
    ],
  },
  "Integrierte Kamera": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Integrierter Kartenleser": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Integrierter USB-Hub": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Intelligentes, ergonomisches Design": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Internationale Schutzart (IP-Code)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Interne Speicherkapazität": {
    type: "numeric",
    units: ["GB", "TB", "MB", "KB"],
    baseUnit: "GB",
  },
  "Interner Speichertyp": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Internet-TV": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "JIS B-Seriengröße (B0...B9)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "KI-Kamera": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kabellose Reichweite": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kabellänge: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Kabelsperre-Slot": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kabeltyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kamera Wiedergabe": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kamera-Dateisystem": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kamera-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kapazität: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Kapazität Papierfach 1": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Keyboard Abmessungen (BxTxH)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Knopfanzahl: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kohlenstoffemissionen gesamt, mit/ohne Nutzungsphase(kg an CO2e)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kohlenstoffemissionen, Ende der Lebensdauer (kg an CO2e)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kohlenstoffemissionen, Herstellung (kg an CO2e)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kohlenstoffemissionen, Logistik (kg an CO2e)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kombinierter Strom (+12V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Kombinierter Strom (+3.3V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Kombinierter Strom (+5V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Kombinierter Strom (+5Vsb)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Kombinierter Strom (-12V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Kompatible Betriebssysteme": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kompatible Materialien": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kompatible Prozessoren": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kompatible Speicherkarten": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Komponente für": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Konformitätsbescheinigungen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kontinuierliche Audiowiedergabezeit (ANC ausgeschaltet)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kontinuierliche Audiowiedergabezeit (ANC eingeschaltet)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kontinuierliche HDD Übertragungsrate": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  Kontrastverhältnis: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kontrastverhältnis (dynamisch)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kontrolle durch Eltern": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kopfhörer-Anschluss": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kopfhörerausgang: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kopfhörerausgänge: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kopfhörerfrequenz: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kopieren: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kundenspezifische Mediengrößen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kühltechnik: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Kühlung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Kürzeste Verschlusszeit": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "LED-Anzeigen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "LED-Hintergrundbeleuchtung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Ladegerät enthalten": {
    type: "boolean",
  },
  "Lage des Bildstabilisator": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Lagenanzahl pro Palette": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Lagertyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Lamellenmaterial: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Lebensdauer der Tastaturtasten": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Leitzahl Blitz": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Lesegeschwindigkeit: {
    type: "numeric",
    units: ["MB/s", "GB/s", "KB/s"],
    baseUnit: "MB/s",
  },
  "Live-View": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Low-Blue-Light-Technologie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Lupenfunktion bei Wiedergabe (Max.)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Länge (mm)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Längste Verschlusszeit": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Lüfterdurchmesser: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Marktpositionierung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maus enthalten": {
    type: "boolean",
  },
  "Max Ausgangsstrom (+5V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Max CPU Kühler-Höhe": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Max Grafikkarten-Länge": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Max. Ausgabekapazität": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Max. Ausgangsstrom (+12V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Max. Ausgangsstrom (+3.3V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Max. Ausgangsstrom (+5Vsb)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Max. Ausgangsstrom (-12V)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Maximale Auflösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale Bildauflösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale Bildwiederholrate": {
    type: "numeric",
    units: ["Hz", "kHz", "MHz"],
    baseUnit: "Hz",
    min: 24,
  },
  "Maximale Blendenzahl": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale Displays pro Videokarte": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale Druckgröße": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale Papiergröße der ISO A-Serie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale Papierkapazität": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Maximale Schichtdicke": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale Video-Auflösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale monatliche Auslastung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximale unterstützte Anzahl der HDD": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximaler Scanbereich": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Maximum Brennweite (äquivalent 35 mm Kleinbild)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Mediengewichte für das Papierfach": {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Medientypen für das Papierfach": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Megapixel (ca.)": {
    type: "numeric",
    units: ["MP", "Megapixel"],
    baseUnit: "MP",
  },
  "Megapixel insgesamt": {
    type: "numeric",
    units: ["MP", "Megapixel"],
    baseUnit: "MP",
  },
  "Mehrfach-Kopie (max.)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Memory Formfaktor": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Menge pro Packung": {
    type: "numeric",
    unit: "",
  },
  "Menge pro Versandkarton": {
    type: "numeric",
    unit: "",
  },
  "Mikrofon enthalten": {
    type: "boolean",
  },
  "Mikrofon-Eingang": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Mikrofon-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Min. Systemstromversogung": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  Mindestschichtdicke: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Minimum Brennweite (äquivalent 35 mm Kleinbild)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Mitgelieferte Kabel": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Mittlere Betriebsdauer zwischen Ausfällen (MTBF)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Mittlere Zeit bis zum Ausfall (MTTF) des Lüfters": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Mobile Drucktechnologien": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Mobile Netzwerkverbindung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Mobilfunknetzgenerierung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Modulkonfiguration: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Montageset: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Motherboard Anschlussstecker": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Motherboard Chipsatz": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Motherboard Chipsatz Familie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Motherboardformfaktor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Motion Interpolation Technologie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Motion-JPEG Framerate": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  NFC: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "NVIDIA G-SYNC": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  NVMe: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Nachhaltigkeitskonformität: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Nachhaltigkeitszertifikate: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Nahfeldkommunikation (NFC)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Name der Farbe": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Natives Seitenverhältnis": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Neigungsverstellung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Neigungswinkelbereich: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Netzteil Eingansgsspannung": {
    type: "numeric",
    units: ["V"],
    baseUnit: "V",
  },
  "Netzteil enthalten": {
    type: "boolean",
  },
  Netzteilfrequenz: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Netzteiltyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Nicht-ISO Druckmedienformate": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Numerisches Keypad": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Oberflächenfärbung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Objektivanschluss: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Objektivaufbau (Elemente/Gruppen)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "On-Screen-Display (OSD)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "OpenGL-Version": {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  "Optische Scan-Auflösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Optischer Audio-Digitalausgang": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Orientierungssensor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "PC-Eingang (D-Sub)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "PCI Express x16-Steckplätze (Gen 4.x)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "PEGI-Klassifizierung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Packungsinhalt: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Paketgewicht: {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Palettengewicht (brutto)": {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  "Panel-Montage-Schnittstelle": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Panel-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Parallele Verarbeitungstechnologie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Patrone(n) enthalten": {
    type: "boolean",
  },
  "Patronenreichweite Lieferumfang (schwarz)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Periphere (Molex) Netzkabellänge": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  PictBridge: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Pixel Abstand": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Plattform: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Port-Auslösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Portweiterleitung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Position Kopfhörerlautsprecher": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Produkte pro Palette": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Produktfarbe: {
    type: "enum",
    allowUnknown: true,
    options: ["Schwarz", "Weiß", "Silber", "Grau", "Rot", "Blau"],
  },
  Produkttyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Prozessor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Prozessor-Boost-Taktfrequenz": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  Prozessorfamilie: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Prozessorhersteller: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Prozessorsockel: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Prozessortaktfrequenz: {
    type: "numeric",
    units: ["GHz", "MHz"],
    baseUnit: "GHz",
  },
  "Puffergröße Speicherlaufwerk": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Quality of Service (QoS) Support": {
    type: "boolean",
  },
  "RAID Level": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "RAID-Unterstützung": {
    type: "boolean",
  },
  "RAM-Kapazität": {
    type: "numeric",
    units: ["KB", "MB", "GB", "TB"],
    baseUnit: "GB",
  },
  "RAM-Speicher maximal": {
    type: "numeric",
    units: ["KB", "MB", "GB", "TB"],
    baseUnit: "GB",
  },
  "RGB-LED-Stiftleiste": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "RMS-Leistung": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Randloser Druck": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Reaktionszeit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Reaktionszeit (ms)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Receiver enthalten": {
    type: "boolean",
  },
  "Relative Luftfeuchtigkeit in Betrieb": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Reparierbarkeitsklasse: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Reset-Knopf": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Rotationsgeschwindigkeit (max.)": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  "Rückkamera-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "SATA Anschlüsse": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "SATA II Anschlüsse": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "SATA III Anschlüsse": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "SATA-Netzkabellänge": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "SIM-Karten-Slot": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "SIM-Kartensteckplätze": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "SSD Speicherkapazität": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "SSD-Formfaktor": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Scannen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Scanner-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Scantechnologie: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Schalldruckpegel (Druck)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Schallleistungspegel (Druck)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  Schnellstartübersicht: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Schnittstelle: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Schnittstellentyp Ethernet-LAN": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Schreibgeschwindigkeit: {
    type: "numeric",
    units: ["MB/s", "GB/s", "KB/s"],
    baseUnit: "MB/s",
  },
  Schwenkbar: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Schwenkwinkelbereich: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Scroll Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Seitenbeschreibungssprachen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Seitenfenster: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Selbstauslöser Verzögerung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Sensor-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Sensorformat: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Separater Grafik-Adapterspeicher": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Separates Grafikkartenmodell": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  "Sichtbare Größe (horizontal)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Sichtbare Größe (vertikal)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Sichtfeld: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Slot-Typ Kabelsperre": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Smart-TV": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Smartphone Fernsteuerung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Soundbar Lautsprecher RMS Leistung": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  Speicherdatenübertragungsrate: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Speicherkanäle: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Speicherkapazität: {
    type: "numeric",
    units: ["GB", "TB", "MB", "KB"],
    baseUnit: "GB",
  },
  Speicherkartensteckplätze: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Speicherlaufwerk-Adapter enthalten": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Speicherlayout (Module x Größe)": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Speichermedien: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Speicherrangfolge: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  Speicherspannung: {
    type: "numeric",
    units: ["V"],
    baseUnit: "V",
  },
  Speichertyp: {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Spiel-Edition": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Spiel-Funktionen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Spiel-Modus": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Standort-Position": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Start-/Stopp-Zyklen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Stativbefestigung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Steuerung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Stromkabellänge Motherboard": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Stromverbrauch (PowerSave)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Stromverbrauch (Standardbetrieb)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Stromverbrauch (Standby)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Stromverbrauch (aus)": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Stromversorgungseinheit (PSU) Formfaktor": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Ständer enthalten": {
    type: "boolean",
  },
  Ständertyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Subwoofer enthalten": {
    type: "boolean",
  },
  Sucherbildschirmgröße: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Suchertyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "TV Tuner integriert": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Tastatur - Tastenanzahl": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Tastatur Formfaktor": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Tastatur mit Hintergrundbeleuchtung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Tastatur-Stil": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Tastatur-Switch": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Tastaturaufbau: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Tastaturgewicht: {
    type: "numeric",
    units: ["g", "kg"],
    baseUnit: "g",
  },
  Tastatursprache: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Tastentyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Technologie mit hohem Dynamikbereich (HDR)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Temperaturbereich bei Lagerung": {
    type: "numeric",
    units: ["°C"],
  },
  "Thermal Design Power (TDP)": {
    type: "numeric",
    units: ["W"],
    baseUnit: "W",
  },
  "Thunderbolt-Technologie": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Tiefe: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Tiefe (ohne Standfuß)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Tiefe der Standhalterung": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Top WLAN-Standard": {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  Touchscreen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Tragestil: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Treibereinheit: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Tunertyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Typ: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "UHS Speed Klasse": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "UNSPSC-Code": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB 3.2 Gen 1 (3.1 Gen 1) Anschlüsse": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB 3.2 Gen 1 (3.1 Gen 1) Anzahl der Anschlüsse vom Typ A": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB 3.2 Gen 1 (3.1 Gen 1) Anzahl der Anschlüsse vom Typ C": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB 3.2 Gen 2 (3.1 Gen 2) Anschlüsse": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB 3.2 Gen 2 (3.1 Gen 2) Anzahl der Anschlüsse vom Typ A": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB 3.2 Gen 2 (3.1 Gen 2) Anzahl der Anschlüsse vom Typ C": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB Anschluss": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB Typ-C Ladeport": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB-Anschlusstyp": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "USB-Version": {
    type: "pattern",
    pattern: "^\\d+(\\.\\d+)?$",
    options: ["1.4", "2.0", "5.3"],
  },
  Umgebungslichtsensor: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Umschlaggrößen: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unbuffered Speicher": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Unterhaltungselektronik-Kontrolle (CEC)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützt Mac-Betriebssysteme": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützt Windows-Betriebssysteme": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Arbeitsspeicher": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Unterstützte Arbeitsspeichergeschwindigkeit": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Unterstützte Audioformate": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Bildformate": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Dateiformate": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Hard-Disk Drive Größen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Lüfterdurchmesser (oben)": {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Unterstützte Motherboards Formfaktoren": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Prozessorsteckplätze": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Radiatorgrößen hinten": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Radiatorgrößen oben": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Seitenverhältnisse": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Sicherheitsalgorithmen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Speicherlaufwerk-Schnittstellen": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Unterstützte Speicherlaufwerke": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Unterstützte Speichertaktrate (max.)": {
    type: "pattern",
    pattern: "^\\d+\\s?(GB|TB|MB|KB)$",
    options: ["512 GB", "1 TB"],
  },
  "Unterstützte Sprachen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützte Stromversorgungs-Formfaktoren": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Unterstützte Videoformate": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Unterstützung anderer Betriebsysteme": {
    type: "boolean",
  },
  "Unterstützung der Pulsweitenmodulation": {
    type: "boolean",
  },
  Untertitelfunktion: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Ursprungsland: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "VESA-Halterung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Ventilator-Anschluss": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Verbesserter Audio-Rückkanal (eARC)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Verbesserung des Videotexts": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Vergrößerung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Verkabelungstechnologie: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Verkleinerung/Vergrößerung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Verpackungsart: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Verpackungsbreite: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Verpackungshöhe: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Verpackungstiefe: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  "Versandkarton pro Palettenlage": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Versandkartonsbreite: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Versandkartonshöhe: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Versandkartonslänge: {
    type: "numeric",
    units: ["mm", "cm", "m"],
    baseUnit: "mm",
  },
  Verschlusstyp: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Veröffentlichungsdatum: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Video-Apps": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Video-Auflösung": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Video-Geschwindigkeitsklasse": {
    type: "enum",
    options: ["V6", "V10", "V30", "V60", "V90", "Class 10", "U1", "U3"],
    allowUnknown: false,
  },
  Videoaufnahme: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Videospiel enthalten": {
    type: "boolean",
  },
  "WAN-Verbindungstyp": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  WLAN: {
    type: "boolean",
  },
  "WLAN Datentransferrate (max.)": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  "WLAN-Band": {
    type: "boolean",
  },
  "WLAN-Datenübertragungsrate (erstes Band)": {
    type: "numeric",
    units: ["Mbps", "Gbps"],
    baseUnit: "Mbps",
  },
  "Bluetooth-Version": {
    type: "pattern",
    pattern: StandardPatterns.BLUETOOTH_VERSION.source,
    options: ["5.4", "5.3", "5.2", "5.1", "5.0", "4.2"],
  },
  "WLAN-Standards": {
    type: "enum",
    allowUnknown: true,
    options: [
      "Wi-Fi 7 (802.11be)",
      "Wi-Fi 6E (802.11ax)",
      "Wi-Fi 6 (802.11ax)",
      "Wi-Fi 5 (802.11ac)",
      "Wi-Fi 4 (802.11n)",
      "802.11g",
      "802.11b",
      "802.11a",
    ],
  },
  Energieeffizienzklasse: {
    type: "enum",
    allowUnknown: true,
    options: StandardEnums.ENERGY_CLASS,
  },
  "WPS Sicherheit per Tastendruck": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  WWAN: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Wandmontage: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Wandmontageset: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Warentarifnummer (HS)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Wasserdicht: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Webbrowser: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Weißabgleich: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Wiederholfrequenz: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Zahl der Chassisventilatorstecker": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Zahl der Druckpatronen": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Zertifizierung: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Zubehörschuh: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Zubehörschuh-Typ": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Zufälliges Lesen (4KB)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Zufälliges Schreiben (4KB)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Zusätzliche Stromanschlüsse": {
    type: "numeric",
    units: ["W", "kW", "V", "A", "Wh", "mAh"],
    baseUnit: "W",
  },
  "Zuverlässigkeitsklasse bei wiederholtem freien Fall": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  Zweck: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "sRGB Abdeckung (klassisch)": {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
  "Übertragungsrate HDD Schnittstelle": {
    type: "numeric",
    units: ["MHz", "GHz", "Mbps", "Gbps", "MB/s"],
    baseUnit: "Hz",
  },
  Übertragungstechnik: {
    type: "enum",
    allowUnknown: true,
    options: [],
  },
};
