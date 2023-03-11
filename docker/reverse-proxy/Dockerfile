FROM nginx:latest

WORKDIR /

COPY docker/reverse-proxy/dhparam/ /etc/nginx/dhparam/
COPY docker/reverse-proxy/certs/jag.baby/ /etc/nginx/certs/jag.baby/
COPY docker/reverse-proxy/templates/ /etc/nginx/templates/
COPY docker/reverse-proxy/html/ /etc/nginx/html/