FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Live no browser: mesma origem. Nginx encaminha /api → serviço `app`.
# Login produto: PKCE prisma-steward-ui (sem client_secret / sem Bearer estático).
ARG VITE_DATA_MODE=live
ARG VITE_API_BASE_URL=
ARG VITE_OIDC_ENABLED=true
ARG VITE_OIDC_ISSUER=http://localhost:8180/realms/prisma
ARG VITE_OIDC_PASSWORD_CLIENT_ID=prisma-lab
ARG VITE_OIDC_CLIENT_ID=prisma-steward-ui
ARG VITE_API_BEARER=
ENV VITE_DATA_MODE=$VITE_DATA_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OIDC_ENABLED=$VITE_OIDC_ENABLED
ENV VITE_OIDC_ISSUER=$VITE_OIDC_ISSUER
ENV VITE_OIDC_PASSWORD_CLIENT_ID=$VITE_OIDC_PASSWORD_CLIENT_ID
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_API_BEARER=$VITE_API_BEARER
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
