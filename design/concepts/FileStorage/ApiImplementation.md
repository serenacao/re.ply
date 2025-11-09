[@file-storage-api-spec](./Api.md)
[@file-storage-spec](./FileStorage.md)
[@file-storage-implementation](./Implementation.md)

```typescript

import type { 
  File, 
  UploadFileRequest, 
  RemoveFileRequest, 
  RenameFileRequest, 
  FilesRequest,
  ApiResponse 
} from '../types/fileStorage'

const API_BASE_URL = 'http://localhost:8000'

class FileStorageApi {
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      console.log('Response:"', response)
      const data = await response.json()
      

      if (!response.ok) {
        return { error: data.error || 'An error occurred' }
      }

      return { data }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Network error' 
      }
    }
  }

  async uploadFile(request: UploadFileRequest): Promise<ApiResponse<{ File: File }>> {
    return this.makeRequest('/api/FileStorage/upload', 'POST', request)
  }

  async removeFile(request: RemoveFileRequest): Promise<ApiResponse<{ File: File }>> {
    return this.makeRequest('/api/FileStorage/remove', 'POST', request)
  }

  async renameFile(request: RenameFileRequest): Promise<ApiResponse<{ File: File }>> {
    return this.makeRequest('/api/FileStorage/rename', 'POST', request)
  }

  async getFiles(request: FilesRequest): Promise<ApiResponse<File[]>> {
    return this.makeRequest('/api/FileStorage/_files', 'POST', request)
  }
}

export const fileStorageApi = new FileStorageApi()
```

