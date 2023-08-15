FROM mcr.microsoft.com/devcontainers/typescript-node:1-18-bullseye

# Instala o chromium para os testes
RUN apt-get update && apt-get install -y chromium

# Instala codecov
RUN cd /usr/bin && \
    sudo curl -Os https://uploader.codecov.io/latest/linux/codecov && \
    sudo chmod +x codecov && \
    cd -

# Define pasta padrão
#WORKDIR /root/nortan

# Adiciona novo usuário e grupo para evitar usar o root
#RUN groupadd -r node && useradd -m -r -g node -s /bin/bash node

# Adciona bashrc
COPY .bashrc /root

# Define variáveis de ambiente
ENV  TZ Brazil/East
ENV  CHROME_BIN /usr/bin/chromium


# Corrige permissões da pasta
# RUN chmod -Rf 775 /home/node && chown -Rf node:node /home/node

# Passa a usar o novo usuário não root "node"
# USER node
# ENV USER node
