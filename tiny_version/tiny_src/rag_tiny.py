from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

class DocumentRetrieverTiny:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        self.vector_db = None

    def ingest(self, file_path):
        loader = PyPDFLoader(file_path) if file_path.endswith(".pdf") else TextLoader(file_path)
        docs = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
        chunks = splitter.split_documents(docs)
        self.vector_db = FAISS.from_documents(chunks, self.embeddings)
        return f"Tiny DB pronto: {len(chunks)} frammenti."

    def search(self, query, k=1): 
        if not self.vector_db: return ""
        docs = self.vector_db.similarity_search(query, k=k)
        return "\n".join([d.page_content for d in docs])