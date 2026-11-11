# ──────────────────────────────────────────────
# Contenedor del juego Snake
# Sirve los archivos estáticos con Nginx
# ──────────────────────────────────────────────
FROM nginx:1.27-alpine

# Etiqueta de metadata
LABEL org.opencontainers.image.title="Snake Game"
LABEL org.opencontainers.image.description="Juego Snake clásico servido con Nginx"
LABEL org.opencontainers.image.licenses="MIT"

# Copiar los archivos estáticos del juego al directorio de Nginx
COPY index.html /usr/share/nginx/html/
COPY css/        /usr/share/nginx/html/css/
COPY js/         /usr/share/nginx/html/js/

# Puerto que expone Nginx
EXPOSE 80

# Healthcheck básico: verifica que Nginx responde
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
