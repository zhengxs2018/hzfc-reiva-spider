# 编译阶段
FROM node:12-slim as build

WORKDIR /root

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY src ./src
COPY package.json .
COPY tsconfig.json .

RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN cnpm install
RUN npm run build

# 生产阶段
FROM node:12-slim as prod

WORKDIR /app

ENV NODE_ENV="production"

COPY --from=build /root/dist ./dist
COPY config ./config
COPY package.json .
COPY .env .

RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN cnpm install --production

CMD ["npm", "start"]

EXPOSE 9000
