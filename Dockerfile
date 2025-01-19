# Build Stage
FROM node:21-alpine AS build

WORKDIR /app

ADD package*.json /app/

RUN npm install

ADD . /app/

# Application Build
RUN npm run build

# Production Stage
FROM node:21-alpine

WORKDIR /app

# 빌드 단계에서 생성된 빌드 아티팩트만 복사
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package*.json /app/

# 프로덕션 의존성만 설치
RUN npm install --production

EXPOSE 3080

ENTRYPOINT ["npm", "run", "start:prod"]
