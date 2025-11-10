FROM debian:stable-slim

COPY ./dist/app /usr/bin/application

EXPOSE 3000

RUN chmod +x /usr/bin/application
CMD ["/usr/bin/application"]