import fs from "fs";
const ICECAT_USERNAME = process.env.ICECAT_USERNAME;
const ICECAT_PASSWORD = process.env.ICECAT_PASSWORD;
const auth = "Basic " + Buffer.from(`${ICECAT_USERNAME}:${ICECAT_PASSWORD}`).toString("base64");
const id = "135153062"; // PS5 Pro
const url = `https://data.icecat.biz/xml_s3/xml_server3.cgi?product_id=${id};lang=de;output=productxml`;
const res = await fetch(url, { headers: { Authorization: auth } });
const xml = await res.text();
console.log(xml.substring(0, 5000));
