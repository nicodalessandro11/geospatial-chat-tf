**Are-u-Queryous** de forma simple

## 🎯 **¿Qué es Are-u-Queryous?**

Es un **asistente virtual inteligente** que permite hacer preguntas sobre datos urbanos de Barcelona en **lenguaje natural** (como hablarías con una persona) y obtener respuestas precisas basadas en datos reales.

**Ejemplo práctico:**
- En lugar de escribir SQL complicado, simplemente preguntas: *"¿Cuál es el barrio con más población en Barcelona?"*
- El sistema responde: *"La Nova Esquerra de l'Eixample con 58,668 habitantes"*

---

## 🏗️ **Arquitectura del Sistema (3 capas principales)**

### 1. **Frontend (Lo que ve el usuario)**
- **Interfaz web moderna** con mapa interactivo de Barcelona
- **Chat inteligente** donde escribes preguntas en español/inglés
- **Visualización en tiempo real** de los datos en el mapa

### 2. **Backend API (El cerebro)**
- **FastAPI** que recibe las preguntas del usuario
- **Procesador de lenguaje natural** que entiende lo que preguntas
- **Generador de consultas SQL** automático
- **Sistema de memoria conversacional** (recuerda el contexto de la conversación)

### 3. **Base de Datos (Los datos)**
- **PostgreSQL con PostGIS** (datos geoespaciales)
- Información real de Barcelona: población, distritos, barrios, etc.

---

## 🔄 **Flujo de Funcionamiento (paso a paso)**

```
1. Usuario escribe pregunta → "¿Cuántos habitantes tiene Gràcia?"

2. Frontend envía pregunta → API Backend

3. Backend procesa con IA → 
   - Entiende que busca población del distrito Gràcia
   - Genera SQL automáticamente
   - Consulta la base de datos

4. Base de datos devuelve datos → Backend

5. IA formatea respuesta → "Gràcia tiene 119,049 habitantes"

6. Frontend muestra respuesta → Usuario ve resultado + mapa actualizado
```

---

## 🧠 **Tecnologías Clave**

### **Inteligencia Artificial:**
- **GPT-3.5-turbo** (OpenAI) - Entiende preguntas y genera respuestas
- **LangChain** - Framework para aplicaciones de IA
- **Prompts personalizados** - Entrenado específicamente para datos urbanos

### **Backend:**
- **FastAPI** - API REST moderna y rápida
- **Python** - Lenguaje de programación principal

### **Frontend:**
- **Next.js + TypeScript** - Aplicación web moderna
- **React** - Interfaz de usuario interactiva
- **Leaflet** - Mapas interactivos

### **Datos:**
- **Supabase PostgreSQL** - Base de datos en la nube
- **PostGIS** - Extensión para datos geoespaciales

---

## ✨ **Características Destacadas**

### 1. **Conversación Natural**
- Preguntas en español o inglés
- No necesitas saber SQL o programación
- Entiende contexto: *"¿Y cuál es el segundo?"*, *"Compáralo con Eixample"*

### 2. **Memoria Conversacional**
- Recuerda las 6 últimas preguntas/respuestas
- Permite hacer preguntas de seguimiento
- Mantiene el contexto de la conversación

### 3. **Integración con Mapa**
- Si seleccionas un área en el mapa, las preguntas se contextualizan
- Visualización automática de resultados
- Interfaz intuitiva y moderna

### 4. **Datos Reales**
- Información oficial de Barcelona
- Datos actualizados de población, distritos, barrios
- Consultas geoespaciales avanzadas

---

## 🎯 **Casos de Uso para la Presentación**

### **Demo 1: Pregunta Simple**
```
Pregunta: "¿Cuál es el barrio más poblado?"
Respuesta: "La Nova Esquerra de l'Eixample con 58,668 habitantes"
```

### **Demo 2: Conversación Contextual**
```
Usuario: "¿Cuál es el distrito con más población?"
IA: "Eixample con 262,485 habitantes"
Usuario: "¿Y el segundo?"
IA: "Sant Martí con 230,417 habitantes"
Usuario: "Compáralos"
IA: "Eixample tiene 32,068 habitantes más que Sant Martí..."
```

### **Demo 3: Integración con Mapa**
```
1. Selecciona distrito en mapa → Gràcia
2. Pregunta: "¿Cuántos barrios tiene?"
3. IA contextualiza automáticamente: "Gràcia tiene X barrios..."
```

---

## 💡 **Valor del Proyecto**

### **Para Ciudadanos:**
- Acceso fácil a datos urbanos
- No necesitan conocimientos técnicos
- Información instantánea y precisa

### **Para Administración Pública:**
- Democratización del acceso a datos
- Mejor toma de decisiones basada en datos
- Transparencia gubernamental

### **Técnicamente:**
- Combina IA moderna con datos geoespaciales
- Arquitectura escalable y moderna
- Conversación natural sobre datos complejos

---

## 🚀 **Puntos Clave para tu Presentación**

1. **Problema resuelto:** Acceso complejo a datos urbanos → Conversación natural
2. **Innovación:** IA + Datos Geoespaciales + Interfaz intuitiva
3. **Impacto:** Democratiza el acceso a información urbana
4. **Técnica:** Arquitectura moderna, escalable y bien documentada
5. **Futuro:** Base para expandir a otras ciudades y tipos de datos