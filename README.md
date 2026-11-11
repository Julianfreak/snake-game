# 🐍 Snake Game

Juego Snake clásico con estética moderna, construido con HTML, CSS y JavaScript **vanilla** (sin frameworks, sin compilación). Desplegado en AWS con S3 + CloudFront y totalmente contenerizado con Docker.

**🎮 Demo en vivo:** [https://d34tjebyh8sm5v.cloudfront.net](https://d34tjebyh8sm5v.cloudfront.net)

---

## 📋 Tabla de contenidos

- [Características](#características)
- [Cómo jugar](#cómo-jugar)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecución local con Docker](#ejecución-local-con-docker)
- [Despliegue a AWS con Docker](#despliegue-a-aws-con-docker)
- [Arquitectura en AWS](#arquitectura-en-aws)
- [Costo estimado](#costo-estimado)
- [Limpieza de recursos](#limpieza-de-recursos)
- [Licencia](#licencia)

---

## Características

- 🎨 **Renderizado con Canvas** — game loop de 60 FPS con `requestAnimationFrame`
- ⌨️ **Controles duales** — teclado (flechas + WASD) y táctil (swipe) para móvil
- 🏆 **Sistema de puntuación** — récord persistente con `localStorage`
- ⚡ **Velocidad progresiva** — la serpiente acelera al comer
- ⏸️ **Pausa** — tecla espacio para pausar/reanudar
- 📱 **Responsive** — se adapta a cualquier tamaño de pantalla
- ♿ **Accesible** — respeta `prefers-reduced-motion`
- 🎯 **Sin dependencias** — HTML, CSS y JS puro, sin frameworks ni build step

---

## Cómo jugar

| Tecla | Acción |
|-------|--------|
| `↑` / `W` | Mover arriba |
| `↓` / `S` | Mover abajo |
| `←` / `A` | Mover izquierda |
| `→` / `D` | Mover derecha |
| `Espacio` | Pausar / Reanudar |

En **móvil**: desliza el dedo sobre el tablero en la dirección que quieras mover la serpiente.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 Canvas, CSS3, JavaScript (ES6+) |
| Servidor local | Docker + Nginx |
| Infraestructura | AWS CDK + AWS Blocks |
| Hosting | Amazon S3 + CloudFront |
| Cifrado | AWS KMS |

---

## Estructura del proyecto

```
.
├── index.html                  # Estructura HTML del juego
├── css/
│   └── style.css               # Estilos (tema oscuro, responsive)
├── js/
│   └── game.js                 # Lógica del juego (game loop, render, controles)
├── site/                       # Copia de los archivos para despliegue en S3
│   ├── index.html
│   ├── css/style.css
│   └── js/game.js
├── Dockerfile                  # Contenedor del juego (Nginx)
├── docker-compose.yml          # Orquestación local
├── Dockerfile.deploy           # Contenedor de despliegue (Node.js + CDK + AWS CLI)
├── docker-compose.deploy.yml   # Orquestación del despliegue
├── .dockerignore               # Archivos excluidos de los contenedores
├── aws-blocks/                 # Definición de infraestructura AWS (CDK + Blocks)
│   ├── index.cdk.ts            # Stack CDK con construct Hosting
│   ├── index.ts                # Scope de Blocks
│   ├── package.json
│   └── scripts/                # Scripts de Blocks (deploy, destroy, etc.)
├── cdk.json                    # Configuración de CDK
├── package.json                # Dependencias del proyecto (CDK, TypeScript)
├── .blocks/config.json         # ID del stack de Blocks
└── README.md
```

---

## Ejecución local con Docker

### Requisitos

- **Docker** 28+
- **Docker Compose** v2+

No necesitas instalar Node.js, Python ni ninguna otra dependencia en tu sistema operativo. Todo corre dentro del contenedor.

### Iniciar el juego

```bash
docker compose up --build
```

Abre **[http://localhost:8080](http://localhost:8080)** en tu navegador.

### Detener el contenedor

```bash
docker compose down
```

---

## Despliegue a AWS con Docker

El proyecto incluye un contenedor de despliegue con todas las herramientas necesarias (Node.js 22, AWS CLI v2, AWS CDK). No necesitas instalar nada en tu sistema operativo.

### Requisitos previos

1. Tener una cuenta de AWS
2. Autenticarte con AWS CLI en tu sistema (las credenciales se montan en el contenedor):

```bash
aws login --profile aws-migrate --region us-east-2
```

### 1. Construir el contenedor de despliegue

```bash
docker compose -f docker-compose.deploy.yml build
```

### 2. Bootstrap de CDK (solo la primera vez)

Esto crea los recursos base que CDK necesita en tu cuenta (bucket S3 para assets, roles IAM):

```bash
docker compose -f docker-compose.deploy.yml run --rm deploy \
    cdk bootstrap aws://CUENTA-ID/us-east-2
```

> Reemplaza `CUENTA-ID` con tu ID de cuenta de AWS (por ejemplo, `012646747071`).
> Si ya hiciste bootstrap antes, puedes saltar este paso.

### 3. Desplegar

```bash
docker compose -f docker-compose.deploy.yml run --rm deploy \
    cdk deploy --all --require-approval never --progress events
```

Al completarse, CDK imprimirá la URL de CloudFront. Abre esa URL en tu navegador.

### 4. Shell interactivo (opcional)

Si prefieres entrar al contenedor y ejecutar comandos manualmente:

```bash
docker compose -f docker-compose.deploy.yml run --rm deploy
# Dentro del contenedor:
cdk deploy --all
cdk destroy --all
aws sts get-caller-identity --profile aws-migrate
```

---

## Arquitectura en AWS

```
                    ┌──────────────────────┐
                    │   CloudFront (CDN)    │
                    │   https://...cloud    │
                    │   front.net           │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │     Amazon S3        │
                    │   (archivos del      │
                    │    juego estáticos)  │
                    └──────────────────────┘
                               │
                    ┌──────────┌───────────┐
                    │   AWS KMS            │
                    │   (cifrado)          │
                    └──────────────────────┘
```

| Recurso | Función |
|---------|---------|
| **CloudFront** | CDN global que sirve el juego con HTTPS |
| **S3** | Almacenamiento de los archivos estáticos |
| **KMS** | Clave de cifrado del hosting |
| **CloudWatch** | Alarma de tasa 5xx + tópico SNS de monitoreo |
| **CloudFront Functions** | Enrutamiento en edge con KeyValueStore |

Todos los recursos regionales se crean en `us-east-2` (US East - Ohio). CloudFront es un servicio global.

---

## Costo estimado

| Servicio | Costo mensual | Descripción |
|----------|--------------|-------------|
| KMS | $1.00 | Clave de cifrado del hosting |
| S3 | $0.02 | Almacenamiento + requests |
| CloudFront | $0.00 | Requests y transferencia (free tier) |
| CloudFront Functions | $0.00 | 8,000 invocaciones (free tier) |
| **Total** | **~$1.03/mes** | |

---

## Limpieza de recursos

Para eliminar todos los recursos de AWS y dejar de incurrir costos:

```bash
docker compose -f docker-compose.deploy.yml run --rm deploy \
    cdk destroy --all
```

---

## Licencia

Este proyecto está bajo la licencia **MIT**. Puedes usarlo, modificarlo y distribuirlo libremente.
