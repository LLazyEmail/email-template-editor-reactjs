# syntax=docker/dockerfile:1

FROM node:16-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "./server.js"]
EXPOSE 9001