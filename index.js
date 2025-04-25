const pup = require('puppeteer');
const url = "https://www.adidas.com.br/calcados";

(async () => {
    const browser = await pup.launch({ headless: false });
    const page = await browser.newPage();
    console.log("Iniciou");

    await page.goto(url);
    await page.click("#glass-gdpr-default-consent-accept-button");

    let tenis = [];
    let ProximaPagina = true;

    while (ProximaPagina) {
        // Coleta os dados dos produtos na página atual
        const dadosTenis = await page.$$eval('.product-grid_grid__e2ygA article', artigos => {
            return artigos.map(artigo => {
                const texto = artigo.querySelector('[data-testid="product-card-subtitle"]') ? artigo.querySelector('[data-testid="product-card-subtitle"]').innerText : null;

                // Distingue entre nome e categoria
                const nome = texto && texto.includes('Tênis') ? texto : null; 
                const categoria = !nome && texto ? texto : null; 

                const valor = artigo.querySelector('div[data-testid="price-component"] span') ? artigo.querySelector('div[data-testid="price-component"] span').innerText : null;
                const urlImagem = artigo.querySelector('img') ? artigo.querySelector('img').src : null;

                return { nome, categoria, valor, urlImagem };
            });
        });

        console.log("Produtos capturados nesta página:", dadosTenis.length);

        tenis = [...tenis, ...dadosTenis];

        const proximaPaginaBotao = await page.$('a.pagination_prev-next-button__Ie7Iz');
        if (proximaPaginaBotao) {
            await page.waitForSelector('a.pagination_prev-next-button__Ie7Iz', { visible: true });
            
            // Clica no botão de próximo e espera a mudança da página
            await proximaPaginaBotao.click();
            console.log('Clicando no botão de "Próximo"...');

            try {
                // Aqui esperamos pela presença de qualquer produto
                await page.waitForSelector('.product-grid_grid__e2ygA article', { visible: true, timeout: 60000 });
                console.log('Página carregada com novos produtos.');
            } catch (error) {
                console.log('Erro ao esperar pela próxima página: ', error);
                ProximaPagina = false; 
            }
        } else {
            ProximaPagina = false;
        }
    }

    // Exibe o total de produtos capturados e todos os dados
    console.log("Total de produtos capturados:", tenis.length);
    console.log(tenis);

    await browser.close();
})();
