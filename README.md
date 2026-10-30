# Edson Brenno — Portfólio

Portfólio pessoal com storytelling: 80% carreira, 20% vida.

**Stack:** HTML, CSS e JavaScript puros + [GSAP](https://gsap.com/) (ScrollTrigger) e [Lenis](https://lenis.darkroom.engineering/) via CDN.
Sem build: basta abrir o `index.html`.

## Estrutura

```
index.html
css/style.css
js/main.js
assets/
  img/      fotos otimizadas (WebP)
  video/    vídeos comprimidos (H.264, sem áudio)
  curriculo_edson_brenno_portfolio_pt.pdf
  curriculo_edson_brenno_portfolio_en.pdf
```

## Rodar localmente

```bash
npx serve .
# ou
python -m http.server 5500
```

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `edson-brenno.github.io` para ter a URL raiz, ou qualquer nome).
2. Envie os arquivos:
   ```bash
   git init
   git add .
   git commit -m "feat: portfólio"
   git branch -M main
   git remote add origin https://github.com/Edson-brenno/<repo>.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / root**.

> As pastas `cv/`, `fotos/` e `exemplos/` estão no `.gitignore` — elas contêm arquivos brutos e documentos pessoais que **não** devem ser publicados.
