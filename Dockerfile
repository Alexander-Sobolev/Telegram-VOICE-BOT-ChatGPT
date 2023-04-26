FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PORT=3001

EXPOSE $PORT

CMD ["npm", "start"]