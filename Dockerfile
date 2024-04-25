FROM node:latest

RUN mkdir -p /app

WORKDIR /app

COPY . ./

RUN npm config set registry http://registry.npm.taobao.org/

COPY package.json /app/package.json

RUN rm -rf /app/pnpm-lock.yaml
RUN cd /app && rm -rf /app/node_modules && npm install -g pnpm && pnpm install

RUN cd /app && rm -rf /app/dist && pnpm build

CMD pnpm start:prod
