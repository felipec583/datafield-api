# Project Routes

## GET /project

Retrieves project information from the database.

### Endpoint

```
GET /project
```

### Response

**Success (200)**
```json
{
  "id": 1,
  "name": "Proyecto Mina A",
  "clientEmail": "your@email.com",
  "workSystem": "Sistema Transporte",
  "subsystem": "Faja Transportadora",
  "specialty": "Mecánica",
  "workLocation": "Faena Norte",
  "projectContract": "CON-2024-001"
}
```

**Error (5xx)**
```json
{
  "error": "Error message"
}
```

### Example Request

```bash
curl -X GET http://localhost:3000/project
```

### Notes

- Currently hardcoded to return the project with `id = 1`.
- Response uses camelCase for all fields.
- `projectContract` is now part of the project table.
