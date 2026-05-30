FROM node:lts-alpine

ENV TZ=Asia/Seoul

RUN apk --no-cache add tzdata && \
  cp /usr/share/zoneinfo/$TZ /etc/localtime && \
  echo $TZ > /etc/timezone

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN [ "npm", "ci" ]

COPY . .

RUN [ "npm", "run", "build" ]

ENTRYPOINT [ "npm", "run", "start" ]
