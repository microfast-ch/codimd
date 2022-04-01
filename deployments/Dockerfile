ARG BUILDPACK=12-bullseye
ARG RUNTIME=12-alpine

FROM node:$BUILDPACK as FRONTEND_BUILD
WORKDIR /app
COPY . .
ENV QT_QPA_PLATFORM=offscreen

RUN git status
RUN set -xe && \
  git reset --hard && \
  git clean -fx && \
  npm install && \
  npm run build && \
  cp ./deployments/docker-entrypoint.sh ./ && \
  cp .sequelizerc.example .sequelizerc && \
  rm -rf .git .gitignore .dockerignore .editorconfig .babelrc .mailmap .sequelizerc.example \
  test docs contribute \
  package-lock.json webpack.prod.js webpack.htmlexport.js webpack.dev.js webpack.common.js \
  config.json.example README.md CONTRIBUTING.md AUTHORS node_modules

FROM node:$BUILDPACK as BACKEND_BUILD
#USER hackmd
ENV QT_QPA_PLATFORM=offscreen
WORKDIR /app
COPY . .
RUN npm install --production && npm cache clean --force && rm -rf /tmp/{core-js-banners,phantomjs}

FROM node:$RUNTIME
WORKDIR /app
COPY --from=BACKEND_BUILD /app/node_modules .
COPY --from=FRONTEND_BUILD /app .
COPY deployments/docker-entrypoint.sh .
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
