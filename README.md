# 🐉 Dragonfire — Nikhil Kumar Pillay's Portfolio

A Game of Thrones / dragonfire-themed **3D portfolio** for Nikhil Kumar Rajendra Pillay, Software Engineer.

Built with **Three.js** (procedural flying dragon that breathes fire, rising embers, Dragonstone peaks) and vanilla HTML/CSS/JS — **no build step required**.

## Run locally
Any static server works. From this folder:

```bash
npx serve .
# or
python -m http.server 8000
```

Then open the printed URL.

## Deploy to Vercel
```bash
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

## Structure
| File | Purpose |
|------|---------|
| `index.html` | Page structure + Three.js import map |
| `styles.css` | Dragonfire theme |
| `dragon.js`  | The 3D scene (dragon, fire, embers, sky) |
| `main.js`    | Nav, scroll reveals, stat counters, project cards |
| `vercel.json`| Deploy config |

Projects pulled from the resume and [github.com/DOOMSDAY1009](https://github.com/DOOMSDAY1009).