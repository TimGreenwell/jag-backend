FROM nginx:latest

WORKDIR /

COPY docker/reverse-proxy/ssh-config/ /etc/letsencrypt/
COPY docker/reverse-proxy/certs/jag.baby/ /etc/letsencrypt/live/jag.baby/
COPY docker/reverse-proxy/templates/ /etc/nginx/templates/
