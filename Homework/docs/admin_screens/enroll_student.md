# Matrícula Manual

**Ruta**: `app/admin/institution/[id]/enroll-student.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/enroll-student`

## Propósito
Permitir el registro individual de un nuevo estudiante en la plataforma, creando sus credenciales de acceso de forma inmediata.

## Características
- **Formulario de Registro**: Captura nombre completo, correo electrónico y contraseña.
- **Generador de Contraseñas**: Herramienta integrada para crear contraseñas seguras y aleatorias con un solo clic.
- **Validación**: Comprobación de que todos los campos estén llenos antes de procesar.
- **Seguridad**: Autocapitalización desactivada para correos y contraseñas.

## Integración con el Backend

### Endpoints Necesarios
- **POST** `/auth/institutional-user`: Crea el usuario en el sistema con el rol `STUDENT` y lo vincula a la institución.

### Estructura de Datos
**Cuerpo de la Petición (POST):**
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "role": "STUDENT",
  "institutionId": "string"
}
```

### Requisitos
- El backend debe enviar un correo electrónico de bienvenida con las credenciales generadas.
- Verificación de duplicidad de correo electrónico.

## Flujo del Usuario
1. El administrador recibe los datos de un alumno nuevo en la oficina.
2. Abre esta pantalla para darle de alta en el sistema.
3. Escribe el nombre y correo.
4. Genera una contraseña aleatoria y se la entrega al alumno/padre.
5. Finaliza la matrícula y confirma que el estudiante ya puede iniciar sesión.

## Interacciones
- **Atrás**: Cancela la operación y regresa al Panel de la Institución.
- **Finalizar**: Registra y regresa.
