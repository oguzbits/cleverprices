try {
  const gtins = ["711719020837", "6937120321231", "45496453596"];
  const escapedGtins = gtins.map((g) =>
    g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const gtinRegex = new RegExp(`Value="0?(${escapedGtins.join("|")})"`);
  console.log("Regex created successfully. Length:", gtinRegex.source.length);

  const testBlock = '<EAN_UPC Value="711719020837" />';
  const match = testBlock.match(gtinRegex);
  console.log("Match test:", match ? "SUCCESS" : "FAIL");
} catch (e) {
  console.error("Regex construction failed:", e);
}
