## Stage 1
#FROM node:12.10.0-alpine as node
#WORKDIR /usr/src/app
#COPY package*.json ./
#RUN npm install
#COPY . .
#RUN npm run build
#
## # Stage 2
#FROM nginx:1.13.12-alpine
#COPY --from=node /usr/src/app/dist/ /usr/share/nginx/html
#COPY ./nginx.conf /etc/nginx/conf.d/default.con

FROM nginx:stable-alpine
LABEL version="1.0"

COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html
COPY platform/viewer/dist/ .
