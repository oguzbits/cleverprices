# AI Extraction Research Findings (Icecat)

## Category: GPU

- **Key Fields**:
  - `Grafikprozessorenfamilie`: NVIDIA, AMD
  - `GPU`: Model name (e.g., GeForce RTX 5070 Ti)
  - `Separater Grafik-Adapterspeicher`: 16 GB, 12 GB, etc.
  - `Grafikkartenspeichertyp`: GDDR7, GDDR6X, GDDR6
  - `Anzahl Slots`: Often decimal! (e.g., "3,125", "2,5")
  - `Länge (mm)`: Explicitly mentions mm in the key sometimes.
  - `Min. Systemstromvorsogung`: 850 W, 750 W.
- **Rules to Add**:
  - `Anzahl Slots` regex for `\d+(,\d+)?`.
  - `Schnittstelle` (PCI Express 5.0).
  - `Zusätzliche Stromanschlüsse` (1x 16-pin, 2x 8-pin).

## Category: CPU-Cooler

- **Key Fields**:
  - `Typ`: Luftkühlung, Wasserkühlung.
  - `Lüfterdurchmesser`: 12 cm, 140 mm.
  - `Thermal Design Power (TDP)`: 250 W.
  - `Geräuschpegel (hohe Geschwindigkeit)`: 34,8 dB.
  - `Anzahl Wärmerohre`: 6, 4.
- **Rules to Add**:
  - `TDP` regex `\d+ W`.
  - `RPM` for `Rotationsgeschwindigkeit`.
  - `dB` for noise levels.

## Category: Consoles

- **Key Fields**:
  - `Plattform`: PlayStation 5, Xbox Series X.
  - `Interne Speicherkapazität`: 825 GB, 1 TB.
  - `Lesegeschwindigkeit`: 5500 MB/s.
  - `HDMI-Version`: 2.1.
- **Rules to Add**:
  - `MB/s` for speed.
  - `TFLOPS` for performance.

## Category: Games

- **Key Fields**:
  - `Plattform`: PlayStation 5, PC.
  - `Spiel-Genre`: Aktion, Abenteuer.
  - `USK-Einstufung`: 0, 6, 12, 16, 18.
  - `PEGI-Klassifizierung`: 3, 7, 12, 16, 18.
- **Rules to Add**:
  - Genre aliases.
  - USK/PEGI numeric extraction.

## Global Patterns

- **Unit Normalization**: Continue forcing lowercase (mm, mp, gb, w, hz).
- **Decimal Comma Handling**: `\d+,\d+` is standard in DE Icecat.
- **Boolean Keywords**: "Ja", "Nein" are reliable.

## Phase 2: Idealo Research (Non-Icecat)

### Category: Smartphones (Samsung Galaxy A55 5G)

- **Key Fields**:
  - `Display`: "6,6 Zoll", "2.340 x 1.080 Pixeln" (Note: "Pixeln" suffix).
  - `Kamera`: "50 MP", "12 MP", "5 MP".
  - `Akku`: "5.000 mAh" (Note: dot separator).
  - `Ladegeschwindigkeit`: "25W".
  - `Schutzart`: "IP67".
- **Rules to Add**:
  - `Display` resolution regex: `\d{1,2}(\.\d{3})?\s*x\s*\d{1,2}(\.\d{3})?` (handling 2.340 format).
  - `Kamera` MP extraction: Look for multiple MP values.
  - `Akku` mAh extraction: handle `.` thousand separator.

### Category: Smartwatches (Apple Watch Series 10)

- **Key Fields**:
  - `Gehäusegröße`: "46 mm", "42 mm".
  - `Wasserdichtigkeit`: "50 Metern", "5 ATM".
  - `Batterielaufzeit`: "18 Stunden".
  - `Display-Typ`: "OLED", "LTPO3".
- **Rules to Add**:
  - `Wasserschutz`: Regex for "ATM" and "Metern".
  - `Batterie`: Regex for "Stunden" / "h".

### Category: 3D-Drucker (Anycubic Kobra 3 V2 Combo)

- **Key Fields**:
  - `Bauvolumen`/`Druckgröße`: "255 x 255 x 260 mm" (Explicit dimensions).
  - `Druckgeschwindigkeit`: "600 mm/s".
  - `Düsentemperatur`/`Hotend`: "300 °C".
  - `Heizbett`: "110 °C".
  - `Nivellierung`: "LeviQ 3.0", "Auto-Leveling".
- **Rules to Add**:
  - `mm/s` unit for speed.
  - `°C` unit for temperatures.
  - explicit `Druckgröße` dimension matcher.

### Category: Monitors (Minifire 34")

- **Key Fields**:
  - `Auflösung`: "3440 x 1440 Pixel".
  - `Bildwiederholfrequenz`: "165 Hz", "100 Hz".
  - `Helligkeit`: "300 cd/m²".
  - `Reaktionszeit`: "1 ms".
- **Rules to Add**:
  - `cd/m²` unit.
  - `Hz` unit.

### Category: Notebooks (HP 17-cn3263ng)

- **Key Fields**:
  - `Arbeitsspeicher`: "16 GB".
  - `Festplatte`: "512 GB SSD".
  - `Batterie`: "41 Wh".
  - `Display`: "17,3 Zoll".
- **Rules to Add**:
  - `Wh` unit for battery capacity.
