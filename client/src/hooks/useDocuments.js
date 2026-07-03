import { useState, useCallback, useEffect } from 'react';
import { fetchDocuments, deleteDocument, uploadDocument } from '../api/client';

export function useDocuments() {
  const [documents, setDocuments]               = useState([]);
  const [isLoading, setIsLoading]               = useState(false);
  const [uploading, setUploading]               = useState(false);
  const [uploadProgress, setUploadProgress]     = useState(0);
  const [error, setError]                       = useState(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upload = useCallback(async (file) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const { data } = await uploadDocument(file, setUploadProgress);
      await loadDocuments();
      return data;
    } catch (err) {
      const msg = err?.response?.data?.error || err.message;
      setError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [loadDocuments]);

  const remove = useCallback(async (docName) => {
    try {
      await deleteDocument(docName);
      setDocuments((prev) => prev.filter((d) => d.doc_name !== docName));
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  return { documents, isLoading, uploading, uploadProgress, error, loadDocuments, upload, remove };
}
