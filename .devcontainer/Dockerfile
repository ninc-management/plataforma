FROM node:12

# Define pasta padrão
WORKDIR /home/nodejs/nortan

# Adiciona novo usuário e grupo para evitar usar o root
RUN groupadd -r nodejs && useradd -m -r -g nodejs -s /bin/bash nodejs

# Adciona bashrc
COPY .bashrc /home/nodejs

# Define variáveis de ambiente
ENV  TZ Brazil/East

# Corrige permissões da pasta
RUN chmod -Rf 775 /home/nodejs && chown -Rf nodejs:nodejs /home/nodejs

# Passa a usar o novo usuário não root "nodejs"
USER nodejs
