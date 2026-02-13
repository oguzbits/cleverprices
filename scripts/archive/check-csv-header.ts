const fs = require("fs");
const path =
  "/Users/oguz/Desktop/Dev/cleverprices/Keepa Import 14-01-26/laptop-de.csv";

const buffer = Buffer.alloc(2000);
const fd = fs.openSync(path, "r");
fs.readSync(fd, buffer, 0, 2000, 0);
fs.closeSync(fd);

console.log(buffer.toString("utf-8"));
