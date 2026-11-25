# The Playwright image includes Chromium and its system libraries.
# Keep the tag in sync with the playwright version in package.json.
FROM mcr.microsoft.com/playwright:v1.65.1-noble

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

USER pwuser
CMD ["node", "src/server.js"]
