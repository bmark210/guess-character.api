# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Generate Prisma client and apply migrations
RUN npx prisma generate && npx prisma migrate deploy

# Build the NestJS application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "dist/main"]

# Set the DATABASE_URL environment variable
ENV DATABASE_URL=

# Copy the .env file
COPY .env .env