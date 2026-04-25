# Review Routes

## POST /review

Creates a new review record in the database.

### Endpoint

```
POST /review
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reviewDate` | string | Yes | Date of the review (ISO format) |
| `responsible` | string | Yes | Person responsible for the review |
| `normativaAsmeB313` | boolean | No | ASME B313 compliance |
| `normativaAsmeB314` | boolean | No | ASME B314 compliance |
| `normativaApi650` | boolean | No | API 650 compliance |
| `normativaApi1104` | boolean | No | API 1104 compliance |
| `normativaAwsD11` | boolean | No | AWS D1.1 compliance |
| `technicalSpec` | boolean | No | Technical specifications checked |
| `drawings` | boolean | No | Drawings verified |
| `deviationDescription` | string | No | Description of any deviations |
| `correctiveActions` | string | No | Corrective actions to take |
| `reviewStatus` | string | Yes | Status of the review |
| `comments` | string | No | Additional comments |
| `conclusion` | string | No | Conclusion of the review |
| `inspectorName` | string | No | Inspector's name |
| `jtSupName` | string | No | JT Supervisor's name |
| `adcName` | string | No | ADC's name |
| `clientName` | string | No | Client's name |

### Response

**Success (200)**
```json
{
  "message": "New review created",
  "reviewId": 1
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
curl -X POST http://localhost:3000/review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewDate": "2024-01-15",
    "responsible": "John Doe",
    "normativaAsmeB313": true,
    "normativaApi650": true,
    "reviewStatus": "approved",
    "inspectorName": "Jane Smith"
  }'
```

### Notes

- The `project_id` and `created_by` fields are currently hardcoded to `1` in the implementation.
- `projectContract` is no longer part of the review - it's now stored in the project table.

---

## GET /review/:id

Retrieves a review by its ID, including associated member and project information.

### Endpoint

```
GET /review/:id
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The ID of the review |

### Response

**Success (200)**
```json
{
  "id": 1,
  "reviewDate": "2024-01-15",
  "responsible": "John Doe",
  "normativaAsmeB313": true,
  "normativaAsmeB314": false,
  "normativaApi650": true,
  "normativaApi1104": false,
  "normativaAwsD11": false,
  "technicalSpec": true,
  "drawings": true,
  "deviationDescription": "Minor deviation noted",
  "correctiveActions": "Adjust alignment",
  "reviewStatus": "approved",
  "comments": "All checks passed",
  "conclusion": "Approved for production",
  "inspectorName": "Jane Smith",
  "jtSupName": "Bob Wilson",
  "adcName": "Alice Johnson",
  "clientName": "Client Corp",
  "member": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "project": {
    "name": "Proyecto Mina A",
    "clientEmail": "contact@client.com",
    "workSystem": "Sistema Transporte",
    "subsystem": "Faja Transportadora",
    "specialty": "Mecánica",
    "workLocation": "Faena Norte",
    "projectContract": "CON-2024-001"
  }
}
```

**Error (404)**
```json
{
  "error": "Review not found"
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
curl -X GET http://localhost:3000/review/1
```
