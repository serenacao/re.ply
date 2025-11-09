``` typescript

export interface File {
  name: string
  content: string
}

export interface UploadFileRequest {
  user: string
  name: string
  content: string
}

export interface RemoveFileRequest {
  user: string
  name: string
}

export interface RenameFileRequest {
  user: string
  name: string
  newName: string
}

export interface FilesRequest {
  user: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}


```