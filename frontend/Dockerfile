# Build Stage
FROM node:lts AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the app
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Copy custom Nginx configuration for React Router (optional)
COPY custom_nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from the build stage to the Nginx web root directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
