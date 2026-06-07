export default async function handler(req, res) {
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
    const result = {};

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const end = Math.floor(Date.now() / 1000);
          const start = end - 365 * 2 * 24 * 60 * 60;

          const url =
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d`;

          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          });

          const data = await response.json();

          const resultData = data.chart.result?.[0];
          const timestamps = resultData?.timestamp;
          const closes = resultData?.indicators?.quote?.[0]?.close;

          if (!timestamps || !closes) {
            result[symbol] = null;
            return;
          }

          result[symbol] = timestamps
            .map((time, index) => ({
              date: new Date(time * 1000).toISOString().split("T")[0],
              close: closes[index],
            }))
            .filter(row => row.close !== null);
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
