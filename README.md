# Wrapped for LinkedIn

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/render-examples/wrapped-for-linkedin)

Wrapped for LinkedIn turns your LinkedIn analytics export into a year-in-review story, inspired by Spotify Wrapped. It shows your top posts, who engages with your content, and the badges you earned this year.

The app parses your analytics file in your browser, and the file never leaves your device. To add post screenshots to exported images, the app sends the URLs of your top posts to a screenshot service. The service accepts only public posts and does not log the URLs. The app runs on [Render](https://render.com/).

Created by [Shifra Williams](https://www.linkedin.com/in/shifra-williams/) and [Venkata Naga Sai Kumar Bysani](https://www.linkedin.com/in/saibysani18/).

> [!NOTE]
> This project is not affiliated with, endorsed by, or connected to LinkedIn or Microsoft.

🫶 _Made with love for the developer community_

## Features

- **Shareable cards**: Download story cards as PNG or PDF and post them on LinkedIn.
- **Top posts**: See your posts ranked by impressions, engagement rate, and comments.
- **Badges**: Earn badges for 1M+ impressions, a 100K+ impression post, 1,000+ new followers, or engagement in all 12 months.
- **Audience demographics**: See your followers and engagers by industry, seniority, location, and company size.
- **Story navigation**: Swipe through cards like Instagram stories. Cards autoplay, and you can press and hold to pause.
- **Demo data**: Try the app with sample data before you upload your own file.
- **Local caching**: The app caches your data in your browser, so it loads again when you return.

## Get your Wrapped for LinkedIn

1. Export your [LinkedIn analytics](https://www.linkedin.com/analytics/creator/content/?metricType=ENGAGEMENTS&timeRange=past_365_days) as an Excel file. The [Wrapped for LinkedIn landing page](https://wrappedforlinkedin.onrender.com/) has step-by-step instructions.
1. Open [wrappedforlinkedin.onrender.com](https://wrappedforlinkedin.onrender.com/) and upload the file.
1. Look through your stories and share the cards you like.

## Run locally

You need Node.js 20.19+ or 22.12+ for the site, and Node.js 22+ for the screenshot service.

```bash
git clone https://github.com/render-examples/wrapped-for-linkedin.git
cd wrapped-for-linkedin
npm install --prefix site
bin/preview.sh
```

Open `http://localhost:5173`.

The site works without the screenshot service, but exported cards then show no post screenshots. To run the service locally, open a second terminal:

```bash
cd screenshot-service
npm install
ALLOWED_ORIGIN=http://localhost:5173 npm start
```

The service listens on port 10000, which matches `VITE_SCREENSHOT_SERVICE_URL` in `site/.env.development`.

### Tests

```bash
npm test --prefix site
npm test --prefix screenshot-service
```

## Project structure

| Path | Contents |
| --- | --- |
| `site/` | React, TypeScript, and Vite app. See `site/src/README.md` for its architecture. |
| `screenshot-service/` | Express service that uses Playwright to take screenshots of public LinkedIn post embeds. |
| `render.yaml` | Render Blueprint for the static site and the screenshot service. |
| `bin/preview.sh` | Starts the site's development server. |

## Deploy to Render

Click **Deploy to Render** at the top of this README. The Blueprint creates two services:

- `wrapped-for-linkedin` is a static site.
- `wrapped-for-linkedin-screenshots` is a Docker web service. It uses the Standard plan because Chromium needs about 1 GB of memory.

If you deploy under different service names, update `VITE_SCREENSHOT_SERVICE_URL` and `ALLOWED_ORIGIN` in `render.yaml` to match the new URLs.

## Contribute

1. Fork the repository.
1. Create a feature branch.
1. Commit your changes.
1. Push the branch and open a pull request.
