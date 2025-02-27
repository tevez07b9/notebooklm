export const API_URL = import.meta.env.VITE_API_URL;

interface FetchOptions extends RequestInit {
  body?: any;
}

export async function fetchData(endpoint: string, options: FetchOptions = {}) {
  const url = `${API_URL}/${endpoint}`;

  if (options.method === "POST" || options.method === "PUT") {
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Server error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export const askQuestion = (question: string, fileName: string) => {
  return fetchData("chat", {
    method: "POST",
    body: {
      question,
      fileName,
    },
  });
};

export const uploadPdf = async (pdfData: FormData) => {
  const url = `${API_URL}/upload`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: pdfData,
    });
    if (!response.ok) {
      throw new Error(`Server error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const deletePdf = (fileName: string) => {
  return fetchData("delete-pdf", {
    method: "POST",
    body: { fileName },
  });
};

export const getPdfs = () => fetchData("get-pdfs");
