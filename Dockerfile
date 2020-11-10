FROM node:current-alpine

WORKDIR /opt/proxy-app
COPY . .
RUN npm ci

EXPOSE 80

CMD [ "node", "app.js" ]
