FROM node:latest

RUN mkdir -p /app

WORKDIR /app

COPY . ./

RUN npm config set registry https://registry.npm.taobao.org/

COPY package.json /app/package.json

RUN rm -rf /app/package-lock.json
RUN cd /app && rm -rf /app/node_modules &&  npm install

RUN cd /app && rm -rf /app/dist &&  npm run build

CMD npm run start:prod