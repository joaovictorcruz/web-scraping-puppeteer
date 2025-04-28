const pup = require("puppeteer");
const fs = require("fs");
const url = "https://www.adidas.com.br/calcados";

(async () => {
  const browser = await pup.launch({ headless: false });
  const page = await browser.newPage();
  console.log("Iniciou");

  await page.goto(url, { waitUntil: "domcontentloaded" });

  try {
    await page.waitForSelector("#glass-gdpr-default-consent-accept-button", {
      timeout: 10000,
    });
    await page.click("#glass-gdpr-default-consent-accept-button");
    console.log("Cookies aceitos!");
  } catch (err) {
    console.log("Botão de cookies não encontrado ou já aceito.");
  }

  let tenis = [];
  let ProximaPagina = true;

  while (ProximaPagina) {
    await page.waitForSelector(".product-grid_grid__e2ygA article", {
      visible: true,
    });

    const dadosTenis = await page.$$eval(
      ".product-grid_grid__e2ygA article",
      (artigos) => {
        return artigos.map((artigo) => {
          const nome =
            artigo.querySelector('[data-testid="product-card-title"]')
              ?.innerText || null;
          const categoria =
            artigo.querySelector('[data-testid="product-card-subtitle"]')
              ?.innerText || null;
          const valor =
            artigo.querySelector('div[data-testid="price-component"] span')
              ?.innerText || null;
          const urlImagem = artigo.querySelector("img")?.src || null;

          return { nome, categoria, valor, urlImagem };
        });
      }
    );

    console.log("Produtos capturados nesta página:", dadosTenis.length);

    tenis = [...tenis, ...dadosTenis];

    // Verifica se existe o botão de "Próximo" baseado no texto
    const existeProximo = await page.evaluate(() => {
      const spans = Array.from(
        document.querySelectorAll("span.gl-cta__content")
      );
      return spans.some((span) => span.textContent.trim() === "Próximo");
    });

    if (existeProximo) {
      console.log('Clicando no botão de "Próximo"...');
      await page.evaluate(() => {
        const spans = Array.from(
          document.querySelectorAll("span.gl-cta__content")
        );
        const botaoProximo = spans.find(
          (span) => span.textContent.trim() === "Próximo"
        );
        botaoProximo?.click();
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      console.log("Não encontrou botão de próxima página. Finalizando...");
      ProximaPagina = false;
    }
  }

  console.log("Total de produtos capturados:", tenis.length);

  // Salva os dados em um arquivo JSON
  fs.writeFileSync("dados_tenis.json", JSON.stringify(tenis, null, 2), "utf-8");
  console.log("Dados salvos em 'dados_tenis.json'");

  await browser.close();
})();
