FROM node:24-alpine AS deps
WORKDIR /usr/src/app
RUN apk add --no-cache openssl python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
RUN npm rebuild bcrypt --build-from-source

FROM node:24-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl python3 make g++
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY prisma ./prisma
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY package.json ./
EXPOSE 5000
CMD ["node", "dist/main.js"]
