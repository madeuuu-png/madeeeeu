# 📱 MAKANA - App Móvil

Aplicación móvil desarrollada con React Native + Expo Router para controlar un dispensador automatizado de productos de higiene femenina en instituciones educativas.

---

## 🚀 Funcionalidades

- 🔐 Login por cédula
- 👤 Validación de estudiantes
- 📦 Solicitud de productos (kits)
- 📊 Visualización de inventario
- 📡 Comunicación con ESP32 vía Bluetooth
- 🧠 Control de comandos hacia el dispensador
- 🛠 Panel de administrador

---

## 🧱 Estructura del Proyecto

---App/
├── index.tsx
├── home.tsx
├── admin.tsx
├── informacion.tsx
├── recuperarCedula.tsx

components/
├── layout/
├── ui/
│ ├── home/
│ └── informacion/

lib/
├── constants/
├── core/
│ ├── dataBase/
│ └── storage/
├── supabase/

hooks/
├── useAuth.ts
├── useAdmin.ts
├── useBle.ts
├── useInventario.ts

## 🧠 Arquitectura

El proyecto sigue una estructura modular:

- **app/** → pantallas principales (routing)
- **components/** → UI reutilizable
- **lib/** → lógica, datos y servicios
- **hooks/** → lógica reutilizable (estado y funciones)

---

## 🔌 Tecnologías

- React Native
- Expo Router
- TypeScript
- Supabase
- Bluetooth Low Energy (BLE)
- ESP32

---


## 📡 Integración con Hardware

La app se conecta a un ESP32 mediante BLE para enviar comandos al dispensador.

---

## 👨‍💻 Equipo

- Kayle Darhyle Culcay Verdugo  
- Madelayne Cristina Palomino Sinche  
- Nayeli Alejandra Peralta Bravo  

---

## 🎯 Objetivo

Brindar acceso rápido, seguro y digno a productos de higiene femenina mediante tecnología automatizada.

---

## 📌 Notas

Proyecto desarrollado como parte de un proyecto integrador académico.
