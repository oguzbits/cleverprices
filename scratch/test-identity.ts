import { getProductIdentity } from "../src/lib/utils/product-identity";

const p30 = {
  title: "Anycubic Kobra S1 3D-Drucker, 600mm/s Hochgeschwindigkeitsdruck, 320°C Hotend mit Abnehmbarer Düse, Dreifach-Kühlsystem, Skalierbarer Vierfarbdruck, Druckgröße 250 * 250 * 250 mm",
  brand: "ANYCUBIC"
};

const p27 = {
  title: "Anycubic Kobra S1 Combo 3D-Drucker Mehrfarbig, Geschlossene CoreXY-Struktur, 600 mm/s Schnelles Drucken, Trocknung Filament während des Drucks, 320 °C Hotend, Druckgröße 250 x 250 x 250 mm",
  brand: "ANYCUBIC"
};

console.log("P30 Identity:", JSON.stringify(getProductIdentity(p30 as any), null, 2));
console.log("P27 Identity:", JSON.stringify(getProductIdentity(p27 as any), null, 2));
