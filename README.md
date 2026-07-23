# A garden for Nurulain

A static, garden-themed marriage proposal from Aleem to Nurulain. It is designed for GitHub Pages and requires no build step.

## Personalise the story

Open `content.js`. All names, letter paragraphs, journey milestones, reasons,
promises, and proposal wording are collected there. The partner naming fields let
you choose the right tone in different places:

- `partnerName` — full name, currently “Nurulain”
- `partnerShortName` — familiar short name, currently “Nurul”
- `partnerNickname` — intimate nickname, currently “Ain”

Edit the text between quotation marks, save, and open `index.html` to preview.

## Publish with GitHub Pages

This project includes an automatic deployment workflow:

1. Push these files to a GitHub repository on the `main` branch.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Open the repository's **Actions** tab and watch the **Deploy GitHub Pages** workflow.

Every push to `main` will publish the latest version. You can also run the
workflow manually from the Actions tab using **Run workflow**. GitHub shows the
public site URL on the completed deployment and in **Settings → Pages**.

## Preview locally

You can open `index.html` directly, or run:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The custom garden artwork is stored at `assets/moonlit-garden.png`.
