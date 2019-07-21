# Install node.js
FROM node:10.16.0

# Install FFMPEG
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

# Create working directory
RUN mkdir -p /bot
WORKDIR /bot

# Install dependencies
COPY package.json /bot
COPY yarn.lock /bot
RUN yarn

# Build app
COPY . /bot
RUN yarn build

# Start bot
CMD [ "yarn", "start" ]
