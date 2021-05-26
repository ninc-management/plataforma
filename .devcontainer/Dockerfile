FROM node:12

# Instala a versão mais recente do Git
RUN apt-get update && \
    apt-get install -y make libssl-dev libghc-zlib-dev libcurl4-gnutls-dev libexpat1-dev gettext unzip make wget vim less && \
    wget https://github.com/git/git/archive/v2.30.0.zip -O git.zip && \
    unzip git.zip && \
    cd git-* && \
    make prefix=/usr/local all && \
    make prefix=/usr/local install && \
    cd - && rm -rf git*

# Define pasta padrão
WORKDIR /root/nortan

# Adiciona novo usuário e grupo para evitar usar o root
#RUN groupadd -r node && useradd -m -r -g node -s /bin/bash node

# Adciona bashrc
COPY .bashrc /root

# Define variáveis de ambiente
ENV  TZ Brazil/East

# Corrige permissões da pasta
# RUN chmod -Rf 775 /home/node && chown -Rf node:node /home/node

# Passa a usar o novo usuário não root "node"
# USER node
# ENV USER node
