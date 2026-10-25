# REST API Specification (OpenAPI Aligned)
**Base URL:** `http://127.0.0.1:8000/api/v1/`  
**Authentication:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`  
**Standard Error Envelope:**
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable error description."
  }
}
```

---

## 1. Authentication Endpoints

### 1.1 POST `/auth/register/`
Registers a new user, automatically provisions their default workspace, initializes their daily 20-query quota, and returns JWT tokens.
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "confirm_password": "Password123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": {
      "id": "c0a80123-4567-89ab-cdef-0123456789ab",
      "email": "user@example.com",
      "date_joined": "2026-10-25T14:00:00Z"
    },
    "tokens": {
      "access": "eyJhbGciOi...",
      "refresh": "eyJhbGciOi..."
    }
  }
  ```

### 1.2 POST `/auth/login/`
Authenticates existing credentials and returns JWT access and refresh tokens.
- **Request:** `{"email": "user@example.com", "password": "Password123!"}`
- **Response (200 OK):** `{"access": "eyJhbGci...", "refresh": "eyJhbGci..."}`

### 1.3 GET `/auth/me/`
Returns currently authenticated user profile and default workspace.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "id": "c0a80123-4567-89ab-cdef-0123456789ab",
    "email": "user@example.com",
    "workspace": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Personal Workspace"
    }
  }
  ```

---

## 2. Document Endpoints

### 2.1 POST `/documents/`
Uploads a document file for parsing, chunking, and vector embedding.
- **Content-Type:** `multipart/form-data`
- **Form Data:** `file`: `[binary data: PDF, DOCX, or TXT (max 5 MB)]`
- **Response (201 Created):**
  ```json
  {
    "id": "0b190127-2ab5-427c-a731-bd974f2b2ca4",
    "workspace": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "original_name": "company_remote_policy.txt",
    "file_type": "TXT",
    "file_size": 1850,
    "status": "UPLOADED",
    "created_at": "2026-10-25T14:30:00Z"
  }
  ```

### 2.2 GET `/documents/`
Returns a paginated list of all documents belonging to the user's workspace.
- **Response (200 OK):**
  ```json
  [
    {
      "id": "0b190127-2ab5-427c-a731-bd974f2b2ca4",
      "workspace_name": "Personal Workspace",
      "original_name": "company_remote_policy.txt",
      "file_type": "TXT",
      "file_size": 1850,
      "status": "READY",
      "chunks_count": 4,
      "created_at": "2026-10-25T14:30:00Z",
      "processed_at": "2026-10-25T14:30:02Z"
    }
  ]
  ```

### 2.3 GET `/documents/{id}/status/`
Lightweight endpoint for frontend polling during ingestion.
- **Response (200 OK):**
  ```json
  {
    "id": "0b190127-2ab5-427c-a731-bd974f2b2ca4",
    "status": "READY",
    "error_code": null,
    "error_message": null,
    "processed_at": "2026-10-25T14:30:02Z"
  }
  ```

### 2.4 DELETE `/documents/{id}/`
Deletes document, stored file, and cascades deletion to all vector chunks in PostgreSQL.
- **Response (204 No Content)**

---

## 3. Conversation & RAG Q&A Endpoints

### 3.1 POST `/conversations/`
Creates a new conversation session.
- **Request:** `{"title": "Policy Q&A"}`
- **Response (201 Created):** `{"id": "85140ca7-aa4f-47a6-aecf-0ef22322ee33", "title": "Policy Q&A", "created_at": "..."}`

### 3.2 GET `/conversations/{id}/messages/`
Returns chronological message history with role, content, and sources.
- **Response (200 OK):**
  ```json
  [
    {
      "id": "e4b3c2a1-...",
      "role": "USER",
      "content": "What is the equipment allowance?",
      "sources": null,
      "created_at": "2026-10-25T14:35:00Z"
    },
    {
      "id": "f5c4d3b2-...",
      "role": "ASSISTANT",
      "content": "Every newly hired full-time team member receives a $1,500 USD stipend upon onboarding. [1]",
      "sources": [
        {
          "chunk_id": "6bcfbc23-...",
          "document_id": "0b190127-...",
          "document_name": "company_remote_policy.txt",
          "page_number": 1,
          "excerpt": "## 2. Home Office & Equipment Allowance..."
        }
      ],
      "created_at": "2026-10-25T14:35:01Z"
    }
  ]
  ```

### 3.3 POST `/conversations/{id}/ask/`
Submits a question to the RAG pipeline. Atomically checks daily quota, retrieves relevant chunks with pgvector, validates relevance threshold, synthesizes grounded answer, and formats citations.
- **Request:**
  ```json
  {
    "question": "What is the equipment allowance for home office setup?",
    "document_ids": ["0b190127-2ab5-427c-a731-bd974f2b2ca4"]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "answer": "Every newly hired full-time team member receives a one-time, tax-free Home Office Setup Stipend of $1,500 USD upon onboarding. [1]",
    "sources": [
      {
        "chunk_id": "6bcfbc23-0b65-4297-844b-602bdec31fd2",
        "document_id": "0b190127-2ab5-427c-a731-bd974f2b2ca4",
        "document_name": "company_remote_policy.txt",
        "page_number": 1,
        "excerpt": "## 2. Home Office & Equipment Allowance..."
      }
    ],
    "quota_remaining": 18
  }
  ```

---

## 4. Usage & Quota Endpoints

### 4.1 GET `/usage/`
Returns real-time atomic daily quota status.
- **Response (200 OK):**
  ```json
  {
    "limit": 20,
    "used": 2,
    "remaining": 18,
    "reset_date": "2026-10-25",
    "reset_time": "Midnight UTC"
  }
  ```
