# Install node.js
FROM node:10.16.0-alpine

# Install ffmpeg
RUN apk update && apk upgrade && apk add ffmpeg

# Create working directory
RUN mkdir -p /bot
WORKDIR /bot

# Install dependencies w/ yarn
COPY package.json /bot
COPY yarn.lock /bot
RUN apk --no-cache --virtual build-dependencies add \
	yarn \
	python \
	make \
	g++ \
	&& yarn install \
	&& apk del build-dependencies

# Build app
COPY . /bot
RUN yarn build

# Run unit tests
RUN yarn test

# Start bot
CMD [ "yarn", "start" ]
