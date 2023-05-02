FROM node:20-bullseye-slim
LABEL maintainer="juandacorreo@gmail.com"

ENV NODE_ENV=production 
ENV PORT=3000 

# Set working directory
RUN mkdir /app
WORKDIR /app

# set locale
RUN apt-get update && apt-get install -y \
  locales \ 
  locales-all \
  && rm -rf /var/lib/apt/lists/*
ENV LC_ALL es_ES.UTF-8
ENV LANG es_ES.UTF-8
ENV LANGUAGE es_ES.UTF-8


# Install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --production

# Configure entrypoint
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]


# Build JavaScript from TypeScript
COPY . .
RUN NODE_OPTIONS=--max-old-space-size=8192 npm run build

EXPOSE $PORT

# Default env file
ENV ENV_FILE=config/.env.prod

# Run this app when a container is launched
# base image entrypoint will add node command
CMD [ "-r", "tsconfig-paths/register", "bin/app.js" ]

