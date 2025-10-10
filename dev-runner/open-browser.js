import open from "open";

setTimeout(async () => {
  const url = "http://localhost:5173";
  console.log(`🌐 Opening ${url} in your browser...`);
  await open(url);
}, 5000);
