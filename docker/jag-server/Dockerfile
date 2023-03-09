FROM node:latest

WORKDIR /app

COPY docker/jag-server/ .

RUN npm install

CMD ["npm", "start"]