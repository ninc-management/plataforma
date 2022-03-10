FROM gitpod/workspace-base

ENV DEBIAN_FRONTEND noninteractive

USER root
# Instala dependências
RUN install-packages make libssl-dev libghc-zlib-dev libcurl4-gnutls-dev libexpat1-dev gettext make && \
    curl -Os https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    install-packages ./google-chrome-stable_current_amd64.deb && \
    rm google-chrome-stable_current_amd64.deb

RUN curl -Os https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.5.2.deb && \
    install-packages ./mongodb-database-tools-ubuntu2004-x86_64-100.5.2.deb && \
    rm mongodb-database-tools-ubuntu2004-x86_64-100.5.2.deb

RUN curl -Os https://downloads.mongodb.com/compass/mongodb-mongosh_1.2.3_amd64.deb && \
    install-packages ./mongodb-mongosh_1.2.3_amd64.deb && \
    rm mongodb-mongosh_1.2.3_amd64.deb

USER gitpod

# Instala codecov
RUN cd /usr/bin && \
    sudo curl -Os https://uploader.codecov.io/latest/linux/codecov && \
    sudo chmod +x codecov && \
    cd -

ENV NODE_VERSION=12.22.9
ENV TRIGGER_REBUILD=1
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | PROFILE=/dev/null bash \
    && bash -c ". .nvm/nvm.sh \
        && nvm install $NODE_VERSION \
        && nvm alias default $NODE_VERSION \
        && npm install -g typescript yarn node-gyp" \
    && echo ". ~/.nvm/nvm-lazy.sh"  >> /home/gitpod/.bashrc.d/50-node
# above, we are adding the lazy nvm init to .bashrc, because one is executed on interactive shells, the other for non-interactive shells (e.g. plugin-host)

RUN printf  \
"export NVM_DIR=\"\$HOME/.nvm\"\n\
node_versions=(\"\$NVM_DIR\"/versions/node/*)\n\
if (( \"\${#node_versions[@]}\" > 0 )); then\n\
    PATH=\"\$PATH:\${node_versions[\$((\${#node_versions[@]} - 1))]}/bin\"\n\
fi\n\
if [ -s \"\$NVM_DIR/nvm.sh\" ]; then\n\
    # load the real nvm on first use\n\
    nvm() {\n\
        # shellcheck disable=SC1090,SC1091\n\
        source \"\$NVM_DIR\"/nvm.sh\n\
        nvm \"\$@\"\n\
    }\n\
fi\n\
if [ -s \"\$NVM_DIR/bash_completion\" ]; then\n\
    # shellcheck disable=SC1090,SC1091\n\
    source \"\$NVM_DIR\"/bash_completion\n\
fi" >> ~/.nvm/nvm-lazy.sh

ENV PATH=$PATH:/home/gitpod/.nvm/versions/node/v${NODE_VERSION}/bin
ENV CHROME_BIN=/usr/bin/google-chrome
ENV NG_CLI_ANALYTICS=ci