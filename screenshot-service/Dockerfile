# The Playwright image includes Chromium and its system libraries.
# Keep the tag in sync with the playwright version in package.json.
# The digest pins the exact image. Update it when you change the tag.
FROM mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY src ./src

USER pwuser
CMD ["node", "src/server.ts"]
