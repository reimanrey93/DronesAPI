# Gestión de drones

Aplicación pequeña para administrar una flota de drones. Incluye una API REST con FastAPI, persistencia SQLite y un panel web en JavaScript puro.

## Requisitos

- Python 3.10 o posterior

## Instalación y ejecución

En PowerShell, desde la carpeta del proyecto:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Abre <http://127.0.0.1:8000> para usar el panel y <http://127.0.0.1:8000/docs> para explorar la API. La base SQLite `drones.db` se crea automáticamente al iniciar la aplicación.

Para usar otra base de datos, define `DATABASE_URL` antes de iniciar. Por ejemplo, `sqlite:///./otra-base.db`.

## Funcionalidades

- Crear, listar, consultar, editar y eliminar drones.
- Buscar por número de serie o modelo y filtrar por estado.
- Validar campos y unicidad del número de serie.
- Mantener cambios entre reinicios usando SQLite.

## API

| Método | Ruta | Acción |
| --- | --- | --- |
| `GET` | `/api/drones` | Listar y filtrar (`search`, `status`) |
| `GET` | `/api/drones/{id}` | Consultar un drone |
| `POST` | `/api/drones` | Crear un drone |
| `PUT` | `/api/drones/{id}` | Actualizar un drone |
| `DELETE` | `/api/drones/{id}` | Eliminar un drone |

Estados válidos: `available`, `in_mission`, `maintenance`. El frontend muestra las etiquetas en español.

## Pruebas

```powershell
python -m pytest
```
