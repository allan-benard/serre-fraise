# Utilise une image officielle PHP avec Apache
FROM php:8.2-apache

# Installe les dépendances nécessaires pour PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo_pgsql

# Active les erreurs dans Apache (facultatif mais utile pour debug)
RUN echo "display_errors=On\nerror_reporting=E_ALL" > /usr/local/etc/php/conf.d/errors.ini

# Copie tous les fichiers dans le dossier web d'Apache
COPY . /var/www/html/

# Donne les bons droits
RUN chown -R www-data:www-data /var/www/html

# Expose le port 80
EXPOSE 80
