FROM node:12-buster
#FROM node:lts

# Создать директорию app
WORKDIR /app

# Установить зависимости приложения
# Используется символ подстановки для копирования как package.json, так и package-lock.json,
# работает с npm@5+
COPY . ./

### Install SASQL - PHP-Extension inkl. Client-Libraries ###
COPY ./sqlany*.* /opt/
RUN cd /opt && mkdir -p sqlanywhere17 \
     && tar xzf sqlanywhere17.tgz -C sqlanywhere17 \
     && rm sqlanywhere17.tgz \
     && ln -s /opt/sqlanywhere17/bin64/sa_config.sh /etc/profile.d/sa_config.sh \
     && cd /app \
     && echo 'export LD_LIBRARY_PATH=/opt/sqlanywhere17/lib64:$LD_LIBRARY_PATH' >> ~/.profile \
     && echo 'export SQLANY17=/opt/sqlanywhere17' >> ~/.profile

ENV LD_LIBRARY_PATH /opt/sqlanywhere17/lib64:$LD_LIBRARY_PATH
ENV SQLANY17 /opt/sqlanywhere17


RUN npm install --unsafe-perm
# Используется при сборке кода в продакшене
# RUN npm install --only=production

RUN cd /tmp && \
curl -LO https://download.oracle.com/otn_software/linux/instantclient/195000/instantclient-basic-linux.x64-19.5.0.0.0dbru.zip && \
unzip instantclient*.zip && \
rm instantclient*.zip && \
mv instantclient_19_5 /oracle && \
cd /app && \
echo 'export LD_LIBRARY_PATH=/oracle:$LD_LIBRARY_PATH' >> ~/.profile

RUN apt update && \
apt install -y libaio1

ENV LD_LIBRARY_PATH /oracle:$LD_LIBRARY_PATH

VOLUME ["/app/config/"]
CMD [ "node", "index.js" ]
