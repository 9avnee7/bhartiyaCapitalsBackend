FROM node:23-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 3001

# Start the application
CMD ["node", "src/server.js"]