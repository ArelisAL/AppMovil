# AppMovil — Fran-Costuras

App móvil Android del taller de costura **Fran-Costuras** para la **costurera**
(«Mis pedidos», detalle del pedido, cambio de estado e historial, registrar y ver medidas).
Se distribuye por Google Play Store. No tiene base de datos, reglas de negocio ni modo sin conexión:
usa los mismos endpoints de la API REST del repositorio `Backend` que el `Frontend`.

Tecnologías: React Native + Expo (Expo Router) + TypeScript, Axios, `expo-secure-store` para la sesión,
colores desde `src/theme/marca.ts`.

## Requisitos

- Node.js 20 o superior y npm.
- Expo Go en un celular Android o un emulador Android.
- La API del `Backend` corriendo y accesible desde el celular
  (`python manage.py runserver 0.0.0.0:8000`).

## Variable de entorno

Crear el archivo `.env.local` en la raíz del repositorio (no se versiona):

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api/v1
```

En un celular real se usa la IP de la computadora en la red local, nunca `localhost`.
Las variables `EXPO_PUBLIC_*` quedan dentro de la app: nunca se ponen secretos en ellas.

## Instalar y correr

```bash
npm install
npx expo start     # abrir en Expo Go o en un emulador Android
```

## Probar y verificar

```bash
npm run lint
npm run test       # Jest (jest-expo) + React Native Testing Library
npx expo-doctor
```

La compilación y publicación en Google Play (EAS Build / EAS Submit) solo se hace cuando el humano lo pide.

Reglas de trabajo y del proyecto: ver `AGENTS.md`.

## Ampliación de alcance

El proyecto también contempla la ampliación aprobada por la cliente en `DERCAS_Fran-Costuras_v1.5-ampliacion.docx` y `.pdf` (§14). La captura de consumos por recepción/administración y la confirmación de «En proceso» por administradora/costurera asignada están implementadas y verificadas en Backend, Frontend, AdminWeb y AppMovil como primera entrega de la Fase A. El resto se entrega por fases según `docs/plan/AMPLIACION-DERCAS-1.5.md`; las decisiones de negocio pendientes siguen bloqueando las funciones dependientes. El DERCAS describe el alcance, no certifica las funciones pendientes.
