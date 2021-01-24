FROM node:12-alpine

# Define pasta padrão
WORKDIR /home/nodejs/nortan

# Adiciona dependências do sistema
RUN apk add --no-cache \
        git \
        bash \
        tzdata \
        openntpd

# Adiciona novo usuário e grupo para evitar usar o root
RUN addgroup -S nodejs \
    && adduser -S nodejs -G nodejs -s /bin/bash -D

# Adciona bashrc
COPY .bashrc /home/nodejs

# Define variáveis de ambiente
ENV  NODE_ENV production

# Corrige permissões da pasta
RUN chmod -Rf 775 /home/nodejs && chown -Rf nodejs:nodejs /home/nodejs

# Passa a usar o novo usuário não root "nodejs"
USER nodejs
