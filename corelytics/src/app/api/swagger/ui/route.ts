// Swagger UI HTML oldal - standalone verzió a React strict mode figyelmeztetések elkerülése érdekében
// Magyar nyelvű felület egyedi fordítás pluginnal
import { NextResponse } from 'next/server'

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Corelytics API Dokumentáció</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background: #fafafa; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; }
    /* Magyar fejléc stílus */
    .swagger-ui .info hgroup.main h2 { font-size: 1.2em; }
    .swagger-ui .info .title { font-size: 2em; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    // Magyar fordítások a Swagger UI felülethez
    const huTranslations = {
      "Authorize": "Hitelesítés",
      "Logout": "Kijelentkezés",
      "Close": "Bezárás",
      "Try it out": "Kipróbálás",
      "Cancel": "Mégse",
      "Execute": "Végrehajtás",
      "Clear": "Törlés",
      "Reset": "Visszaállítás",
      "Loading...": "Betöltés...",
      "No parameters": "Nincsenek paraméterek",
      "Parameters": "Paraméterek",
      "Name": "Név",
      "Description": "Leírás",
      "Value": "Érték",
      "Parameter content type": "Paraméter tartalomtípus",
      "Response content type": "Válasz tartalomtípus",
      "Request body": "Kérés törzse",
      "Responses": "Válaszok",
      "Response headers": "Válasz fejlécek",
      "Hide Response": "Válasz elrejtése",
      "Response body": "Válasz törzs",
      "Headers": "Fejlécek",
      "Example Value": "Példa érték",
      "Model": "Modell",
      "Models": "Modellek",
      "Schema": "Séma",
      "Required": "Kötelező",
      "Curl": "Curl",
      "Request URL": "Kérés URL",
      "Server response": "Szerver válasz",
      "Response Code": "Válasz kód",
      "Links": "Hivatkozások",
      "No links": "Nincsenek hivatkozások",
      "Lock": "Zárolás",
      "available": "elérhető",
      "Download": "Letöltés",
      "Copy to clipboard": "Másolás vágólapra",
      "Expand operation": "Művelet kibontása",
      "Collapse operation": "Művelet összecsukása",
      "operationId": "Művelet azonosító",
      "deprecated": "elavult",
      "In": "Hely",
      "path": "útvonal",
      "query": "lekérdezés",
      "header": "fejléc",
      "cookie": "süti",
      "order by": "rendezés",
      "Filter by tag": "Szűrés címke szerint",
      "Authorization": "Jogosultság",
      "Possible values": "Lehetséges értékek",
      "Example": "Példa",
      "Schemes": "Sémák",
      "Select a definition": "Válassz egy definíciót",
      "default": "alapértelmezett",
      "Request duration": "Kérés időtartama",
      "Undocumented": "Nem dokumentált",
      "Failed to fetch.": "Sikertelen lekérdezés.",
      "Possible Reasons:": "Lehetséges okok:",
      "CORS": "CORS",
      "The URL is not correct": "Az URL nem megfelelő",
      "The server is not reachable": "A szerver nem elérhető",
      "Send empty value": "Üres érték küldése",
      "Add string item": "Szöveges elem hozzáadása",
      "Add item": "Elem hozzáadása",
      "Remove item": "Elem eltávolítása",
    };

    // Magyar fordítás plugin
    const HuTranslationPlugin = function() {
      return {
        statePlugins: {
          spec: {
            wrapActions: {}
          }
        },
        fn: {
          getLocalizedText: function(key) {
            return huTranslations[key] || key;
          }
        }
      };
    };

    SwaggerUIBundle({
      url: '/api/swagger',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      plugins: [HuTranslationPlugin],
      layout: 'BaseLayout',
      deepLinking: true,
      // Magyar szöveget használ a "Filter by tag" mezőhöz
      filter: true,
      // Modellek alapértelmezetten kibontva
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    });

    // DOM-ban lévő angol szövegek magyarra cserélése betöltés után
    function translateUI() {
      // Gombok és címkék fordítása
      document.querySelectorAll('.btn, .opblock-summary-method, label, th, .tab-header, .opblock-tag, h4, h5, span, a').forEach(function(el) {
        var text = el.textContent?.trim();
        if (text && huTranslations[text]) {
          // Csak közvetlen szövegcsomópontokat cseréljük
          for (var node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() && huTranslations[node.textContent.trim()]) {
              node.textContent = node.textContent.replace(node.textContent.trim(), huTranslations[node.textContent.trim()]);
            }
          }
        }
      });

      // Placeholder szövegek fordítása
      document.querySelectorAll('input[placeholder]').forEach(function(input) {
        var ph = input.getAttribute('placeholder');
        if (ph === 'Filter by tag') {
          input.setAttribute('placeholder', 'Szűrés címke szerint');
        }
      });
    }

    // Fordítás futtatása a DOM betöltése és időzítve is, mivel a Swagger UI aszinkron renderel
    window.addEventListener('load', function() {
      setTimeout(translateUI, 500);
      setTimeout(translateUI, 1500);
      setTimeout(translateUI, 3000);
    });

    // MutationObserver a dinamikusan betöltött tartalom fordításához
    var observer = new MutationObserver(function(mutations) {
      translateUI();
    });
    
    // A swagger-ui div megfigyelése változásokra
    window.addEventListener('load', function() {
      var target = document.getElementById('swagger-ui');
      if (target) {
        observer.observe(target, { childList: true, subtree: true });
      }
    });
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
