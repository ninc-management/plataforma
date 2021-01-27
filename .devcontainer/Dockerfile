FROM node:12

# Define pasta padrão
WORKDIR /home/node/nortan

# Adiciona novo usuário e grupo para evitar usar o root
#RUN groupadd -r node && useradd -m -r -g node -s /bin/bash node

# Adciona bashrc
COPY .bashrc /home/node

# Define variáveis de ambiente
ENV  TZ Brazil/East

# Corrige permissões da pasta
RUN chmod -Rf 775 /home/node && chown -Rf node:node /home/node

# Passa a usar o novo usuário não root "node"
USER node
