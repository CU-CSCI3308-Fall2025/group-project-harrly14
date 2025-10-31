FROM node:lts

WORKDIR /repository

COPY package*.json ./

RUN npm ci --silent

COPY . .

RUN chown -R node:node /repository

USER node

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]