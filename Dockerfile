FROM ubuntu:22.04

RUN apt-get update
RUN apt-get install --yes curl
RUN curl -fsSL https://deb.nodesource.com/setup_16.x

RUN apt install nodejs -y
#RUN apt-get install nodejs
RUN node -v


RUN  wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg \
     echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list \
     sudo apt update && sudo apt install terraform    \

#FROM node:18-alpine
#
#WORKDIR /app
#
#COPY . .
#
#RUN npm install
#
#RUN npm run build
#
##CMD ["npm","run","start"]
#
#EXPOSE 2000
#
#CMD ["node","dist/main"]