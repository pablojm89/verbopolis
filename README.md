# Verbópolis v4 · Aula completa

App web local para estudiar los verbos y sus conjugaciones en tercer ciclo de Primaria.

## Cómo abrirla

1. Descomprime el ZIP.
2. Abre `index.html` en Chrome, Edge o Firefox.
3. Elige un perfil de alumno/a o entra en la zona maestro/a con el código de aula.

## Código maestro/a

La zona docente está protegida con el código:

`45612378`

Es una protección práctica para aula. No es seguridad avanzada, porque el código está en una app local HTML/JS.

## Google Sheets

Esta versión ya trae configurada la URL de Apps Script que proporcionaste:

`https://script.google.com/macros/s/AKfycbwXO7MK9U_59iEQ702-2JVKO348tDq6TCPsyDxw0nJnry6GDaKAxYy98ApHTBzmp3OJ/exec`

Desde Maestro/a → Configuración puedes probar la conexión o cambiar la URL.

## Mejoras incluidas en v4

- Modo alumno más limpio.
- Zona maestro/a separada y protegida por código.
- Selector de grupos: 5.ºA, 5.ºB, 6.ºA, 6.ºB y grupos personalizados.
- Misiones por sesión configurables por grupo.
- Modo evaluación sin pistas y con nota final sobre 10.
- Ranking sano por avatares y XP.
- Panel docente con radar de errores: tiempos fallados, verbos fallados y alumnado que necesita repaso.
- Modo accesible: letra más grande y menos carga visual.
- Modo tranquilo: reduce animaciones y estímulos.
- Fichas imprimibles adaptadas a la misión activa.
- Exportación CSV local.
- Cola de sincronización: si internet falla, conserva los intentos y los envía después.

## Uso recomendado en clase

- Crea los perfiles con nombre de pila, iniciales o alias.
- Configura una misión por grupo antes de la sesión.
- Deja al alumnado usar solo Jugar, Estudiar, Repasar errores y Mi progreso.
- Al terminar la sesión, entra en Maestro/a y sincroniza si queda cola pendiente.

## Nota importante

El apartado de seguridad avanzada del backend no se ha implementado todavía, tal como pediste. La siguiente mejora técnica sería añadir una clave interna de aula al Apps Script para que solo acepte envíos de esta app.
