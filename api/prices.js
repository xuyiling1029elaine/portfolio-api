import yahooFinance from "yahoo-finance2";

export default async function handler(req, res) {
  // Allow CORS from any origin (needed for GitHub Pages)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const tickers = req.query.tickers;

    if (!tickers) {
      return res.status(400).json({ error: "Missing tickers parameter" });
    }

    const symbols = tickers.split(",").map(t => t.trim().toUpperCase());

    if (symbols.length > 20) {
      return res.status(400).json({ error: "Maximum 20 tickers per request" });
    }

    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 2);

    const result = {};

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const data = await yahooFinance.historical(symbol, {
            period1: start,
            period2: end,
            interval: "1d",
          });

          result[symbol] = data
            .filter((row) => row.close != null)
            .map((row) => ({
              date: row.date.toISOString().split("T")[0],
              close: row.close,
            }));
        } catch (e) {
          result[symbol] = null;
        }
      })
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch historical prices",
      detail: error.message,
    });
  }
}
