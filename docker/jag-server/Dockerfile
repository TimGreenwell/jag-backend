FROM node:16

WORKDIR /app

COPY docker/jag-server/ .
COPY public public

RUN npm install

CMD ["npm", "start"]