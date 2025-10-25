FROM debian:stable-slim

COPY ./dist/app /usr/bin/app

EXPOSE 3000

RUN chmod +x /usr/bin/app
CMD ["/usr/bin/app"]